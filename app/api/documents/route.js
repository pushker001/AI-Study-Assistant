import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '../../lib/auth-middleware';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET - List user's documents
async function handleGetDocuments(req) {
  try {
    // Create authenticated Supabase client using the user's token
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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    let query = supabase
      .from('documents_metadata')
      .select('*')
      .eq('user_id', req.user.id)  // Use req.user.id instead of auth.uid()
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('filename', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ documents: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE - Delete user's documents
async function handleDeleteDocuments(req) {
  try {
    const { documentIds } = await req.json();

    if (!documentIds || !Array.isArray(documentIds)) {
      return NextResponse.json({ error: 'Document IDs required' }, { status: 400 });
    }

    // Delete documents (only user's own documents due to RLS)
    const { error } = await supabase
      .from('documents_metadata')
      .delete()
      .in('id', documentIds)
      .eq('user_id', req.user.id);  // Extra safety check

    if (error) throw error;

    return NextResponse.json({ 
      message: `${documentIds.length} document(s) deleted successfully` 
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Export protected handlers
export const GET = withAuth(handleGetDocuments);
export const DELETE = withAuth(handleDeleteDocuments);
