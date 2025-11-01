"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Legend,
} from "recharts";

function formatPct(val) {
  return isNaN(val) ? "--" : (val * 100).toFixed(2) + "%";
}
function formatRs(val) {
  return isNaN(val) ? "--" : "₹" + Number(val).toLocaleString("en-IN");
}

export default function StockDetailsPage() {
  const { symbol } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [quote, setQuote] = useState(null);
  const [history, setHistory] = useState([]);
  const [risk, setRisk] = useState({});
  const [monteCarlo, setMonteCarlo] = useState({});
  const [amount, setAmount] = useState(10000);
  const [years, setYears] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState("1M");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/stock/profile/${symbol}`).then(res => res.json()),
      fetch(`/api/stock/quote/${symbol}`).then(res => res.json()),
      fetch(`/api/stock/history/${symbol}?period=1y&interval=1d`).then(res => res.json()),
      fetch(`/api/stock/risk-volatility/${symbol}?period=1y&interval=1d`).then(res => res.json()),
      fetch(`/api/stock/monte-carlo-prediction/${symbol}?num_simulations=1000&days=252`).then(res => res.json()),
    ]).then(([profile, quote, history, risk, mc]) => {
      setProfile(profile);
      setQuote(quote);
      setHistory(history);
      setRisk(risk);
      setMonteCarlo(mc);
      setLoading(false);
    }).catch(error => {
      console.error('Error:', error);
      setLoading(false);
    });
  }, [symbol]);

  // Estimate future value
  const estReturn =
    amount *
    Math.pow(
      1 + (risk.annualized_return || 0),
      Number(years || 1)
    );
  const estProfit = estReturn - amount;

  return (
    <section className="min-h-screen py-12 px-2 bg-gradient-to-b from-[#050511] via-[#0d1020] to-[#0b0b12] text-white">
      <div className="max-w-7xl mx-auto grid gap-6">
        {loading ? (
          <div className="flex justify-center items-center min-h-[60vh]">
            <span className="animate-spin border-4 border-purple-400 border-t-transparent rounded-full w-10 h-10"></span>
          </div>
        ) : (
          <>
            {/* Stock Dashboard Title */}
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-cyan-400 text-center">
                Stock Dashboard
              </h1>
            </div>

            {/* Stock Name Display */}
            <div className="mb-6">
              <div className="bg-[#181f31] rounded-xl p-4 border border-gray-700">
                <h2 className="text-xl font-bold text-white text-center">
                  {quote?.longName || symbol}
                </h2>
              </div>
            </div>
            
            {/* Main Grid - 2 columns with equal alignment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT COLUMN */}
              <div className="flex flex-col gap-6 h-full">
                {/* Profile Card */}
                <div className="bg-[#181f31] rounded-xl p-6 shadow-lg h-fit">
                  <h3 className="text-xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
                    {quote?.longName || symbol}
                  </h3>
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
                      <span className="text-white font-semibold">{formatRs(quote?.marketCap)}</span>
                    </div>
                    <div className="flex justify-between items-center text-base">
                      <span className="font-medium text-gray-300">Symbol:</span>
                      <span className="text-white font-semibold">{symbol}</span>
                    </div>
                    <div className="flex justify-between items-center text-base">
                      <span className="font-medium text-gray-300">Current Price:</span>
                      <span className="text-white font-semibold text-lg">{formatRs(quote?.regularMarketPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center text-base">
                      <span className="font-medium text-gray-300">Day Change:</span>
                      <span className={`font-semibold ${quote?.regularMarketChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {quote?.regularMarketChange >= 0 ? '+' : ''}{quote?.regularMarketChange?.toFixed(2)} ({formatPct(quote?.regularMarketChangePercent / 100)})
                      </span>
                    </div>
                  </div>
                  {profile?.website && (
                    <a 
                      href={profile.website} 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base font-semibold mt-6 rounded-lg transition-colors inline-block text-center" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Visit Company Website
                    </a>
                  )}
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
                      <span className="font-bold text-white text-lg">{formatPct(risk.annualized_return)}</span>
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
                      <span className="font-bold text-white">{formatPct(risk.annualized_volatility)}</span>
                    </div>
                    <div className="flex justify-between items-center text-base">
                      <span className="text-gray-300 font-medium">Annualized Return:</span>
                      <span className="font-bold text-white">{formatPct(risk.annualized_return)}</span>
                    </div>
                    <div className="flex justify-between items-center text-base">
                      <span className="text-gray-300 font-medium">Sharpe Ratio:</span>
                      <span className="font-bold text-white">{risk.sharpe_ratio?.toFixed(2) ?? "--"}</span>
                    </div>
                  </div>
                  
                  <div className="bg-[#232b44] rounded-lg h-64 p-2 mt-4">
                    {risk.returns?.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={risk.returns.slice(-100)}>
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
              <div className="flex flex-col gap-6 h-full">
                {/* Historical Price Card */}
                <div className="bg-[#181f31] rounded-xl p-6 shadow-lg h-fit">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                    <h3 className="text-xl font-bold text-white">Historical Price</h3>
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
                    {history.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={history.slice(
                          selectedPeriod === "1Y" ? -365 :
                          selectedPeriod === "6M" ? -180 :
                          selectedPeriod === "3M" ? -90 :
                          -30
                        )}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <Line 
                            type="monotone" 
                            dataKey="close" 
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
                            formatter={(value) => ['₹' + value.toFixed(2), 'Price']}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="text-gray-400 text-sm flex items-center justify-center h-full">No data</span>
                    )}
                  </div>
                </div>

                {/* Moving Averages */}
                <div className="bg-[#181f31] rounded-xl p-6 shadow-lg h-fit">
                  <h3 className="text-xl font-bold mb-4 text-white border-b border-gray-700 pb-2">Moving Averages (20 & 50 Days)</h3>
                  <div className="bg-[#232b44] rounded-lg h-64 p-2">
                    {history.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={history.slice(-30)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="date" 
                            tick={{fill:'#9ca3af', fontSize: 9}}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis tick={{fill:'#9ca3af', fontSize: 10}} />
                          <Tooltip 
                            contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "6px" }}
                          />
                          <Legend 
                            wrapperStyle={{ fontSize: '11px' }}
                          />
                          <Bar dataKey="ma20" barSize={10} fill="#f08bd6" name="MA 20"/>
                          <Bar dataKey="ma50" barSize={10} fill="#9b5cff" name="MA 50"/>
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="text-gray-400 text-sm flex items-center justify-center h-full">No data</span>
                    )}
                  </div>
                </div>

                {/* Monte Carlo Prediction */}
                <div className="bg-[#181f31] rounded-xl p-6 shadow-lg h-fit">
                  <h3 className="text-xl font-bold mb-3 text-white border-b border-gray-700 pb-2">Monte Carlo Prediction (1 Year)</h3>
                  <div className="space-y-3 mb-4 text-base">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 font-medium">Expected Price:</span>
                      <span className="font-bold text-white">{formatRs(monteCarlo.expected_price)}</span>
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
                          <XAxis 
                            dataKey="label" 
                            tick={{fill:'#9ca3af', fontSize: 10}}
                          />
                          <YAxis 
                            tick={{fill:'#9ca3af', fontSize: 10}}
                            tickFormatter={(val) => '₹' + val.toFixed(0)}
                          />
                          <Tooltip 
                            contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "6px" }}
                            formatter={(value) => ['₹' + value.toFixed(2), 'Price']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#8b5cf6" 
                            strokeWidth={3} 
                            dot={{ fill: '#8b5cf6', r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="text-gray-400 text-sm flex items-center justify-center h-full">No data</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
