// C:\gameon-v1\app\api\auth\signup\route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";

export async function POST(req: Request) {
  const { firstName, lastName, email, password } = await req.json();

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await connectDB();
  const lowerEmail = email.toLowerCase().trim();
  
  // Helper function to normalize Gmail emails (remove dots from local part)
  const normalizeGmailEmail = (email: string) => {
    if (email.includes('@gmail.com')) {
      const [local, domain] = email.split('@');
      return local.replace(/\./g, '') + '@' + domain;
    }
    return email;
  };

  const mongoose = await connectDB();
  const db = mongoose.connection.db;
  
  // 1. Check our User model
  let existingUser = await User.findOne({ email: lowerEmail }).select('+password provider');
  
  // For Gmail, also try normalized version
  if (!existingUser && lowerEmail.includes('@gmail.com')) {
    const normalizedEmail = normalizeGmailEmail(lowerEmail);
    existingUser = await User.findOne({ email: normalizedEmail }).select('+password provider');
  }
  
  // 2. Check NextAuth's users collection
  const nextAuthUsersCollection = db.collection('users');
  let nextAuthUser = await nextAuthUsersCollection.findOne({ email: lowerEmail });
  
  // For Gmail, also try normalized version
  if (!nextAuthUser && lowerEmail.includes('@gmail.com')) {
    const normalizedEmail = normalizeGmailEmail(lowerEmail);
    nextAuthUser = await nextAuthUsersCollection.findOne({ email: normalizedEmail });
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
      console.error('[signup] Error checking accounts:', err);
    }
  }

  // Check if account exists
  const accountExists = !!(existingUser || nextAuthUser);
  
  if (accountExists) {
    // Determine if it's a Google account
    const isGoogleAccount = hasGoogleAccount || 
                           (existingUser && existingUser.provider === 'google') || 
                           (!existingUser && nextAuthUser);
    
    if (isGoogleAccount) {
      return NextResponse.json({ 
        error: "An account with this email already exists. It was created with Google. Please sign in using Google or use a different email address." 
      }, { status: 409 });
    }
    
    // Block if a credentials account already exists
    if (existingUser && existingUser.provider === "credentials") {
      return NextResponse.json({ 
        error: "An account with this email already exists. Please sign in instead." 
      }, { status: 409 });
    }
    
    // Account exists but type unknown
    return NextResponse.json({ 
      error: "An account with this email already exists. Please sign in instead." 
    }, { status: 409 });
  }

  try {
    const fullName = `${firstName} ${lastName}`;

    // Save password in plain text; Mongoose pre-save hook will hash it automatically
    const newUser = await User.create({
      firstName,
      lastName,
      name: fullName,
      email: lowerEmail,
      password,
      provider: "credentials",
    });

    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
