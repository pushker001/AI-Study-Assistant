import AuthGuard from '../components/Authgurad'
import ChatUI from '../components/ChatUI';

export default function ChatPage() {
  return (
    <AuthGuard>
      <div className="h-screen">
        <ChatUI />
      </div>
    </AuthGuard>
  );
}
