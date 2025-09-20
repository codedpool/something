"use client";

import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useUser, SignedIn } from "@clerk/nextjs"; // Clerk imports
import { CoinContext } from "@/context/CoinContext"; // Adjusted path for your project
import Groq from "groq-sdk";
import Chatbot from "@/components/Chatbot"; // Adjusted path

// RiskVolatility Component
const RiskVolatility = ({ selectedFund, historicalPrice }) => {
  const [metrics, setMetrics] = useState({});
  useEffect(() => {
    if (!selectedFund || !historicalPrice.length) return;
    const returns = historicalPrice.slice(1).map((curr, i) => {
      const prev = historicalPrice[i].nav;
      return (curr.nav - prev) / prev;
    });
    const annualizedVolatility = (returns.reduce((sum, r) => sum + r * r, 0) / returns.length) ** 0.5 * (252 ** 0.5);
    const annualizedReturn = (returns.reduce((sum, r) => sum + r, 0) / returns.length * 252);
    const sharpeRatio = annualizedVolatility > 0 ? (annualizedReturn - 0.06) / annualizedVolatility : 0; // 6% risk-free rate (aligned with backend)
    setMetrics({
      annualized_volatility: annualizedVolatility,
      annualized_return: annualizedReturn,
      sharpe_ratio: sharpeRatio,
    });
  }, [selectedFund, historicalPrice]);

  return (
    <div className="text-gray-200 text-sm">
      {metrics.annualized_volatility ? (
        <>
          <p>Volatility (Yearly): {(metrics.annualized_volatility * 100).toFixed(2)}%</p>
          <p>Return (Yearly): {(metrics.annualized_return * 100).toFixed(2)}%</p>
          <p>Sharpe Ratio: {metrics.sharpe_ratio.toFixed(2)}</p>
        </>
      ) : (
        <p>No risk data available yet.</p>
      )}
    </div>
  );
};

// MonteCarloPrediction Component
const MonteCarloPrediction = ({ selectedFund, historicalPrice }) => {
  const [prediction, setPrediction] = useState({});
  useEffect(() => {
    if (!selectedFund || !historicalPrice.length) return;
    const returns = historicalPrice.slice(1).map((curr, i) => (curr.nav - historicalPrice[i].nav) / historicalPrice[i].nav);
    const mu = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const sigma = (returns.reduce((sum, r) => sum + r * r, 0) / returns.length - mu * mu) ** 0.5;
    const lastPrice = historicalPrice[historicalPrice.length - 1].nav;
    const days = 252;
    const numSimulations = 1000;
    let simulations = Array(numSimulations).fill(lastPrice);
    for (let t = 1; t < days; t++) {
      const randomReturns = Array(numSimulations).fill(0).map(() => mu + sigma * (Math.random() * 2 - 1));
      simulations = simulations.map((price, i) => price * (1 + randomReturns[i]));
    }
    const expectedPrice = simulations.reduce((sum, p) => sum + p, 0) / numSimulations;
    const probPositive = simulations.filter((p) => p > lastPrice).length / numSimulations;
    setPrediction({
      expected_price: expectedPrice,
      probability_positive_return: probPositive * 100,
      last_price: lastPrice,
    });
  }, [selectedFund, historicalPrice]);

  return (
    <div className="text-gray-200 text-sm">
      {prediction.expected_price ? (
        <>
          <p>Expected NAV (1 Year): ₹{prediction.expected_price.toFixed(2)}</p>
          <p>Chance of Gain: {prediction.probability_positive_return.toFixed(1)}%</p>
          <p>Current NAV: ₹{prediction.last_price.toFixed(2)}</p>
        </>
      ) : (
        <p>No prediction data available yet.</p>
      )}
    </div>
  );
};

// CalculateReturns Component
const CalculateReturns = ({ selectedFund, historicalPrice }) => {
  const [returns, setReturns] = useState({});
  useEffect(() => {
    if (!selectedFund || !historicalPrice.length) return;
    const latestPrice = historicalPrice[historicalPrice.length - 1].nav;
    const oneYearAgoPrice = historicalPrice.length > 252 ? historicalPrice[historicalPrice.length - 252].nav : latestPrice;
    const oneYearReturn = oneYearAgoPrice > 0 ? ((latestPrice - oneYearAgoPrice) / oneYearAgoPrice * 100) : "N/A";
    setReturns({ one_year_return: oneYearReturn });
  }, [selectedFund, historicalPrice]);

  return (
    <div className="text-gray-200 text-sm">
      {returns.one_year_return !== undefined ? (
        <p>1-Year Return: {typeof returns.one_year_return === "string" ? returns.one_year_return : `${returns.one_year_return.toFixed(1)}%`}</p>
      ) : (
        <p>No return data available yet.</p>
      )}
    </div>
  );
};

// Helper functions for AI prompt
const computeRiskVolatility = (historicalPrice) => {
  if (!historicalPrice.length) return {};
  const returns = historicalPrice.slice(1).map((curr, i) => {
    const prev = historicalPrice[i].nav;
    return (curr.nav - prev) / prev;
  });
  const annualizedVolatility = (returns.reduce((sum, r) => sum + r * r, 0) / returns.length) ** 0.5 * (252 ** 0.5);
  const annualizedReturn = (returns.reduce((sum, r) => sum + r, 0) / returns.length * 252);
  const sharpeRatio = annualizedVolatility > 0 ? (annualizedReturn - 0.06) : 0;
  return {
    annualized_volatility: annualizedVolatility,
    annualized_return: annualizedReturn,
    sharpe_ratio: sharpeRatio,
  };
};

const computeMonteCarloPrediction = (historicalPrice) => {
  if (!historicalPrice.length) return {};
  const returns = historicalPrice.slice(1).map((curr, i) => (curr.nav - historicalPrice[i].nav) / historicalPrice[i].nav);
  const mu = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const sigma = (returns.reduce((sum, r) => sum + r * r, 0) / returns.length - mu * mu) ** 0.5;
  const lastPrice = historicalPrice[historicalPrice.length - 1].nav;
  const days = 252;
  const numSimulations = 1000;
  let simulations = Array(numSimulations).fill(lastPrice);
  for (let t = 1; t < days; t++) {
    const randomReturns = Array(numSimulations).fill(0).map(() => mu + sigma * (Math.random() * 2 - 1));
    simulations = simulations.map((price, i) => price * (1 + randomReturns[i]));
  }
  const expectedPrice = simulations.reduce((sum, p) => sum + p, 0) / numSimulations;
  const probPositive = simulations.filter((p) => p > lastPrice).length / numSimulations;
  return {
    expected_price: expectedPrice,
    probability_positive_return: probPositive * 100,
    last_price: lastPrice,
  };
};

const computeReturns = (historicalPrice) => {
  if (!historicalPrice.length) return {};
  const latestPrice = historicalPrice[historicalPrice.length - 1].nav;
  const oneYearAgoPrice = historicalPrice.length > 252 ? historicalPrice[historicalPrice.length - 252].nav : latestPrice;
  const oneYearReturn = oneYearAgoPrice > 0 ? ((latestPrice - oneYearAgoPrice) / oneYearAgoPrice * 100) : "N/A";
  return { one_year_return: oneYearReturn };
};

export default function CryptoDashboard() {
  const { allCoin } = useContext(CoinContext); // Assuming allCoin contains mutual fund data
  const { user, isSignedIn } = useUser(); // Clerk hook for user data
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedFund, setSelectedFund] = useState(null);
  const [randomFunds, setRandomFunds] = useState([]);
  const [fundDetails, setFundDetails] = useState({});
  const [historicalPrice, setHistoricalPrice] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiReport, setAiReport] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);
  const [priceRange, setPriceRange] = useState("365"); // Default to 1 year

  const groqClient = new Groq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY, // Use environment variable
    dangerouslyAllowBrowser: true, // Note: Consider server-side for production
  });

  // Fetch random funds on initial load
  useEffect(() => {
    if (allCoin.length > 0) {
      const shuffled = [...allCoin].sort(() => 0.5 - Math.random());
      setRandomFunds(shuffled.slice(0, 5));
    }
  }, [allCoin]);

  // Fetch suggestions based on search term
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }
    const filtered = allCoin
      .filter((fund) => fund.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 10);
    setSuggestions(filtered);
  }, [searchTerm, allCoin]);

  // Fetch fund details and historical NAV
  useEffect(() => {
    const fetchFundDetails = async () => {
      if (!selectedFund) {
        setFundDetails({});
        setHistoricalPrice([]);
        setHeatmapData([]);
        setAiAnalysis("");
        setAiReport("");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Fetch fund details
        const detailsResponse = await axios.get(
          `http://localhost:8000/api/scheme-details/${selectedFund.id}`
        );
        setFundDetails(detailsResponse.data);

        // Fetch historical NAV
        const priceResponse = await axios.get(
          `http://localhost:8000/api/historical-nav/${selectedFund.id}`
        );
        const prices = priceResponse.data.map((item) => ({
          date: item.date,
          nav: parseFloat(item.nav),
        }));
        setHistoricalPrice(prices);

        // Fetch heatmap data
        const heatmapResponse = await axios.get(
          `http://localhost:8000/api/performance-heatmap/${selectedFund.id}`
        );
        setHeatmapData(heatmapResponse.data);
      } catch (err) {
        console.error("Error fetching fund details:", err);
        setError("Failed to fetch fund details.");
      } finally {
        setLoading(false);
      }
    };
    fetchFundDetails();
  }, [selectedFund]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setSelectedFund(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") e.preventDefault();
  };

  const handleSelectFund = (fund) => {
    setSelectedFund(fund);
    setSearchTerm(fund.name);
    setSuggestions([]);
  };

  const addToPortfolio = async (fund) => {
    if (!isSignedIn || !user) {
      alert("Please sign in to add items to your portfolio!");
      return;
    }
    try {
      const response = await axios.post("http://localhost:8000/api/add-to-portfolio", {
        user_id: user.id, // Clerk user ID
        item_type: "mutual_fund",
        item_id: fund.id,
        name: fund.name,
      });
      alert(response.data.message);
    } catch (err) {
      console.error("Error adding to portfolio:", err);
      alert(err.response?.data?.detail || "Failed to add to portfolio");
    }
  };

  const handleAiAnalysis = async () => {
    if (!selectedFund || Object.keys(fundDetails).length === 0 || !historicalPrice.length) {
      setAiAnalysis("Please select a fund first and wait for data to load!");
      return;
    }

    setLoading(true);
    setAiAnalysis("");

    const latestPrice = historicalPrice[historicalPrice.length - 1].nav;
    const oneYearAgoPrice = historicalPrice.length > 252 ? historicalPrice[historicalPrice.length - 252].nav : latestPrice;
    const oneYearGrowth = oneYearAgoPrice > 0 ? ((latestPrice - oneYearAgoPrice) / oneYearAgoPrice * 100).toFixed(1) : "N/A";
    const bestMonth = heatmapData.length > 0 ? heatmapData.reduce((max, curr) => max.dayChange > curr.dayChange ? max : curr) : { month: "N/A", dayChange: 0 };
    const worstMonth = heatmapData.length > 0 ? heatmapData.reduce((min, curr) => min.dayChange < curr.dayChange ? min : curr) : { month: "N/A", dayChange: 0 };

    const summary = {
      fund_name: selectedFund.name,
      launched: fundDetails.fund_start_date || "N/A",
      current_nav: latestPrice,
      one_year_growth: oneYearGrowth,
      best_month: bestMonth.month ? `${bestMonth.month} (+${(bestMonth.dayChange * 100).toFixed(2)}%)` : "N/A",
      worst_month: worstMonth.month ? `${worstMonth.month} (${(worstMonth.dayChange * 100).toFixed(2)}%)` : "N/A",
      fund_category: fundDetails.scheme_category || "N/A",
      monte_carlo_prediction: computeMonteCarloPrediction(historicalPrice),
      risk_volatility: computeRiskVolatility(historicalPrice),
    };

    const prompt = `
      I have data about a mutual fund called '${summary.fund_name}'. Please provide a simple, friendly explanation for someone new to investing based on this data:
      - Fund Name: ${summary.fund_name}
      - Launched: ${summary.launched}
      - Current NAV: ₹${summary.current_nav.toFixed(2)}
      - 1-Year Growth: ${summary.one_year_growth}%
      - Best Month: ${summary.best_month}
      - Worst Month: ${summary.worst_month}
      - Fund Category: ${summary.fund_category}
      - Monte Carlo Prediction: ${JSON.stringify(summary.monte_carlo_prediction)}
      - Risk & Volatility: ${JSON.stringify(summary.risk_volatility)}
      Give me a clear, conversational breakdown in a point-by-point format—like advice from a friend. Cover these points without repeating the questions:
      1. What this mutual fund is and what it’s used for.
      2. How it’s been doing lately, looking at its growth and NAV changes.
      3. What the best and worst months tell us about its ups and downs.
      4. Whether it’s a good pick for a beginner—think about ease, risk, and volatility—and why.
      5. What the Monte Carlo prediction suggests about its future—use the prediction data (expected NAV, probability of positive return) for a simple outlook.
      Format each point as a numbered item starting with "1. ", "2. ", etc., and keep it short, avoid complicated terms, and make it feel warm and helpful!
    `;

    try {
      const chatCompletion = await groqClient.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 1,
        max_completion_tokens: 1024,
        top_p: 1,
        stream: true,
        stop: null,
      });

      let analysis = "";
      for await (const chunk of chatCompletion) {
        analysis += chunk.choices[0]?.delta?.content || "";
        setAiAnalysis(analysis);
      }
    } catch (err) {
      console.error("Error generating AI analysis:", err);
      setAiAnalysis("Oops, something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const handleAiReport = async () => {
    if (!selectedFund || Object.keys(fundDetails).length === 0) {
      setAiReport("Please select a fund first!");
      return;
    }

    setLoadingReport(true);
    setAiReport("");

    const latestPrice = historicalPrice.length > 0 ? historicalPrice[historicalPrice.length - 1].nav : 0;
    const oneYearAgoPrice = historicalPrice.length > 252 ? historicalPrice[historicalPrice.length - 252].nav : latestPrice;
    const oneYearGrowth = oneYearAgoPrice > 0 ? ((latestPrice - oneYearAgoPrice) / oneYearAgoPrice * 100).toFixed(1) : "N/A";
    const bestMonth = heatmapData.length > 0 ? heatmapData.reduce((max, curr) => max.dayChange > curr.dayChange ? max : curr) : { month: "N/A", dayChange: 0 };
    const worstMonth = heatmapData.length > 0 ? heatmapData.reduce((min, curr) => min.dayChange < curr.dayChange ? min : curr) : { month: "N/A", dayChange: 0 };

    const summary = {
      name: selectedFund.name,
      scheme_code: selectedFund.id,
      current_nav: latestPrice,
      one_year_growth: oneYearGrowth,
      best_month: bestMonth.month ? `${bestMonth.month} (+${(bestMonth.dayChange * 100).toFixed(2)}%)` : "N/A",
      worst_month: worstMonth.month ? `${worstMonth.month} (${(worstMonth.dayChange * 100).toFixed(2)}%)` : "N/A",
      launched: fundDetails.fund_start_date || "N/A",
      fund_category: fundDetails.scheme_category || "N/A",
    };

    const prompt = `
      Act as a Mutual Fund Expert Advisor. I have data about a mutual fund called '${summary.name}'. Provide a detailed, friendly report for a beginner investor, guiding them on how to proceed with this fund based on this data:
      - Fund Name: ${summary.name}
      - Scheme Code: ${summary.scheme_code}
      - Current NAV: ₹${summary.current_nav.toFixed(2)}
      - 1-Year Growth: ${summary.one_year_growth}%
      - Best Month: ${summary.best_month}
      - Worst Month: ${summary.worst_month}
      - Launched: ${summary.launched}
      - Fund Category: ${summary.fund_category}
      Provide a report with these sections:
      - **Fund Overview** - Briefly explain what this mutual fund is and its purpose.
      - **Performance Summary** - Summarize its recent performance based on NAV and growth.
      - **Risk Assessment** - Evaluate its risk level using price changes and monthly swings.
      - **Future Outlook** - Give a simple prediction about its future potential based on the data.
      - **Action Plan** - Provide simple, actionable steps (e.g., invest, hold, research more) with reasons.
      Format each section with a heading in bold (e.g., **Fund Overview**) followed by a short paragraph. Keep it easy to understand, avoid technical jargon, and make it feel like friendly expert advice!
    `;

    try {
      const chatCompletion = await groqClient.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.8,
        max_completion_tokens: 2048,
        top_p: 1,
        stream: true,
        stop: null,
      });

      let report = "";
      for await (const chunk of chatCompletion) {
        report += chunk.choices[0]?.delta?.content || "";
        setAiReport(report);
      }
    } catch (err) {
      console.error("Error generating AI report:", err);
      setAiReport(`Error: ${err.message || "Unknown error occurred while generating the report."}`);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleRangeChange = (days) => {
    setPriceRange(days);
  };

  const randomFundsSection = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {randomFunds.map((fund) => (
        <div
          key={fund.id}
          className="bg-white/5 backdrop-blur-sm border border-white/8 rounded-2xl p-4 shadow-md hover:bg-white/10 transition-colors"
        >
          <h3 className="text-white text-md font-semibold mb-2">{fund.name}</h3>
          <p className="text-gray-200 text-sm">Scheme Code: {fund.id}</p>
          <div className="flex justify-between mt-2">
            <button
              onClick={() => handleSelectFund(fund)}
              className="py-1 px-3 bg-gradient-to-r from-[#9b5cff] to-[#f08bd6] text-white rounded-full text-sm hover:scale-[1.01] transition-transform"
            >
              View Details
            </button>
            <SignedIn>
              <button
                onClick={() => addToPortfolio(fund)}
                className="py-1 px-3 bg-green-600 text-white rounded-full text-sm hover:bg-green-700"
              >
                Add to Portfolio
              </button>
            </SignedIn>
          </div>
        </div>
      ))}
    </div>
  );

  const selectedFundSection = selectedFund && (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/8 rounded-2xl p-4 shadow-md">
        <h3 className="text-white text-lg font-semibold mb-2">{selectedFund.name}</h3>
        <div className="text-gray-200 text-sm">
          <p><span className="font-medium">Scheme Code:</span> {selectedFund.id}</p>
          <p><span className="font-medium">Category:</span> {fundDetails.scheme_category || "N/A"}</p>
          <p><span className="font-medium">Current NAV:</span> ₹{historicalPrice.length > 0 ? historicalPrice[historicalPrice.length - 1].nav.toFixed(2) : "N/A"}</p>
          <p><span className="font-medium">Launch Date:</span> {fundDetails.fund_start_date || "N/A"}</p>
        </div>
        <SignedIn>
          <button
            onClick={() => addToPortfolio(selectedFund)}
            className="mt-4 py-1 px-3 bg-green-600 text-white rounded-full text-sm hover:bg-green-700"
          >
            Add to Portfolio
          </button>
        </SignedIn>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/8 rounded-2xl p-4 shadow-md">
        <h3 className="text-white text-lg font-semibold mb-2">Historical NAV</h3>
        <div className="text-gray-200 text-sm">
          {historicalPrice.length > 0 ? (
            <ul className="max-h-48 overflow-y-auto">
              {historicalPrice.slice(-10).reverse().map((data) => (
                <li key={data.date} className="flex justify-between">
                  <span>{data.date}</span>
                  <span>₹{data.nav.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No price data available.</p>
          )}
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/8 rounded-2xl p-4 shadow-md">
        <h3 className="text-white text-lg font-semibold mb-2">Calculate Returns</h3>
        <CalculateReturns selectedFund={selectedFund} historicalPrice={historicalPrice} />
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/8 rounded-2xl p-4 shadow-md">
        <h3 className="text-white text-lg font-semibold mb-2">Performance Heatmap</h3>
        <div className="text-gray-200 text-sm">
          {heatmapData.length > 0 ? (
            <ul className="max-h-48 overflow-y-auto">
              {heatmapData.map((data) => (
                <li key={data.month} className="flex justify-between">
                  <span>Month {data.month}</span>
                  <span>{(data.dayChange * 100).toFixed(2)}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No heatmap data available.</p>
          )}
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/8 rounded-2xl p-4 shadow-md">
        <h3 className="text-white text-lg font-semibold mb-2">Risk & Volatility</h3>
        <RiskVolatility selectedFund={selectedFund} historicalPrice={historicalPrice} />
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/8 rounded-2xl p-4 shadow-md">
        <h3 className="text-white text-lg font-semibold mb-2">Monte Carlo Prediction</h3>
        <MonteCarloPrediction selectedFund={selectedFund} historicalPrice={historicalPrice} />
      </div>
    </div>
  );

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-[#050511] via-[#0d1020] to-[#0b0b12] text-white py-6 px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-6 bg-gradient-to-r from-[#9b5cff] to-[#f08bd6] bg-clip-text text-transparent">
          Mutual Fund Dashboard
        </h1>
        <div className="bg-white/5 backdrop-blur-sm border border-white/8 rounded-2xl p-4 mb-6 shadow-md relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            className="w-full p-2 rounded bg-white/10 text-white focus:outline-none border border-white/12"
            placeholder="Search for a mutual fund..."
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-10 bg-white/5 backdrop-blur-sm border border-white/8 rounded-2xl w-full max-h-60 overflow-y-auto mt-2 shadow-lg">
              {suggestions.map((fund) => (
                <li
                  key={fund.id}
                  onClick={() => handleSelectFund(fund)}
                  className="p-2 hover:bg-white/10 cursor-pointer text-gray-200"
                >
                  {fund.name}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex gap-4">
            <button
              onClick={handleAiAnalysis}
              disabled={loading || loadingReport || !selectedFund}
              className={`py-2 px-4 rounded bg-gradient-to-r from-[#9b5cff] to-[#f08bd6] text-white text-sm font-semibold ${
                loading || loadingReport || !selectedFund ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.01] transition-transform"
              }`}
            >
              {loading ? "Generating..." : "AI Analysis"}
            </button>
            <button
              onClick={handleAiReport}
              disabled={loading || loadingReport || !selectedFund}
              className={`py-2 px-4 rounded bg-gradient-to-r from-purple-600 to-purple-800 text-white text-sm font-semibold ${
                loading || loadingReport || !selectedFund ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.01] transition-transform"
              }`}
            >
              {loadingReport ? "Generating..." : "AI Report"}
            </button>
          </div>
        </div>

        {aiAnalysis && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/8 rounded-2xl p-4 mb-6 shadow-md">
            <h3 className="text-lg font-semibold mb-2 text-[#9b5cff]">AI Analysis</h3>
            <div className="text-gray-200 text-base leading-relaxed" style={{ whiteSpace: "pre-line" }}>
              {aiAnalysis}
            </div>
          </div>
        )}

        {aiReport && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/8 rounded-2xl p-6 mb-6 shadow-md">
            <h3 className="text-2xl font-bold mb-6 text-[#f08bd6]">AI Mutual Fund Report</h3>
            <div className="text-gray-200 text-lg leading-loose" style={{ whiteSpace: "pre-wrap" }}>
              {aiReport}
            </div>
          </div>
        )}

        {loading && !aiAnalysis && !aiReport ? (
          <p className="text-white text-center">Loading...</p>
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : selectedFund ? (
          selectedFundSection
        ) : (
          randomFundsSection
        )}
      </div>
      <Chatbot selectedFund={selectedFund} />
    </div>
  );
}