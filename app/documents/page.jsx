"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('/api/documents');
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id) => {
    if (!confirm('Delete this document? This cannot be undone.')) return;
    
    try {
      await axios.delete(`/api/documents/${id}`);
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (error) {
      alert('Error deleting document');
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.filename.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-6">Loading documents...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Documents</h1>
        <Link href="/" className="bg-blue-500 text-white px-4 py-2 rounded">
          Upload New
        </Link>
      </div>

      <input
        type="text"
        placeholder="Search documents..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Filename</th>
              <th className="border p-2 text-left">Upload Date</th>
              <th className="border p-2 text-left">Pages</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.map(doc => (
              <tr key={doc.id}>
                <td className="border p-2">{doc.filename}</td>
                <td className="border p-2">
                  {new Date(doc.created_at).toLocaleDateString()}
                </td>
                <td className="border p-2">{doc.page_count || '-'}</td>
                <td className="border p-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    doc.status === 'ready' ? 'bg-green-100 text-green-800' :
                    doc.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {doc.status}
                  </span>
                </td>
                <td className="border p-2">
                  <Link 
                    href={`/chat?doc=${doc.id}`}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-sm mr-2"
                  >
                    Chat
                  </Link>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredDocs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No documents found
        </div>
      )}
    </div>
  );
}