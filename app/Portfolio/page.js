"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from "recharts";

export default function PortfolioPage() {
  const { user, isSignedIn } = useUser();
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalValue: 0,
    totalInvested: 0,
    totalGain: 0,
    totalGainPercent: 0,
    stocksValue: 0,
    mutualFundsValue: 0,
    cryptoValue: 0,
  });

  // Function to calculate aggregate portfolio metrics
  const calculatePortfolioMetrics = () => {
    if (!portfolioItems.length) {
      setStats({
        totalValue: 0,
        totalInvested: 0,
        totalGain: 0,
        totalGainPercent: 0,
        stocksValue: 0,
        mutualFundsValue: 0,
        cryptoValue: 0,
      });
      return;
    }

    // Calculate mock values (in real scenario, you'd fetch actual prices and quantities)
    const stocksValue = portfolioItems.filter(i => i.item_type === 'stock').length * 5000; // Mock value per stock
    const mutualFundsValue = portfolioItems.filter(i => i.item_type === 'mutual_fund').length * 10000; // Mock value per fund
    const cryptoValue = portfolioItems.filter(i => i.item_type === 'crypto').length * 3000; // Mock value per crypto
    
    const totalValue = stocksValue + mutualFundsValue + cryptoValue;
    const totalInvested = totalValue * 0.85; // Mock 15% gain
    const totalGain = totalValue - totalInvested;
    const totalGainPercent = (totalGain / totalInvested) * 100;

    setStats({
      totalValue,
      totalInvested,
      totalGain,
      totalGainPercent,
      stocksValue,
      mutualFundsValue,
      cryptoValue,
    });
  };

  useEffect(() => {
    calculatePortfolioMetrics();
  }, [portfolioItems]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!isSignedIn || !user) {
        setError("Please sign in to view your portfolio");
        setLoading(false);
        return;
      }

      try {
        const userId = user.id.replace('user_', '');
        const response = await fetch(`/api/portfolio/${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio');
        }

        const items = await response.json();
        setPortfolioItems(items);
      } catch (err) {
        console.error("Error fetching portfolio:", err);
        setError("Failed to fetch your portfolio. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [isSignedIn, user]);

  const handleRemoveItem = async (itemId) => {
    if (!isSignedIn || !user) {
      alert("Please sign in to remove items");
      return;
    }

    try {
      const userId = user.id.replace('user_', '');
      const response = await fetch(`/api/portfolio/${userId}/${itemId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      // Remove item from state
      setPortfolioItems(items => items.filter(item => item.id !== itemId));
      alert("Item removed successfully!");
    } catch (err) {
      console.error("Error removing item:", err);
      alert("Failed to remove item. Please try again.");
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen py-12 px-4 bg-gradient-to-b from-[#050511] via-[#0d1020] to-[#0b0b12]">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Please Sign In</h1>
          <p className="text-gray-400">You need to be signed in to view your portfolio.</p>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const allocationData = [
    { name: 'Stocks', value: stats.stocksValue, color: '#10b981' },
    { name: 'Mutual Funds', value: stats.mutualFundsValue, color: '#8b5cf6' },
    { name: 'Crypto', value: stats.cryptoValue, color: '#06b6d4' },
  ].filter(item => item.value > 0);

  const performanceData = [
    { month: 'Jan', value: stats.totalInvested * 0.95 },
    { month: 'Feb', value: stats.totalInvested * 0.98 },
    { month: 'Mar', value: stats.totalInvested * 1.02 },
    { month: 'Apr', value: stats.totalInvested * 1.05 },
    { month: 'May', value: stats.totalInvested * 1.08 },
    { month: 'Jun', value: stats.totalValue },
  ];

  const formatCurrency = (val) => {
    return '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <section className="min-h-screen py-12 px-2 bg-gradient-to-b from-[#050511] via-[#0d1020] to-[#0b0b12] text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-cyan-400 text-center mb-2">
            Portfolio Dashboard
          </h1>
          <p className="text-gray-400 text-center text-base">
            Your complete investment overview and analytics
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[60vh]">
            <span className="animate-spin border-4 border-purple-400 border-t-transparent rounded-full w-10 h-10"></span>
          </div>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-600 rounded-lg p-6 text-red-400 text-center">
            <p className="text-lg font-semibold">{error}</p>
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Value Card */}
              <div className="bg-[#181f31] rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm font-medium">Total Value</span>
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{formatCurrency(stats.totalValue)}</h3>
                <p className="text-sm text-gray-400">Current portfolio worth</p>
              </div>

              {/* Total Gain Card */}
              <div className="bg-[#181f31] rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm font-medium">Total Gain</span>
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-green-400 mb-1">
                  +{formatCurrency(stats.totalGain)}
                </h3>
                <p className="text-sm text-green-400">+{stats.totalGainPercent.toFixed(2)}% overall</p>
              </div>

              {/* Total Items Card */}
              <div className="bg-[#181f31] rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm font-medium">Total Holdings</span>
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{portfolioItems.length}</h3>
                <p className="text-sm text-gray-400">Investment items</p>
              </div>

              {/* Total Invested Card */}
              <div className="bg-[#181f31] rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm font-medium">Total Invested</span>
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{formatCurrency(stats.totalInvested)}</h3>
                <p className="text-sm text-gray-400">Capital deployed</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Asset Allocation Chart */}
              <div className="bg-[#181f31] rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
                  Asset Allocation
                </h3>
                {allocationData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocationData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {allocationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-400">
                    No data to display
                  </div>
                )}
                
                {/* Allocation Breakdown */}
                <div className="mt-4 space-y-2">
                  {allocationData.map((item) => (
                    <div key={item.name} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-gray-300">{item.name}</span>
                      </div>
                      <span className="text-white font-semibold">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Chart */}
              <div className="bg-[#181f31] rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
                  Portfolio Performance (6 Months)
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: '#9ca3af', fontSize: 12 }} 
                      />
                      <YAxis 
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickFormatter={(val) => '₹' + (val / 1000).toFixed(0) + 'k'}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: "#1f2937", 
                          border: "1px solid #374151", 
                          borderRadius: "6px" 
                        }}
                        formatter={(value) => [formatCurrency(value), 'Value']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Holdings Breakdown */}
            <div className="bg-[#181f31] rounded-xl p-6 border border-gray-700 mb-8">
              <h3 className="text-xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
                Your Holdings
              </h3>
              
              {portfolioItems.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-400 text-lg">Your portfolio is empty</p>
                  <p className="text-gray-500 text-sm mt-2">Start by adding stocks, mutual funds, or crypto from their dashboards</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {portfolioItems.map((item) => (
                    <div key={item.id} className="bg-[#232b44] rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-base mb-1 truncate">{item.name}</h4>
                          <p className="text-gray-400 text-sm uppercase">{item.symbol}</p>
                        </div>
                        <span 
                          className="px-2 py-1 rounded text-xs font-medium capitalize whitespace-nowrap ml-2"
                          style={{
                            backgroundColor: 
                              item.item_type === 'stock' ? 'rgba(16, 185, 129, 0.1)' : 
                              item.item_type === 'crypto' ? 'rgba(6, 182, 212, 0.1)' :
                              'rgba(139, 92, 246, 0.1)',
                            color: 
                              item.item_type === 'stock' ? '#10B981' : 
                              item.item_type === 'crypto' ? '#06B6D4' :
                              '#8B5CF6'
                          }}
                        >
                          {item.item_type === 'mutual_fund' ? 'Mutual Fund' : item.item_type}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-gray-400 mb-3">
                        <span>Added: {new Date(item.added_at).toLocaleDateString()}</span>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stocks */}
              <div className="bg-[#181f31] rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Stocks</h3>
                  <div className="w-10 h-10 bg-green-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-white mb-2">{formatCurrency(stats.stocksValue)}</p>
                <p className="text-sm text-gray-400">
                  {portfolioItems.filter(i => i.item_type === 'stock').length} holdings
                </p>
              </div>

              {/* Mutual Funds */}
              <div className="bg-[#181f31] rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Mutual Funds</h3>
                  <div className="w-10 h-10 bg-purple-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-white mb-2">{formatCurrency(stats.mutualFundsValue)}</p>
                <p className="text-sm text-gray-400">
                  {portfolioItems.filter(i => i.item_type === 'mutual_fund').length} holdings
                </p>
              </div>

              {/* Crypto */}
              <div className="bg-[#181f31] rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Cryptocurrency</h3>
                  <div className="w-10 h-10 bg-cyan-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-white mb-2">{formatCurrency(stats.cryptoValue)}</p>
                <p className="text-sm text-gray-400">
                  {portfolioItems.filter(i => i.item_type === 'crypto').length} holdings
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}