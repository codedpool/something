import { NextResponse } from 'next/server';

// Auth0 login endpoint - redirect to Auth0
export async function GET(request) {
  const url = new URL(request.url);
  const screenHint = url.searchParams.get('screen_hint');
  
  // Build Auth0 login URL
  const loginUrl = new URL('/authorize', process.env.AUTH0_ISSUER_BASE_URL);
  loginUrl.searchParams.set('response_type', 'code');
  loginUrl.searchParams.set('client_id', process.env.AUTH0_CLIENT_ID);
  loginUrl.searchParams.set('redirect_uri', `${process.env.AUTH0_BASE_URL}/auth/callback`);
  loginUrl.searchParams.set('scope', 'openid profile email');
  
  if (screenHint === 'signup') {
    loginUrl.searchParams.set('screen_hint', 'signup');
  }
  
  return NextResponse.redirect(loginUrl.toString());
}