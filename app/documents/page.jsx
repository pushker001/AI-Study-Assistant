"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import AuthGuard from '../components/Authgurad';
import { getAuthHeaders } from '../lib/auth';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [search]);

  // In your documents/page.jsx, add this useEffect
useEffect(() => {
  const interval = setInterval(() => {
    fetchDocuments();
  }, 5000); // Refresh every 5 seconds

  return () => clearInterval(interval);
}, []);


  const fetchDocuments = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`/api/documents?search=${search}`, { headers });

       // Add this debug line
       console.log('Documents response:', response.data.documents);
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentIds) => {
    if (!confirm(`Delete ${documentIds.length} document(s)?`)) return;
  
    setDeleting(true);
    try {
      const headers = await getAuthHeaders();
      
      // Delete each document individually
      for (const docId of documentIds) {
        await axios.delete(`/api/documents/${docId}`, { headers });
      }
      
      // Remove from frontend state
      setDocuments(docs => docs.filter(doc => !documentIds.includes(doc.id)));
      setSelectedDocs([]);
      
      // Refresh the list to be sure
      setTimeout(() => {
        fetchDocuments();
      }, 1000);
      
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting documents');
    } finally {
      setDeleting(false);
    }
  };
  

  const toggleSelect = (docId) => {
    setSelectedDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AuthGuard>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Documents</h1>
          <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Upload New Document
          </Link>
        </div>

        {/* Search and Actions */}
        <div className="flex justify-between items-center mb-6">
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-4 py-2 w-64"
          />
          
          {selectedDocs.length > 0 && (
            <button
              onClick={() => handleDelete(selectedDocs)}
              disabled={deleting}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Delete Selected ({selectedDocs.length})
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8">Loading documents...</div>
        ) : (
          <>
            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <input
                      type="checkbox"
                      checked={selectedDocs.includes(doc.id)}
                      onChange={() => toggleSelect(doc.id)}
                      className="mt-1"
                    />
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                  </div>

                  <h3 className="font-semibold text-lg mb-2 truncate" title={doc.filename}>
                    📄 {doc.filename}
                  </h3>

                  <div className="text-sm text-gray-600 space-y-1">
                  <p>📅 {new Date(doc.created_at).toLocaleDateString()}</p>
                    <p>📊 {doc.page_count || 'N/A'} pages</p>
                    <p>💾 {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB` : 'N/A'}</p>
                  </div>

                  <div className="flex justify-between mt-4">
                    <Link 
                      href={`/chat/${doc.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      💬 Chat
                    </Link>
                    <button
                      onClick={() => handleDelete([doc.id])}
                      className="text-red-600 hover:text-red-800 text-sm"
                      disabled={deleting}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {documents.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No documents found</p>
                <Link href="/" className="text-blue-600 hover:text-blue-800">
                  Upload your first document
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </AuthGuard>
  );
}
