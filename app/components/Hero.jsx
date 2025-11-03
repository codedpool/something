"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export default function Hero() {
  const [openNavigation, setOpenNavigation] = useState(false);

  const toggleNavigation = () => setOpenNavigation(!openNavigation);
  const handleNavClick = () => setOpenNavigation(false);

  return (
    <section className="relative w-full min-h-screen bg-gradient-to-b from-[#050511] via-[#0d1020] to-[#0b0b12] overflow-hidden text-white">
      {/* Fixed Navbar */}
      <header
        className={`fixed top-0 left-0 w-full z-50 border-b border-white/10 backdrop-blur-md transition-all duration-300 ${
          openNavigation ? "bg-[#0b0b12]/95" : "bg-[#0b0b12]/70"
        }`}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-[42px] h-[42px] rounded-full bg-gradient-to-r from-purple-500 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
              WP
            </div>
            <span className="hidden md:block text-white font-semibold text-lg tracking-wide">
              WealthPulse
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {[
              { name: "Why Choose Us", href: "#" },
              { name: "Get Started", href: "#" },
              { name: "StockDashboard", href: "/StockDashboard" },
              { name: "MFDashboard", href: "/MFDashboard" },
              { name: "CryptoDashboard", href: "/CryptoDashboard" },
            ].map((link) => (
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
            {[
              { name: "Why Choose Us", href: "#" },
              { name: "Get Started", href: "#" },
              { name: "StockDashboard", href: "/StockDashboard" },
              { name: "MFDashboard", href: "/MFDashboard" },
              { name: "CryptoDashboard", href: "/CryptoDashboard" },
            ].map((link) => (
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

      {/* Main Hero */}
     <div className="relative z-10 pt-40 pb-20 flex flex-col items-center text-center px-6">
  <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-12 font-poppins">
    Transforming complex finance into
    <span className="block relative">
      <span className="relative inline-block px-4">
        Simple, Smart decisions
        <span className="absolute left-[-1rem] right-[-1rem] top-full h-[7px] bg-gradient-to-r from-[#9b5cff] to-[#f08bd6] mt-2" style={{ borderRadius: '0 0 100% 100%' }}></span>
      </span>
    </span>
  </h1>


        <p className="text-lg text-gray-300 max-w-2xl mb-8 mt-6">
  Unleash your financial potential with WealthPulse
  <br />
  <span className="italic">your AI-powered investment companion.</span>
</p>


        <button className="inline-flex items-center gap-3 bg-gradient-to-r from-[#9b5cff] to-[#f08bd6] text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:scale-[1.02] transition-transform">
          Get Started
          <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            →
          </span>
        </button>

        {/* Hero Graphic */}
        <div className="relative mt-16 w-full max-w-4xl">
          

          {/* Background Glow */}
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-[radial-gradient(circle_at_center,_rgba(155,92,255,0.25),_transparent_70%)] blur-3xl"></div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      {/* Bottom Gradient Glow & Fade Transition */}
<div className="absolute left-0 right-0 bottom-0 h-[350px] w-full">
  {/* Inner glow that radiates upward */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(155,92,255,0.25)_0%,_rgba(240,139,214,0.15)_30%,_transparent_80%)] blur-3xl" />

  {/* Smooth gradient that blends with next section */}
  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0710] via-[#0b0710]/80 to-transparent" />
</div>

    </section>
  );
}
