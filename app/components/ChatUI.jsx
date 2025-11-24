"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { getAuthHeaders } from '../lib/auth';

export default function ChatUI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // Generate session ID on component mount
  useEffect(() => {
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Get auth headers and send with request
      const headers = await getAuthHeaders();
      const res = await axios.post("/api/chat", { 
        question: input,
        sessionId: sessionId 
      }, { headers });
      
      const botMessage = { 
        role: "assistant", 
        content: res.data.answer,
        sources: res.data.sources || []
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Chat error:', err.response?.data || err.message);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `❌ Error: ${err.response?.data?.error || err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div className={`max-w-lg ${msg.role === "user" ? "" : "w-full"}`}>
              <div
                className={`p-3 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-900 rounded-bl-none"
                }`}
              >
                {msg.content}
              </div>
              
              {/* Sources section for assistant messages */}
              {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  <details className="cursor-pointer">
                    <summary className="hover:text-blue-600">
                      📚 Sources ({msg.sources.length}) - Click to expand
                    </summary>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {msg.sources.map((source, idx) => (
                        <div key={idx} className="p-2 bg-white rounded border text-xs">
                          <div className="font-semibold text-blue-600">{source.id}</div>
                          <div className="text-gray-700 mt-1">{source.content}</div>
                          {source.similarity && (
                            <div className="text-gray-400 mt-1">
                              Relevance: {(source.similarity * 100).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-500 rounded-2xl rounded-bl-none p-3">
              🤔 Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input box */}
      <div className="p-4 border-t bg-white flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask something about your PDF..."
          className="flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
