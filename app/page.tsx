import Image from "next/image";
import FileUploader from "./components/FileUploader";
import Chatbot from "./components/Chatbot";

export default function Home() {
  return (
    <main className="flex flex-col items-center p-6 space-y-6">
      <h1 className="text-3xl font-bold">AI Study Assistant 📚</h1>
      
      <div className="flex gap-4">
        <a href="/documents" className="bg-gray-500 text-white px-4 py-2 rounded">
          My Documents
        </a>
        <a href="/chat" className="bg-blue-500 text-white px-4 py-2 rounded">
          Chat
        </a>
      </div>
      
      <FileUploader />

      <Chatbot />

      
      
    </main>
    
  );
}
