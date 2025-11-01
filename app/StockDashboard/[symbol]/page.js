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
    });
  }, [symbol]);

  // Estimate future value like MF example
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
            {/* Symbol Heading */}
            <div>
              <input
                type="text"
                value={quote?.longName || symbol || ""}
                readOnly
                className="w-full bg-[#181f31] text-white p-3 rounded mb-2 font-semibold"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-6">
                {/* Profile Card */}
                <div className="bg-[#181f31] rounded-xl p-6 shadow mb-2">
                  <h2 className="text-xl font-bold mb-2">{quote?.longName || symbol}</h2>
                  <div className="mb-2 text-sm">
                    <span className="font-bold">Industry:</span> {profile?.industry}
                  </div>
                  <div className="mb-2 text-sm">
                    <span className="font-bold">Sector:</span> {profile?.sector}
                  </div>
                  <div className="mb-2 text-sm">
                    <span className="font-bold">Market Cap:</span> {formatRs(quote?.marketCap)}
                  </div>
                  <div className="mb-2 text-sm">
                    <span className="font-bold">Symbol:</span> {symbol}
                  </div>
                  <a href={profile?.website} className="text-blue-400 underline text-sm" target="_blank" rel="noopener noreferrer">
                    Visit Website
                  </a>
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
                    <b>Annualized Return:</b> {formatPct(risk.annualized_return)}
                    <div className="text-xs opacity-60 mt-1">
                      *Based on historical annualized return, actual returns may vary.
                    </div>
                  </div>
                </div>
                {/* Risk & Volatility */}
                <div className="bg-[#181f31] rounded-xl p-6 shadow">
                  <h3 className="font-bold mb-3">Risk & Volatility</h3>
                  <div>Annualized Volatility: <b>{formatPct(risk.annualized_volatility)}</b></div>
                  <div>Annualized Return: <b>{formatPct(risk.annualized_return)}</b></div>
                  <div>Sharpe Ratio: <b>{risk.sharpe_ratio?.toFixed(2) ?? "--"}</b></div>
                  <div className="mt-4 bg-[#232b44] rounded h-32">
                    {risk.returns?.length ? (
                      <ResponsiveContainer width="99%" height={90}>
                        <LineChart data={risk.returns.slice(-100)}>
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
                {/* Historical Price Card */}
                <div className="bg-[#181f31] rounded-xl p-6 shadow">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold">Historical Price</h3>
                  </div>
                  <div className="mt-3 bg-[#232b44] rounded h-48">
                    {history.length > 0 ? (
                      <ResponsiveContainer width="100%" height={140}>
                        <LineChart data={history.slice(-30)}>
                          <Line type="monotone" dataKey="close" stroke="#9b5cff" strokeWidth={2} dot={false} />
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
                {/* Moving Averages Bar Chart */}
                <div className="bg-[#181f31] rounded-xl p-6 shadow">
                  <h3 className="font-bold mb-2">Moving Averages (20 & 50 days)</h3>
                  <div className="bg-[#232b44] rounded h-32">
                    {history.length ? (
                      <ResponsiveContainer width="99%" height={90}>
                        <ComposedChart data={history.slice(-30)}>
                          <XAxis dataKey="date" tick={{fill:'#fff'}} hide/>
                          <YAxis tick={{fill:'#fff'}} />
                          <Tooltip contentStyle={{ background: "#181f31", border: "none" }}/>
                          <Bar dataKey="ma20" barSize={10} fill="#f08bd6"/>
                          <Bar dataKey="ma50" barSize={10} fill="#9b5cff"/>
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
                    <b>Expected Price:</b> {monteCarlo.expected_price?.toFixed(2) ?? "--"}
                    <br />
                    <b>Probability of Positive Return:</b> {formatPct(monteCarlo.probability_positive_return / 100)}
                    <br />
                    <b>Range:</b> {monteCarlo.lower_bound_5th_percentile?.toFixed(2)} - {monteCarlo.upper_bound_95th_percentile?.toFixed(2)}
                  </div>
                  <div className="bg-[#232b44] rounded h-32">
                    {monteCarlo.expected_price ? (
                      <ResponsiveContainer width="99%" height={90}>
                        <LineChart data={[
                          { label: "Last Price", value: monteCarlo.last_price },
                          { label: "Expected", value: monteCarlo.expected_price },
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
