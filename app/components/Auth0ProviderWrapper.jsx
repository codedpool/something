"use client";

import React from "react";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";

export default function Auth0ProviderWrapper({ children }) {
  return <Auth0Provider>{children}</Auth0Provider>;
}
