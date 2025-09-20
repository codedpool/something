import { useState } from "react";
import Groq from "groq-sdk";

const Chatbot = ({ selectedFund }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const groqClient = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const prompt = selectedFund
      ? `The user asks about "${selectedFund.name}" (Code: ${selectedFund.code}). Question: "${input}". Answer as a friendly financial advisor in up to 10 concise numbered points, max 50 words total, each point on a new line starting with "1. ", "2. ", etc. Keep it simple, no technical terms.`
      : `User asked: "${input}". No fund selected. Provide up to 10 concise numbered points, max 50 words total, about mutual funds or suggest fund selection, each point on a new line starting with "1. ", "2. ", etc. Keep it simple, friendly.`;

    try {
      const chatCompletion = await groqClient.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "deepseek-r1-distill-qwen-32b",
        temperature: 1,
        max_completion_tokens: 1024,
        top_p: 1,
        stream: true,
      });

      let botResponse = "";
      for await (const chunk of chatCompletion) {
        botResponse += chunk.choices[0]?.delta?.content || "";
      }

      // Clean and format response with newlines
      let cleanedResponse = botResponse
        .replace(/<think>.*?<\/think>/gs, "") // Remove <think> tags
        .replace(/\*\*/g, ""); // Remove markdown bolding
      
      // Ensure numbered points are on new lines by splitting on numbered transitions
      const points = cleanedResponse.split(/(?<=\.\s*)(?=\d+\.\s)/).filter(p => p.trim());
      cleanedResponse = points.join("\n");
      // console.log(points);
      // console.log(cleanedResponse);

      setMessages((prev) => [...prev, { role: "assistant", content: cleanedResponse }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Oops! Something went wrong." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!isOpen ? (
        <button onClick={() => setIsOpen(true)} className="w-12 h-12 bg-blue-gradient rounded-full text-white shadow-lg">
          💬
        </button>
      ) : (
        <div className="bg-gray-800 rounded-lg shadow-lg w-96 h-[600px] flex flex-col">
          <div className="flex justify-between p-3 bg-black-gradient rounded-t-lg">
            <h3 className="text-white">Fund Chatbot</h3>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto bg-gray-900 text-white">
            {messages.length === 0 ? (
              <p className="text-dimWhite text-sm">Ask me about {selectedFund ? selectedFund.name : "mutual funds"}!</p>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`mb-2 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                  <span className={`inline-block p-2 rounded-lg whitespace-pre-wrap ${msg.role === "user" ? "bg-blue-500" : "bg-gray-700"}`}>
                    {msg.content}
                  </span>
                </div>
              ))
            )}
            {loading && <div className="text-left p-2 bg-gray-700 rounded-lg">Typing...</div>}
          </div>
          <div className="p-3 border-t border-gray-700">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              className="w-full p-2 bg-gray-900 text-white rounded border border-gray-700"
              placeholder="Type your question..."
              rows="2"
            />
            <button onClick={handleSendMessage} disabled={loading} className="mt-2 w-full py-2 bg-blue-gradient text-primary">
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
