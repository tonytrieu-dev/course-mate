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
    const { query, classId, conversationHistory = [] } = body;
    console.log('Parsed parameters:', { query, classId, historyLength: conversationHistory.length });
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Generate an embedding for the user's question using Hugging Face.
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
      console.error('HF Embedding API error:', {
        status: hfEmbeddingResponse.status,
        statusText: hfEmbeddingResponse.statusText,
        body: errorBody
      });
      throw new Error(`Failed to get embedding from Hugging Face: ${hfEmbeddingResponse.status} ${errorBody}`);
    }

    const queryEmbedding = await hfEmbeddingResponse.json();
    console.log('Query embedding generated, dimension:', queryEmbedding?.length);

    // 2. Query the database for the most relevant document sections.
    const { data: documents, error: rpcError } = await supabaseAdmin.rpc('match_documents', {
      class_id_filter: classId, // Pass the classId to the RPC
      match_count: 5,
      match_threshold: 0.5,
      query_embedding: queryEmbedding, // Pass the embedding directly
    });

    if (rpcError) {
      console.error('Error from match_documents:', rpcError);
      console.error('RPC error details:', JSON.stringify(rpcError, null, 2));
      return new Response(JSON.stringify({ 
        error: 'Failed to find matching documents. Please ensure the database is properly set up.',
        details: rpcError.message || rpcError
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!documents || documents.length === 0) {
      console.log('No matching documents found for classId:', classId);
      return new Response(JSON.stringify({ 
        answer: "I don't have any documents to reference for this class yet. Please upload some course materials (PDFs or text files) first, and I'll be able to help answer questions about them.",
        debug: { classId, documentsFound: 0 }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${documents.length} matching documents for classId:`, classId);
    const contextText = documents.map((doc: any) => doc.content).join("\n\n---\n\n");

    // 3. Build conversation context
    const conversationContext = conversationHistory.length > 0 
      ? `Previous conversation:\n${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}\n\n`
      : '';

    // 4. Create enhanced prompt with conversation history
    const enhancedPrompt = `You are a helpful assistant answering questions about course materials. Use the following context to answer the user's question. If the context doesn't contain the answer, say so.

${conversationContext}Context from documents:
${contextText}

Current question: ${query}

Please provide a clear and helpful answer based on the context and conversation history:`;

    // 5. Call the Hugging Face Inference API with enhanced prompt
    // Add retry logic for rate limits
    let hfResponse;
    let retries = 3;
    
    // Log the request details for debugging
    const requestBody = {
      inputs: enhancedPrompt,
      parameters: { 
        max_new_tokens: 150,
        temperature: 0.7,
        do_sample: true,
        top_p: 0.9,
        repetition_penalty: 1.2
      },
      options: {
        wait_for_model: true
      }
    };
    
    console.log('Sending request to HF Text Generation API');
    console.log('Request body parameters:', requestBody.parameters);
    console.log('Prompt length:', enhancedPrompt.length);
    
    // Try primary model first, with fallback to alternative models
    // Updated models for current HuggingFace API availability
    const models = [
      'microsoft/DialoGPT-medium', // Conversational AI model
      'google/flan-t5-small', // Small efficient model
      'gpt2', // Basic fallback that should always work
    ];
    
    let modelUsed = '';
    
    for (const model of models) {
      retries = 3;
      while (retries > 0) {
        console.log(`Trying model: ${model} (attempt ${4 - retries}/3)`);
        
        // First check if model is available
        const statusCheckResponse = await fetch(`https://api-inference.huggingface.co/status/${model}`, {
          headers: {
            Authorization: `Bearer ${hfApiKey}`,
          },
        });
        
        if (statusCheckResponse.ok) {
          const status = await statusCheckResponse.json();
          console.log(`Model ${model} status:`, status);
          
          // Wait if model is loading
          if (status.state === 'loading') {
            console.log(`Model ${model} is loading, waiting...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
        
        hfResponse = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            headers: {
              Authorization: `Bearer ${hfApiKey}`,
              'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(requestBody),
        });
        
        if (hfResponse.ok) {
          modelUsed = model;
          break;
        }
        
        // Check if it's a rate limit error or model loading
        if (hfResponse.status === 503 || hfResponse.status === 429) {
          console.log(`Rate limited or model loading, retrying... (${retries - 1} retries left)`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          retries--;
        } else {
          console.log(`Model ${model} failed with status ${hfResponse.status}, trying next model...`);
          break; // Other errors, try next model
        }
      }
      
      if (hfResponse?.ok) {
        console.log(`Successfully used model: ${modelUsed}`);
        break; // Success with this model, exit model loop
      }
    }

    if (!hfResponse?.ok) {
      const errorBody = hfResponse ? await hfResponse.text() : 'No response';
      console.error('All HF models failed. Last error:', {
        status: hfResponse?.status,
        statusText: hfResponse?.statusText,
        body: errorBody
      });
      
      // Provide a helpful fallback response instead of throwing
      console.log('Using fallback response due to API failures');
      return new Response(JSON.stringify({ 
        answer: `I'm currently experiencing issues connecting to the AI service. However, I found ${documents.length} relevant document(s) for your question. The most relevant content includes:\n\n${documents[0]?.content?.substring(0, 500)}...\n\nPlease try again in a few moments, or review the uploaded documents directly.`,
        modelUsed: 'fallback',
        documentsFound: documents.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const hfResult = await hfResponse.json();
    console.log('HF API Response structure:', JSON.stringify(hfResult, null, 2));

    // Check for error in response
    if (hfResult.error) {
      console.error('API returned error in response:', hfResult.error);
      throw new Error(`HuggingFace API Error: ${hfResult.error}`);
    }

    // Extract the answer from the model's response
    let answer;
    if (Array.isArray(hfResult) && hfResult.length > 0) {
      // The API returns an array of objects with generated_text property
      if (hfResult[0].generated_text !== undefined) {
        // The API might return the full text including the prompt
        answer = hfResult[0].generated_text;
        console.log('Extracted answer from generated_text');
        
        // Try to extract just the answer part if it includes the prompt
        // Look for the part after "Please provide a clear and helpful answer based on the context and conversation history:"
        const promptMarker = "Please provide a clear and helpful answer based on the context and conversation history:";
        const markerIndex = answer.indexOf(promptMarker);
        if (markerIndex !== -1) {
          answer = answer.substring(markerIndex + promptMarker.length).trim();
          console.log('Extracted answer portion after prompt marker');
        }
        
        // If the answer is empty, use a fallback message
        if (!answer || answer.trim() === '') {
          answer = "I understand your question, but I need more context from the course materials to provide a helpful answer. Could you please be more specific?";
        }
      } else {
        console.error('Response array missing generated_text:', hfResult[0]);
        answer = "I couldn't generate a proper answer. The response format was unexpected.";
      }
    } else if (typeof hfResult === 'object' && hfResult.generated_text) {
      // Handle single object response (some models might return this)
      answer = hfResult.generated_text;
      console.log('Extracted answer from single object response');
    } else if (typeof hfResult === 'string') {
      // Handle string response (unlikely but possible)
      answer = hfResult;
      console.log('Response was a direct string');
    } else {
      console.error('Unexpected response format:', typeof hfResult, hfResult);
      answer = "I couldn't generate a proper answer. Please try again.";
    }

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