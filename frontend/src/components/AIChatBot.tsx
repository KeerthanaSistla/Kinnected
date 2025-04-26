import { useState, useRef, useEffect } from "react";
import { SendHorizonal, Trash2 } from "lucide-react";
import { generateGeminiResponse } from "@/lib/gemini";

export function AIChatBot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([]);
  const [fadeHeader, setFadeHeader] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fade chat header on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (messagesContainerRef.current) {
        setFadeHeader(messagesContainerRef.current.scrollTop > 10);
      }
    };

    const el = messagesContainerRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { from: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const reply = await generateGeminiResponse(input);
    const botMessage = { from: "bot", text: reply };
    setMessages((prev) => [...prev, botMessage]);
  };

  const handleClearChat = () => {
    if (confirm("Are you sure you want to delete the entire conversation?")) {
      setMessages([]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div
        className={`px-4 py-3 border-b bg-gradient-to-r from-orange-400 to-green-500 text-white transition-opacity duration-300 ${
          fadeHeader ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <h2 className="text-lg font-bold text-center">Kinnected AI</h2>
      </div>

      {/* Chat Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-xs px-4 py-2 rounded-md text-sm ${
              msg.from === "user"
                ? "bg-blue-100 ml-auto text-right"
                : "bg-gray-100 mr-auto text-left"
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="sticky bottom-0 bg-white p-4 border-t flex items-center gap-2">
        <button
          onClick={handleClearChat}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        <input
          className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="Ask Kinnected AI..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        <button onClick={handleSend} className="text-blue-600 hover:text-blue-800">
          <SendHorizonal className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
