import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';

// Force dynamic rendering (uses request.url)
export const dynamic = 'force-dynamic';

/**
 * GET /api/users/check-email?email=...
 * Check if a user exists with the given email
 * Returns: { exists: boolean, isBanned?: boolean, provider?: string, hasPassword?: boolean }
 * 
 * NOTE: This endpoint is PUBLIC and does NOT require authentication.
 * It is used during login/signup flows when users are not yet authenticated.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    const lowerEmail = email.toLowerCase().trim();
    
    // Helper function to normalize Gmail emails (remove dots from local part)
    const normalizeGmailEmail = (email: string) => {
      if (email.includes('@gmail.com')) {
        const [local, domain] = email.split('@');
        return local.replace(/\./g, '') + '@' + domain;
      }
      return email;
    };
    
    // 1. Check our User model
    let user = await User.findOne({ email: lowerEmail }).select('+password isBanned provider');
    
    // For Gmail, also try normalized version (without dots)
    if (!user && lowerEmail.includes('@gmail.com')) {
      const normalizedEmail = normalizeGmailEmail(lowerEmail);
      user = await User.findOne({ email: normalizedEmail }).select('+password isBanned provider');
    }
    
    // 2. Check NextAuth's users collection
    const nextAuthUsersCollection = db.collection('users');
    let nextAuthUser = await nextAuthUsersCollection.findOne({ email: lowerEmail });
    
    // For Gmail, also try normalized version
    if (!nextAuthUser && lowerEmail.includes('@gmail.com')) {
      const normalizedEmail = normalizeGmailEmail(lowerEmail);
      nextAuthUser = await nextAuthUsersCollection.findOne({ email: normalizedEmail });
      
      // If still not found, search all Gmail users and match by normalized email
      if (!nextAuthUser) {
        const allGmailUsers = await nextAuthUsersCollection.find({ 
          email: { $regex: /@gmail\.com$/i }
        }).toArray();
        
        const normalizedSearch = normalizeGmailEmail(lowerEmail);
        for (const potentialUser of allGmailUsers) {
          if (normalizeGmailEmail(potentialUser.email.toLowerCase()) === normalizedSearch) {
            nextAuthUser = potentialUser;
            break;
          }
        }
      }
    }

    // 3. Check if there's a Google account linked
    let hasGoogleAccount = false;
    if (nextAuthUser) {
      try {
        const accountsCollection = db.collection('accounts');
        const linkedAccount = await accountsCollection.findOne({ 
          userId: nextAuthUser._id,
          provider: 'google'
        });
        hasGoogleAccount = !!linkedAccount;
      } catch (err) {
        console.error('[check-email] Error checking accounts:', err);
      }
    }

    // Check if account exists
    const accountExists = !!(user || nextAuthUser);
    
    if (!accountExists) {
      return NextResponse.json({
        success: true,
        exists: false,
      });
    }

    // Determine provider and account details
    let provider = 'credentials';
    let hasPassword = false;
    let isBanned = false;

    // Determine if it's a Google account
    const isGoogleAccount = hasGoogleAccount || 
                           (user && user.provider === 'google') || 
                           (!user && nextAuthUser);

    if (isGoogleAccount) {
      provider = 'google';
      hasPassword = false;
    } else if (user) {
      provider = user.provider || 'credentials';
      hasPassword = !!user.password;
    } else if (nextAuthUser) {
      // NextAuth user but not in User model - treat as OAuth (no password)
      provider = 'google';
      hasPassword = false;
    }

    // Get ban status
    if (user) {
      isBanned = user.isBanned || false;
    }

    return NextResponse.json({
      success: true,
      exists: true,
      isBanned: isBanned,
      provider: provider,
      hasPassword: hasPassword,
    });
  } catch (error: any) {
    console.error('Error checking email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check email' },
      { status: 500 }
    );
  }
}
