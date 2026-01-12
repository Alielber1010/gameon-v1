import { NextRequest, NextResponse } from 'next/server';

// Handle NextAuth error redirects
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const error = searchParams.get('error');
  
  // Redirect to login page with error parameter
  // If it's AccessDenied (which happens when signIn returns false for banned users), treat it as AccountBanned
  const errorParam = error === 'AccessDenied' ? 'AccountBanned' : (error || 'AccessDenied');
  
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('error', errorParam);
  
  return NextResponse.redirect(loginUrl);
}
