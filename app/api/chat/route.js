import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { withAuth } from '../../lib/auth-middleware';
const { CohereClient } = require('cohere-ai');

const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

async function handleChat(req) {
  try {
    // Create authenticated Supabase client
    const authHeader = req.headers.get('authorization');
    const token = authHeader.split(' ')[1];
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    const { question, sessionId } = await req.json();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    console.log('=== DEBUGGING CHAT API ===');
    console.log('User ID:', req.user.id);
    console.log('Question:', question);

    // Check if user has any documents at all
    const { data: userDocs, error: docsError } = await supabase
      .from('documents_metadata')
      .select('*')
      .eq('user_id', req.user.id);

    console.log('User documents in metadata:', userDocs?.length || 0);
    console.log('Sample metadata:', userDocs?.[0] || 'No metadata');

    // Check if user has any document chunks
    const { data: userChunks, error: chunksError } = await supabase
      .from('documents')
      .select('id, content, document_id')
      .limit(5);

    console.log('Total document chunks in DB:', userChunks?.length || 0);
    console.log('Sample chunk:', userChunks?.[0]?.content?.substring(0, 100) || 'No chunks');

    // Check documents with proper join
    const { data: joinedDocs, error: joinError } = await supabase
      .from('documents')
      .select(`
        id, 
        content,
        document_id,
        documents_metadata!inner(user_id, filename)
      `)
      .eq('documents_metadata.user_id', req.user.id)
      .limit(3);

    console.log('Joined documents for user:', joinedDocs?.length || 0);
    console.log('Sample joined doc:', joinedDocs?.[0] || 'No joined docs');

    // Generate session ID if not provided
    const currentSessionId = sessionId || `session_${Date.now()}`;

    // Get conversation history for this user
    const { data: history } = await supabase
      .from('conversations')
      .select('role, content')
      .eq('session_id', currentSessionId)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true })
      .limit(10);

    // Store user message with user_id
    await supabase.from('conversations').insert({
      session_id: currentSessionId,
      role: 'user',
      content: question,
      user_id: req.user.id
    });

    // Generate embedding for the question
    const questionEmbedding = await cohere.embed({
      texts: [question],
      model: 'embed-english-light-v3.0',
      inputType: 'search_query'
    });

    console.log('Generated embedding length:', questionEmbedding.embeddings[0].length);

    // Find similar documents (RLS will automatically filter by user)
    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: questionEmbedding.embeddings[0],
      match_threshold: 0.7,
      match_count: 3
    });

    console.log('Documents found by match_documents:', documents?.length || 0);
    console.log('Match documents error:', error);
    console.log('Sample document content:', documents?.[0]?.content?.substring(0, 200) || 'No content');

    if (error) {
      console.error('Supabase search error:', error);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    // If no documents found, return a helpful message
    if (!documents || documents.length === 0) {
      return NextResponse.json({ 
        answer: "I don't have any documents to search through. Please upload a PDF first and then ask your question.",
        sources: [],
        sessionId: currentSessionId
      });
    }

    // Prepare context with conversation history
    const contextWithSources = documents.map((doc, index) => ({
      content: doc.content,
      source: `Document ${index + 1} (ID: ${doc.id})`,
      similarity: doc.similarity
    }));

    const documentContext = contextWithSources.map(item => 
      `[Source: ${item.source}]\n${item.content}`
    ).join('\n\n---\n\n');

    console.log('Context being sent to AI:', documentContext.substring(0, 300));

    // Build conversation context
    const conversationContext = history?.length > 0 
      ? history.map(msg => `${msg.role}: ${msg.content}`).join('\n')
      : '';

    // Generate answer using OpenRouter
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'mistralai/mistral-7b-instruct:free',
      messages: [
        {
          role: 'user',
          content: `You are a helpful study assistant with conversation memory. Use the conversation history and document context to provide relevant answers.

${conversationContext ? `Previous Conversation:\n${conversationContext}\n\n` : ''}Document Context:
${documentContext}

Current Question: ${question}

Instructions:
- Consider the conversation history when answering
- Reference previous topics if relevant
- Always cite sources using [Source: Document X]
- If building on previous discussion, acknowledge it

Answer:`
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const answer = response.data.choices[0].message.content;

    // Store assistant response with user_id
    await supabase.from('conversations').insert({
      session_id: currentSessionId,
      role: 'assistant',
      content: answer,
      sources: contextWithSources,
      user_id: req.user.id
    });

    console.log('=== END DEBUGGING ===');

    return NextResponse.json({ 
      answer,
      sources: contextWithSources.map(item => ({
        id: item.source,
        content: item.content.substring(0, 200) + '...',
        similarity: item.similarity
      })),
      sessionId: currentSessionId
    });

  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Export protected handler
export const POST = withAuth(handleChat);
