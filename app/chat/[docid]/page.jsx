"use client"
import { useParams } from 'next/navigation';
import ChatUI from '../../components/ChatUI';
import AuthGuard from '../../components/Authgurad';


export default function DocumentChatPage(){
    const params = useParams();
    const docId = params.docId;

    return (
        <AuthGuard>
            <div className='h-screen'>
                <ChatUI docId = {docId}/>

            </div>
        </AuthGuard>
    )

}
