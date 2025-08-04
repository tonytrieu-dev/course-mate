// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js'
import { extractText } from 'https://esm.sh/unpdf'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Security configuration
const SECURITY_CONFIG = {
  MAX_TEXT_LENGTH: 1000000, // 1MB of text content
  MAX_CHUNK_SIZE: 2000, // Increased for academic content
  MIN_CHUNK_SIZE: 50, // Minimum meaningful content
  SUSPICIOUS_PATTERNS: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
  ],
  ACADEMIC_INDICATORS: [
    /syllabus/gi,
    /course/gi,
    /assignment/gi,
    /semester/gi,
    /professor/gi,
    /due date/gi,
    /exam/gi,
    /quiz/gi,
  ]
}

// Security logging utility
function logSecurityEvent(level: 'info' | 'warn' | 'error', event: string, details: any) {
  console[level](`[SECURITY] ${event}:`, {
    timestamp: new Date().toISOString(),
    ...details
  });
}

// PDF content validation function
function validatePDFContent(content: string, fileName: string): { isValid: boolean; warnings: string[]; sanitizedContent: string } {
  const warnings: string[] = [];
  let sanitizedContent = content;
  
  logSecurityEvent('info', 'PDF content validation started', {
    fileName,
    contentLength: content.length
  });

  // Check content length
  if (content.length > SECURITY_CONFIG.MAX_TEXT_LENGTH) {
    logSecurityEvent('warn', 'PDF content exceeds size limit', {
      fileName,
      contentLength: content.length,
      maxLength: SECURITY_CONFIG.MAX_TEXT_LENGTH
    });
    
    sanitizedContent = content.substring(0, SECURITY_CONFIG.MAX_TEXT_LENGTH);
    warnings.push('Content truncated due to size limit');
  }

  // Check for suspicious patterns
  let suspiciousPatternFound = false;
  for (const pattern of SECURITY_CONFIG.SUSPICIOUS_PATTERNS) {
    if (pattern.test(content)) {
      suspiciousPatternFound = true;
      logSecurityEvent('warn', 'Suspicious pattern detected in PDF content', {
        fileName,
        pattern: pattern.toString()
      });
      
      // Remove suspicious content
      sanitizedContent = sanitizedContent.replace(pattern, '[CONTENT_REMOVED]');
      warnings.push('Suspicious content was removed for security');
    }
  }

  // Check for academic content indicators
  const academicIndicators = SECURITY_CONFIG.ACADEMIC_INDICATORS.filter(pattern => 
    pattern.test(content)
  ).length;
  
  const isLikelyAcademic = academicIndicators >= 2;
  
  if (!isLikelyAcademic) {
    logSecurityEvent('warn', 'Content may not be academic material', {
      fileName,
      academicIndicators,
      contentSample: content.substring(0, 200)
    });
    warnings.push('Content does not appear to be academic material');
  }

  // Final validation
  const isValid = sanitizedContent.length >= SECURITY_CONFIG.MIN_CHUNK_SIZE && !suspiciousPatternFound;
  
  logSecurityEvent('info', 'PDF content validation completed', {
    fileName,
    isValid,
    warnings: warnings.length,
    isLikelyAcademic,
    finalContentLength: sanitizedContent.length
  });

  return {
    isValid,
    warnings,
    sanitizedContent
  };
}

// Determine bucket based on file type/path
function getBucketName(filePath: string): string {
  console.log('🔍 Bucket selection debug:', {
    filePath,
    containsSyllabi: filePath?.includes('/syllabi/'),
    containsSyllabus: filePath?.toLowerCase().includes('syllabus'),
  });
  
  // If the path contains 'syllabi' or looks like a syllabus, use secure bucket
  if (filePath.includes('/syllabi/') || filePath.toLowerCase().includes('syllabus')) {
    console.log('✅ Selected bucket: secure-syllabi');
    return 'secure-syllabi';
  }
  // Otherwise use regular bucket
  console.log('📁 Selected bucket: class-materials');
  return 'class-materials';
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

    // Determine appropriate bucket based on file path
    const bucketName = getBucketName(file.path);
    
    logSecurityEvent('info', 'File processing started', {
      fileId: file.id,
      fileName: file.name,
      filePath: file.path,
      bucketName,
      fileType: file.type
    });

    // Download file content from appropriate storage bucket
    const { data: blob, error: downloadError } = await supabaseAdmin.storage
      .from(bucketName)
      .download(file.path);
    if (downloadError) throw downloadError;
    if (!blob) {
      throw new Error('File not found in storage.');
    }

    let content = '';
    const fileType = blob.type;

    if (fileType === 'application/pdf') {
      const fileBuffer = await blob.arrayBuffer();
      const { text } = await extractText(new Uint8Array(fileBuffer), { mergePages: true });
      
      // SECURITY: Validate and sanitize PDF content
      const validation = validatePDFContent(text, file.name);
      
      if (!validation.isValid) {
        logSecurityEvent('error', 'PDF content validation failed', {
          fileName: file.name,
          fileId: file.id,
          warnings: validation.warnings
        });
        
        return new Response(JSON.stringify({
          error: 'PDF content validation failed',
          warnings: validation.warnings
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Use sanitized content
      content = validation.sanitizedContent;
      
      // Debug: Log content extraction status
      console.log('PDF content extraction status:', {
        fileName: file.name,
        originalTextLength: text?.length || 0,
        sanitizedContentLength: validation.sanitizedContent?.length || 0,
        contentAssigned: !!content,
        contentType: typeof content,
        contentPreview: content ? content.substring(0, 100) + '...' : 'NO CONTENT'
      });
      
      // Log warnings if any
      if (validation.warnings.length > 0) {
        logSecurityEvent('warn', 'PDF content validation warnings', {
          fileName: file.name,
          fileId: file.id,
          warnings: validation.warnings
        });
      }
      
    } else if (fileType.startsWith('text/')) {
      const rawContent = await blob.text();
      
      // SECURITY: Apply same validation to text files
      const validation = validatePDFContent(rawContent, file.name);
      
      if (!validation.isValid) {
        logSecurityEvent('error', 'Text content validation failed', {
          fileName: file.name,
          fileId: file.id,
          warnings: validation.warnings
        });
        
        return new Response(JSON.stringify({
          error: 'Text content validation failed',
          warnings: validation.warnings
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      content = validation.sanitizedContent;
      
    } else {
      logSecurityEvent('info', 'Unsupported file type skipped', {
        fileName: file.name,
        fileType,
        fileId: file.id
      });
      
      console.log(`Skipping embedding for unsupported file type: ${fileType}`);
      return new Response('OK - unsupported file type', { headers: corsHeaders });
    }
    
    // Chunk the content into smaller pieces using security configuration
    const chunkSize = SECURITY_CONFIG.MAX_CHUNK_SIZE;
    const overlapSize = Math.floor(chunkSize * 0.1); // 10% overlap
    const chunks: string[] = [];
    
    for (let i = 0; i < content.length; i += chunkSize - overlapSize) {
      const chunk = content.slice(i, i + chunkSize);
      
      // Only include chunks that meet minimum size requirement
      if (chunk.trim().length >= SECURITY_CONFIG.MIN_CHUNK_SIZE) {
        chunks.push(chunk.trim());
      }
    }
    
    logSecurityEvent('info', 'Content chunking completed', {
      fileName: file.name,
      fileId: file.id,
      totalChunks: chunks.length,
      contentLength: content.length,
      chunkSize,
      overlapSize
    });
    
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

      const embedding: number[] = await response.json();
      console.log(`Generated embedding for chunk ${i + 1}, dimension: ${embedding?.length || 0}`);
      
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
        embedding_dimension: embedding?.length || 0
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

    logSecurityEvent('info', 'File processing completed successfully', {
      fileName: file.name,
      fileId: file.id,
      totalChunks: chunks.length,
      bucketName,
      processingTimeMs: Date.now() - (req.headers.get('x-request-start') ? parseInt(req.headers.get('x-request-start')!) : Date.now())
    });
    
    console.log('Successfully processed all chunks for file:', file.name);
    
    // Debug: Log content status before return
    console.log('Content status before return:', {
      fileName: file.name,
      contentExists: !!content,
      contentType: typeof content,
      contentLength: content?.length || 0,
      contentPreview: content ? content.substring(0, 100) + '...' : 'NO CONTENT',
      chunksLength: chunks.length
    });
    
    // Store extracted text in a temporary extraction record for retrieval
    let extractedTextId = null;
    if (content && content.length > 0) {
      try {
        const { data: extractionRecord, error: insertError } = await supabaseAdmin
          .from('document_extractions')
          .insert({
            file_id: file.id,
            extracted_text: content,
            extraction_date: new Date().toISOString(),
            content_length: content.length
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Failed to store extracted text:', insertError);
          // Continue without storing - will include text in response as fallback
        } else {
          extractedTextId = extractionRecord.id;
          console.log('Stored extracted text with ID:', extractedTextId);
        }
      } catch (storageError) {
        console.error('Error storing extracted text:', storageError);
        // Continue without storing - will include text in response as fallback
      }
    }

    // Create response - include extractedText directly if storage failed, otherwise reference
    const response = {
      success: true, 
      message: `Successfully embedded ${chunks.length} chunks for ${file.name}`,
      securityStatus: 'validated',
      extractedText: extractedTextId ? null : content, // Include text only if storage failed
      extractedTextId: extractedTextId, // Reference to stored text
      contentLength: content.length,
      chunksProcessed: chunks.length
    };
    
    // Debug: Log response before sending
    console.log('Response object before JSON.stringify:', {
      fileName: file.name,
      responseKeys: Object.keys(response),
      hasExtractedText: 'extractedText' in response,
      extractedTextValue: response.extractedText ? 'INCLUDED_DIRECTLY' : 'STORED_SEPARATELY',
      extractedTextId: extractedTextId,
      extractedTextType: typeof response.extractedText,
      extractedTextLength: response.extractedText?.length || 0,
      usingStoredReference: !!extractedTextId
    });
    
    return new Response(JSON.stringify(response), { 
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