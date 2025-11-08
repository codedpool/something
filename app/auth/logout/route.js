import { NextResponse } from 'next/server';

// Auth0 logout endpoint - redirect to Auth0 logout
export async function GET() {
  const logoutUrl = new URL('/v2/logout', process.env.AUTH0_ISSUER_BASE_URL);
  logoutUrl.searchParams.set('client_id', process.env.AUTH0_CLIENT_ID);
  logoutUrl.searchParams.set('returnTo', process.env.AUTH0_BASE_URL);
  
  return NextResponse.redirect(logoutUrl.toString());
}