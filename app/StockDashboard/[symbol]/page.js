"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import useUser from "@/lib/authClient";
import StockAIDostModal from "../../components/StockAIDostModal";
import StockAIReportModal from "../../components/StockAIReportModal";
import Chatbot from "../../components/Chatbot";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  Legend,
} from "recharts";
import Navbar from "../../components/Navbar";

  // Utility functions
  function formatPct(val) {
    return isNaN(val) ? "--" : (val * 100).toFixed(2) + "%";
  }
  function formatRs(val) {
    return isNaN(val) ? "--" : "₹" + Number(val).toLocaleString("en-IN");
  }

  // Custom Heatmap Component using Bar Chart (copied from MF page design)
  function PerformanceHeatmap({ data }) {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          No heatmap data available
        </div>
      );
    }

    // Format data for bar chart - take last 12 months
    const chartData = data.slice(-12).map(item => ({
      month: `${item.month}/${item.year}`,
      value: item.value,
      displayValue: item.value.toFixed(4)
    }));

    const getColor = (value) => {
      if (value > 0.15) return "#eab308";
      if (value > 0.05) return "#84cc16";
      if (value > 0) return "#10b981";
      if (value > -0.05) return "#6366f1";
      return "#8b5cf6";
    };

    return (
      <div className="w-full h-full bg-white rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              tick={{ fill: '#6b7280', fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickFormatter={(val) => val.toFixed(4)}
            />
            <Tooltip 
              contentStyle={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "6px" }}
              formatter={(value) => [value.toFixed(4), 'Monthly Return']}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.value)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="flex items-center justify-end gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-[#8b5cf6] rounded"></div>
            <span className="text-gray-600">Negative</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-[#6366f1] rounded"></div>
            <span className="text-gray-600">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-[#10b981] rounded"></div>
            <span className="text-gray-600">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-[#eab308] rounded"></div>
            <span className="text-gray-600">High</span>
          </div>
        </div>
      </div>
    );
  }

  export default function StockDetailsPage() {
    const { symbol } = useParams();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [history, setHistory] = useState([]);
    const [heatmap, setHeatmap] = useState([]);
    const [riskVolatility, setRiskVolatility] = useState({});
    const [monteCarlo, setMonteCarlo] = useState({});
    const [amount, setAmount] = useState(10000);
    const [years, setYears] = useState(1);
    const [selectedPeriod, setSelectedPeriod] = useState("1M");

    // Compare stocks state
    const [stock1Query, setStock1Query] = useState("");
    const [stock2Query, setStock2Query] = useState("");
    const [stock1Suggestions, setStock1Suggestions] = useState([]);
    const [stock2Suggestions, setStock2Suggestions] = useState([]);
    const [showStock1Dropdown, setShowStock1Dropdown] = useState(false);
    const [showStock2Dropdown, setShowStock2Dropdown] = useState(false);
    const [selectedStock1, setSelectedStock1] = useState(null);
    const [selectedStock2, setSelectedStock2] = useState(null);
    const [stock1Data, setStock1Data] = useState(null);
    const [stock2Data, setStock2Data] = useState(null);
    const [showComparison, setShowComparison] = useState(false);

    // AI Modals
    const [showAIDost, setShowAIDost] = useState(false);
    const [showAIReport, setShowAIReport] = useState(false);
  const [addingToPortfolio, setAddingToPortfolio] = useState(false);
  const { user, isSignedIn } = useUser();

    useEffect(() => {
      setLoading(true);

      (async () => {
        try {
          const endpoints = {
            profile: `/api/stock/profile/${symbol}`,
            history: `/api/stock/history/${symbol}`,
            heatmap: `/api/stock/performance-heatmap/${symbol}`,
            risk: `/api/stock/risk-volatility/${symbol}`,
            montecarlo: `/api/stock/monte-carlo-prediction/${symbol}`,
          };

          const results = {};

          for (const [key, url] of Object.entries(endpoints)) {
            try {
              const res = await fetch(url);
              const text = await res.text();
              // Try to parse JSON, fallback to null and log raw body for debugging
              try {
                results[key] = res.ok ? JSON.parse(text) : null;
              } catch (parseErr) {
                console.error(`Non-JSON response from ${url}:`, text.slice(0, 1000));
                results[key] = null;
              }
            } catch (fetchErr) {
              console.error(`Network error fetching ${url}:`, fetchErr);
              results[key] = null;
            }
          }

          setProfile(results.profile || null);
          setHistory(results.history || []);
          setHeatmap(results.heatmap || []);
          setRiskVolatility(results.risk || {});
          setMonteCarlo(results.montecarlo || {});
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      })();
    }, [symbol]);

    // Debounced search for stock 1
    useEffect(() => {
      if (stock1Query.length < 1) return setStock1Suggestions([]);
      const id = setTimeout(async () => {
        try {
          const res = await fetch(`/api/stock/search-stocks?q=${encodeURIComponent(stock1Query)}`);
          const data = await res.json();
          setStock1Suggestions(data || []);
          setShowStock1Dropdown(true); // Always show dropdown when searching
        } catch (e) {
          console.error('Error fetching stock suggestions:', e);
          setStock1Suggestions([]);
          setShowStock1Dropdown(true); // Show dropdown even on error
        }
      }, 300);
      return () => clearTimeout(id);
    }, [stock1Query]);

    // Debounced search for stock 2
    useEffect(() => {
      if (stock2Query.length < 1) return setStock2Suggestions([]);
      const id = setTimeout(async () => {
        try {
          const res = await fetch(`/api/stock/search-stocks?q=${encodeURIComponent(stock2Query)}`);
          const data = await res.json();
          setStock2Suggestions(data || []);
          setShowStock2Dropdown(true); // Always show dropdown when searching
        } catch (e) {
          console.error('Error fetching stock suggestions:', e);
          setStock2Suggestions([]);
          setShowStock2Dropdown(true); // Show dropdown even on error
        }
      }, 300);
      return () => clearTimeout(id);
    }, [stock2Query]);

    // Fetch data for selected stock 1
    useEffect(() => {
      if (!selectedStock1) return;
      (async () => {
        try {
          const res = await fetch(`/api/stock/profile/${selectedStock1.symbol}`);
          const data = await res.json();
          setStock1Data({ profile: data });
        } catch (e) {
          console.error(e);
        }
      })();
    }, [selectedStock1]);

    // Fetch data for selected stock 2
    useEffect(() => {
      if (!selectedStock2) return;
      (async () => {
        try {
          const res = await fetch(`/api/stock/profile/${selectedStock2.symbol}`);
          const data = await res.json();
          setStock2Data({ profile: data });
        } catch (e) {
          console.error(e);
        }
      })();
    }, [selectedStock2]);

    const handleStock1Select = (s) => {
      setSelectedStock1(s);
      setStock1Query(s.name || s.symbol);
    };
  const handleStock2Select = (s) => {
    setSelectedStock2(s);
    setStock2Query(s.name || s.symbol);
  };

  const handleAddToPortfolio = async () => {
    if (!isSignedIn || !user) {
      alert("Please sign in to add items to your portfolio");
      return;
    }

    try {
      setAddingToPortfolio(true);
      console.log('Adding to portfolio:', {
        userId: user.sub,
        symbol,
        name: profile?.longName || symbol
      });

      // Using Next.js API route instead of calling FastAPI directly
  const userId = encodeURIComponent(user.sub || '');
  const response = await fetch(`/api/portfolio/add/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol: symbol,
          name: profile?.longName || symbol,
          item_type: "stock"
        }),
      });

      const responseText = await response.text();
      console.log('API Response:', response.status, responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing response:', e);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        if (response.status === 400) {
          alert(data.detail || "Stock already in portfolio");
        } else {
          throw new Error(data.detail || "Failed to add to portfolio");
        }
        return;
      }

      alert("Successfully added to portfolio!");
    } catch (error) {
      console.error("Error adding to portfolio:", error);
      alert(error.message || "Failed to add to portfolio. Please try again.");
    } finally {
      setAddingToPortfolio(false);
    }
  };    const estReturn = amount * Math.pow(1 + (riskVolatility.annualized_return || 0), Number(years || 1));
    const estProfit = estReturn - amount;

    return (
      <>
      <Navbar />
      <section className="min-h-screen py-18 px-2 bg-gradient-to-b from-[#050511] via-[#0d1020] to-[#0b0b12] text-white">
        <div className="max-w-7xl mx-auto grid gap-6">
          {loading ? (
            <div className="flex justify-center items-center min-h-[60vh]">
              <span className="animate-spin border-4 border-purple-400 border-t-transparent rounded-full w-10 h-10"></span>
            </div>
          ) : (
            <>
              <div className="mb-6 ">
                <h1 className="text-3xl md:text-4xl font-bold text-cyan-400 text-center">Stock Dashboard</h1>
              </div>

              <div className="mb-6">
                <div className="bg-[#181f31] rounded-xl p-4 border border-gray-700">
                  <h2 className="text-xl font-bold text-white text-center mb-4">{profile?.longName || profile?.companyName || symbol}</h2>
                  <div className="flex gap-4 justify-center">
                    <button onClick={() => setShowAIDost(true)} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold text-base transition-all transform hover:scale-105 shadow-lg flex items-center gap-2">
                      AI Dost
                    </button>
                    <button onClick={() => setShowAIReport(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2.5 rounded-lg font-semibold text-base transition-all transform hover:scale-105 shadow-lg flex items-center gap-2">
                      AI Report
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6 items-start">
                <div className="flex flex-col gap-6">
                  <div className="bg-[#181f31] rounded-xl p-6 shadow-lg h-fit">
                    <h3 className="text-xl font-bold mb-4 text-white border-b border-gray-700 pb-2">{profile?.longName || symbol}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-base">
                        <span className="font-medium text-gray-300">Industry:</span>
                        <span className="text-white font-semibold">{profile?.industry || 'Not Available'}</span>
                      </div>
                      <div className="flex justify-between items-center text-base">
                        <span className="font-medium text-gray-300">Sector:</span>
                        <span className="text-white font-semibold">{profile?.sector || 'Not Available'}</span>
                      </div>
                      <div className="flex justify-between items-center text-base">
                        <span className="font-medium text-gray-300">Market Cap:</span>
                        <span className="text-white font-semibold">{formatRs(profile?.marketCap || profile?.market_cap)}</span>
                      </div>
                      <div className="flex justify-between items-center text-base">
                        <span className="font-medium text-gray-300">Symbol:</span>
                        <span className="text-white font-semibold">{symbol}</span>
                      </div>
                    </div>
                    <button 
                      onClick={handleAddToPortfolio}
                      disabled={addingToPortfolio}
                      className={`w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-base font-semibold mt-6 rounded-lg transition-colors ${
                        addingToPortfolio ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {addingToPortfolio ? 'Adding...' : 'Add to Portfolio'}
                    </button>
                  </div>

                  <div className="bg-[#181f31] rounded-xl p-6 shadow-lg h-fit">
                    <h3 className="text-xl font-bold mb-4 text-white border-b border-gray-700 pb-2">Calculate Your Returns</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-base mb-2"><span className="text-gray-300 font-medium">Investment Amount (₹):</span></label>
                        <input className="w-full bg-[#232b44] text-white rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-500" type="number" min="100" value={amount} onChange={e => setAmount(Number(e.target.value))} />
                      </div>
                      <div>
                        <label className="block text-base mb-2"><span className="text-gray-300 font-medium">Duration (Years):</span></label>
                        <input className="w-full bg-[#232b44] text-white rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-500" type="number" min="1" value={years} onChange={e => setYears(Number(e.target.value))} />
                      </div>
                    </div>
                    <div className="mt-6 space-y-3 text-base border-t border-gray-700 pt-4">
                      <div className="flex justify-between items-center"><span className="text-gray-300 font-medium">Estimated Total Value:</span><span className="font-bold text-white text-lg">{formatRs(estReturn)}</span></div>
                      <div className="flex justify-between items-center"><span className="text-gray-300 font-medium">Estimated Profit:</span><span className="font-bold text-green-400 text-lg">{formatRs(estProfit)}</span></div>
                      <div className="flex justify-between items-center"><span className="text-gray-300 font-medium">Annualized Return:</span><span className="font-bold text-white text-lg">{formatPct(riskVolatility.annualized_return)}</span></div>
                      <p className="text-sm opacity-70 mt-4 text-gray-400 italic">*Based on historical annualized return, actual returns may vary.</p>
                    </div>
                  </div>

                  <div className="bg-[#181f31] rounded-xl p-6 shadow-lg h-fit">
                    <h3 className="text-xl font-bold mb-4 text-white border-b border-gray-700 pb-2">Risk & Volatility</h3>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center text-base"><span className="text-gray-300 font-medium">Annualized Volatility:</span><span className="font-bold text-white">{formatPct(riskVolatility.annualized_volatility)}</span></div>
                      <div className="flex justify-between items-center text-base"><span className="text-gray-300 font-medium">Annualized Return:</span><span className="font-bold text-white">{formatPct(riskVolatility.annualized_return)}</span></div>
                      <div className="flex justify-between items-center text-base"><span className="text-gray-300 font-medium">Sharpe Ratio:</span><span className="font-bold text-white">{riskVolatility.sharpe_ratio?.toFixed(2) ?? "--"}</span></div>
                    </div>
                    <div className="bg-[#232b44] rounded-lg h-64 p-2 mt-4">
                      {riskVolatility.returns?.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={riskVolatility.returns.slice(-100)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <Line type="monotone" dataKey="returns" stroke="#10b981" strokeWidth={1.5} dot={false} />
                            <XAxis dataKey="date" tick={{fill:'#9ca3af', fontSize: 9}} angle={-45} textAnchor="end" height={60} />
                            <YAxis tick={{fill:'#9ca3af', fontSize: 10}} tickFormatter={(val) => (val * 100).toFixed(1) + '%'} />
                            <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "6px" }} formatter={(value) => [(value * 100).toFixed(4) + '%', 'Daily Return']} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <span className="text-gray-400 text-sm flex items-center justify-center h-full">No data</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="bg-[#181f31] rounded-xl p-6 shadow-lg h-fit">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                      <h3 className="text-xl font-bold text-white">Historical Price</h3>
                      <div className="flex gap-2">
                        {["1M", "3M", "6M", "1Y"].map((period) => (
                          <button key={period} onClick={() => setSelectedPeriod(period)} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${selectedPeriod === period ? "bg-purple-600 text-white" : "bg-[#232b44] text-gray-300 hover:bg-purple-500 hover:text-white"}`}>{period}</button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-[#232b44] rounded-lg h-64 p-2">
                      {history.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={history.slice(selectedPeriod === "1Y" ? -365 : selectedPeriod === "6M" ? -180 : selectedPeriod === "3M" ? -90 : -30)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <Line type="monotone" dataKey="close" stroke="#06b6d4" strokeWidth={2} dot={false} />
                            <XAxis dataKey="date" tick={{fill:'#9ca3af', fontSize: 9}} angle={-45} textAnchor="end" height={60} />
                            <YAxis domain={["auto", "auto"]} tick={{fill:'#9ca3af', fontSize: 10}} tickFormatter={(val) => '₹' + val.toFixed(2)} />
                            <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "6px" }} formatter={(value) => ['₹' + value.toFixed(2), 'Price']} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <span className="text-gray-400 text-sm flex items-center justify-center h-full">No data</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#181f31] rounded-xl p-6 shadow-lg h-fit">
                    <h3 className="text-xl font-bold mb-4 text-white border-b border-gray-700 pb-2">Moving Averages (20 & 50 Days)</h3>
                    <div className="bg-[#232b44] rounded-lg h-64 p-2">
                      {history.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={history.slice(-30)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="date" tick={{fill:'#9ca3af', fontSize: 9}} angle={-45} textAnchor="end" height={60} />
                            <YAxis tick={{fill:'#9ca3af', fontSize: 10}} />
                            <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "6px" }} />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                            <Bar dataKey="ma20" barSize={10} fill="#f08bd6" name="MA 20" />
                            <Bar dataKey="ma50" barSize={10} fill="#9b5cff" name="MA 50" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <span className="text-gray-400 text-sm flex items-center justify-center h-full">No data</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#181f31] rounded-xl p-6 shadow-lg h-fit">
                    <h3 className="text-xl font-bold mb-3 text-white border-b border-gray-700 pb-2">Monte Carlo Prediction (1 Year)</h3>
                    <div className="space-y-3 mb-4 text-base">
                      <div className="flex justify-between items-center"><span className="text-gray-300 font-medium">Expected Price:</span><span className="font-bold text-white">{formatRs(monteCarlo.expected_price)}</span></div>
                      <div className="flex justify-between items-center"><span className="text-gray-300 font-medium">Probability of Positive Return:</span><span className="font-bold text-white">{formatPct(monteCarlo.probability_positive_return / 100)}</span></div>
                      <div className="flex justify-between items-center"><span className="text-gray-300 font-medium">Range:</span><span className="font-bold text-white">{monteCarlo.lower_bound_5th_percentile?.toFixed(2)} - {monteCarlo.upper_bound_95th_percentile?.toFixed(2)}</span></div>
                    </div>
                    <div className="bg-[#232b44] rounded-lg h-64 p-2">
                      {monteCarlo.expected_price ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[
                            { label: "Last Price", value: monteCarlo.last_price },
                            { label: "Expected", value: monteCarlo.expected_price },
                            { label: "5th %", value: monteCarlo.lower_bound_5th_percentile },
                            { label: "95th %", value: monteCarlo.upper_bound_95th_percentile }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="label" tick={{fill:'#9ca3af', fontSize: 10}} />
                            <YAxis tick={{fill:'#9ca3af', fontSize: 10}} tickFormatter={(val) => '₹' + val.toFixed(0)} />
                            <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "6px" }} formatter={(value) => ['₹' + value.toFixed(2), 'Price']} />
                            <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <span className="text-gray-400 text-sm flex items-center justify-center h-full">No data</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-[#181f31] rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold mb-6 text-white">Compare Stocks</h3>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="relative">
                    <label className="block text-base mb-2 text-gray-300 font-medium">First Stock</label>
                    <input type="text" value={stock1Query} onChange={(e) => { setStock1Query(e.target.value); setSelectedStock1(null); }}                     onFocus={() => stock1Query.length >= 1 && setShowStock1Dropdown(true)} placeholder="Type to search (e.g., TCS, INFY, RELIANCE)..." className="w-full bg-[#232b44] text-white p-4 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400" />
                    {showStock1Dropdown && stock1Suggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-[#232b44] border border-gray-600 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                        {stock1Suggestions.map((s) => (
                          <div key={s.symbol || s.code} onClick={() => { setShowStock1Dropdown(false); handleStock1Select(s); }} className="p-4 hover:bg-purple-600 cursor-pointer transition-colors border-b border-gray-700 last:border-b-0">
                            <div className="text-white font-medium text-sm mb-1">{s.name || s.longName || s.symbol}</div>
                            <div className="text-gray-400 text-xs">Symbol: {s.symbol || s.code}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedStock1 && (<div className="mt-2 p-3 bg-green-900/30 border border-green-600 rounded-lg"><div className="text-green-400 text-sm font-medium">✓ Selected: {selectedStock1.name || selectedStock1.symbol}</div><div className="text-gray-400 text-xs mt-1">Symbol: {selectedStock1.symbol || selectedStock1.code}</div></div>)}
                    <p className="text-xs text-gray-400 mt-2 italic">Type any letter to search</p>
                  </div>

                  <div className="relative">
                    <label className="block text-base mb-2 text-gray-300 font-medium">Second Stock</label>
                    <input type="text" value={stock2Query} onChange={(e) => { setStock2Query(e.target.value); setSelectedStock2(null); }}                     onFocus={() => stock2Query.length >= 1 && setShowStock2Dropdown(true)} placeholder="Type to search (e.g., TCS, INFY, RELIANCE)..." className="w-full bg-[#232b44] text-white p-4 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400" />
                    {showStock2Dropdown && stock2Suggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-[#232b44] border border-gray-600 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                        {stock2Suggestions.map((s) => (
                          <div key={s.symbol || s.code} onClick={() => { setShowStock2Dropdown(false); handleStock2Select(s); }} className="p-4 hover:bg-purple-600 cursor-pointer transition-colors border-b border-gray-700 last:border-b-0">
                            <div className="text-white font-medium text-sm mb-1">{s.name || s.longName || s.symbol}</div>
                            <div className="text-gray-400 text-xs">Symbol: {s.symbol || s.code}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedStock2 && (<div className="mt-2 p-3 bg-green-900/30 border border-green-600 rounded-lg"><div className="text-green-400 text-sm font-medium">✓ Selected: {selectedStock2.name || selectedStock2.symbol}</div><div className="text-gray-400 text-xs mt-1">Symbol: {selectedStock2.symbol || selectedStock2.code}</div></div>)}
                    <p className="text-xs text-gray-400 mt-2 italic">Type any letter to search</p>
                  </div>
                </div>

                {selectedStock1 && selectedStock2 && (
                  <div className="text-center">
                    <button 
                      onClick={() => setShowComparison(true)}
                      className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white px-8 py-4 rounded-lg text-base font-bold transition-all transform hover:scale-105"
                    >
                      Compare Stocks
                    </button>
                    <p className="text-gray-400 text-sm mt-3">
                      Click to generate comparison report
                    </p>
                  </div>
                )}

                {showComparison && stock1Data && stock2Data && (
                  <div className="mt-8 bg-[#181f31] rounded-xl p-8 shadow-lg">
                    <h3 className="text-2xl font-bold mb-6 text-white">Stock Comparison</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-[#232b44] rounded-lg p-6">
                        <h4 className="text-xl font-bold text-white mb-4">{stock1Data.profile?.longName || stock1Data.profile?.companyName || selectedStock1.name}</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-base">
                            <span className="font-medium text-gray-300">Industry:</span>
                            <span className="text-white font-semibold">{stock1Data.profile?.industry || 'Not Available'}</span>
                          </div>
                          <div className="flex justify-between items-center text-base">
                            <span className="font-medium text-gray-300">Sector:</span>
                            <span className="text-white font-semibold">{stock1Data.profile?.sector || 'Not Available'}</span>
                          </div>
                          <div className="flex justify-between items-center text-base">
                            <span className="font-medium text-gray-300">Market Cap:</span>
                            <span className="text-white font-semibold">{formatRs(stock1Data.profile?.marketCap || stock1Data.profile?.market_cap)}</span>
                          </div>
                          <div className="flex justify-between items-center text-base">
                            <span className="font-medium text-gray-300">Symbol:</span>
                            <span className="text-white font-semibold">{selectedStock1.symbol}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-[#232b44] rounded-lg p-6">
                        <h4 className="text-xl font-bold text-white mb-4">{stock2Data.profile?.longName || stock2Data.profile?.companyName || selectedStock2.name}</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-base">
                            <span className="font-medium text-gray-300">Industry:</span>
                            <span className="text-white font-semibold">{stock2Data.profile?.industry || 'Not Available'}</span>
                          </div>
                          <div className="flex justify-between items-center text-base">
                            <span className="font-medium text-gray-300">Sector:</span>
                            <span className="text-white font-semibold">{stock2Data.profile?.sector || 'Not Available'}</span>
                          </div>
                          <div className="flex justify-between items-center text-base">
                            <span className="font-medium text-gray-300">Market Cap:</span>
                            <span className="text-white font-semibold">{formatRs(stock2Data.profile?.marketCap || stock2Data.profile?.market_cap)}</span>
                          </div>
                          <div className="flex justify-between items-center text-base">
                            <span className="font-medium text-gray-300">Symbol:</span>
                            <span className="text-white font-semibold">{selectedStock2.symbol}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 p-6 bg-[#232b44] rounded-lg">
                      <h4 className="text-xl font-bold text-white mb-4">AI Comparison Analysis</h4>
                      <p className="text-gray-300 text-base leading-relaxed">
                        Based on the comparison between {stock1Data.profile?.longName || selectedStock1.name} and {stock2Data.profile?.longName || selectedStock2.name}, 
                        both stocks operate in the {stock1Data.profile?.sector === stock2Data.profile?.sector ? stock1Data.profile?.sector : `${stock1Data.profile?.sector} and ${stock2Data.profile?.sector} sectors respectively`}. 
                        {stock1Data.profile?.marketCap && stock2Data.profile?.marketCap ? 
                          `${stock1Data.profile.longName || selectedStock1.name} has a market capitalization of ${formatRs(stock1Data.profile.marketCap)} compared to ${formatRs(stock2Data.profile.marketCap)} for ${stock2Data.profile.longName || selectedStock2.name}. ` : 
                          ''
                        }
                        Consider your investment goals, risk tolerance, and conduct further research before making investment decisions. This analysis is for informational purposes only and should not be considered as financial advice.
                      </p>
                    </div>
                  </div>
                )}

                {!selectedStock1 && !selectedStock2 && (<p className="text-center text-gray-400 text-base">Search and select two stocks to compare their performance metrics</p>)}
              </div>

              <StockAIDostModal isOpen={showAIDost} onClose={() => setShowAIDost(false)} stockData={{ meta: profile, navHistory: history, riskVolatility, monteCarlo }} />
              <StockAIReportModal isOpen={showAIReport} onClose={() => setShowAIReport(false)} stockData={{ meta: profile, navHistory: history, riskVolatility, monteCarlo }} />
              
              {/* Chatbot */}
              <Chatbot
                selectedFund={{
                  name: profile?.longName || profile?.companyName || symbol,
                  code: symbol
                }}
              />
            </>
          )}
        </div>
      </section>
      </>
    );
  }
