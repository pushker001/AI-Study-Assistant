"use client";
import { useState } from "react";
import axios from "axios";
import { getAuthHeaders } from '../lib/auth';

export default function Chatbot() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");

  const handleAsk = async() => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post('api/chat', {question: query}, { headers });
      setAnswer(response.data.answer);
    } catch (error) {
      console.error('Error:', error.response?.data);
      setAnswer('Error: ' + (error.response?.data?.error || error.message));
    }
  }

  return(
    <div className="p-4">
      <textarea
        className="border p-2 w-full"
        placeholder="Ask something about your PDF..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={handleAsk} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
        Ask
      </button>
      {answer && (
        <div className="mt-4 border-t pt-2">
          <strong>Answer:</strong>
          <p>{answer}</p>
        </div>
      )}
    </div>
  )
}
