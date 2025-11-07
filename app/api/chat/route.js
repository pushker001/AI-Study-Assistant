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
    const { question } = await req.json();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // 1. Generate embedding for the question
    const questionEmbedding = await cohere.embed({
      texts: [question],
      model: 'embed-english-light-v3.0',
      inputType: 'search_query'
    });

    console.log('Received question:', question);
    console.log('Generated embedding length:', questionEmbedding.embeddings[0].length);

    // 2. Find similar documents using vector similarity
    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: questionEmbedding.embeddings[0],
      match_threshold: 0.7,
      match_count: 3
    });

    if (error) {
      console.error('Supabase search error:', error);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    // 3. Prepare context from similar documents
    // 3. Prepare context from similar documents with source tracking
    const contextWithSources = documents.map((doc, index) => ({
      content: doc.content,
      source: `Document ${index + 1} (ID: ${doc.id})`,
      similarity: doc.similarity
    }));

    const context = contextWithSources.map(item => 
      `[Source: ${item.source}]\n${item.content}`
    ).join('\n\n---\n\n');

    // 4. Enhanced prompt with source citation instructions
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'mistralai/mistral-7b-instruct:free',
      messages: [
        {
          role: 'user',
          content: `You are a helpful study assistant. Answer the question based on the provided context. Always cite your sources using the format [Source: Document X].

    Context:
    ${context}

    Question: ${question}

    Instructions:
    - Answer based only on the provided context
    - Always cite which document(s) you're referencing
    - If information isn't in the context, say "I don't have enough information to answer that question"
    - Be specific and helpful for studying

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

    return NextResponse.json({ 
      answer,
      sources: contextWithSources.map(item => ({
        id: item.source,
        content: item.content.substring(0, 200) + '...',
        similarity: item.similarity
      })),
      sourceCount: documents.length 
    });

  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
