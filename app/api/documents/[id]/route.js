import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    // Delete all document chunks first
    const { error: chunksError } = await supabase
      .from('documents')
      .delete()
      .eq('document_id', id);

    if (chunksError) throw chunksError;

    // Delete document metadata
    const { error: metaError } = await supabase
      .from('documents_metadata')
      .delete()
      .eq('id', id);

    if (metaError) throw metaError;

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}