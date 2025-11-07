import Image from "next/image";
import FileUploader from "./components/FileUploader";
import Chatbot from "./components/Chatbot";

export default function Home() {
  return (
    <main className="flex flex-col items-center p-6 space-y-6">
      <h1 className="text-3xl font-bold">AI Study Assistant 📚</h1>
      <FileUploader />

      <Chatbot />

      
      
    </main>
    
  );
}
