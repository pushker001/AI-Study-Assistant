"use client";

import { useState } from "react";
import axios from "axios";
import { set } from "cohere-ai/core/schemas";

export default function Chatbot() {

    const [query, setquery] = useState("");
    const [answer, setanswer] = useState("")


    const handleask = async() => {
        try {
            const response = await axios.post('api/chat', {question: query});
            setanswer(response.data.answer);
        } catch (error) {
            console.error('Error:', error.response?.data);
            setanswer('Error: ' + (error.response?.data?.error || error.message));
        }
    }
    



    return(
        <div className="p-4">
            <textarea
                className="border p-2 w-full"
                placeholder="Ask something about your PDF..."
                value={query}
                onChange={(e) => setquery(e.target.value)}
            />
            <button onClick={handleask} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
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