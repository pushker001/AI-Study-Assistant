import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
const { CohereClient } = require('cohere-ai');

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

export async function POST(req) {
  try {
    const { question, sessionId } = await req.json();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Generate session ID if not provided
    const currentSessionId = sessionId || `session_${Date.now()}`;

    // Get conversation history (last 5 messages for context)
    const { data: history } = await supabase
      .from('conversations')
      .select('role, content')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true })
      .limit(10);

    // Store user message
    await supabase.from('conversations').insert({
      session_id: currentSessionId,
      role: 'user',
      content: question
    });

    // 1. Generate embedding for the question
    const questionEmbedding = await cohere.embed({
      texts: [question],
      model: 'embed-english-light-v3.0',
      inputType: 'search_query'
    });

    // 2. Find similar documents
    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: questionEmbedding.embeddings[0],
      match_threshold: 0.7,
      match_count: 3
    });

    if (error) {
      console.error('Supabase search error:', error);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    // 3. Prepare context with conversation history
    const contextWithSources = documents.map((doc, index) => ({
      content: doc.content,
      source: `Document ${index + 1} (ID: ${doc.id})`,
      similarity: doc.similarity
    }));

    const documentContext = contextWithSources.map(item => 
      `[Source: ${item.source}]\n${item.content}`
    ).join('\n\n---\n\n');

    // Build conversation context
    const conversationContext = history?.length > 0 
      ? history.map(msg => `${msg.role}: ${msg.content}`).join('\n')
      : '';

    // 4. Enhanced prompt with conversation memory
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

    // Store assistant response
    await supabase.from('conversations').insert({
      session_id: currentSessionId,
      role: 'assistant',
      content: answer,
      sources: contextWithSources
    });

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

