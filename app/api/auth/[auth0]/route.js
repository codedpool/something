import { NextRequest, NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { auth0 } = params;
  
  console.log('Auth route called:', auth0);
  
  try {
    // Handle login
    if (auth0 === 'login') {
      const searchParams = request.nextUrl.searchParams;
      const screenHint = searchParams.get('screen_hint');
      
      // Build Auth0 login URL
      const loginUrl = new URL('/authorize', process.env.AUTH0_ISSUER_BASE_URL);
      loginUrl.searchParams.set('response_type', 'code');
      loginUrl.searchParams.set('client_id', process.env.AUTH0_CLIENT_ID);
      loginUrl.searchParams.set('redirect_uri', `${process.env.AUTH0_BASE_URL}/api/auth/callback`);
      loginUrl.searchParams.set('scope', 'openid profile email');
      
      if (screenHint === 'signup') {
        loginUrl.searchParams.set('screen_hint', 'signup');
      }
      
      console.log('Redirecting to Auth0:', loginUrl.toString());
      return NextResponse.redirect(loginUrl.toString());
    }
    
    // Handle logout
    if (auth0 === 'logout') {
      const logoutUrl = new URL('/v2/logout', process.env.AUTH0_ISSUER_BASE_URL);
      logoutUrl.searchParams.set('client_id', process.env.AUTH0_CLIENT_ID);
      logoutUrl.searchParams.set('returnTo', process.env.AUTH0_BASE_URL);
      
      // Clear the session cookie
      const response = NextResponse.redirect(logoutUrl.toString());
      response.cookies.set('appSession', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // This deletes the cookie
        path: '/',
      });
      
      console.log('Logging out and clearing session');
      return response;
    }
    
    // Handle callback
    if (auth0 === 'callback') {
      const searchParams = request.nextUrl.searchParams;
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      console.log('Callback received - code:', !!code, 'error:', error);
      
      if (error) {
        console.error('Auth0 callback error:', error, errorDescription);
        return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}?error=${error}&description=${encodeURIComponent(errorDescription || '')}`);
      }
      
      if (!code) {
        console.error('No authorization code received');
        return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}?error=no_code`);
      }
      
      try {
        console.log('Exchanging code for tokens...');
        
        // Exchange code for tokens
        const tokenResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: process.env.AUTH0_CLIENT_ID,
            client_secret: process.env.AUTH0_CLIENT_SECRET,
            code: code,
            redirect_uri: `${process.env.AUTH0_BASE_URL}/api/auth/callback`,
          }),
        });
        
        const tokens = await tokenResponse.json();
        console.log('Token response status:', tokenResponse.status);
        
        if (!tokenResponse.ok || tokens.error) {
          console.error('Token exchange failed:', tokens);
          throw new Error(tokens.error_description || tokens.error || 'Token exchange failed');
        }
        
        console.log('Tokens received, fetching user info...');
        
        // Get user info
        const userResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/userinfo`, {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
          },
        });
        
        if (!userResponse.ok) {
          console.error('User info fetch failed:', userResponse.status);
          throw new Error('Failed to fetch user info');
        }
        
        const user = await userResponse.json();
        console.log('User info received:', user.email || user.sub);
        
        // Create session
        const sessionData = {
          user: user,
          access_token: tokens.access_token,
          id_token: tokens.id_token,
          expires_at: Date.now() + ((tokens.expires_in || 3600) * 1000),
        };
        
        const response = NextResponse.redirect(process.env.AUTH0_BASE_URL);
        
        // Set session cookie
        response.cookies.set('appSession', JSON.stringify(sessionData), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: tokens.expires_in || 3600,
          path: '/',
        });
        
        console.log('Session cookie set, redirecting to home');
        return response;
        
      } catch (error) {
        console.error('Callback processing error:', error);
        return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}?error=callback_error&description=${encodeURIComponent(error.message)}`);
      }
    }
    
    // Handle me (user profile)
    if (auth0 === 'me') {
      const cookieHeader = request.headers.get('cookie');
      console.log('Me route - has cookies:', !!cookieHeader);
      
      if (!cookieHeader) {
        console.log('No cookies found');
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
      
      const sessionMatch = cookieHeader.match(/appSession=([^;]*)/);
      if (!sessionMatch) {
        console.log('No appSession cookie found');
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
      
      try {
        const sessionData = JSON.parse(decodeURIComponent(sessionMatch[1]));
        
        // Check if session is expired
        if (Date.now() > sessionData.expires_at) {
          console.log('Session expired');
          return NextResponse.json({ error: 'Session expired' }, { status: 401 });
        }
        
        console.log('Returning user data for:', sessionData.user.email || sessionData.user.sub);
        return NextResponse.json(sessionData.user);
      } catch (error) {
        console.error('Session parse error:', error);
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }
    }
    
    console.log('Unknown auth route:', auth0);
    return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}