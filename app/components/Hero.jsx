"use client";

import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative w-full min-h-[760px] bg-gradient-to-b from-[#050511] via-[#0d1020] to-[#0b0b12] overflow-hidden text-white">
      <div className="max-w-7xl mx-auto px-8 py-20 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* left column - headings */}
        <div className="md:col-span-7">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="w-[46px] h-[46px] rounded-full bg-gradient-to-r from-purple-500 to-pink-400 flex items-center justify-center">
                {/* logo placeholder */}
                <span className="font-bold text-white">CD</span>
              </div>
              <nav className="hidden md:flex gap-8 ml-auto text-sm opacity-80">
                <a className="hover:underline" href="#">Why Choose Us</a>
                <a className="hover:underline" href="#">Whitepaper</a>
                <a className="hover:underline" href="#">Get Started</a>
              </nav>
            </div>
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
          <div className="w-[420px] h-[420px] rounded-3xl bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-transparent to-transparent relative">
            <Image src="/file.svg" alt="globe" width={420} height={420} className="object-cover rounded-3xl" />
          </div>

          <aside className="absolute right-0 top-12 w-[320px] bg-white/6 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-2xl font-bold mb-2">Get Started</h3>
            <p className="text-sm text-gray-200 mb-6">Begin by selecting your preferred process style to get started.</p>

            <div className="flex flex-col gap-4">
              <button className="flex items-center justify-between gap-4 bg-white/5 hover:bg-white/8 border border-white/6 rounded-full px-4 py-3">
                <span>Wizzard Mode</span>
                <span className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center">→</span>
              </button>

              <button className="flex items-center justify-between gap-4 bg-white/5 hover:bg-white/8 border border-white/6 rounded-full px-4 py-3">
                <span>Expert Mode</span>
                <span className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center">→</span>
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
