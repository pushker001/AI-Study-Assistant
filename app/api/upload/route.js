import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import axios from 'axios';
import { withAuth } from '../../lib/auth-middleware';
const { CohereClient } = require('cohere-ai');

// Extract text using LangChain Python service only
async function extractTextFromPDF(buffer) {
  console.log('Starting LangChain PDF extraction...');
  
  try {
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', buffer, 'document.pdf');
    
    const response = await axios.post(`${process.env.PDF_EXTRACTION_SERVICE_URL}/extract-pdf`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000 // 30 second timeout
    });
    
    const result = response.data;
    console.log('LangChain extraction successful:', result.total_elements, 'elements');
    
    // Combine all elements into structured text
    const text = result.elements
      .map(el => `[${el.type.toUpperCase()}]\n${el.content}`)
      .join('\n\n');
    
    return {
      text: text,
      pageCount: result.page_count,
      elements: result.elements,
      extractionMethod: 'langchain'
    };
    
  } catch (langchainError) {
    console.error('LangChain extraction failed:', langchainError.message);
    throw new Error(`PDF extraction failed: ${langchainError.message}`);
  }
}

// Protected POST handler
async function handleUpload(req) {
  let docMetadata = null;
  
  try {
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

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file)
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const { data: docMetadataResult, error: metaError } = await supabase
      .from('documents_metadata')
      .insert({
        filename: file.name,
        file_size: file.size,
        status: 'processing',
        user_id: req.user.id
      })
      .select()
      .single();

    if (metaError) {
      //Handle unique constraint violation
      if(metaError.code === '23505') {
        return NextResponse.json({
          error: "You already have a document uploaded. Please delete it first to upload a new one."

        }, { status: 400 });
      }
      console.error('Metadata creation error:', metaError);
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 });
    }

    docMetadata = docMetadataResult;
    console.log('Created document metadata with ID:', docMetadata.id);

    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      const { text, pageCount, extractionMethod } = await extractTextFromPDF(buffer);

      console.log('Text length:', text.length);
      console.log('Page count:', pageCount);
      console.log('Extraction method:', extractionMethod);

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const docs = await splitter.createDocuments([text]);
      console.log('Number of docs created:', docs.length);

      const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

      console.log('Starting embedding generation...');
      const vectors = await Promise.all(
        docs.map(async (doc, i) => {
          const response = await cohere.embed({
            texts: [doc.pageContent],
            model: 'embed-english-light-v3.0',
            inputType: 'search_document'
          });
          return {
            id: `${docMetadata.id}_chunk_${i}`,
            content: doc.pageContent,
            embedding: response.embeddings[0],
            document_id: docMetadata.id
          };
        })
      );

      console.log('Inserting', vectors.length, 'vectors into database...');
      for (const v of vectors) {
        const { error } = await supabase.from('documents').insert({
          id: v.id,
          content: v.content,
          embedding: v.embedding,
          document_id: v.document_id
        });
        
        if (error) {
          console.error('Supabase insert error:', error);
          throw error;
        }
      }
      console.log('All vectors inserted successfully');

      // Update document status to ready
      console.log('Updating document status to ready...');
      
      const updateResult = await supabase
        .from('documents_metadata')
        .update({ 
          status: 'ready',
          page_count: pageCount
        })
        .eq('id', docMetadata.id);

      console.log('Status update result:', updateResult);
      
      if (updateResult.error) {
        console.error('Status update failed:', updateResult.error);
      } else {
        console.log('Status updated successfully to ready');
      }

      return NextResponse.json({ 
        message: 'Uploaded and indexed successfully!',
        documentId: docMetadata.id,
        extractionMethod: extractionMethod
      });

    } catch (processingError) {
      console.error('Processing error:', processingError);
      
      // Delete the failed document metadata instead of marking as error
      if (docMetadata && docMetadata.id) {
        console.log('Deleting failed document metadata:', docMetadata.id);
        const deleteResult = await supabase
          .from('documents_metadata')
          .delete()
          .eq('id', docMetadata.id);
          
        console.log('Delete result:', deleteResult);
        
        if (deleteResult.error) {
          console.error('Failed to delete document metadata:', deleteResult.error);
        } else {
          console.log('Failed document deleted successfully');
        }
      }

      throw processingError;
    }

  } catch (err) {
    console.error('Upload error:', err);
    
    // Additional cleanup in case of outer try-catch
    if (docMetadata && docMetadata.id) {
      try {
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
        
        await supabase
          .from('documents_metadata')
          .delete()
          .eq('id', docMetadata.id);
          
        console.log('Cleaned up failed document in outer catch');
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError);
      }
    }
    
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const POST = withAuth(handleUpload);
