import { createClient } from 'https://esm.sh/@supabase/supabase-js'

// Type definitions
interface Document {
  content: string;
  // Add other document properties as needed
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

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
    const { query, classId, conversationHistory } = body;
    console.log('Parsed parameters:', { query, classId, historyLength: conversationHistory?.length || 0 });
    
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

    console.log(`Found ${documents?.length || 0} matching documents for classId:`, classId);
    const contextText = documents && documents.length > 0 
      ? documents.map((doc: Document) => doc.content).join("\n\n---\n\n")
      : '';

    // Build conversation context for better follow-up handling
    const conversationContext = conversationHistory && conversationHistory.length > 0
      ? conversationHistory.map((msg: ConversationMessage) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')
      : '';

    // Enhanced question type classification
    const isFollowUpQuestion = (query: string, hasConversationHistory: boolean): boolean => {
      if (!hasConversationHistory) return false;
      
      const normalizedQuery = query.trim().toLowerCase();
      
      // Explicit follow-up patterns
      const followUpPatterns = [
        /^(are you sure|really|what do you mean|can you explain|explain more|tell me more|how so|why|elaborate)/i,
        /^(what about|what if|but what|and what|or what)/i,
        /^(that doesn't|that seems|i don't understand|unclear|confusing)/i,
        /^(can you clarify|clarify|rephrase|simplify)/i,
        /^(expand on|go deeper|more details|more info)/i,
        /^(yes but|no but|however|although|still)/i,
        /^(correct|right|wrong|true|false)\?*$/i,
        /^(ok|okay|i see|got it|thanks|thank you)[\.\?\!]*$/i
      ];
      
      // Pronouns and references often indicate follow-ups
      const pronounPatterns = [
        /\b(this|that|it|they|them|these|those)\b/i,
        /\b(your answer|your response|what you said|you mentioned)\b/i
      ];
      
      // Short questions or statements with conversation history are likely follow-ups
      if (normalizedQuery.length < 20 && hasConversationHistory) {
        return true;
      }
      
      // Check for question words that might be follow-ups
      const questionWords = ['how', 'why', 'what', 'when', 'where', 'which', 'who'];
      const startsWithQuestionWord = questionWords.some(word => normalizedQuery.startsWith(word));
      
      return followUpPatterns.some(pattern => pattern.test(query.trim())) ||
             (startsWithQuestionWord && pronounPatterns.some(pattern => pattern.test(query))) ||
             (normalizedQuery.length < 15 && normalizedQuery.includes('?'));
    };

    // Calculate document relevance confidence
    const hasRelevantDocuments = documents && documents.length > 0;
    const hasConversation = conversationHistory && conversationHistory.length > 0;
    const isFollowUp = isFollowUpQuestion(query, hasConversation);
    
    console.log('Question analysis:', { 
      query: query.substring(0, 50) + (query.length > 50 ? '...' : ''),
      isFollowUp, 
      hasRelevantDocuments, 
      hasConversation,
      documentsCount: documents?.length || 0,
      conversationLength: conversationHistory?.length || 0
    });

    // If no documents AND no conversation history, return the "no documents" message
    if (!hasRelevantDocuments && !hasConversation) {
      console.log('No matching documents and no conversation history for classId:', classId);
      return new Response(JSON.stringify({ 
        answer: "I don't have any documents to reference for this class yet. Please upload some course materials first."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SECTION 3: GENERATE A RESPONSE WITH GOOGLE GEMINI
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      throw new Error('GOOGLE_API_KEY is not set in environment variables.');
    }

    // Dynamic prompt construction based on question type and available context
    const buildPrompt = (query: string, contextText: string, conversationContext: string, isFollowUp: boolean, hasRelevantDocuments: boolean): string => {
      if (isFollowUp && hasConversation) {
        // For follow-up questions, prioritize conversation context
        return `You are an intelligent academic assistant helping a student. The student is asking a follow-up question to continue our conversation.

Previous conversation:
${conversationContext}

${hasRelevantDocuments ? `Additional course material context (use if relevant):\n---\n${contextText}\n---\n\n` : ''}Current follow-up question: ${query}

Please respond to the student's follow-up question by:
1. Referencing our previous conversation 
2. Providing clarification, elaboration, or addressing their concerns
3. Being conversational and helpful
4. Using course materials only if they add value to your response

Answer:`;
      } else if (hasRelevantDocuments) {
        // For new questions with relevant documents
        return `You are an intelligent academic assistant. Answer the student's question using the provided course materials.

${conversationContext ? `Previous conversation for context:\n${conversationContext}\n\n` : ''}Course materials:
---
${contextText}
---

Current question: ${query}

Please provide a helpful answer based on the course materials. If the materials don't contain the specific information needed, let the student know what you found and suggest they might need additional resources.

Answer:`;
      } else {
        // For questions without relevant documents but with conversation history
        return `You are an intelligent academic assistant. The student is asking a question, but I don't have specific course materials that directly address this topic.

${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ''}Current question: ${query}

Please provide a helpful response by:
1. Using any relevant information from our conversation history
2. Providing general academic guidance if appropriate
3. Suggesting the student upload relevant course materials if this is a course-specific question
4. Being honest about the limitations while still being helpful

Answer:`;
      }
    };

    const prompt = buildPrompt(query, contextText, conversationContext, isFollowUp, hasRelevantDocuments);

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
            maxOutputTokens: 400,
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