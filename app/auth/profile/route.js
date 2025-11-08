import { NextResponse } from 'next/server';

// Simple profile endpoint for Auth0 SDK
export async function GET() {
  // Return null for now since we don't have a proper session implementation
  // This prevents the 404 error while maintaining the useUser hook functionality
  return NextResponse.json(null);
}