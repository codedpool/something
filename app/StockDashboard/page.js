"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Chatbot from "../components/Chatbot";

const stocksPerPage = 9;

function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

function getRandomSubset(arr, count) {
  if (!Array.isArray(arr)) return [];
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export default function StockDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  // Load random stocks initially (e.g., from /api/stock/list)
  useEffect(() => {
    if (debouncedSearch) return; // skip random-load if searching

    setLoading(true);
    setError("");
    fetch(`/api/stock/list`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch stock list");
        const arr = await res.json();
        // arr should be [{ symbol: 'TCS.NS', longName: 'Tata Consultancy Services', ...}, ...]
        setStocks(getRandomSubset(arr, stocksPerPage));
        setPage(1);
      })
      .catch((e) => {
        setError("Could not fetch stocks.");
        setStocks([]);
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  // Load searched stock if a symbol is entered
  useEffect(() => {
    if (!debouncedSearch) return;
    setLoading(true);
    setError("");
    fetch(`/api/stock/search?symbol=${encodeURIComponent(debouncedSearch)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch stock");
        const data = await res.json();
        setStocks(data.found ? [data] : []);
        setPage(1);
      })
      .catch((e) => {
        setError("Could not fetch stock.");
        setStocks([]);
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  const currentStocks = stocks.slice((page - 1) * stocksPerPage, page * stocksPerPage);

  return (
    <>
    <Navbar />
    <section className="py-18 px-7 min-h-[60vh] bg-gradient-to-b from-[#050511] via-[#0d1020] to-[#0b0b12]">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-white text-center">View Stocks</h2>
        <div className="flex justify-center mb-8">
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="text-white bg-white/10 px-4 py-3 rounded-full focus:ring-2 focus:ring-purple-600 max-w-xl w-full"
            placeholder="Enter Stock Symbol (e.g. TCS.NS)…"
          />
        </div>
        <div>
          {loading ? (
            <div className="text-center py-8 text-gray-300">Loading…</div>
          ) : error ? (
            <div className="text-center py-8 text-red-300">{error}</div>
          ) : currentStocks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {currentStocks.map((stock) => (
                <Link href={`/StockDashboard/${stock.symbol}`} key={stock.symbol}>
                  <div className="bg-white/10 border border-white/20 rounded-2xl p-6 shadow-md hover:bg-white/20 transition-colors cursor-pointer flex flex-col h-full">
                    <div className="text-purple-200 font-semibold mb-2">{stock.longName || stock.symbol}</div>
                    <div className="text-xs text-gray-300 mb-3">Symbol: <span className="font-mono">{stock.symbol}</span></div>
                    <button className="mt-auto py-2 px-4 bg-gradient-to-r from-[#9b5cff] to-[#f08bd6] text-white rounded-full shadow font-bold">
                      View Details →
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-300">No stocks found.</div>
          )}
        </div>
      </div>
    </section>
    <Chatbot />
    </>
  );
}
