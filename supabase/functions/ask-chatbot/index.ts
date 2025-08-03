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
    const { query, classId, classIds, conversationHistory, mentionContext } = body;
    
    // Support both single and multiple class IDs
    const targetClassIds = classIds && classIds.length > 0 ? classIds : (classId ? [classId] : []);
    
    console.log('Parsed parameters:', { 
      query, 
      classId, 
      classIds: targetClassIds, 
      historyLength: conversationHistory?.length || 0,
      hasMentions: mentionContext?.hasMentions || false,
      mentionedClasses: mentionContext?.mentionedClasses?.length || 0
    });
    
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

    // SECTION 2: MATCH DOCUMENTS (Supabase) - Multi-class support
    let allDocuments: Document[] = [];
    let contextText = '';
    let contextSummary = '';
    
    if (targetClassIds.length === 0) {
      console.log('No class IDs provided');
    } else if (targetClassIds.length === 1) {
      // Single class - use original logic
      const { data: documents, error: rpcError } = await supabaseAdmin.rpc('match_documents', {
        class_id_filter: targetClassIds[0],
        match_count: 5,
        match_threshold: 0.5,
        query_embedding: queryEmbedding,
      });

      if (rpcError) {
        console.error('Error from match_documents:', rpcError);
        throw new Error(`Failed to find matching documents: ${rpcError.message}`);
      }

      allDocuments = documents || [];
      contextText = documents && documents.length > 0 
        ? documents.map((doc: Document) => doc.content).join("\n\n---\n\n")
        : '';
      
      console.log(`Found ${documents?.length || 0} matching documents for single class:`, targetClassIds[0]);
    } else {
      // Multiple classes - fetch documents from each and combine intelligently
      const classDocuments: { [classId: string]: Document[] } = {};
      let totalDocuments = 0;
      
      for (const classId of targetClassIds) {
        const { data: documents, error: rpcError } = await supabaseAdmin.rpc('match_documents', {
          class_id_filter: classId,
          match_count: 3, // Fewer per class to avoid overwhelming context
          match_threshold: 0.5,
          query_embedding: queryEmbedding,
        });

        if (rpcError) {
          console.error(`Error from match_documents for class ${classId}:`, rpcError);
          continue;
        }

        if (documents && documents.length > 0) {
          classDocuments[classId] = documents;
          totalDocuments += documents.length;
        }
      }
      
      // Combine documents from all classes
      const contextParts: string[] = [];
      for (const [classId, documents] of Object.entries(classDocuments)) {
        if (documents.length > 0) {
          const classContext = documents.map((doc: Document) => doc.content).join("\n\n");
          contextParts.push(`Documents from class ${classId}:\n${classContext}`);
        }
      }
      
      contextText = contextParts.join("\n\n---\n\n");
      allDocuments = Object.values(classDocuments).flat();
      
      // Create context summary for multi-class queries
      const classNames = mentionContext?.mentionedClasses?.map((c: any) => c.name) || targetClassIds;
      contextSummary = `Searching across ${targetClassIds.length} classes: ${classNames.join(', ')}`;
      
      console.log(`Found ${totalDocuments} total documents from ${targetClassIds.length} classes:`, targetClassIds);
    }

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
    let hasRelevantDocuments = allDocuments && allDocuments.length > 0;
    const hasConversation = conversationHistory && conversationHistory.length > 0;
    const isFollowUp = isFollowUpQuestion(query, hasConversation);
    
    console.log('Question analysis:', { 
      query: query.substring(0, 50) + (query.length > 50 ? '...' : ''),
      isFollowUp, 
      hasRelevantDocuments, 
      hasConversation,
      documentsCount: allDocuments?.length || 0,
      conversationLength: conversationHistory?.length || 0,
      classCount: targetClassIds.length,
      hasMentions: mentionContext?.hasMentions || false
    });

    // AUTO-EMBEDDING: Check if files exist but embeddings are missing
    if (!hasRelevantDocuments && !hasConversation && targetClassIds.length > 0) {
      console.log('No documents found, checking for files without embeddings...');
      
      // Check if any uploaded files exist for these classes
      const { data: classFiles, error: filesError } = await supabaseAdmin
        .from('class_files')
        .select('id, name, path, class_id, type')
        .in('class_id', targetClassIds)
        .order('created_at', { ascending: false });
      
      if (filesError) {
        console.error('Error checking class_files:', filesError);
      } else if (classFiles && classFiles.length > 0) {
        console.log(`Found ${classFiles.length} uploaded files without embeddings. Auto-triggering embedding process...`);
        
        // Auto-trigger embedding for all files
        const embeddingPromises = classFiles.map(async (file) => {
          try {
            console.log(`Auto-embedding file: ${file.name} (ID: ${file.id})`);
            
            const embeddingResponse = await fetch(`${supabaseUrl}/functions/v1/embed-file`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ record: file }),
            });
            
            if (!embeddingResponse.ok) {
              const errorText = await embeddingResponse.text();
              console.error(`Failed to embed file ${file.name}:`, errorText);
              return { success: false, file: file.name, error: errorText };
            }
            
            const result = await embeddingResponse.json();
            console.log(`Successfully auto-embedded: ${file.name}`);
            return { success: true, file: file.name, result };
          } catch (error) {
            console.error(`Error auto-embedding file ${file.name}:`, error);
            return { success: false, file: file.name, error: error.message };
          }
        });
        
        // Wait for all embeddings to complete
        const embeddingResults = await Promise.allSettled(embeddingPromises);
        const successfulEmbeddings = embeddingResults.filter(result => 
          result.status === 'fulfilled' && result.value.success
        ).length;
        
        console.log(`Auto-embedding completed: ${successfulEmbeddings}/${classFiles.length} files successfully embedded`);
        
        // If at least one file was successfully embedded, retry the document search
        if (successfulEmbeddings > 0) {
          console.log('Retrying document search after auto-embedding...');
          
          // Re-run the document search for all target classes
          if (targetClassIds.length === 1) {
            // Single class retry
            const { data: retryDocuments, error: retryError } = await supabaseAdmin.rpc('match_documents', {
              class_id_filter: targetClassIds[0],
              match_count: 5,
              match_threshold: 0.5,
              query_embedding: queryEmbedding,
            });

            if (!retryError && retryDocuments && retryDocuments.length > 0) {
              allDocuments = retryDocuments;
              contextText = retryDocuments.map((doc: Document) => doc.content).join("\n\n---\n\n");
              console.log(`Retry successful: Found ${retryDocuments.length} documents after auto-embedding`);
            }
          } else {
            // Multiple classes retry
            const retryClassDocuments: { [classId: string]: Document[] } = {};
            let retryTotalDocuments = 0;
            
            for (const classId of targetClassIds) {
              const { data: retryDocuments, error: retryError } = await supabaseAdmin.rpc('match_documents', {
                class_id_filter: classId,
                match_count: 3,
                match_threshold: 0.5,
                query_embedding: queryEmbedding,
              });

              if (!retryError && retryDocuments && retryDocuments.length > 0) {
                retryClassDocuments[classId] = retryDocuments;
                retryTotalDocuments += retryDocuments.length;
              }
            }
            
            if (retryTotalDocuments > 0) {
              const retryContextParts: string[] = [];
              for (const [classId, documents] of Object.entries(retryClassDocuments)) {
                if (documents.length > 0) {
                  const classContext = documents.map((doc: Document) => doc.content).join("\n\n");
                  retryContextParts.push(`Documents from class ${classId}:\n${classContext}`);
                }
              }
              
              contextText = retryContextParts.join("\n\n---\n\n");
              allDocuments = Object.values(retryClassDocuments).flat();
              console.log(`Retry successful: Found ${retryTotalDocuments} documents from ${targetClassIds.length} classes after auto-embedding`);
            }
          }
          
          // Update relevant documents status for continuation of the flow
          hasRelevantDocuments = allDocuments && allDocuments.length > 0;
        }
        
        // If we still don't have documents after auto-embedding, inform the user
        if (!hasRelevantDocuments) {
          const autoEmbedMessage = successfulEmbeddings > 0
            ? `I processed ${successfulEmbeddings} file(s) for your class(es), but couldn't find content relevant to your question. The files may not contain information about "${query}". Try asking about topics specifically covered in your uploaded materials.`
            : `I found ${classFiles.length} uploaded file(s) for your class(es), but encountered issues processing them for search. Please try re-uploading your course materials or contact support if the problem persists.`;
            
          console.log('Auto-embedding completed but no relevant documents found');
          return new Response(JSON.stringify({ 
            answer: autoEmbedMessage
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        // No files exist - original "no documents" flow
        const noDocsMessage = targetClassIds.length > 1 
          ? `I don't have any documents to reference for the classes you mentioned (${contextSummary}). Please upload course materials for these classes first.`
          : targetClassIds.length === 1
          ? "I don't have any documents to reference for this class yet. Please upload some course materials first."
          : "Please select a class or use @ClassName to specify which class to ask about.";
          
        console.log('No matching documents, no conversation history, and no uploaded files for classes:', targetClassIds);
        return new Response(JSON.stringify({ 
          answer: noDocsMessage
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // SECTION 3: GENERATE A RESPONSE WITH GOOGLE GEMINI
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      throw new Error('GOOGLE_API_KEY is not set in environment variables.');
    }

    // Dynamic prompt construction based on question type and available context
    const buildPrompt = (
      query: string, 
      contextText: string, 
      conversationContext: string, 
      isFollowUp: boolean, 
      hasRelevantDocuments: boolean,
      contextSummary: string,
      mentionContext: any
    ): string => {
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
        const contextHeader = mentionContext?.hasMentions && contextSummary 
          ? `Course materials from ${contextSummary}:`
          : 'Course materials:';
          
        const mentionNote = mentionContext?.hasMentions 
          ? `\n\nNote: The student used @mentions to specify ${mentionContext.mentionedClasses?.length === 1 ? 'a specific class' : 'specific classes'}: ${mentionContext.mentionedClasses?.map((c: any) => c.name).join(', ')}.`
          : '';
          
        return `You are an intelligent academic assistant. Answer the student's question using the provided course materials.

${conversationContext ? `Previous conversation for context:\n${conversationContext}\n\n` : ''}${contextHeader}
---
${contextText}
---

Current question: ${query}${mentionNote}

Please provide a helpful answer based on the course materials. ${mentionContext?.hasMentions ? 'Focus on the mentioned classes when relevant. ' : ''}If the materials don't contain the specific information needed, let the student know what you found and suggest they might need additional resources.

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

    const prompt = buildPrompt(query, contextText, conversationContext, isFollowUp, hasRelevantDocuments, contextSummary, mentionContext);

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