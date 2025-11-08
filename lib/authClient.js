"use client";

// Lightweight client shim that maps the app's existing `useUser()` usage
// (previously from Clerk) to Auth0's client hook. This keeps the rest of
// the codebase changes minimal: import { useUser } from '@/lib/authClient'
// and you'll get { user, isSignedIn, isLoading }.

import { useUser as useAuth0User } from "@auth0/nextjs-auth0/client";

export function useUser() {
  const { user, error, isLoading } = useAuth0User();
  return {
    user: user || null,
    isSignedIn: !!user,
    isLoading,
    error,
  };
}

export const loginHref = "/auth/login";
export const logoutHref = "/auth/logout";

export default useUser;
