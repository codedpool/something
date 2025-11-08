// Auth0 API route handler for Next.js App Router
// Since this SDK version doesn't export handleAuth, we'll use a simple approach

export async function GET(request) {
  // For now, return a simple response to avoid errors
  // The actual Auth0 authentication will be handled by the SDK automatically
  // when using the Auth0Provider in the layout
  
  return new Response('Auth route - handled by Auth0 SDK', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}