import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://newealth.com',
    'X-Title': 'NewWealth AI',
  },
});

export async function POST(request) {
  try {
    const { fundData } = await request.json();

    // Check if this is portfolio data (multiple items) or single fund data
    const isPortfolio = fundData.portfolioItems && fundData.portfolioItems.length > 0;

    let fundInfo, prompt;

    if (isPortfolio) {
      // Portfolio context - analyze all holdings
      const stocksCount = fundData.meta?.stocks_count || 0;
      const mfCount = fundData.meta?.mutual_funds_count || 0;
      const cryptoCount = fundData.portfolioItems?.filter(i => i.item_type === 'crypto').length || 0;
      
      // Build detailed portfolio items list
      const itemsList = fundData.portfolioItems.map((item, idx) => {
        const returnStr = item.risk_volatility?.annualized_return 
          ? `${(item.risk_volatility.annualized_return * 100).toFixed(2)}%` 
          : "N/A";
        const volatilityStr = item.risk_volatility?.annualized_volatility 
          ? `${(item.risk_volatility.annualized_volatility * 100).toFixed(2)}%` 
          : "N/A";
        const navStr = item.nav ? `₹${item.nav}` : "N/A";
        
        return `${idx + 1}. ${item.name} (${item.item_type})
   - Symbol: ${item.symbol || 'N/A'}
   - Current Price/NAV: ${navStr}
   - Annual Return: ${returnStr}
   - Volatility: ${volatilityStr}
   - Added: ${new Date(item.added_at).toLocaleDateString()}`;
      }).join('\n\n');

      fundInfo = `
Portfolio Analysis:
- Total Holdings: ${fundData.meta?.portfolio_size || 0}
- Stocks: ${stocksCount}
- Mutual Funds: ${mfCount}
- Cryptocurrencies: ${cryptoCount}

Portfolio Performance Metrics:
- Average Annualized Return: ${((fundData.riskVolatility?.annualized_return || 0) * 100).toFixed(2)}%
- Average Volatility: ${((fundData.riskVolatility?.annualized_volatility || 0) * 100).toFixed(2)}%
- Sharpe Ratio: ${fundData.riskVolatility?.sharpe_ratio?.toFixed(2) || "N/A"}

Monte Carlo Portfolio Prediction (1 Year):
- Expected Portfolio Value: ₹${fundData.monteCarlo?.expected_nav?.toFixed(2) || "N/A"}
- Probability of Positive Return: ${fundData.monteCarlo?.probability_positive_return?.toFixed(2) || "N/A"}%

Your Holdings:
${itemsList}
`;

      prompt = `You are a friendly investment advisor called "AI Dost" (Dost means friend in Hindi). Analyze this PORTFOLIO (containing stocks, mutual funds, and/or cryptocurrencies) and explain it to a beginner investor in a very simple, friendly, and easy-to-understand way. Use bullet points and keep it conversational like talking to a friend. Focus on:

1. 🎯 Portfolio Overview (what mix of investments do they have?)
2. 📈 Overall Performance (how is the portfolio doing?)
3. 💰 Diversification & Risk (is it well-balanced? risky?)
4. 🔮 Future Outlook (what to expect)
5. 👍 Should they make changes? (suggestions)
6. 💡 Quick tips for portfolio management

Keep it short, friendly, and use emojis. Avoid jargon. Explain like talking to a friend over chai ☕

Portfolio Data:
${fundInfo}`;
    } else {
      // Single fund/stock context
      const currentNav = fundData.navHistory?.length > 0 
        ? fundData.navHistory[fundData.navHistory.length - 1]?.nav 
        : "N/A";
      const navDisplay = currentNav !== "N/A" ? `₹${parseFloat(currentNav).toFixed(2)}` : "N/A";

      fundInfo = `
Mutual Fund Analysis:
- Fund Name: ${fundData.meta?.scheme_name || fundData.meta?.schemeName || "Unknown"}
- Fund House: ${fundData.meta?.fund_house || fundData.meta?.amc || "Unknown"}
- Category: ${fundData.meta?.scheme_category || "Unknown"}
- Type: ${fundData.meta?.scheme_type || "Unknown"}

Performance Metrics:
- Annualized Return: ${((fundData.riskVolatility?.annualized_return || 0) * 100).toFixed(2)}%
- Annualized Volatility: ${((fundData.riskVolatility?.annualized_volatility || 0) * 100).toFixed(2)}%
- Sharpe Ratio: ${fundData.riskVolatility?.sharpe_ratio?.toFixed(2) || "N/A"}

Monte Carlo Prediction (1 Year):
- Expected NAV: ₹${fundData.monteCarlo?.expected_nav?.toFixed(2) || "N/A"}
- Probability of Positive Return: ${fundData.monteCarlo?.probability_positive_return?.toFixed(2) || "N/A"}%
- Range: ₹${fundData.monteCarlo?.lower_bound_5th_percentile?.toFixed(2) || "N/A"} - ₹${fundData.monteCarlo?.upper_bound_95th_percentile?.toFixed(2) || "N/A"}

Current NAV: ${navDisplay}
Total Historical Data Points: ${fundData.navHistory?.length || 0}
`;

      prompt = `You are a friendly investment advisor called "AI Dost" (Dost means friend in Hindi). Analyze this mutual fund data and explain it to a beginner investor in a very simple, friendly, and easy-to-understand way. Use bullet points and keep it conversational like talking to a friend. Focus on:

1. 🎯 What this fund is about (in simple terms)
2. 📈 How it has performed (good or bad? why?)
3. 💰 Risk level (is it safe or risky?)
4. 🔮 Future expectations (what to expect)
5. 👍 Should you consider it? (pros and cons)
6. 💡 Quick tips for this type of fund

Keep it short, friendly, and use emojis. Avoid jargon. Explain like talking to a friend over chai ☕

Fund Data:
${fundInfo}`;
    }

    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "google/gemini-2.5-flash",
      temperature: 0.8,
      max_tokens: 1024,
      top_p: 1,
      stream: true,
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
    console.error("Error in AI summarization:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
