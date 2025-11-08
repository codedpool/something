import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const { prompt } = await request.json();
    
    if (!prompt) {
      throw new Error("No prompt provided");
    }

    const openaiClient = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': 'https://newealth.com',
        'X-Title': 'NewWealth AI',
      },
    });

    // Log API call attempt
    console.log("Calling OpenRouter API with prompt:", prompt.substring(0, 100) + "...");

    // Set system context for financial advisor role
    const messages = [
      {
        role: "system",
        content: `You are an expert financial advisor with deep knowledge of mutual funds, stocks, and investment strategies.
          - Keep responses short and focused on the user's question
          - Use simple language, avoiding technical jargon
          - Format advice in clear, numbered points
          - If uncertain, be transparent about limitations
          - Focus on educational guidance, not specific investment advice
          - Stay professional and factual in responses`
      },
      { role: "user", content: prompt }
    ];

    console.log(`Attempting chat completion with prompt:`, prompt.substring(0, 100) + "...");
    
    const chatStream = await openaiClient.chat.completions.create({
      messages: messages,
      model: "google/gemini-2.5-flash",
      temperature: 1,
      max_tokens: 1024,
      top_p: 1,
      stream: true,
    });
    
    console.log("Chat stream created successfully");
    return createStreamResponse(chatStream);

    // Helper function to create stream response
    function createStreamResponse(chatStream) {
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of chatStream) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                controller.enqueue(new TextEncoder().encode(content));
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
          "Content-Type": "text/plain",
          "Cache-Control": "no-cache",
        },
      });
    }

  } catch (error) {
    console.error("Chat API error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "Chat service is not properly configured" },
        { status: 503 }
      );
    }

    if (error.message === "No prompt provided") {
      return NextResponse.json(
        { error: "Please provide a question or message" },
        { status: 400 }
      );
    }

    if (error.message?.includes('401')) {
      return NextResponse.json(
        { error: "Authentication failed with the chat service" },
        { status: 401 }
      );
    }

    if (error.message?.includes('429')) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to process chat request" },
      { status: 500 }
    );
  }
}