"use client";

import { useEffect, useState } from "react";
import useUser from "@/lib/authClient";
import AIDostModal from "../components/AIDostModal";
import AIReportModal from "../components/AIReportModal";
import Navbar from "../components/Navbar";

export default function PortfolioPage() {
  const { user, isSignedIn, isLoading } = useUser();
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAIDost, setShowAIDost] = useState(false);
  const [showAIReport, setShowAIReport] = useState(false);
  const [riskVolatility, setRiskVolatility] = useState({});
  const [monteCarlo, setMonteCarlo] = useState({});

  // Function to calculate aggregate portfolio metrics
  const calculatePortfolioMetrics = async () => {
    if (!portfolioItems.length) return;

    try {
      const totalRisk = portfolioItems.reduce(
        (acc, item) => acc + (item.risk_volatility?.annualized_volatility || 0),
        0
      );
      const avgVolatility = totalRisk / portfolioItems.length;

      const totalReturn = portfolioItems.reduce(
        (acc, item) => acc + (item.risk_volatility?.annualized_return || 0),
        0
      );
      const avgReturn = totalReturn / portfolioItems.length;

      setRiskVolatility({
        annualized_volatility: avgVolatility,
        annualized_return: avgReturn,
        sharpe_ratio: (avgReturn - 0.05) / avgVolatility,
      });

      setMonteCarlo({
        expected_nav: portfolioItems.reduce((acc, item) => acc + (item.nav || 0), 0),
        probability_positive_return: avgReturn > 0 ? 75 : 45,
        lower_bound_5th_percentile: avgReturn * 0.95,
        upper_bound_95th_percentile: avgReturn * 1.05,
      });
    } catch (error) {
      console.error("Error calculating portfolio metrics:", error);
    }
  };

  useEffect(() => {
    calculatePortfolioMetrics();
  }, [portfolioItems]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (isLoading) {
        return; // Still loading, don't fetch yet
      }
      
      if (!isSignedIn || !user) {
        setError("Please sign in to view your portfolio");
        setLoading(false);
        return;
      }

      try {
        const userId = encodeURIComponent(user.sub || "");
        const response = await fetch(`/api/portfolio/${userId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch portfolio");
        }

        const items = await response.json();

        const itemsWithMetrics = await Promise.all(
          items.map(async (item) => {
            try {
              let riskResponse, navResponse;
              if (item.item_type === "stock") {
                riskResponse = await fetch(`/api/stock/risk-volatility/${item.symbol}`);
                navResponse = await fetch(`/api/stock/profile/${item.symbol}`);
              } else {
                riskResponse = await fetch(`/api/mutual/risk-volatility/${item.symbol}`);
                navResponse = await fetch(`/api/mutual/scheme-details/${item.symbol}`);
              }

              const risk = await riskResponse.json();
              const nav = await navResponse.json();

              return {
                ...item,
                risk_volatility: risk,
                nav: item.item_type === "stock" ? nav?.currentPrice : nav?.nav,
              };
            } catch (error) {
              console.error(`Error fetching metrics for ${item.symbol}:`, error);
              return item;
            }
          })
        );

        setPortfolioItems(itemsWithMetrics);
      } catch (err) {
        console.error("Error fetching portfolio:", err);
        setError("Failed to fetch your portfolio. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [isSignedIn, user, isLoading]);

  const handleRemoveItem = async (itemId) => {
    if (!isSignedIn || !user) {
      alert("Please sign in to remove items");
      return;
    }

    try {
      const userId = encodeURIComponent(user.sub || "");
      const response = await fetch(`/api/portfolio/${userId}/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove item");
      }

      setPortfolioItems((items) => items.filter((item) => item.id !== itemId));
      alert("Item removed successfully!");
    } catch (err) {
      console.error("Error removing item:", err);
      alert("Failed to remove item. Please try again.");
    }
  };

  if (!isSignedIn && !isLoading) {
    return (
      <div className="min-h-screen py-12 px-4 bg-linear-to-b from-[#050511] via-[#0d1020] to-[#0b0b12]">
        <Navbar />
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Please Sign In</h1>
          <p className="text-gray-400">You need to be signed in to view your portfolio.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-linear-to-b from-[#050511] via-[#0d1020] to-[#0b0b12]">
      <Navbar /> {/* <-- Added Navbar here */}
      <div className="max-w-7xl mt-12">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">My Portfolio</h1>
              <p className="text-gray-400">Manage your finance</p>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowAIDost(true)}
                className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold text-base transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                AI Dost
              </button>
              <button
                onClick={() => setShowAIReport(true)}
                className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2.5 rounded-lg font-semibold text-base transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                AI Report
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
            {error}
          </div>
        ) : portfolioItems.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-lg">
            <p className="text-gray-400">Your portfolio is empty. Add some stocks or mutual funds from the dashboards!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {portfolioItems.map((item) => (
              <div key={item.id} className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-400">{item.symbol}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                    style={{
                      backgroundColor: item.item_type === 'stock' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                      color: item.item_type === 'stock' ? '#10B981' : '#8B5CF6'
                    }}>
                    {item.item_type}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>Added: {new Date(item.added_at).toLocaleDateString()}</span>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Modals */}
        <AIDostModal
          isOpen={showAIDost}
          onClose={() => setShowAIDost(false)}
          fundData={{
            meta: {
              portfolio_size: portfolioItems.length,
              stocks_count: portfolioItems.filter(i => i.item_type === 'stock').length,
              mutual_funds_count: portfolioItems.filter(i => i.item_type === 'mutual_fund').length,
              last_added: portfolioItems[0]?.added_at
            },
            riskVolatility,
            monteCarlo,
            portfolioItems
          }}
        />

        <AIReportModal
          isOpen={showAIReport}
          onClose={() => setShowAIReport(false)}
          fundData={{
            meta: {
              portfolio_size: portfolioItems.length,
              stocks_count: portfolioItems.filter(i => i.item_type === 'stock').length,
              mutual_funds_count: portfolioItems.filter(i => i.item_type === 'mutual_fund').length,
              last_added: portfolioItems[0]?.added_at
            },
            riskVolatility,
            monteCarlo,
            portfolioItems
          }}
        />
      </div>
    </div>
  );
}
