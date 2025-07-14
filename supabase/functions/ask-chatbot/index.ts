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
    console.log('Ask-chatbot function called');
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
        JSON.stringify({ error: 'Missing environment variables on the server. Check function logs.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    console.log('Request body:', body);
    const { query, classId } = body; // conversationHistory is not used by Gemini in this setup
    console.log('Parsed parameters:', { query, classId });
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // SECTION 1: GENERATE EMBEDDING (Hugging Face)
    console.log('Calling HuggingFace embedding API for query:', query);
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
      console.error('HF Embedding API error:', { status: hfEmbeddingResponse.status, body: errorBody });
      throw new Error(`Failed to get embedding from Hugging Face: ${hfEmbeddingResponse.status} ${errorBody}`);
    }

    const queryEmbedding = await hfEmbeddingResponse.json();
    console.log('Query embedding generated.');

    // SECTION 2: MATCH DOCUMENTS (Supabase)
    const { data: documents, error: rpcError } = await supabaseAdmin.rpc('match_documents', {
      class_id_filter: classId,
      match_count: 5,
      match_threshold: 0.5,
      query_embedding: queryEmbedding,
    });

    if (rpcError) {
      console.error('Error from match_documents:', rpcError);
      throw new Error(`Failed to find matching documents: ${rpcError.message}`);
    }

    if (!documents || documents.length === 0) {
      console.log('No matching documents found for classId:', classId);
      return new Response(JSON.stringify({ 
        answer: "I don't have any documents to reference for this class yet. Please upload some course materials first."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${documents.length} matching documents for classId:`, classId);
    const contextText = documents.map((doc: any) => doc.content).join("\n\n---\n\n");

    // SECTION 3: GENERATE A RESPONSE WITH GOOGLE GEMINI
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      throw new Error('GOOGLE_API_KEY is not set in environment variables.');
    }

    const prompt = `
Based on the following context from course documents, please answer the user's question.
If the context doesn't contain the answer, state that you couldn't find the information in the documents.

Context:
---
${contextText}
---

Question:
${query}

Answer:
`;

    console.log('Sending request to Google Gemini API...');

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }],
          }],
          generationConfig: {
            temperature: 0.7,
            topP: 1,
            maxOutputTokens: 250,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error('Google Gemini API error:', errorBody);
      throw new Error(`Gemini API request failed with status ${geminiResponse.status}`);
    }

    const geminiResult = await geminiResponse.json();
    const answer = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
      console.error('Unexpected response format from Gemini:', geminiResult);
      return new Response(
        JSON.stringify({ answer: "I'm sorry, I couldn't generate a response at this time. Please try again later." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return the final answer
    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Ask-chatbot function error:', err);
    const errorMessage = err?.message ?? String(err);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: String(err)
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
});