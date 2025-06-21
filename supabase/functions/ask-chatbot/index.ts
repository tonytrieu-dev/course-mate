import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
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

    const { query, classId } = await req.json();
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Generate an embedding for the user's question using Hugging Face.
    const hfEmbeddingResponse = await fetch(
      'https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5/pipeline/feature-extraction',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: query, normalize: true }),
      }
    );

    if (!hfEmbeddingResponse.ok) {
      const errorBody = await hfEmbeddingResponse.text();
      throw new Error(`Failed to get embedding from Hugging Face: ${hfEmbeddingResponse.status} ${errorBody}`);
    }

    const queryEmbedding = await hfEmbeddingResponse.json();

    // 2. Query the database for the most relevant document sections.
    const { data: documents, error: rpcError } = await supabaseAdmin.rpc('match_documents', {
      query_embedding: queryEmbedding, // Pass the embedding directly
      match_threshold: 0.5,
      match_count: 5,
      p_class_id: classId, // Pass the classId to the RPC
    });

    if (rpcError) {
      console.error('Error from match_documents:', rpcError);
      return new Response(JSON.stringify({ error: 'Failed to find matching documents.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!documents || documents.length === 0) {
      return new Response(JSON.stringify({ answer: "I'm sorry, I couldn't find any relevant documents to answer your question. Please upload some files first." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contextText = documents.map((doc: any) => doc.content).join("\n\n---\n\n");

    // 3. Call the Hugging Face Inference API
    const hfResponse = await fetch('https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1', {
        headers: {
          Authorization: `Bearer ${hfApiKey}`,
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
            inputs: `Based ONLY on the following context, please answer the user's question. If the context does not contain the answer, say "I'm sorry, that information is not available in the provided documents."\n\nContext:\n${contextText}\n\nQuestion:\n${query}\n\nAnswer:`,
            parameters: { max_new_tokens: 250 }
        }),
    });

    const hfResult = await hfResponse.json();

    // Extract the answer from the model's response text
    const answer = hfResult[0].generated_text.split("Answer:")[1]?.trim() || "I couldn't generate an answer.";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(String(err?.message ?? err), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
});