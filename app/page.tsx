"use client";
import AuthGuard from './components/Authgurad'
import { useAuth } from './lib/auth';
import Fileuploader from "./components/FileUploader";
import Chatbot from "./components/Chatbot";
import Link from 'next/link';

export default function Home() {
  return (
    <AuthGuard>
      <main className="flex flex-col items-center p-6 space-y-8">
        <div className="flex justify-between items-center w-full max-w-4xl">
          <h1 className="text-3xl font-bold">AI Study Assistant 📚</h1>
          <div className="flex items-center space-x-4">
            <Link href="/documents" className="text-blue-600 hover:text-blue-800">
              📁 My Documents
            </Link>
            <UserMenu />
          </div>
        </div>
        
        <Fileuploader />
        
        <div className="w-full max-w-4xl">
          <Chatbot />
        </div>
      </main>
    </AuthGuard>
  );
}

function UserMenu() {
  const { user, signOut } = useAuth();
  
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">{user?.email}</span>
      <button
        onClick={signOut}
        className="text-sm text-red-600 hover:text-red-800"
      >
        Logout
      </button>
    </div>
  );
}
