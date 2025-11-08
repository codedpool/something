import { NextResponse } from 'next/server';

// Auth0 callback endpoint - handle the callback from Auth0
export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  
  if (error) {
    // Redirect to home with error
    return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}?error=${error}`);
  }
  
  if (code) {
    // TODO: Exchange code for tokens and create session
    // For now, just redirect to home
    return NextResponse.redirect(process.env.AUTH0_BASE_URL);
  }
  
  // No code, redirect to home
  return NextResponse.redirect(process.env.AUTH0_BASE_URL);
}