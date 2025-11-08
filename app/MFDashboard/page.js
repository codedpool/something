"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Chatbot from "../components/Chatbot";

// Debounce utility
const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
};

const fetchSchemes = async (search = "") => {
  const url = search
    ? `/api/mutual/schemes?search=${encodeURIComponent(search)}`
    : "/api/mutual/schemes";
  const res = await fetch(url);
  if (!res.ok) return {};
  return await res.json();
};

function getRandomMFs(schemesObj, count = 6) {
  const entries = Object.entries(schemesObj);
  if (entries.length <= count) return entries;
  const shuffled = entries.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export default function MFDashboardPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [loading, setLoading] = useState(false);
  const [schemes, setSchemes] = useState({});
  const [displayedMfs, setDisplayedMfs] = useState([]);
  const [noResults, setNoResults] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    setLoading(true);
    fetchSchemes(debouncedSearch).then((data) => {
      setSchemes(data);
      if (debouncedSearch) {
        // Show up to 8 matching results for queries
        const mfArr = Object.entries(data).slice(0, 8);
        setDisplayedMfs(mfArr);
        setNoResults(mfArr.length === 0);
      } else {
        // Show 6 random funds for blank search
        const mfArr = getRandomMFs(data, 6);
        setDisplayedMfs(mfArr);
        setNoResults(mfArr.length === 0);
      }
      setLoading(false);
    });
  }, [debouncedSearch]);

  const onSearchChange = (e) => setSearch(e.target.value);
  const onClearSearch = () => {
    setSearch("");
    inputRef.current.focus();
  };

  return (
    <>
    <Navbar />
    <section className="relative min-h-screen bg-gradient-to-b from-[#050511] via-[#0d1020] to-[#0b0b12] py-16 text-white">
      <div className="max-w-5xl mx-auto px-9">
        {/* Searchbar */}
        <div className="flex justify-center mb-8 py-9 relative">
          <input
            ref={inputRef}
            value={search}
            onChange={onSearchChange}
            type="text"
            placeholder="Search Mutual Funds by name…"
            className="w-full max-w-md px-5 py-3 rounded-full bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-md"
            aria-label="Search Mutual Funds"
          />
          {search && (
            <button
              onClick={onClearSearch}
              className="absolute right-8 top-2.5 text-white/60 hover:text-white/90 text-xl"
              aria-label="Clear Search"
            >
              ×
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <span className="animate-spin border-4 border-purple-400 border-t-transparent rounded-full w-8 h-8"></span>
          </div>
        ) : noResults ? (
          <div className="flex flex-col items-center py-16">
            <span className="text-4xl mb-4 opacity-70">😕</span>
            <span className="text-gray-400 text-lg">
              No mutual funds found. Try another search!
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {displayedMfs.map(([code, name]) => (
              <div
                key={code}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col hover:bg-white/10 transition-colors"
              >
                <h3 className="text-lg font-semibold mb-2">{name}</h3>
                <div className="text-xs text-gray-300 mb-5">
                  Scheme Code: <span className="font-mono">{code}</span>
                </div>
                <Link href={`/MFDashboard/${code}`}>
                  <button className="inline-flex items-center gap-2 bg-gradient-to-r from-[#9b5cff] to-[#f08bd6] text-white text-sm font-semibold px-4 py-2 rounded-full shadow hover:scale-[1.03] transition-transform">
                    View Details →
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="absolute left-0 right-0 bottom-0 h-48 bg-gradient-to-t from-[#0b0710]/80 to-transparent" />
      <Chatbot />
    </section>
    </>
  );
}
