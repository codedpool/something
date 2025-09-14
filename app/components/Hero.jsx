"use client";

import Image from "next/image";
import Earth from "@/components/uilayouts/globe";

export default function Hero() {
  return (
    <section className="relative w-full min-h-[760px] bg-gradient-to-b from-[#050511] via-[#0d1020] to-[#0b0b12] overflow-hidden text-white">

      {/* Top navbar */}
      <header className="absolute left-0 right-0 top-6 z-30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/8 rounded-full px-4 py-2 shadow-md">
            <div className="w-[46px] h-[46px] rounded-full bg-gradient-to-r from-purple-500 to-pink-400 flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-white">CD</span>
            </div>

            <nav className="hidden md:flex gap-8 ml-4 text-sm text-gray-100/90">
              <a className="hover:underline hover:text-white transition-colors" href="#">Why Choose Us</a>
              <a className="hover:underline hover:text-white transition-colors" href="#">Whitepaper</a>
              <a className="hover:underline hover:text-white transition-colors" href="#">Get Started</a>
            </nav>

            <div className="ml-auto hidden md:flex items-center gap-3">
              <button className="text-sm text-white/90 bg-white/6 hover:bg-white/10 px-4 py-2 rounded-full border border-white/6">Sign in</button>
              <button className="text-sm font-semibold bg-gradient-to-r from-[#9b5cff] to-[#f08bd6] text-white px-4 py-2 rounded-full shadow">Connect</button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 pt-32 md:pt-36 pb-20 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* left column - headings */}
        <div className="md:col-span-7">
          <div className="mb-6">
            {/* kept intentionally minimal - header contains the main nav now */}
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
            Empowering Your
            <br />
            Financial Freedom
          </h1>

          <p className="mt-6 text-lg text-gray-200 max-w-xl">Coinlend DeFi Unlocks Your Potential</p>

          <div className="mt-10 flex items-center gap-6">
            <button className="inline-flex items-center gap-3 bg-gradient-to-r from-[#9b5cff] to-[#f08bd6] text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:scale-[1.01] transition-transform">
              Connect Wallet
              <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">→</span>
            </button>
          </div>
        </div>

        {/* right column - globe + card */}
        <div className="md:col-span-5 relative flex justify-end items-start">
          <div className="w-[520px] h-[520px] rounded-3xl bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-transparent to-transparent relative overflow-hidden">
            <Earth className="w-full h-full rounded-3xl" />
          </div>

          <aside className="absolute right-0 top-8 translate-x-6 w-[320px] bg-white/6 backdrop-blur-md border border-white/12 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-2xl font-bold mb-2">Get Started</h3>
            <p className="text-sm text-gray-200 mb-6">Begin by selecting your preferred process style to get started.</p>

            <div className="flex flex-col gap-4">
              <button className="flex items-center justify-between gap-4 bg-white/6 hover:bg-white/10 border border-white/8 rounded-full px-4 py-3 transition-colors">
                <span>Wizard Mode</span>
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">→</span>
              </button>

              <button className="flex items-center justify-between gap-4 bg-white/6 hover:bg-white/10 border border-white/8 rounded-full px-4 py-3 transition-colors">
                <span>Expert Mode</span>
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">→</span>
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* bottom section */}
      <div className="absolute left-0 right-0 bottom-0 h-48 bg-gradient-to-t from-[#0b0710]/80 to-transparent" />
    </section>
  );
}
