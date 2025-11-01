"use client";
import React from "react";
import { ClerkProvider } from "@clerk/nextjs";

export default function ClerkProviderWrapper({ children }) {
  
  return <ClerkProvider>{children}</ClerkProvider>;
}
