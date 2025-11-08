"use client";

import Link from "next/link";
import { useState } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export default function Navbar() {
  const [openNavigation, setOpenNavigation] = useState(false);

  const toggleNavigation = () => setOpenNavigation(!openNavigation);
  const handleNavClick = () => setOpenNavigation(false);

  const links = [
    { name: "Why Choose Us", href: "/#features" },
    { name: "Testimonials", href: "/#testimonials" },
    { name: "StockDashboard", href: "/StockDashboard" },
    { name: "MFDashboard", href: "/MFDashboard" },
    { name: "CryptoDashboard", href: "/CryptoDashboard" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 border-b border-white/10 backdrop-blur-md transition-all duration-300 ${
        openNavigation ? "bg-[#0b0b12]/95" : "bg-[#0b0b12]/70"
      }`}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="hidden md:block text-white font-semibold text-lg tracking-wide">
            WealthPulse
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              {link.name}
            </Link>
          ))}

          <SignedIn>
            <Link
              href="/Portfolio"
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              My Portfolio
            </Link>
          </SignedIn>
        </nav>

        {/* Auth Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9",
                },
              }}
            />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm text-white/90 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-colors">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="text-sm font-semibold bg-gradient-to-r from-[#9b5cff] to-[#f08bd6] text-white px-4 py-2 rounded-full shadow hover:scale-[1.02] transition-transform">
                Sign up
              </button>
            </SignUpButton>
          </SignedOut>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-md hover:bg-white/10 transition"
          onClick={toggleNavigation}
        >
          <div className="space-y-1">
            <span
              className={`block w-6 h-0.5 bg-white transition-all ${
                openNavigation ? "rotate-45 translate-y-1.5" : ""
              }`}
            ></span>
            <span
              className={`block w-6 h-0.5 bg-white transition-all ${
                openNavigation ? "opacity-0" : ""
              }`}
            ></span>
            <span
              className={`block w-6 h-0.5 bg-white transition-all ${
                openNavigation ? "-rotate-45 -translate-y-1.5" : ""
              }`}
            ></span>
          </div>
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      {openNavigation && (
        <nav className="lg:hidden fixed top-[70px] left-0 right-0 bg-[#0b0b12] border-t border-white/10 backdrop-blur-md flex flex-col items-center py-6 space-y-6 z-40">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={handleNavClick}
              className="text-gray-300 hover:text-white transition-colors text-lg"
            >
              {link.name}
            </Link>
          ))}

          <SignedIn>
            <Link
              href="/Portfolio"
              onClick={handleNavClick}
              className="text-purple-400 hover:text-purple-300 text-lg"
            >
              My Portfolio
            </Link>
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm text-white/90 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-colors">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="text-sm font-semibold bg-gradient-to-r from-[#9b5cff] to-[#f08bd6] text-white px-4 py-2 rounded-full shadow hover:scale-[1.02] transition-transform">
                Sign up
              </button>
            </SignUpButton>
          </SignedOut>
        </nav>
      )}
    </header>
  );
}
