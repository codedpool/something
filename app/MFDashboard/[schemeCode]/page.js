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
} from "recharts";

// Utility for formatting returns, currency, etc.
function formatPct(val) {
  return isNaN(val) ? "--" : (val * 100).toFixed(2) + "%";
}
function formatRs(val) {
  return isNaN(val) ? "--" : "₹" + Number(val).toLocaleString("en-IN");
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
    });
  }, [schemeCode]);

  // Calculate future returns using annualized return
  const estReturn =
    amount *
    Math.pow(
      1 + (riskVolatility.annualized_return || 0),
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
            {/* Scheme Name Heading */}
            <div>
              <input
                type="text"
                value={meta?.schemeName || ""}
                readOnly
                className="w-full bg-[#181f31] text-white p-3 rounded mb-2 font-semibold"
              />
            </div>
            {/* Main Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-6">
                {/* Fund Meta Card */}
                <div className="bg-[#181f31] rounded-xl p-6 shadow mb-2">
                  <h2 className="text-xl font-bold mb-2">{meta?.schemeName}</h2>
                  <div className="mb-2 text-sm">
                    <span className="font-bold">fund house:</span> {meta?.amc}
                  </div>
                  <div className="mb-2 text-sm">
                    <span className="font-bold">scheme type:</span> {meta?.schemeType}
                  </div>
                  <div className="mb-2 text-sm">
                    <span className="font-bold">scheme category:</span> {meta?.category}
                  </div>
                  <div className="mb-2 text-sm">
                    <span className="font-bold">scheme code:</span> {schemeCode}
                  </div>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm mt-2 rounded">
                    Add to Portfolio
                  </button>
                </div>
                {/* Return Calculator Card */}
                <div className="bg-[#181f31] rounded-xl p-6 shadow">
                  <h3 className="font-bold mb-4">Calculate Your Returns</h3>
                  <label className="block mb-2 text-xs">
                    Investment Amount (₹):
                    <input
                      className="bg-[#232b44] ml-2 rounded p-1 w-24 text-right"
                      type="number"
                      min="100"
                      value={amount}
                      onChange={e => setAmount(Number(e.target.value))}
                    />
                  </label>
                  <label className="block mb-4 text-xs">
                    Duration (Years):
                    <input
                      className="bg-[#232b44] ml-2 rounded p-1 w-12 text-right"
                      type="number"
                      min="1"
                      value={years}
                      onChange={e => setYears(Number(e.target.value))}
                    />
                  </label>
                  <div className="text-sm">
                    <b>Estimated Total Value:</b> {formatRs(estReturn)}
                    <br />
                    <b>Estimated Profit:</b> {formatRs(estProfit)}
                    <br />
                    <b>Annualized Return:</b> {formatPct(riskVolatility.annualized_return)}
                    <div className="text-xs opacity-60 mt-1">
                      *Based on historical annualized return, actual returns may vary.
                    </div>
                  </div>
                </div>
                {/* Risk & Volatility */}
                <div className="bg-[#181f31] rounded-xl p-6 shadow">
                  <h3 className="font-bold mb-3">Risk & Volatility</h3>
                  <div>Annualized Volatility: <b>{formatPct(riskVolatility.annualized_volatility)}</b></div>
                  <div>Annualized Return: <b>{formatPct(riskVolatility.annualized_return)}</b></div>
                  <div>Sharpe Ratio: <b>{riskVolatility.sharpe_ratio?.toFixed(2) ?? "--"}</b></div>
                  {/* Returns LineChart */}
                  <div className="mt-4 bg-[#232b44] rounded h-32">
                    {riskVolatility.returns?.length ? (
                      <ResponsiveContainer width="99%" height={90}>
                        <LineChart data={riskVolatility.returns.slice(-100)}>
                          <Line type="monotone" dataKey="returns" stroke="#00e2bc" strokeWidth={1} dot={false} />
                          <XAxis dataKey="date" hide />
                          <YAxis tick={{fill:'#fff'}} />
                          <Tooltip contentStyle={{ background: "#181f31", border: "none" }}/>
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="text-gray-400 text-xs flex items-center justify-center h-full">No data</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-6">
                {/* NAV History Card */}
                <div className="bg-[#181f31] rounded-xl p-6 shadow">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold">Historical NAV</h3>
                    {/* Nav periods placeholder (implement tabs as needed) */}
                    <div className="flex gap-2">
                      <button className="px-2 py-1 text-xs rounded bg-[#232b44]">1M</button>
                      <button className="px-2 py-1 text-xs rounded">3M</button>
                      <button className="px-2 py-1 text-xs rounded">6M</button>
                      <button className="px-2 py-1 text-xs rounded">1Y</button>
                    </div>
                  </div>
                  <div className="mt-3 bg-[#232b44] rounded h-48">
                    {navHistory.length > 0 ? (
                      <ResponsiveContainer width="100%" height={140}>
                        <LineChart data={navHistory.slice(-30)}>
                          <Line type="monotone" dataKey="nav" stroke="#9b5cff" strokeWidth={2} dot={false} />
                          <XAxis dataKey="date" hide />
                          <YAxis domain={["auto", "auto"]} tick={{fill:'#fff'}} />
                          <Tooltip contentStyle={{ background: "#181f31", border: "none" }}/>
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="text-gray-400 text-sm flex items-center justify-center h-full">No data</span>
                    )}
                  </div>
                </div>
                {/* Performance Heatmap */}
                <div className="bg-[#181f31] rounded-xl p-6 shadow">
                  <h3 className="font-bold mb-2">Performance Heatmap</h3>
                  <div className="bg-[#232b44] rounded h-32">
                    {heatmap.length ? (
                      <ResponsiveContainer width="99%" height={90}>
                        <ComposedChart data={heatmap}>
                          <XAxis dataKey="month" tick={{fill:'#fff'}} />
                          <YAxis tickFormatter={(v)=>`${(v*100).toFixed(2)}%`} tick={{fill:'#fff'}} />
                          <Tooltip contentStyle={{ background: "#181f31", border: "none" }}/>
                          <Bar 
                            dataKey="dayChange" 
                            barSize={20} 
                            fill="#f08bd6"
                            shape={({ x, y, width, height, fill }) => (
                              <rect x={x} y={y} width={width} height={height} rx={6} fill={fill}/>
                            )}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="text-gray-400 text-xs flex items-center justify-center h-full">No data</span>
                    )}
                  </div>
                </div>
                {/* Monte Carlo Prediction */}
                <div className="bg-[#181f31] rounded-xl p-6 shadow">
                  <h3 className="font-bold mb-2">Monte Carlo Prediction (1 Year)</h3>
                  <div className="mb-2 text-sm">
                    <b>Expected NAV:</b> {monteCarlo.expected_nav?.toFixed(2) ?? "--"}
                    <br />
                    <b>Probability of Positive Return:</b> {formatPct(monteCarlo.probability_positive_return / 100)}
                    <br />
                    <b>Range:</b> {monteCarlo.lower_bound_5th_percentile?.toFixed(2)} - {monteCarlo.upper_bound_95th_percentile?.toFixed(2)}

                  </div>
                  <div className="bg-[#232b44] rounded h-32">
                    {monteCarlo.expected_nav ? (
                      <ResponsiveContainer width="99%" height={90}>
                        <LineChart data={[
                          { label: "Last NAV", value: monteCarlo.last_nav },
                          { label: "Expected", value: monteCarlo.expected_nav },
                          { label: "5th %", value: monteCarlo.lower_bound_5th_percentile },
                          { label: "95th %", value: monteCarlo.upper_bound_95th_percentile }
                        ]}>
                          <XAxis dataKey="label" tick={{fill:'#fff'}} />
                          <YAxis tick={{fill:'#fff'}} />
                          <Tooltip contentStyle={{ background: "#181f31", border: "none" }}/>
                          <Line type="monotone" dataKey="value" stroke="#9b5cff" strokeWidth={3} dot />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="text-gray-400 text-xs flex items-center justify-center h-full">No data</span>
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
