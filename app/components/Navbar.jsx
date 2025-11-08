"use client";

import Link from "next/link";
import { useState } from "react";
import useUser, { loginHref, logoutHref } from "@/lib/authClient";

export default function Navbar() {
  const [openNavigation, setOpenNavigation] = useState(false);
  const { user, isSignedIn, isLoading } = useUser();

  const toggleNavigation = () => setOpenNavigation(!openNavigation);
  const handleNavClick = () => setOpenNavigation(false);

  const links = [
    { name: "Why Choose Us", href: "/#features" },
    { name: "Testimonials", href: "/#testimonials" },
    { name: "StockDashboard", href: "/StockDashboard" },
    { name: "MFDashboard", href: "/MFDashboard" },
    { name: "CryptoDashboard", href: "/CryptoDashboard" },
    { name: "Courses", href: "/Courses" },
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
          {isSignedIn && !isLoading && (
            <Link href="/Portfolio" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
              My Portfolio
            </Link>
          )}
        </nav>

        {/* Auth Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          {isLoading ? (
            <div className="animate-pulse bg-white/10 h-9 w-24 rounded-full"></div>
          ) : isSignedIn && user ? (
            <div className="flex items-center gap-3">
              <img 
                src={user.picture || '/vercel.svg'} 
                alt={user.name || 'user'} 
                className="w-9 h-9 rounded-full object-cover" 
              />
              <span className="text-sm text-gray-200">{user.name || user.email}</span>
              <a 
                href={logoutHref} 
                className="text-sm text-white/90 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-colors"
              >
                Sign out
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <a 
                href={loginHref} 
                className="text-sm text-white/90 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-colors"
              >
                Sign in
              </a>
              <a 
                href={`${loginHref}?screen_hint=signup`} 
                className="text-sm font-semibold bg-linear-to-r from-[#9b5cff] to-[#f08bd6] text-white px-4 py-2 rounded-full shadow hover:scale-[1.02] transition-transform"
              >
                Sign up
              </a>
            </div>
          )}
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
          {isLoading ? (
            <div className="animate-pulse bg-white/10 h-8 w-32 rounded-full"></div>
          ) : isSignedIn ? (
            <Link 
              href="/Portfolio" 
              onClick={handleNavClick} 
              className="text-purple-400 hover:text-purple-300 text-lg"
            >
              My Portfolio
            </Link>
          ) : (
            <div className="flex flex-col gap-3 items-center">
              <a 
                href={loginHref} 
                className="text-sm text-white/90 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-colors"
              >
                Sign in
              </a>
              <a 
                href={`${loginHref}?screen_hint=signup`} 
                className="text-sm font-semibold bg-linear-to-r from-[#9b5cff] to-[#f08bd6] text-white px-4 py-2 rounded-full shadow hover:scale-[1.02] transition-transform"
              >
                Sign up
              </a>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
