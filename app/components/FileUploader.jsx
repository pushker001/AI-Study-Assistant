"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '../lib/auth';
import Link from 'next/link';

export default function FileUploader() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [hasDocument, setHasDocument] = useState(false);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkExistingDocument();
  }, []);

  const checkExistingDocument = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get('/api/documents', { headers });
      
      if (response.data.documents.length > 0) {
        setHasDocument(true);
        setCurrentDoc(response.data.documents[0]);
      } else {
        setHasDocument(false);
        setCurrentDoc(null);
      }
    } catch (error) {
      console.error('Error checking documents:', error);
    } finally {
      setLoading(false);
    }
  };

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
        
        if (window.location.pathname === '/documents') {
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
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

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking documents...</p>
        </div>
      </div>
    );
  }

  if (hasDocument) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📄</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Document Limit Reached</h3>
          <p className="text-gray-600 mb-2">
            You already have: <strong>{currentDoc?.filename}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Delete your current document to upload a new one
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/documents" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Manage Documents
            </Link>
            <Link 
              href={`/chat/${currentDoc?.id}`}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Chat with Document
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show upload interface if no document exists
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="border-2 border-dashed border-blue-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors">
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
          className={`cursor-pointer flex flex-col items-center space-y-4 ${
            uploading ? "opacity-50" : ""
          }`}
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <div className="text-3xl">{uploading ? "⏳" : "📄"}</div>
          </div>
          <div>
            <span className="text-xl font-semibold text-gray-800 block">
              {uploading ? "Processing..." : "Upload Your First PDF"}
            </span>
            <span className="text-sm text-gray-500 mt-2 block">
              {uploading ? "Extracting content and generating embeddings" : "Click to select a PDF file"}
            </span>
          </div>
        </label>
      </div>
      
      {message && (
        <div className={`mt-6 p-4 rounded-lg text-sm font-medium ${
          message.startsWith("✅") 
            ? "bg-green-50 text-green-800 border border-green-200" 
            : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}
