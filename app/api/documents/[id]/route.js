import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '../../../lib/auth-middleware';

async function handleDelete(req) {
  try {
    // Extract ID from URL instead of params
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];

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

    console.log('Deleting document:', id);
    console.log('User ID:', req.user.id);

    // Delete all document chunks first
    const { error: chunksError } = await supabase
      .from('documents')
      .delete()
      .eq('document_id', id);

    console.log('Chunks delete result:', chunksError);

    if (chunksError) throw chunksError;

    // Delete document metadata
    const { error: metaError } = await supabase
      .from('documents_metadata')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id); // Extra safety check

    console.log('Metadata delete result:', metaError);

    if (metaError) throw metaError;

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const DELETE = withAuth(handleDelete);
