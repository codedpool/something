export const Footer = () => {
  return (
    <footer className="py-5 border-t border-white/15 bg-black text-white">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-center text-center gap-8">
          
          {/* Left side — Logo text */}
          <div className="flex gap-2 items-center justify-center lg:flex-1">
            <div className="text-lg font-semibold tracking-tight p-2 text-center">Phoenix Arcana</div>
            </div>

          {/* Center — Navigation links */}
          <nav className="flex flex-col lg:flex-row gap-5 lg:gap-7 lg:flex-1 lg:justify-center">
            <a href="#" className="text-white/70 hover:text-white text-xs md:text-sm transition">Features</a>
            <a href="#" className="text-white/70 hover:text-white text-xs md:text-sm transition">Developers</a>
            <a href="#" className="text-white/70 hover:text-white text-xs md:text-sm transition">Company</a>
            <a href="#" className="text-white/70 hover:text-white text-xs md:text-sm transition">Blog</a>
            <a href="#" className="text-white/70 hover:text-white text-xs md:text-sm transition">Changelog</a>
          </nav>

          {/* Right side — Social links as text */}
          <div className="flex gap-5 lg:flex-1 justify-center lg:justify-end text-sm">
            <a href="#" className="text-white/40 hover:text-white transition">Instagram</a>
            <a href="#" className="text-white/40 hover:text-white transition">YouTube</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
