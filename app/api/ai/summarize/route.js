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

    // Prepare fund information for AI
    const fundInfo = `
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

    const prompt = `You are a friendly investment advisor called "AI Dost" (Dost means friend in Hindi). Analyze this mutual fund data and explain it to a beginner investor in a very simple, friendly, and easy-to-understand way. Use bullet points and keep it conversational like talking to a friend. Focus on:

1. 🎯 What this fund is about (in simple terms)
2. 📈 How it has performed (good or bad? why?)
3. 💰 Risk level (is it safe or risky?)
4. 🔮 Future expectations (what to expect)
5. 👍 Should you consider it? (pros and cons)
6. 💡 Quick tips for this type of fund

Keep it short, friendly, and use emojis. Avoid jargon. Explain like talking to a friend over chai ☕

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
      temperature: 0.8,
      max_completion_tokens: 1024,
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
    console.error("Error in AI summarization:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
