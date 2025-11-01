import { Groq } from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request) {
  try {
    const { fundData } = await request.json();

    // Safely get current NAV
    const currentNav = fundData.navHistory?.length > 0 
      ? fundData.navHistory[fundData.navHistory.length - 1]?.nav 
      : "N/A";
    const navDisplay = currentNav !== "N/A" ? `₹${parseFloat(currentNav).toFixed(2)}` : "N/A";

    // Calculate additional metrics
    const navHistoryLength = fundData.navHistory?.length || 0;
    const firstNav = navHistoryLength > 0 ? parseFloat(fundData.navHistory[0]?.nav) : 0;
    const lastNav = navHistoryLength > 0 ? parseFloat(fundData.navHistory[navHistoryLength - 1]?.nav) : 0;
    const totalReturn = firstNav > 0 ? (((lastNav - firstNav) / firstNav) * 100).toFixed(2) : "N/A";

    // Prepare comprehensive fund information for AI
    const fundInfo = `
MUTUAL FUND COMPREHENSIVE ANALYSIS REPORT
============================================

FUND IDENTIFICATION
-------------------
- Fund Name: ${fundData.meta?.scheme_name || fundData.meta?.schemeName || "Unknown"}
- Fund House/AMC: ${fundData.meta?.fund_house || fundData.meta?.amc || "Unknown"}
- Scheme Code: ${fundData.meta?.scheme_code || "Unknown"}
- Category: ${fundData.meta?.scheme_category || "Unknown"}
- Type: ${fundData.meta?.scheme_type || "Unknown"}

CURRENT VALUATION
-----------------
- Current NAV: ${navDisplay}
- Historical Data Points: ${navHistoryLength} days
- Total Historical Return: ${totalReturn}%

PERFORMANCE METRICS
-------------------
- Annualized Return: ${((fundData.riskVolatility?.annualized_return || 0) * 100).toFixed(2)}%
- Annualized Volatility: ${((fundData.riskVolatility?.annualized_volatility || 0) * 100).toFixed(2)}%
- Sharpe Ratio: ${fundData.riskVolatility?.sharpe_ratio?.toFixed(4) || "N/A"}
- Risk-Adjusted Performance: ${fundData.riskVolatility?.sharpe_ratio > 1 ? "Good" : fundData.riskVolatility?.sharpe_ratio > 0.5 ? "Moderate" : "Poor"}

MONTE CARLO SIMULATION (1 YEAR FORECAST)
-----------------------------------------
- Expected NAV (1 Year): ₹${fundData.monteCarlo?.expected_nav?.toFixed(2) || "N/A"}
- Probability of Positive Return: ${fundData.monteCarlo?.probability_positive_return?.toFixed(2) || "N/A"}%
- 5th Percentile (Pessimistic): ₹${fundData.monteCarlo?.lower_bound_5th_percentile?.toFixed(2) || "N/A"}
- 95th Percentile (Optimistic): ₹${fundData.monteCarlo?.upper_bound_95th_percentile?.toFixed(2) || "N/A"}
- Simulation Confidence: ${fundData.monteCarlo?.probability_positive_return > 70 ? "High" : fundData.monteCarlo?.probability_positive_return > 50 ? "Moderate" : "Low"}
`;

    const prompt = `You are a professional financial analyst creating a comprehensive investment report. Generate a detailed, structured investment analysis report for this mutual fund. The report should be professional, data-driven, and suitable for serious investors.

Structure the report with the following sections:

# EXECUTIVE SUMMARY
- Brief overview of the fund
- Key highlights (2-3 sentences)
- Overall rating/recommendation

# FUND OVERVIEW
- Fund house reputation and track record
- Investment strategy and objectives
- Target investor profile

# PERFORMANCE ANALYSIS
- Historical performance evaluation
- Return analysis (absolute and risk-adjusted)
- Comparison to category benchmarks (if applicable)
- Performance consistency

# RISK ASSESSMENT
- Volatility analysis
- Sharpe ratio interpretation
- Risk category (Conservative/Moderate/Aggressive)
- Downside protection

# PREDICTIVE ANALYSIS
- Monte Carlo simulation insights
- Expected returns and probability
- Best and worst case scenarios
- Confidence level in predictions

# INVESTMENT SUITABILITY
- Ideal investment horizon
- Suitable investor types
- Portfolio allocation suggestions
- Entry/exit strategy recommendations

# STRENGTHS & WEAKNESSES
- Key advantages
- Areas of concern
- Competitive positioning

# FINAL RECOMMENDATION
- Investment rating (Strong Buy/Buy/Hold/Sell)
- Risk-reward assessment
- Action items for investors

Use professional financial terminology but ensure clarity. Include specific numbers from the data. Be objective and balanced.

Fund Data:
${fundInfo}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_completion_tokens: 2048,
      top_p: 1,
      stream: true,
      stop: null,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of chatCompletion) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error in AI report generation:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
