// @ts-nocheck
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

// Development-friendly CORS headers (will be secured in production)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight for development
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

    // DEBUG: Log if we're looking for the right class ID
    if (query.toLowerCase().includes('livelabs') || query.toLowerCase().includes('livelab')) {
      console.log('LIVELAB QUERY DEBUG:', {
        searchingForClassIds: targetClassIds,
        expectedClassId: 'class1752473032042',
        isMatchingExpected: targetClassIds.includes('class1752473032042'),
        queryContains: {
          livelab: query.toLowerCase().includes('livelab'),
          grade: query.toLowerCase().includes('grade'),
          percentage: query.toLowerCase().includes('percentage')
        }
      });
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user context early for document filtering
    const authHeader = req.headers.get('Authorization');
    let user = null;
    if (authHeader) {
      try {
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(
          authHeader.replace('Bearer ', '')
        );
        if (!authError && authUser) {
          user = authUser;
        }
      } catch (error) {
        console.log('Auth error:', error);
      }
    }

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

    // SECTION 2A: TASK DATA RETRIEVAL - Check if query is task-related
    const isTaskQuery = (query: string): boolean => {
      const taskKeywords = [
        'due', 'deadline', 'assignment', 'homework', 'task', 'project',
        'upcoming', 'overdue', 'tomorrow', 'today', 'week', 'month',
        'schedule', 'calendar', 'what\'s', 'show me', 'list'
      ];
      const normalizedQuery = query.toLowerCase();
      return taskKeywords.some(keyword => normalizedQuery.includes(keyword));
    };

    const getDateRange = (query: string): { start?: Date, end?: Date } | null => {
      const normalizedQuery = query.toLowerCase();
      const now = new Date();
      
      if (normalizedQuery.includes('next week')) {
        const startOfNextWeek = new Date(now);
        const daysUntilNextMonday = (8 - now.getDay()) % 7 || 7;
        startOfNextWeek.setDate(now.getDate() + daysUntilNextMonday);
        startOfNextWeek.setHours(0, 0, 0, 0);
        
        const endOfNextWeek = new Date(startOfNextWeek);
        endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
        endOfNextWeek.setHours(23, 59, 59, 999);
        
        return { start: startOfNextWeek, end: endOfNextWeek };
      } else if (normalizedQuery.includes('this week')) {
        const startOfWeek = new Date(now);
        const daysFromMonday = (now.getDay() + 6) % 7;
        startOfWeek.setDate(now.getDate() - daysFromMonday);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        return { start: startOfWeek, end: endOfWeek };
      } else if (normalizedQuery.includes('tomorrow')) {
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);
        
        return { start: tomorrow, end: endOfTomorrow };
      } else if (normalizedQuery.includes('today')) {
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);
        
        return { start: startOfToday, end: endOfToday };
      } else if (normalizedQuery.includes('overdue')) {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        yesterday.setHours(23, 59, 59, 999);
        
        return { end: yesterday };
      }
      
      return null;
    };

    // Get tasks if this is a task-related query
    let taskData = '';
    const needsTaskData = isTaskQuery(query);
    
    if (needsTaskData) {
      console.log('Task query detected, fetching user tasks...');
      
      try {
        if (!user) {
          console.log('No authenticated user for task query');
          taskData = '\n\nPlease log in to view your tasks.\n';
        } else {
          const dateRange = getDateRange(query);
          let taskQuery = supabaseAdmin
            .from('tasks')
            .select('id, title, "dueDate", "dueTime", date, class, type, completed, priority, created_at')
            .eq('user_id', user.id);

          // Filter by class if specific classes were mentioned
          if (targetClassIds.length > 0) {
            // Get class names from class IDs for filtering
            const { data: classData } = await supabaseAdmin
              .from('classes')
              .select('id, name')
              .in('id', targetClassIds);
            
            if (classData && classData.length > 0) {
              const classNames = classData.map(c => c.name);
              taskQuery = taskQuery.in('class', classNames);
              console.log('Filtering tasks by classes:', classNames);
            }
          }

          // Apply date filtering if we detected a time range
          if (dateRange) {
            if (dateRange.start && dateRange.end) {
              // Range filtering (this week, next week, etc.)
              const startDateStr = dateRange.start.toISOString().split('T')[0];
              const endDateStr = dateRange.end.toISOString().split('T')[0];
              taskQuery = taskQuery.or(`date.gte.${dateRange.start.toISOString()},date.lte.${dateRange.end.toISOString()},dueDate.gte.${startDateStr},dueDate.lte.${endDateStr}`);
            } else if (dateRange.end) {
              // Before date (overdue)
              const endDateStr = dateRange.end.toISOString().split('T')[0];
              taskQuery = taskQuery.or(`date.lt.${dateRange.end.toISOString()},dueDate.lt.${endDateStr}`);
            }
          }

          taskQuery = taskQuery
            .order('date', { ascending: true, nullsFirst: false })
            .order('"dueDate"', { ascending: true, nullsFirst: false });

          const { data: tasks, error: tasksError } = await taskQuery.limit(20);

          if (tasksError) {
            console.error('Error fetching tasks:', tasksError);
            taskData = '\n\nError retrieving tasks.\n';
          } else if (tasks && tasks.length > 0) {
            console.log(`Found ${tasks.length} tasks for query`);
            
            // Format tasks for AI response
            const formattedTasks = tasks.map(task => {
              const dueInfo = task.dueDate ? 
                `Due: ${task.dueDate}${task.dueTime ? ` at ${task.dueTime}` : ''}` :
                task.date ? `Date: ${new Date(task.date).toLocaleDateString()}` : 'No due date';
              
              const status = task.completed ? '✅ Completed' : '⏳ Pending';
              const priority = task.priority ? ` [${task.priority.toUpperCase()}]` : '';
              
              return `• ${task.title}${priority}
Class: ${task.class || 'No class'}
Type: ${task.type || 'Task'}
${dueInfo}
Status: ${status}`;
            }).join('\n\n');
            
            taskData = `\n\nStudent's Tasks:\n---\n${formattedTasks}\n---\n`;
          } else {
            console.log('No tasks found matching the query criteria');
            taskData = '\n\nNo tasks found matching your criteria.\n';
          }
        }
      } catch (taskError) {
        console.error('Error in task data retrieval:', taskError);
        taskData = '\n\nUnable to retrieve task information at this time.\n';
      }
    }

    // SECTION 2B: MATCH DOCUMENTS (Supabase) - Multi-class support
    let allDocuments: Document[] = [];
    let contextText = '';
    let contextSummary = '';
    
    console.log('Starting document search section');
    
    try {
      if (targetClassIds.length === 0) {
        console.log('No class IDs provided');
      } else if (targetClassIds.length === 1) {
      // Single class - use original logic
      console.log('Calling match_documents with params:', {
        class_id_filter: targetClassIds[0],
        match_count: 5,
        match_threshold: 0.3,
        query_embedding: queryEmbedding ? 'present' : 'missing'
      });
      
      let documents, rpcError;
      
      // Use 4-parameter signature (the one that exists in the database)
      const result = await supabaseAdmin.rpc('match_documents', {
        class_id_filter: targetClassIds[0],
        match_count: 5,
        match_threshold: 0.3,
        query_embedding: queryEmbedding
      });
      documents = result.data;
      rpcError = result.error;

      if (rpcError) {
        console.error('Error from match_documents:', rpcError);
        throw new Error(`Failed to find matching documents: ${rpcError.message}`);
      }

      allDocuments = documents || [];
      contextText = documents && documents.length > 0 
        ? documents.map((doc: Document) => doc.content).join("\n\n---\n\n")
        : '';
      
      console.log(`Found ${documents?.length || 0} matching documents for single class:`, targetClassIds[0]);
      if (documents && documents.length > 0) {
        console.log('Document content samples:');
        documents.forEach((doc: Document, index: number) => {
          console.log(`Document ${index + 1}: ${doc.content?.substring(0, 150)}...`);
        });
      }

      // If semantic search didn't find relevant documents, try text search as fallback
      if (!documents || documents.length === 0) {
        console.log('Semantic search found no documents, trying text search and keyword fallback...');
        
        // First try PostgreSQL full-text search
        const { data: textSearchDocs, error: textSearchError } = await supabaseAdmin
          .from('documents')
          .select('content')
          .eq('class_id', targetClassIds[0])
          .textSearch('content', query, { type: 'websearch' })
          .limit(5);
          
        if (!textSearchError && textSearchDocs && textSearchDocs.length > 0) {
          console.log(`Text search found ${textSearchDocs.length} documents`);
          allDocuments = textSearchDocs;
          contextText = textSearchDocs.map((doc: Document) => doc.content).join("\n\n---\n\n");
        } else {
          // Try keyword-based content search for specific terms
          console.log('Text search also failed, trying keyword-based content search...');
          
          // Extract keywords from query for better matching
          const keywords = ['LiveLab', 'grade', 'percentage', 'evaluation', 'criteria', 'points'];
          const queryKeywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
          const searchTerms = [...keywords, ...queryKeywords];
          
          // Search for documents containing any of these terms
          const { data: keywordDocs, error: keywordError } = await supabaseAdmin
            .from('documents')
            .select('content')
            .eq('class_id', targetClassIds[0])
            .limit(10);
            
          if (!keywordError && keywordDocs && keywordDocs.length > 0) {
            // Filter documents that contain relevant keywords
            const relevantDocs = keywordDocs.filter(doc => 
              searchTerms.some(term => 
                doc.content.toLowerCase().includes(term.toLowerCase())
              )
            );
            
            if (relevantDocs.length > 0) {
              console.log(`Keyword search found ${relevantDocs.length} relevant documents`);
              allDocuments = relevantDocs;
              contextText = relevantDocs.map((doc: Document) => doc.content).join("\n\n---\n\n");
            }
          }
        }
      }
    } else {
      // Multiple classes - fetch documents from each and combine intelligently
      const classDocuments: { [classId: string]: Document[] } = {};
      let totalDocuments = 0;
      
      for (const classId of targetClassIds) {
        let documents, rpcError;
        try {
          // Try 5-parameter signature first
          const result = await supabaseAdmin.rpc('match_documents', {
            class_id_filter: classId,
            match_count: 3,
            match_threshold: 0.3,
            query_embedding: queryEmbedding,
            user_id_filter: null
          });
          documents = result.data;
          rpcError = result.error;
        } catch (signatureError) {
          // Fallback to 4-parameter signature
          const result = await supabaseAdmin.rpc('match_documents', {
            class_id_filter: classId,
            match_count: 3,
            match_threshold: 0.3,
            query_embedding: queryEmbedding
          });
          documents = result.data;
          rpcError = result.error;
        }

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
    } catch (documentSearchError) {
      console.error('Document search error:', documentSearchError);
      // Continue execution with empty documents - don't fail the entire request
      allDocuments = [];
      contextText = '';
      contextSummary = '';
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
            let retryDocuments, retryError;
            try {
              // Try 5-parameter signature first
              const result = await supabaseAdmin.rpc('match_documents', {
                class_id_filter: targetClassIds[0],
                match_count: 5,
                match_threshold: 0.3,
                query_embedding: queryEmbedding,
                user_id_filter: null
              });
              retryDocuments = result.data;
              retryError = result.error;
            } catch (signatureError) {
              // Fallback to 4-parameter signature
              const result = await supabaseAdmin.rpc('match_documents', {
                class_id_filter: targetClassIds[0],
                match_count: 5,
                match_threshold: 0.3,
                query_embedding: queryEmbedding
              });
              retryDocuments = result.data;
              retryError = result.error;
            }

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
              let retryDocuments, retryError;
              try {
                // Try 5-parameter signature first
                const result = await supabaseAdmin.rpc('match_documents', {
                  class_id_filter: classId,
                  match_count: 3,
                  match_threshold: 0.3,
                  query_embedding: queryEmbedding,
                  user_id_filter: null
                });
                retryDocuments = result.data;
                retryError = result.error;
              } catch (signatureError) {
                // Fallback to 4-parameter signature
                const result = await supabaseAdmin.rpc('match_documents', {
                  class_id_filter: classId,
                  match_count: 3,
                  match_threshold: 0.3,
                  query_embedding: queryEmbedding
                });
                retryDocuments = result.data;
                retryError = result.error;
              }

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
        
        // If we still don't have documents after auto-embedding, check for scanned documents
        if (!hasRelevantDocuments) {
          // Check if any documents exist but contain scanned document indicators
          const { data: allEmbeddedDocs, error: allDocsError } = await supabaseAdmin
            .from('documents')
            .select('content')
            .in('class_id', targetClassIds)
            .limit(10);
          
          let hasHandwrittenDocuments = false;
          let handwrittenFileCount = 0;
          
          if (!allDocsError && allEmbeddedDocs && allEmbeddedDocs.length > 0) {
            const handwrittenIndicators = [
              'scanned/image-based PDF',
              'no extractable text',
              'enhanced text extraction attempted',
              'OCR processing attempted'
            ];
            
            const handwrittenDocs = allEmbeddedDocs.filter(doc => 
              handwrittenIndicators.some(indicator => 
                doc.content.toLowerCase().includes(indicator.toLowerCase())
              )
            );
            
            hasHandwrittenDocuments = handwrittenDocs.length > 0;
            handwrittenFileCount = handwrittenDocs.length;
          }
          
          let autoEmbedMessage;
          if (hasHandwrittenDocuments && successfulEmbeddings > 0) {
            // Detected handwritten documents - provide specific guidance
            const subjectHint = query.includes('EE') || query.includes('ee') ? 'electrical engineering' : 
                              query.includes('CS') || query.includes('cs') || query.includes('computer') ? 'computer science' :
                              query.includes('MATH') || query.includes('math') ? 'mathematics' :
                              query.includes('PHYS') || query.includes('physics') ? 'physics' :
                              query.includes('CHEM') || query.includes('chemistry') ? 'chemistry' :
                              'your subject area';
            
            autoEmbedMessage = `I found ${handwrittenFileCount} handwritten document(s) in your class materials. Since these contain handwritten content, I can't search their text directly. However, I can still help! 

Here's what I can do:
• Answer general questions about ${subjectHint} topics
• Explain concepts related to "${query}"
• Help you understand problems if you describe them to me
• Provide study guidance and explanations
• Clarify course concepts and terminology

Try asking: "Can you explain [specific concept]?" or describe what you're working on!`;
          } else if (successfulEmbeddings > 0) {
            // Regular case - processed files but no relevant content
            autoEmbedMessage = `I processed ${successfulEmbeddings} file(s) for your class(es), but couldn't find content relevant to your question. The files may not contain information about "${query}". Try asking about topics specifically covered in your uploaded materials.`;
          } else {
            // Processing failed
            autoEmbedMessage = `I found ${classFiles.length} uploaded file(s) for your class(es), but encountered issues processing them for search. Please try re-uploading your course materials or contact support if the problem persists.`;
          }
            
          console.log('Auto-embedding completed but no relevant documents found', {
            hasHandwrittenDocuments,
            handwrittenFileCount,
            successfulEmbeddings,
            totalFiles: classFiles.length
          });
          
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
      mentionContext: any,
      taskData: string
    ): string => {
      if (isFollowUp && hasConversation) {
        // For follow-up questions, prioritize conversation context
        return `You are an intelligent academic assistant helping a student. The student is asking a follow-up question to continue our conversation.

Previous conversation:
${conversationContext}

${hasRelevantDocuments ? `Additional course material context (use if relevant):\n---\n${contextText}\n---\n\n` : ''}${taskData ? `${taskData}\n` : ''}Current follow-up question: ${query}

Please respond to the student's follow-up question by:
1. Referencing our previous conversation 
2. Providing clarification, elaboration, or addressing their concerns
3. Being conversational and helpful
4. Using course materials and task information only if they add value to your response

Answer:`;
      } else if (hasRelevantDocuments) {
        // For new questions with relevant documents
        const contextHeader = mentionContext?.hasMentions && contextSummary 
          ? `Course materials from ${contextSummary}:`
          : 'Course materials:';
          
        const mentionNote = mentionContext?.hasMentions 
          ? `\n\nNote: The student used @mentions to specify ${mentionContext.mentionedClasses?.length === 1 ? 'a specific class' : 'specific classes'}: ${mentionContext.mentionedClasses?.map((c: any) => c.name).join(', ')}.`
          : '';
          
        return `You are an intelligent academic assistant. Answer the student's question using the provided course materials and task information.

${conversationContext ? `Previous conversation for context:\n${conversationContext}\n\n` : ''}${contextHeader}
---
${contextText}
---
${taskData ? `${taskData}\n` : ''}
Current question: ${query}${mentionNote}

Please provide a helpful answer based on the course materials and task information. ${mentionContext?.hasMentions ? 'Focus on the mentioned classes when relevant. ' : ''}If the materials don't contain the specific information needed, let the student know what you found and suggest they might need additional resources.

Answer:`;
      } else {
        // For questions without relevant documents but with conversation history or task data
        return `You are an intelligent academic assistant. ${taskData ? 'Here is the student\'s task information:' : 'The student is asking a question, but I don\'t have specific course materials that directly address this topic.'}

${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ''}${taskData ? `${taskData}\n` : ''}Current question: ${query}

Please provide a helpful response by:
1. Using any relevant information from our conversation history${taskData ? ' and task data' : ''}
2. Providing general academic guidance if appropriate
3. ${taskData ? 'Focusing on the student\'s actual tasks and deadlines when relevant' : 'Suggesting the student upload relevant course materials if this is a course-specific question'}
4. Being honest about the limitations while still being helpful

Answer:`;
      }
    };

    const prompt = buildPrompt(query, contextText, conversationContext, isFollowUp, hasRelevantDocuments, contextSummary, mentionContext, taskData);

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