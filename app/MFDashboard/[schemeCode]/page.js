// 

"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import useUser from "@/lib/authClient";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import AIDostModal from "../../components/AIDostModal";
import AIReportModal from "../../components/AIReportModal";
import Chatbot from "../../components/Chatbot";
import Navbar from "../../components/Navbar";

// Utility functions
function formatPct(val) {
  return isNaN(val) ? "--" : (val * 100).toFixed(2) + "%";
}
function formatRs(val) {
  return isNaN(val) ? "--" : "₹" + Number(val).toLocaleString("en-IN");
}

// Custom Heatmap Component using Bar Chart
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

  // Get color based on performance value
  const getColor = (value) => {
    if (value > 0.15) return "#eab308";  // Yellow for high positive
    if (value > 0.05) return "#84cc16";   // Light green
    if (value > 0) return "#10b981";      // Green
    if (value > -0.05) return "#6366f1";  // Purple/blue
    return "#8b5cf6";                     // Dark purple for negative
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
            reversed={false}
          />
          <Tooltip 
            contentStyle={{ 
              background: "#ffffff", 
              border: "1px solid #e5e7eb", 
              borderRadius: "6px" 
            }}
            formatter={(value) => [value.toFixed(4), 'Monthly Return']}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.value)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Color Legend */}
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

export default function MFDetailsPage() {
  const { schemeCode } = useParams();
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [navHistory, setNavHistory] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [riskVolatility, setRiskVolatility] = useState({});
  const [monteCarlo, setMonteCarlo] = useState({});
  const [amount, setAmount] = useState(10000);
  const [years, setYears] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState("1M");
  
  // Compare funds state
  const [fund1Query, setFund1Query] = useState("");
  const [fund2Query, setFund2Query] = useState("");
  const [fund1Suggestions, setFund1Suggestions] = useState([]);
  const [fund2Suggestions, setFund2Suggestions] = useState([]);
  const [showFund1Dropdown, setShowFund1Dropdown] = useState(false);
  const [showFund2Dropdown, setShowFund2Dropdown] = useState(false);
  const [selectedFund1, setSelectedFund1] = useState(null);
  const [selectedFund2, setSelectedFund2] = useState(null);
  const [fund1Data, setFund1Data] = useState(null);
  const [fund2Data, setFund2Data] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  
  // AI Dost Modal state
  const [showAIDost, setShowAIDost] = useState(false);
  
  // AI Report Modal state
  const [showAIReport, setShowAIReport] = useState(false);
  const [addingToPortfolio, setAddingToPortfolio] = useState(false);
  const { user, isSignedIn } = useUser();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/mutual/scheme-details/${schemeCode}`).then((r) => r.json()),
      fetch(`/api/mutual/historical-nav/${schemeCode}`).then((r) => r.json()),
      fetch(`/api/mutual/performance-heatmap/${schemeCode}`).then((r) => r.json()),
      fetch(`/api/mutual/risk-volatility/${schemeCode}`).then((r) => r.json()),
      fetch(`/api/mutual/monte-carlo-prediction/${schemeCode}`).then((r) => r.json()),
    ]).then(([meta, navs, heat, risk, mc]) => {
      setMeta(meta);
      setNavHistory(navs);
      setHeatmap(heat);
      setRiskVolatility(risk);
      setMonteCarlo(mc);
      setLoading(false);
    }).catch(error => {
      console.error('Error:', error);
      setLoading(false);
    });
  }, [schemeCode]);

  // Debounced search for fund 1
  useEffect(() => {
    if (fund1Query.length < 1) {
      setFund1Suggestions([]);
      setShowFund1Dropdown(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/mutual/schemes?search=${encodeURIComponent(fund1Query)}`);
        const data = await response.json();
        const suggestions = Object.entries(data).map(([code, name]) => ({ code, name })).slice(0, 10);
        setFund1Suggestions(suggestions);
        setShowFund1Dropdown(true); // Always show dropdown when searching
      } catch (error) {
        console.error('Error fetching fund suggestions:', error);
        setFund1Suggestions([]);
        setShowFund1Dropdown(true); // Show dropdown even on error so user sees "No results found"
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fund1Query]);

  // Debounced search for fund 2
  useEffect(() => {
    if (fund2Query.length < 1) {
      setFund2Suggestions([]);
      setShowFund2Dropdown(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/mutual/schemes?search=${encodeURIComponent(fund2Query)}`);
        const data = await response.json();
        const suggestions = Object.entries(data).map(([code, name]) => ({ code, name })).slice(0, 10);
        setFund2Suggestions(suggestions);
        setShowFund2Dropdown(true); // Always show dropdown when searching
      } catch (error) {
        console.error('Error fetching fund suggestions:', error);
        setFund2Suggestions([]);
        setShowFund2Dropdown(true); // Show dropdown even on error so user sees "No results found"
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fund2Query]);

  // Fetch data for selected fund 1
  useEffect(() => {
    if (!selectedFund1) return;
    (async () => {
      try {
        const res = await fetch(`/api/mutual/scheme-details/${selectedFund1.code}`);
        const data = await res.json();
        setFund1Data({ meta: data });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [selectedFund1]);

  // Fetch data for selected fund 2
  useEffect(() => {
    if (!selectedFund2) return;
    (async () => {
      try {
        const res = await fetch(`/api/mutual/scheme-details/${selectedFund2.code}`);
        const data = await res.json();
        setFund2Data({ meta: data });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [selectedFund2]);

  // Handle fund selection
  const handleFund1Select = (fund) => {
    setSelectedFund1(fund);
    setFund1Query(fund.name);
    setShowFund1Dropdown(false);
  };

  const handleFund2Select = (fund) => {
    setSelectedFund2(fund);
    setFund2Query(fund.name);
    setShowFund2Dropdown(false);
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
        schemeCode,
        name: meta?.scheme_name || meta?.schemeName || schemeCode
      });

      // Using Next.js API route instead of calling FastAPI directly
  const userId = encodeURIComponent(user.sub || '');
  const response = await fetch(`/api/portfolio/add/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol: schemeCode,
          name: meta?.scheme_name || meta?.schemeName || schemeCode,
          item_type: "mutual_fund"
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
          alert(data.detail || "Fund already in portfolio");
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
  };

  // Calculate future returns
  const estReturn = amount * Math.pow(1 + (riskVolatility.annualized_return || 0), Number(years || 1));
  const estProfit = estReturn - amount;

  return (
    <>
    <Navbar />
    <section className="min-h-screen py-12 px-2 bg-gradient-to-b from-[#050511] via-[#0d1020] to-[#0b0b12] text-white">
      <div className="max-w-7xl mx-auto grid gap-6">
        {loading ? (
          <div className="flex justify-center items-center min-h-[60vh]">
            <span className="animate-spin border-4 border-purple-400 border-t-transparent rounded-full w-10 h-10"></span>
          </div>
        ) : (
          <>
            {/* Scheme Name Heading */}
            <div className="mb-6 py-8">
              <h1 className="text-3xl md:text-4xl font-bold text-cyan-400 text-center">
                Mutual Fund Dashboard
              </h1>
            </div>

            {/* Fund Name Display */}
            <div className="mb-6">
              <div className="bg-[#181f31] rounded-xl p-4 border border-gray-700">
                <h2 className="text-xl font-bold text-white text-center mb-4">
                  {meta?.scheme_name || meta?.schemeName || `Scheme Code: ${schemeCode}`}
                </h2>
                
                {/* AI Buttons */}
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => setShowAIDost(true)}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold text-base transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    AI Dost
                  </button>
                  <button 
                    onClick={() => setShowAIReport(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2.5 rounded-lg font-semibold text-base transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    AI Report
                  </button>
                </div>
              </div>
            </div>
            
            {/* Main Grid - 2 columns with equal heights */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
              {/* LEFT COLUMN */}
              <div className="flex flex-col gap-6">
                {/* Fund Meta Card */}
                <div className="bg-[#181f31] rounded-xl p-6 shadow-lg h-fit">
                  <h3 className="text-xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
                    {meta?.scheme_name || meta?.schemeName || `Fund Details`}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-base">
                      <span className="font-medium text-gray-300">fund house:</span> 
                      <span className="text-white font-semibold">{meta?.fund_house || meta?.amc || meta?.fundHouse || 'Not Available'}</span>
                    </div>
                    <div className="flex justify-between items-center text-base">
                      <span className="font-medium text-gray-300">scheme type:</span> 
                      <span className="text-white font-semibold">{meta?.scheme_type || meta?.schemeType || 'Not Available'}</span>
                    </div>
                    <div className="flex justify-between items-center text-base">
                      <span className="font-medium text-gray-300">scheme category:</span> 
                      <span className="text-white font-semibold">{meta?.scheme_category || meta?.category || 'Not Available'}</span>
                    </div>
                    <div className="flex justify-between items-center text-base">
                      <span className="font-medium text-gray-300">scheme code:</span> 
                      <span className="text-white font-semibold">{schemeCode}</span>
                    </div>
                    <div className="flex justify-between items-center text-base">
                      <span className="font-medium text-gray-300">scheme name:</span> 
                      <span className="text-white font-semibold text-right">{meta?.scheme_name || meta?.schemeName || 'Not Available'}</span>
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

                {/* Return Calculator Card */}
                <div className="bg-[#181f31] rounded-xl p-6 shadow-lg h-fit">
                  <h3 className="text-xl font-bold mb-4 text-white border-b border-gray-700 pb-2">Calculate Your Returns</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-base mb-2">
                        <span className="text-gray-300 font-medium">Investment Amount (₹):</span>
                      </label>
                      <input
                        className="w-full bg-[#232b44] text-white rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
                        type="number"
                        min="100"
                        value={amount}
                        onChange={e => setAmount(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-base mb-2">
                        <span className="text-gray-300 font-medium">Duration (Years):</span>
                      </label>
                      <input
                        className="w-full bg-[#232b44] text-white rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
                        type="number"
                        min="1"
                        value={years}
                        onChange={e => setYears(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="mt-6 space-y-3 text-base border-t border-gray-700 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 font-medium">Estimated Total Value:</span> 
                      <span className="font-bold text-white text-lg">{formatRs(estReturn)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 font-medium">Estimated Profit:</span> 
                      <span className="font-bold text-green-400 text-lg">{formatRs(estProfit)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 font-medium">Annualized Return:</span> 
                      <span className="font-bold text-white text-lg">{formatPct(riskVolatility.annualized_return)}</span>
                    </div>
                    <p className="text-sm opacity-70 mt-4 text-gray-400 italic">
                      *Based on historical annualized return, actual returns may vary.
                    </p>
                  </div>
                </div>

                {/* Risk & Volatility */}
                <div className="bg-[#181f31] rounded-xl p-6 shadow-lg h-fit">
                  <h3 className="text-xl font-bold mb-4 text-white border-b border-gray-700 pb-2">Risk & Volatility</h3>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center text-base">
                      <span className="text-gray-300 font-medium">Annualized Volatility:</span> 
                      <span className="font-bold text-white">{formatPct(riskVolatility.annualized_volatility)}</span>
                    </div>
                    <div className="flex justify-between items-center text-base">
                      <span className="text-gray-300 font-medium">Annualized Return:</span> 
                      <span className="font-bold text-white">{formatPct(riskVolatility.annualized_return)}</span>
                    </div>
                    <div className="flex justify-between items-center text-base">
                      <span className="text-gray-300 font-medium">Sharpe Ratio:</span> 
                      <span className="font-bold text-white">{riskVolatility.sharpe_ratio?.toFixed(2) ?? "--"}</span>
                    </div>
                  </div>
                  
                  <div className="bg-[#232b44] rounded-lg h-64 p-2 mt-4">
                    {riskVolatility.returns?.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={riskVolatility.returns.slice(-100)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <Line 
                            type="monotone" 
                            dataKey="returns" 
                            stroke="#10b981" 
                            strokeWidth={1.5} 
                            dot={false} 
                          />
                          <XAxis 
                            dataKey="date" 
                            tick={{fill:'#9ca3af', fontSize: 9}} 
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            tick={{fill:'#9ca3af', fontSize: 10}}
                            tickFormatter={(val) => (val * 100).toFixed(1) + '%'}
                          />
                          <Tooltip 
                            contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "6px" }}
                            formatter={(value) => [(value * 100).toFixed(4) + '%', 'Daily Return']}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="text-gray-400 text-sm flex items-center justify-center h-full">No data</span>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="flex flex-col gap-6">
                {/* NAV History Card */}
                <div className="bg-[#181f31] rounded-xl p-6 shadow-lg h-fit">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                    <h3 className="text-xl font-bold text-white">Historical NAV</h3>
                    <div className="flex gap-2">
                      {["1M", "3M", "6M", "1Y"].map((period) => (
                        <button
                          key={period}
                          onClick={() => setSelectedPeriod(period)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            selectedPeriod === period 
                              ? "bg-purple-600 text-white" 
                              : "bg-[#232b44] text-gray-300 hover:bg-purple-500 hover:text-white"
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-[#232b44] rounded-lg h-64 p-2">
                    {navHistory.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={navHistory.slice(
                          selectedPeriod === "1Y" ? -365 :
                          selectedPeriod === "6M" ? -180 :
                          selectedPeriod === "3M" ? -90 :
                          -30
                        )}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <Line 
                            type="monotone" 
                            dataKey="nav" 
                            stroke="#06b6d4" 
                            strokeWidth={2} 
                            dot={false} 
                          />
                          <XAxis 
                            dataKey="date" 
                            tick={{fill:'#9ca3af', fontSize: 9}}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            domain={["auto", "auto"]} 
                            tick={{fill:'#9ca3af', fontSize: 10}}
                            tickFormatter={(val) => '₹' + val.toFixed(2)}
                          />
                          <Tooltip 
                            contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "6px" }}
                            formatter={(value) => ['₹' + value, 'NAV']}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="text-gray-400 text-sm flex items-center justify-center h-full">No data</span>
                    )}
                  </div>
                </div>

                {/* Performance Heatmap */}
                <div className="bg-[#181f31] rounded-xl p-6 shadow-lg h-fit">
                  <h3 className="text-xl font-bold mb-4 text-white border-b border-gray-700 pb-2">Performance Heatmap</h3>
                  <div className="h-64">
                    <PerformanceHeatmap data={heatmap} />
                  </div>
                </div>

                {/* Monte Carlo Prediction */}
                <div className="bg-[#181f31] rounded-xl p-6 shadow-lg h-fit">
                  <h3 className="text-xl font-bold mb-3 text-white border-b border-gray-700 pb-2">Monte Carlo Prediction (1 Year)</h3>
                  <div className="space-y-3 mb-4 text-base">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 font-medium">Expected NAV:</span> 
                      <span className="font-bold text-white">{monteCarlo.expected_nav?.toFixed(2) ?? "--"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 font-medium">Probability of Positive Return:</span> 
                      <span className="font-bold text-white">{formatPct(monteCarlo.probability_positive_return / 100)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 font-medium">Range:</span> 
                      <span className="font-bold text-white">{monteCarlo.lower_bound_5th_percentile?.toFixed(2)} - {monteCarlo.upper_bound_95th_percentile?.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="bg-[#232b44] rounded-lg h-80 p-2">
                    {monteCarlo.simulation_paths?.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monteCarlo.historical_predicted}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="day" 
                            tick={{fill:'#9ca3af', fontSize: 10}} 
                            label={{ value: 'Trading Days', position: 'insideBottom', offset: -5, fill: '#9ca3af', fontSize: 11 }}
                          />
                          <YAxis 
                            tick={{fill:'#9ca3af', fontSize: 10}}
                            label={{ value: 'NAV (₹)', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 11 }}
                          />
                          <Tooltip 
                            contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "6px" }}
                            labelStyle={{ color: '#f3f4f6' }}
                          />
                          <Legend 
                            wrapperStyle={{ fontSize: '11px' }}
                            iconType="line"
                          />
                          
                          {/* Historical + Predicted (purple) */}
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            data={monteCarlo.historical_predicted}
                            stroke="#8b5cf6" 
                            strokeWidth={2}
                            dot={false}
                            name="Historical + Predicted"
                          />
                          
                          {/* Simulation paths */}
                          {monteCarlo.simulation_paths?.map((sim, idx) => (
                            <Line
                              key={sim.name}
                              type="monotone"
                              dataKey="value"
                              data={sim.data}
                              stroke={
                                idx === 0 ? "#10b981" : // green
                                idx === 1 ? "#14b8a6" : // teal
                                idx === 2 ? "#06b6d4" : // cyan
                                "#3b82f6"                // blue
                              }
                              strokeWidth={1}
                              dot={false}
                              name={sim.name}
                              opacity={0.6}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="text-gray-400 text-sm flex items-center justify-center h-full">No data</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Compare Funds Section - Full Width */}
            <div className="mt-8 bg-[#181f31] rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-6 text-white">Compare Funds</h3>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Fund 1 Search */}
                <div className="relative">
                  <label className="block text-base mb-2 text-gray-300 font-medium">First Fund</label>
                  <input
                    type="text"
                    value={fund1Query}
                    onChange={(e) => {
                      setFund1Query(e.target.value);
                      setSelectedFund1(null);
                    }}
                    onFocus={() => fund1Query.length >= 1 && setShowFund1Dropdown(true)}
                    placeholder="Type to search (e.g., SBI, HDFC, ICICI)..."
                    className="w-full bg-[#232b44] text-white p-4 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                  />
                  {showFund1Dropdown && fund1Suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-[#232b44] border border-gray-600 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                      {fund1Suggestions.map((fund) => (
                        <div
                          key={fund.code}
                          onClick={() => handleFund1Select(fund)}
                          className="p-4 hover:bg-purple-600 cursor-pointer transition-colors border-b border-gray-700 last:border-b-0"
                        >
                          <div className="text-white font-medium text-sm mb-1">{fund.name}</div>
                          <div className="text-gray-400 text-xs">Code: {fund.code}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedFund1 && (
                    <div className="mt-2 p-3 bg-green-900/30 border border-green-600 rounded-lg">
                      <div className="text-green-400 text-sm font-medium">✓ Selected: {selectedFund1.name}</div>
                      <div className="text-gray-400 text-xs mt-1">Code: {selectedFund1.code}</div>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2 italic">Type any letter to search</p>
                </div>

                {/* Fund 2 Search */}
                <div className="relative">
                  <label className="block text-base mb-2 text-gray-300 font-medium">Second Fund</label>
                  <input
                    type="text"
                    value={fund2Query}
                    onChange={(e) => {
                      setFund2Query(e.target.value);
                      setSelectedFund2(null);
                    }}
                    onFocus={() => fund2Query.length >= 1 && setShowFund2Dropdown(true)}
                    placeholder="Type to search (e.g., SBI, HDFC, ICICI)..."
                    className="w-full bg-[#232b44] text-white p-4 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                  />
                  {showFund2Dropdown && fund2Suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-[#232b44] border border-gray-600 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                      {fund2Suggestions.map((fund) => (
                        <div
                          key={fund.code}
                          onClick={() => handleFund2Select(fund)}
                          className="p-4 hover:bg-purple-600 cursor-pointer transition-colors border-b border-gray-700 last:border-b-0"
                        >
                          <div className="text-white font-medium text-sm mb-1">{fund.name}</div>
                          <div className="text-gray-400 text-xs">Code: {fund.code}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedFund2 && (
                    <div className="mt-2 p-3 bg-green-900/30 border border-green-600 rounded-lg">
                      <div className="text-green-400 text-sm font-medium">✓ Selected: {selectedFund2.name}</div>
                      <div className="text-gray-400 text-xs mt-1">Code: {selectedFund2.code}</div>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2 italic">Type any letter to search</p>
                </div>
              </div>

              {/* Compare Button */}
              {selectedFund1 && selectedFund2 && (
                <div className="text-center">
                  <button 
                    onClick={() => setShowComparison(true)}
                    className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white px-8 py-4 rounded-lg text-base font-bold transition-all transform hover:scale-105"
                  >
                    Compare Funds
                  </button>
                  <p className="text-gray-400 text-sm mt-3">
                    Click to generate comparison report
                  </p>
                </div>
              )}

              {showComparison && fund1Data && fund2Data && (
                <div className="mt-8 bg-[#181f31] rounded-xl p-8 shadow-lg">
                  <h3 className="text-2xl font-bold mb-6 text-white">Fund Comparison</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-[#232b44] rounded-lg p-6">
                      <h4 className="text-xl font-bold text-white mb-4">{fund1Data.meta?.scheme_name || fund1Data.meta?.schemeName || selectedFund1.name}</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-base">
                          <span className="font-medium text-gray-300">Fund House:</span>
                          <span className="text-white font-semibold">{fund1Data.meta?.fund_house || 'Not Available'}</span>
                        </div>
                        <div className="flex justify-between items-center text-base">
                          <span className="font-medium text-gray-300">Scheme Type:</span>
                          <span className="text-white font-semibold">{fund1Data.meta?.scheme_type || 'Not Available'}</span>
                        </div>
                        <div className="flex justify-between items-center text-base">
                          <span className="font-medium text-gray-300">Scheme Category:</span>
                          <span className="text-white font-semibold">{fund1Data.meta?.scheme_category || 'Not Available'}</span>
                        </div>
                        <div className="flex justify-between items-center text-base">
                          <span className="font-medium text-gray-300">Code:</span>
                          <span className="text-white font-semibold">{selectedFund1.code}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#232b44] rounded-lg p-6">
                      <h4 className="text-xl font-bold text-white mb-4">{fund2Data.meta?.scheme_name || fund2Data.meta?.schemeName || selectedFund2.name}</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-base">
                          <span className="font-medium text-gray-300">Fund House:</span>
                          <span className="text-white font-semibold">{fund2Data.meta?.fund_house || 'Not Available'}</span>
                        </div>
                        <div className="flex justify-between items-center text-base">
                          <span className="font-medium text-gray-300">Scheme Type:</span>
                          <span className="text-white font-semibold">{fund2Data.meta?.scheme_type || 'Not Available'}</span>
                        </div>
                        <div className="flex justify-between items-center text-base">
                          <span className="font-medium text-gray-300">Scheme Category:</span>
                          <span className="text-white font-semibold">{fund2Data.meta?.scheme_category || 'Not Available'}</span>
                        </div>
                        <div className="flex justify-between items-center text-base">
                          <span className="font-medium text-gray-300">Code:</span>
                          <span className="text-white font-semibold">{selectedFund2.code}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 p-6 bg-[#232b44] rounded-lg">
                    <h4 className="text-xl font-bold text-white mb-4">AI Comparison Analysis</h4>
                    <p className="text-gray-300 text-base leading-relaxed">
                      Based on the comparison between {fund1Data.meta?.scheme_name || selectedFund1.name} and {fund2Data.meta?.scheme_name || selectedFund2.name}, 
                      both funds are managed by {fund1Data.meta?.fund_house === fund2Data.meta?.fund_house ? 
                        fund1Data.meta?.fund_house : 
                        `${fund1Data.meta?.fund_house} and ${fund2Data.meta?.fund_house} respectively`}. 
                      {fund1Data.meta?.scheme_type === fund2Data.meta?.scheme_type ? 
                        `Both funds are ${fund1Data.meta?.scheme_type} schemes` : 
                        `${fund1Data.meta?.scheme_name || selectedFund1.name} is a ${fund1Data.meta?.scheme_type} scheme while ${fund2Data.meta?.scheme_name || selectedFund2.name} is a ${fund2Data.meta?.scheme_type} scheme`}. 
                      Consider your investment goals, risk tolerance, and conduct further research before making investment decisions. This analysis is for informational purposes only and should not be considered as financial advice.
                    </p>
                  </div>
                </div>
              )}

              {!selectedFund1 && !selectedFund2 && (
                <p className="text-center text-gray-400 text-base">
                  Search and select two funds to compare their performance metrics
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* AI Dost Modal */}
      <AIDostModal
        isOpen={showAIDost}
        onClose={() => setShowAIDost(false)}
        fundData={{
          meta,
          navHistory,
          riskVolatility,
          monteCarlo,
        }}
      />

      {/* AI Report Modal */}
      <AIReportModal
        isOpen={showAIReport}
        onClose={() => setShowAIReport(false)}
        fundData={{
          meta,
          navHistory,
          riskVolatility,
          monteCarlo,
        }}
      />

      {/* Chatbot */}
      <Chatbot
        selectedFund={{
          name: meta?.scheme_name || meta?.schemeName || schemeCode,
          code: schemeCode
        }}
      />
    </section>
    </>
  );
}
