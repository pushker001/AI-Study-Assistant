"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '../lib/auth';

export default function FileUploader() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const headers = await getAuthHeaders();
      const response = await axios.post("/api/upload", formData, { headers });
      
      if (response.status === 200) {
        setMessage("✅ " + response.data.message);
        
        // Check if we're on documents page and refresh it
        if (window.location.pathname === '/documents') {
          setTimeout(() => {
            window.location.reload();
          }, 2000); // Wait 2 seconds before refresh
        } else {
          // Route to documents page to see the uploaded file
          setTimeout(() => {
            router.push('/documents');
          }, 1500);
        }
      }
    } catch (error) {
      setMessage("❌ " + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        id="file-upload"
        onChange={handleFileUpload}
        disabled={uploading}
      />
      <label
        htmlFor="file-upload"
        className={`cursor-pointer flex flex-col items-center space-y-2 ${
          uploading ? "opacity-50" : ""
        }`}
      >
        <div className="text-4xl">{uploading ? "⏳" : "📄"}</div>
        <span className="text-lg font-medium">
          {uploading ? "Uploading..." : "Upload PDF"}
        </span>
        <span className="text-sm text-gray-500">
          {uploading ? "Processing your file" : "Click to select a file"}
        </span>
      </label>
      {message && (
        <div className="mt-4 p-3 rounded bg-gray-100 text-sm">
          {message}
        </div>
      )}
    </div>
  );
}
