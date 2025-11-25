"use client";
import AuthGuard from './components/Authgurad'
import { useAuth } from './lib/auth';
import Fileuploader from "./components/FileUploader";
import Link from 'next/link';

export default function Home() {
  const { user } = useAuth();
  const firstName = user?.email?.split('@')[0] || 'User';

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-100 rounded-full opacity-20 animate-pulse delay-1000"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 flex justify-between items-center p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
            <span className="text-xl font-semibold text-gray-800">Study Assistant</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/documents" className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200">
              <span>📁</span>
              <span>My Documents</span>
            </Link>
            <UserMenu />
          </div>
        </div>

        {/* Center Welcome Animation */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="text-center animate-fade-in-up">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce-slow">
                <span className="text-4xl">🧠</span>
              </div>
              <h1 className="text-5xl font-bold text-gray-800 mb-4 animate-slide-in">
                Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 typing-animation">{firstName}</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed animate-fade-in delay-500">
                Transform your PDFs into interactive conversations. Upload any document and start chatting with AI to get instant insights.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Upload Section */}
        <div className="relative z-10 fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 p-6">
          <div className="max-w-2xl mx-auto">
            <Fileuploader />
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}

function UserMenu() {
  const { user, signOut } = useAuth();
  
  return (
    <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
        {user?.email?.[0]?.toUpperCase()}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-700">{user?.email}</span>
        <button
          onClick={signOut}
          className="text-xs text-red-500 hover:text-red-700 text-left transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
