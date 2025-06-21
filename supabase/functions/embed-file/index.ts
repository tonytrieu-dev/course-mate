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
    // Validate that required environment variables are set
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const hfApiKey = Deno.env.get('HUGGINGFACE_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !hfApiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing environment variables on the server.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { record: file } = await req.json();
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
      return new Response('ok - unsupported file type', { headers: corsHeaders });
    }
    
    // Generate the embedding using Hugging Face Inference API
    const response = await fetch(
      'https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5/pipeline/feature-extraction',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: content, normalize: true }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to get embedding from Hugging Face: ${response.status} ${errorBody}`);
    }

    const embedding = await response.json();
    
    // Store the document and its embedding
    await supabaseAdmin.from('documents').insert({
      class_id: file.class_id,
      file_name: file.name,
      content,
      embedding,
    });

    return new Response('ok', { headers: corsHeaders });
  } catch (err) {
    console.error('Error in embed-file function:', err);
    return new Response(String(err?.message ?? err), {
      status: 500,
      headers: corsHeaders,
    });
  }
});