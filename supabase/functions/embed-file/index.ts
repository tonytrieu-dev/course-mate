import { createClient } from 'https://esm.sh/@supabase/supabase-js'
import { extractText } from 'https://esm.sh/unpdf'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const hfApiKey = Deno.env.get('HUGGINGFACE_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !hfApiKey) {
      console.error('Missing environment variables:', {
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        hasHfApiKey: !!hfApiKey
      });
      return new Response(
        JSON.stringify({ error: 'Missing environment variables on the server.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    console.log('Received request body:', JSON.stringify(body, null, 2));
    const { record: file } = body;
    
    if (!file) {
      console.error('No file record in request body');
      return new Response(
        JSON.stringify({ error: 'No file record provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Processing file:', {
      id: file.id,
      name: file.name,
      path: file.path,
      class_id: file.class_id,
      type: file.type
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Download file content from storage
    const { data: blob, error: downloadError } = await supabaseAdmin.storage.from('class-materials').download(file.path);
    if (downloadError) throw downloadError;
    if (!blob) {
      throw new Error('File not found in storage.');
    }

    let content = '';
    const fileType = blob.type;

    if (fileType === 'application/pdf') {
      const fileBuffer = await blob.arrayBuffer();
      const { text } = await extractText(new Uint8Array(fileBuffer), { mergePages: true });
      content = text;
    } else if (fileType.startsWith('text/')) {
      content = await blob.text();
    } else {
      console.log(`Skipping embedding for unsupported file type: ${fileType}`);
      return new Response('OK - unsupported file type', { headers: corsHeaders });
    }
    
    // Chunk the content into smaller pieces (max 1000 chars with overlap)
    const chunkSize = 1000;
    const overlapSize = 200;
    const chunks = [];
    
    for (let i = 0; i < content.length; i += chunkSize - overlapSize) {
      chunks.push(content.slice(i, i + chunkSize));
    }
    
    console.log(`Processing ${chunks.length} chunks for file: ${file.name}`);
    
    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Generate the embedding using Hugging Face Inference API
      let retries = 3;
      let response;
      
      while (retries > 0) {
        response = await fetch(
          'https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5/pipeline/feature-extraction',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${hfApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputs: chunk, normalize: true }),
          }
        );
        
        if (response.ok) break;
        
        if (response.status === 503 || response.status === 429) {
          console.log(`Rate limited on chunk ${i + 1}/${chunks.length}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          retries--;
        } else {
          break;
        }
      }

      if (!response || !response.ok) {
        const errorBody = await response?.text() || 'Unknown error';
        console.error(`Failed on chunk ${i + 1}: ${response?.status} ${errorBody}`);
        throw new Error(`Failed to get embedding from Hugging Face: ${response?.status} ${errorBody}`);
      }

      const embedding = await response.json();
      console.log(`Generated embedding for chunk ${i + 1}, dimension: ${embedding?.length}`);
      
      // Store the document chunk and its embedding
      const insertData = {
        class_id: file.class_id,
        file_name: `${file.name} (chunk ${i + 1}/${chunks.length})`,
        content: chunk,
        embedding,
      };
      
      console.log('Attempting to insert document:', {
        class_id: insertData.class_id,
        file_name: insertData.file_name,
        content_length: insertData.content.length,
        embedding_dimension: insertData.embedding?.length
      });
      
      const { data: insertedDoc, error: insertError } = await supabaseAdmin
        .from('documents')
        .insert(insertData)
        .select();
      
      if (insertError) {
        console.error(`Failed to insert chunk ${i + 1}/${chunks.length}:`, insertError);
        console.error('Insert error details:', JSON.stringify(insertError, null, 2));
        throw new Error(`Database insert failed: ${insertError.message}`);
      }
      
      console.log(`Successfully embedded chunk ${i + 1}/${chunks.length} for ${file.name}`, insertedDoc);
    }

    console.log('Successfully processed all chunks for file:', file.name);
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully embedded ${chunks.length} chunks for ${file.name}` 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    console.error('Error in embed-file function:', err);
    console.error('Full error details:', JSON.stringify(err, null, 2));
    return new Response(JSON.stringify({
      error: err?.message ?? String(err),
      details: err
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});