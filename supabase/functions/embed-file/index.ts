// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js'
import { extractText } from 'https://esm.sh/unpdf'
import { getDocument } from 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.mjs'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Security configuration
const SECURITY_CONFIG = {
  MAX_TEXT_LENGTH: 1000000, // 1MB of text content
  MAX_CHUNK_SIZE: 2000, // Increased for academic content
  MIN_CHUNK_SIZE: 10, // Minimum meaningful content (reduced for edge cases)
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
  
  const isLikelyAcademic = academicIndicators >= 1 || fileName.toLowerCase().includes('hw') || fileName.toLowerCase().includes('homework') || fileName.toLowerCase().includes('assignment');
  
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

// Enhanced PDF text extraction using pdfjs-dist
async function performEnhancedTextExtraction(pdfBuffer: ArrayBuffer, fileName: string): Promise<string> {
  try {
    logSecurityEvent('info', 'Starting enhanced PDF text extraction', {
      fileName,
      bufferSize: pdfBuffer.byteLength
    });

    const uint8Array = new Uint8Array(pdfBuffer);
    
    try {
      // Load PDF document using pdfjs-dist
      const pdfDoc = await getDocument({ data: uint8Array }).promise;
      const numPages = pdfDoc.numPages;
      
      console.log(`PDF loaded successfully: ${numPages} pages, extracting text content...`);
      
      // Check PDF metadata for insights
      const metadata = await pdfDoc.getMetadata();
      console.log('PDF metadata:', {
        producer: metadata.info?.Producer || 'unknown',
        creator: metadata.info?.Creator || 'unknown',
        title: metadata.info?.Title || 'unknown',
        hasMetadata: !!metadata.info
      });
      
      let extractedText = '';
      let totalTextItems = 0;
      
      // Process each page for text content
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        console.log(`Processing page ${pageNum}/${numPages}...`);
        
        try {
          const page = await pdfDoc.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Extract text items and preserve some spatial structure
          const pageText = textContent.items
            .map((item: any) => {
              if (item.str && item.str.trim()) {
                return item.str;
              }
              return '';
            })
            .filter(text => text.length > 0)
            .join(' ');
          
          totalTextItems += textContent.items?.length || 0;
          
          console.log(`Page ${pageNum} extraction details:`, {
            textItemsFound: textContent.items?.length || 0,
            pageTextLength: pageText?.length || 0,
            pageTextSample: pageText ? pageText.substring(0, 100) + '...' : 'NO TEXT',
            hasValidContent: pageText && pageText.trim().length > 0,
            firstFewTextItems: textContent.items?.slice(0, 3).map((item: any) => item.str) || []
          });
          
          if (pageText && pageText.trim().length > 0) {
            extractedText += `\n--- Page ${pageNum} ---\n${pageText.trim()}\n`;
          }
        } catch (pageError) {
          console.warn(`Could not extract text from page ${pageNum}:`, pageError.message);
          continue; // Skip this page and continue with others
        }
      }
      
      console.log('Enhanced extraction final results:', {
        fileName,
        pagesProcessed: numPages,
        totalTextItems: totalTextItems,
        totalExtractedLength: extractedText.length,
        extractedTextSample: extractedText ? extractedText.substring(0, 200) + '...' : 'NO CONTENT',
        willReturnContent: extractedText.trim().length > 0,
        likelyScannedDocument: totalTextItems === 0 || extractedText.length < 10
      });

      logSecurityEvent('info', 'Enhanced PDF text extraction completed', {
        fileName,
        extractedLength: extractedText.length,
        pagesProcessed: numPages,
        extractionMethod: 'pdfjs-text-content'
      });

      return extractedText.trim();
      
    } catch (pdfError) {
      console.error('Enhanced PDF text extraction failed:', pdfError);
      logSecurityEvent('warn', 'Enhanced PDF text extraction failed', {
        fileName,
        error: pdfError.message
      });
      return ''; // Return empty string on failure
    }
  } catch (error) {
    logSecurityEvent('warn', 'Enhanced text extraction failed', {
      fileName,
      error: error.message
    });
    
    console.warn(`Enhanced text extraction failed for ${fileName}:`, error.message);
    return ''; // Return empty string on failure
  }
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
      
      // Enhanced PDF extraction debugging
      console.log('PDF extraction details:', {
        fileName: file.name,
        fileSize: fileBuffer.byteLength,
        extractedTextLength: text?.length || 0,
        extractedTextSample: text ? text.substring(0, 200) + '...' : 'NO TEXT EXTRACTED',
        extractedTextType: typeof text,
        needsAlternativeExtraction: !text || text.length < 5
      });
      
      // If extraction failed, try enhanced PDF text extraction
      let processableText = text || '';
      if (!processableText || processableText.length < 5) {
        console.warn('Initial PDF text extraction failed, attempting enhanced extraction...');
        
        try {
          const enhancedText = await performEnhancedTextExtraction(fileBuffer, file.name);
          
          if (enhancedText && enhancedText.length > 10) {
            processableText = enhancedText;
            console.log(`✅ ENHANCED EXTRACTION SUCCESS: Extracted ${enhancedText.length} characters from PDF`);
            
            logSecurityEvent('info', 'Enhanced extraction successful', {
              fileName: file.name,
              fileId: file.id,
              originalTextLength: text?.length || 0,
              enhancedTextLength: enhancedText.length,
              extractionMethod: 'pdfjs-enhanced'
            });
          } else {
            console.warn('Enhanced extraction returned insufficient content, using fallback');
            processableText = `PDF document: ${file.name}. This appears to be a scanned/image-based PDF with no extractable text. Document uploaded successfully for manual reference. You can still ask questions about this homework assignment.`;
          }
        } catch (enhancedError) {
          console.error('Enhanced extraction failed:', enhancedError);
          processableText = `PDF document: ${file.name}. Text and enhanced extraction failed but file has been uploaded successfully.`;
          
          logSecurityEvent('error', 'Enhanced extraction failed completely', {
            fileName: file.name,
            fileId: file.id,
            error: enhancedError.message
          });
        }
      }
      
      // SECURITY: Validate and sanitize PDF content
      const validation = validatePDFContent(processableText, file.name);
      
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
    
    // DUPLICATE PREVENTION: Check for existing embeddings for this file
    // Look for documents with the same class_id and base file name
    const baseFileName = file.name; // Base file name without chunk suffix
    let duplicatesRemoved = 0;
    
    console.log('Checking for existing embeddings:', {
      class_id: file.class_id,
      baseFileName: baseFileName
    });
    
    const { data: existingDocs, error: checkError } = await supabaseAdmin
      .from('documents')
      .select('id, file_name')
      .eq('class_id', file.class_id)
      .like('file_name', `${baseFileName}%`); // Match base filename with any chunk suffix
    
    if (checkError) {
      console.error('Error checking for existing documents:', checkError);
      // Continue anyway - don't block on this check
    } else if (existingDocs && existingDocs.length > 0) {
      console.log(`Found ${existingDocs.length} existing embedding chunks for file: ${baseFileName}`);
      console.log('Existing chunks:', existingDocs.map(doc => doc.file_name));
      
      // Delete existing embeddings to prevent duplicates
      const { error: deleteError } = await supabaseAdmin
        .from('documents')
        .delete()
        .eq('class_id', file.class_id)
        .like('file_name', `${baseFileName}%`);
      
      if (deleteError) {
        console.error('Error deleting existing embeddings:', deleteError);
        logSecurityEvent('error', 'Failed to delete existing embeddings', {
          fileName: file.name,
          fileId: file.id,
          class_id: file.class_id,
          error: deleteError.message
        });
        
        return new Response(JSON.stringify({
          error: 'Failed to clean up existing embeddings',
          details: deleteError.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      duplicatesRemoved = existingDocs.length;
      console.log(`Successfully deleted ${duplicatesRemoved} existing embedding chunks`);
      logSecurityEvent('info', 'Cleaned up duplicate embeddings', {
        fileName: file.name,
        fileId: file.id,
        class_id: file.class_id,
        deletedChunks: duplicatesRemoved
      });
    } else {
      console.log('No existing embeddings found - proceeding with fresh embedding');
    }
    
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
      duplicatesRemoved: duplicatesRemoved,
      bucketName,
      processingTimeMs: Date.now() - (req.headers.get('x-request-start') ? parseInt(req.headers.get('x-request-start')!) : Date.now())
    });
    
    console.log(`Successfully processed all chunks for file: ${file.name}${duplicatesRemoved > 0 ? ` (removed ${duplicatesRemoved} duplicate chunks first)` : ''}`);
    
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
      message: `Successfully embedded ${chunks.length} chunks for ${file.name}${duplicatesRemoved > 0 ? ` (replaced ${duplicatesRemoved} existing chunks)` : ''}`,
      securityStatus: 'validated',
      extractedText: extractedTextId ? null : content, // Include text only if storage failed
      extractedTextId: extractedTextId, // Reference to stored text
      contentLength: content.length,
      chunksProcessed: chunks.length,
      duplicatesRemoved: duplicatesRemoved
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