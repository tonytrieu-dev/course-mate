import type { User } from '@supabase/supabase-js';
import type { ClassSyllabus, ClassFile } from '../types/database';
import { supabase } from './supabaseClient';
import { errorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { SyllabusSecurityService, SYLLABUS_SECURITY_CONFIG } from './syllabusSecurityService';

const SIGNED_URL_DURATION = 31536000; // 1 year

// File upload interfaces
interface FileUploadResult {
  id: string;
  class_id: string;
  owner: string;
  filename: string;
  path: string;
  size?: number;
  type?: string;
  url?: string;
  uploaded_at: string;
}

interface ClassData {
  id: string;
  name: string;
  syllabus?: ClassSyllabus | null;
  files?: ClassFile[];
}

interface ClassFilesData {
  syllabus: ClassSyllabus | null;
  files: ClassFile[];
}

interface SyllabusUploadResult extends ClassSyllabus {
  extractedText: string;
}

export const fileService = {
  async uploadSyllabus(file: File, classData: ClassData): Promise<SyllabusUploadResult> {
    logger.debug('Syllabus upload started', {
      fileName: file?.name,
      fileSize: file?.size,
      classId: String(classData?.id || ''),
      className: classData?.name
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    logger.auth('Syllabus auth check', {
      user: user ? { id: user.id, email: user.email } : undefined,
      hasError: !!userError
    });
    
    if (userError || !user) {
      throw errorHandler.auth.notAuthenticated({
        operation: 'uploadSyllabus',
        fileName: file?.name,
        classId: classData?.id
      });
    }

    // SECURITY: Comprehensive file validation
    logger.debug('Starting security validation for syllabus upload', {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      userId: user.id
    });

    // 1. Basic file validation
    const fileValidation = SyllabusSecurityService.validateFileUpload(file, user);
    if (!fileValidation.isValid) {
      SyllabusSecurityService.logSecurityEvent('file_validation_failed', {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        userId: user.id,
        errors: fileValidation.errors,
        severity: 'high'
      });
      
      throw errorHandler.data.saveFailed({
        operation: 'uploadSyllabus - file validation',
        fileName: file.name,
        originalError: fileValidation.errors.join('; ')
      });
    }

    // 2. Rate limiting check
    const rateLimitCheck = await SyllabusSecurityService.checkUserRateLimits(user.id);
    if (!rateLimitCheck.isValid) {
      SyllabusSecurityService.logSecurityEvent('rate_limit_exceeded', {
        userId: user.id,
        fileName: file.name,
        errors: rateLimitCheck.errors,
        severity: 'medium'
      });
      
      throw errorHandler.data.saveFailed({
        operation: 'uploadSyllabus - rate limit',
        fileName: file.name,
        originalError: rateLimitCheck.errors.join('; ')
      });
    }

    // 3. PDF structure validation
    const pdfValidation = await SyllabusSecurityService.validatePDFSecurity(file);
    if (!pdfValidation.isValid) {
      SyllabusSecurityService.logSecurityEvent('pdf_validation_failed', {
        fileName: file.name,
        fileSize: file.size,
        userId: user.id,
        errors: pdfValidation.errors,
        severity: 'high'
      });
      
      throw errorHandler.data.saveFailed({
        operation: 'uploadSyllabus - PDF validation',
        fileName: file.name,
        originalError: pdfValidation.errors.join('; ')
      });
    }

    // Log warnings for user awareness
    const allWarnings = [...fileValidation.warnings, ...rateLimitCheck.warnings, ...pdfValidation.warnings];
    if (allWarnings.length > 0) {
      logger.warn('Security validation warnings for syllabus upload', {
        fileName: file.name,
        userId: user.id,
        warnings: allWarnings
      });
    }

    logger.info('Security validation passed for syllabus upload', {
      fileName: file.name,
      userId: user.id,
      validationsPassed: ['file_upload', 'rate_limits', 'pdf_structure']
    });

    // Generate secure file path using security service
    const fileName = SyllabusSecurityService.generateSecureFilePath(classData.id, file.name, user.id);
    
    logger.debug('Secure file path generated', {
      original: file.name,
      secureStoragePath: fileName,
      classId: String(classData.id),
      userIdPrefix: user.id.substring(0, 8)
    });
    
    // Upload file to secure storage bucket
    const { data, error } = await supabase.storage
      .from(SYLLABUS_SECURITY_CONFIG.BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || 'application/pdf',
        metadata: { owner: user.id },
      });

    if (error) {
      logger.error('Syllabus storage upload failed', {
        errorMessage: error.message,
        fileName,
        fileSize: file.size,
        fileType: file.type,
        bucketName: SYLLABUS_SECURITY_CONFIG.BUCKET_NAME,
        uploadPath: fileName
      });
      
      throw errorHandler.data.saveFailed({
        operation: 'uploadSyllabus - storage upload',
        fileName: file.name,
        originalError: error.message
      });
    }
    
    console.log('Syllabus storage upload successful:', {
      fileName,
      uploadPath: data?.path,
      fileSize: file.size
    });

    // Get signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(SYLLABUS_SECURITY_CONFIG.BUCKET_NAME)
      .createSignedUrl(fileName, SIGNED_URL_DURATION);

    if (signedUrlError) {
      throw errorHandler.data.loadFailed({
        operation: 'uploadSyllabus - signed URL creation',
        fileName: file.name,
        originalError: signedUrlError.message
      });
    }

    // Delete existing syllabus if any (always check, regardless of classData.syllabus)
    const { data: deletedRecords, error: deleteError } = await supabase
      .from("class_files")
      .delete()
      .eq("class_id", classData.id)
      .eq("type", "syllabus") // Only delete syllabus files
      .select(); // Get deleted records to verify deletion and clean up storage files
    
    if (deleteError) {
      logger.debug(`No existing syllabus to delete or delete failed for class ${classData.id}: ${deleteError.message}`);
    } else if (deletedRecords && deletedRecords.length > 0) {
      logger.debug(`Successfully deleted ${deletedRecords.length} existing syllabus record(s) for class ${classData.id}`);
      
      // Clean up storage files for deleted records
      for (const record of deletedRecords) {
        if (record.path) {
          try {
            const { error: storageError } = await supabase.storage
              .from(SYLLABUS_SECURITY_CONFIG.BUCKET_NAME)
              .remove([record.path]);
            
            if (storageError) {
              logger.warn(`Failed to delete storage file ${record.path}: ${storageError.message}`);
            } else {
              logger.debug(`Successfully deleted storage file: ${record.path}`);
            }
          } catch (storageCleanupError) {
            logger.warn(`Storage cleanup failed for ${record.path}:`, storageCleanupError);
          }
        }
      }
    } else {
      logger.debug(`No existing syllabus found to delete for class ${classData.id}`);
    }

    // Insert new syllabus record
    const { data: syllabusRecord, error: insertError } = await supabase
      .from("class_files")
      .insert({
        class_id: classData.id,
        name: file.name,
        path: fileName,
        type: "syllabus", // Mark as syllabus file
        size: file.size,
        owner: user.id,
        url: signedUrlData?.signedUrl, // Store the signed URL
      })
      .select()
      .single();

    if (insertError) {
      console.error('Syllabus database insert failed:', insertError);
      console.error('Insert error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      console.error('Attempted insert data:', {
        class_id: classData.id,
        name: file.name,
        path: fileName,
        type: file.type,
        size: file.size,
        owner: user.id,
      });
      
      throw errorHandler.data.saveFailed({
        operation: 'uploadSyllabus - database insert',
        fileName: file.name,
        originalError: insertError.message
      });
    }

    // Call embed-file function to extract text and create embeddings
    let extractedText = '';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      logger.info('Calling embed-file function', {
        fileName: file.name,
        syllabusRecordId: syllabusRecord.id,
        sessionExists: !!session?.access_token
      });
      
      const { data: embedResult, error: functionError } = await supabase.functions.invoke('embed-file', {
        body: { record: syllabusRecord },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      // Log the raw Supabase function response structure
      logger.info('Raw Supabase function invoke response', {
        fileName: file.name,
        hasEmbedResult: !!embedResult,
        embedResultType: typeof embedResult,
        embedResultKeys: embedResult ? Object.keys(embedResult) : 'none',
        embedResultKeysDetailed: embedResult ? Object.keys(embedResult).map(key => ({
          key,
          type: typeof embedResult[key],
          hasValue: !!embedResult[key],
          isString: typeof embedResult[key] === 'string',
          length: typeof embedResult[key] === 'string' ? embedResult[key].length : 'N/A'
        })) : 'none',
        hasFunctionError: !!functionError,
        functionErrorType: typeof functionError
      });

      // Debug: Log the raw response with full structure
      logger.info('Embed-file function raw response', {
        fileName: file.name,
        hasData: !!embedResult,
        hasError: !!functionError,
        errorMessage: functionError?.message,
        dataType: typeof embedResult,
        dataKeys: embedResult ? Object.keys(embedResult) : 'none',
        fullResponse: embedResult, // Log the complete response structure
        extractedTextDirect: embedResult?.extractedText,
        extractedTextLength: embedResult?.extractedText?.length
      });

      if (functionError) {
        logger.warn('Embed-file function failed', {
          error: functionError.message,
          fileName: file.name
        });
      } else {
        // Enhanced text extraction with comprehensive search
        logger.warn('Embed-file function succeeded but extractedText not found at root level', {
          fileName: file.name,
          embedResult: embedResult,
          hasExtractedText: 'extractedText' in (embedResult || {}),
          extractedTextValue: embedResult?.extractedText,
          extractedTextType: typeof embedResult?.extractedText,
          extractedTextLength: embedResult?.extractedText?.length || 'N/A'
        });
        
        // Log detailed edge function response analysis
        logger.info('Edge function response analysis', {
          fileName: file.name,
          // Success response properties
          hasSuccess: 'success' in embedResult,
          successValue: embedResult.success,
          hasMessage: 'message' in embedResult,
          messageValue: embedResult.message,
          hasSecurityStatus: 'securityStatus' in embedResult,
          securityStatusValue: embedResult.securityStatus,
          hasExtractedText: 'extractedText' in embedResult,
          extractedTextType: typeof embedResult.extractedText,
          extractedTextLength: embedResult.extractedText?.length,
          hasContentLength: 'contentLength' in embedResult,
          contentLengthValue: embedResult.contentLength,
          hasChunksProcessed: 'chunksProcessed' in embedResult,
          chunksProcessedValue: embedResult.chunksProcessed,
          // Error response properties
          hasError: 'error' in embedResult,
          errorValue: embedResult.error,
          hasWarnings: 'warnings' in embedResult,
          warningsValue: embedResult.warnings,
          hasDetails: 'details' in embedResult,
          detailsValue: embedResult.details
        });

        // Check if this is an error response from the edge function
        if (embedResult.error) {
          logger.error('Edge function returned error response', {
            fileName: file.name,
            error: embedResult.error,
            warnings: embedResult.warnings,
            details: embedResult.details
          });
          // Continue to fallback since edge function failed
        }

        // Handle extracted text - either direct or stored reference
        if (embedResult.extractedTextId) {
          // Text was stored separately due to size limits - retrieve it
          logger.info('Extracted text stored separately, retrieving', {
            fileName: file.name,
            extractedTextId: embedResult.extractedTextId,
            contentLength: embedResult.contentLength
          });

          try {
            const { data: extractionRecord, error: retrievalError } = await supabase
              .from('document_extractions')
              .select('extracted_text')
              .eq('id', embedResult.extractedTextId)
              .single();

            if (retrievalError) {
              logger.error('Failed to retrieve stored extracted text', {
                fileName: file.name,
                extractedTextId: embedResult.extractedTextId,
                error: retrievalError.message
              });
            } else if (extractionRecord?.extracted_text) {
              extractedText = extractionRecord.extracted_text;
              logger.info('Successfully retrieved stored extracted text', {
                fileName: file.name,
                textLength: extractedText.length,
                source: 'stored reference retrieval'
              });
            }
          } catch (retrievalException) {
            logger.error('Exception retrieving stored extracted text', {
              fileName: file.name,
              error: retrievalException instanceof Error ? retrievalException.message : String(retrievalException)
            });
          }
        }

        // If no stored reference or retrieval failed, try comprehensive search for direct text
        if (!extractedText && embedResult && typeof embedResult === 'object') {
          const possibleTextSources = [
            // Direct access (expected from edge function)
            embedResult.extractedText,
            // Nested in common response patterns
            embedResult.data?.extractedText,
            embedResult.result?.extractedText,
            embedResult.body?.extractedText,
            embedResult.response?.extractedText,
            // Alternative property names
            embedResult.text,
            embedResult.content,
            embedResult.documentText,
            embedResult.pdfText,
            // Deeply nested patterns
            embedResult.data?.text,
            embedResult.data?.content,
            embedResult.result?.text,
            embedResult.result?.content
          ];
          
          for (const textSource of possibleTextSources) {
            if (textSource && typeof textSource === 'string' && textSource.length > 50) {
              extractedText = textSource;
              logger.info('Found extracted text in response structure', {
                fileName: file.name,
                textLength: extractedText.length,
                foundAt: 'alternative location'
              });
              break;
            }
          }
        }
        
        // If we found text, log success and continue
        if (extractedText) {
          logger.info('Document embedding and text extraction completed successfully', {
            fileName: file.name,
            textLength: extractedText.length,
            chunksProcessed: embedResult?.chunksProcessed,
            method: 'edge function with comprehensive search',
            source: 'embed-file edge function'
          });
        } else {
          // Only attempt fallback if no text was found from edge function
          logger.warn('No text extracted from embed-file function, attempting fallback', {
            fileName: file.name,
            embedResult: embedResult
          });
          
          // If still no text extracted, try direct PDF extraction as fallback
          if (file.type === 'application/pdf') {
            logger.info('Attempting direct PDF text extraction fallback', {
              fileName: file.name
            });
          
          try {
            extractedText = await this.extractPDFTextFallback(file);
            if (extractedText && extractedText.length > 50) {
              logger.info('PDF text extraction completed via fallback', {
                fileName: file.name,
                textLength: extractedText.length,
                source: 'local PDF extraction fallback',
                method: 'fallback due to edge function text extraction failure'
              });
            }
          } catch (fallbackError) {
            logger.warn('Fallback PDF extraction failed', {
              fileName: file.name,
              error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
            });
          }
          }
        }
      }
    } catch (error) {
      logger.error('Embed-file function failed with exception', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName: file.name
      });
    }

    // Return both the syllabus record and extracted text
    return {
      ...syllabusRecord,
      extractedText: extractedText
    };
  },

  async uploadClassFile(file: File, classData: ClassData): Promise<ClassFile> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw errorHandler.auth.notAuthenticated({
        operation: 'uploadClassFile',
        fileName: file?.name,
        classId: classData?.id
      });
    }

    // SECURITY: Validate class file upload for safety
    logger.debug('Starting security validation for class file upload', {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      classId: classData.id,
      userId: user.id
    });

    const fileValidation = SyllabusSecurityService.validateClassFileUpload(file, user);
    if (!fileValidation.isValid) {
      SyllabusSecurityService.logSecurityEvent('class_file_validation_failed', {
        userId: user.id,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        errors: fileValidation.errors,
        classId: classData.id
      });
      throw errorHandler.data.saveFailed({
        operation: 'uploadClassFile - security validation',
        details: fileValidation.errors.join(', '),
        validationErrors: fileValidation.errors
      });
    }

    // Log any warnings (non-blocking)
    if (fileValidation.warnings.length > 0) {
      logger.warn('Class file upload security warnings', {
        fileName: file.name,
        warnings: fileValidation.warnings,
        userId: user.id
      });
    }

    // Sanitize filename to remove special characters that cause storage issues
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileName = `${user.id}/${classData.id}/files/${Date.now()}_${sanitizedFileName}`;
    
    // Upload file to storage
    const { data, error } = await supabase.storage
      .from("class-materials")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || 'application/octet-stream',
        metadata: { owner: user.id },
      });

    if (error) {
      throw errorHandler.data.saveFailed({
        operation: 'uploadClassFile - storage upload',
        fileName: file.name,
        originalError: error.message
      });
    }

    // Get signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("class-materials")
      .createSignedUrl(fileName, SIGNED_URL_DURATION);

    if (signedUrlError) {
      throw errorHandler.data.loadFailed({
        operation: 'uploadClassFile - signed URL creation',
        fileName: file.name,
        originalError: signedUrlError.message
      });
    }

    // Insert file record
    const { data: fileRecord, error: insertError } = await supabase
      .from("class_files")
      .insert({
        class_id: classData.id,
        name: file.name,
        path: fileName,
        type: file.type,
        size: file.size,
        owner: user.id,
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      // Enhanced error logging for debugging
      console.error('Database insert failed:', {
        error: insertError,
        errorCode: insertError.code,
        errorMessage: insertError.message,
        errorDetails: insertError.details,
        errorHint: insertError.hint,
        insertData: {
          class_id: classData.id,
          name: file.name,
          path: fileName,
          type: file.type,
          size: file.size,
          owner: user.id,
          uploaded_at: new Date().toISOString(),
        },
        file: {
          name: file.name,
          size: file.size,
          type: file.type
        },
        classData: {
          id: classData.id,
          name: classData.name
        },
        user: user?.id,
        fileName: fileName
      });
      
      throw errorHandler.data.saveFailed({
        operation: 'uploadClassFile - database insert',
        fileName: file.name,
        originalError: insertError.message,
        details: {
          supabaseError: insertError,
          fileName: fileName,
          classId: String(classData.id)
        }
      });
    }

    // Invoke embed-file function
    const { data: { session } } = await supabase.auth.getSession();
    const { error: functionError } = await supabase.functions.invoke('embed-file', {
      body: { record: fileRecord },
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    });

    if (functionError) {
      console.error('Error invoking embed-file function:', functionError);
    }

    return fileRecord;
  },

  async deleteFile(filePath: string, classId: string): Promise<ClassFile[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      throw errorHandler.auth.notAuthenticated({
        operation: 'deleteFile',
        originalError: userError?.message || "User not authenticated"
      });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("class-materials")
      .remove([filePath]);

    if (storageError) {
      throw errorHandler.data.saveFailed({
        operation: 'deleteFile - storage deletion',
        originalError: storageError.message
      });
    }

    // Delete from documents table (embeddings) first
    const fileName = filePath.split('/').pop();
    const { error: documentsError } = await supabase
      .from("documents")
      .delete()
      .eq("class_id", classId)
      .eq("file_name", fileName);

    if (documentsError) {
      throw errorHandler.data.saveFailed({
        operation: 'deleteFile - documents deletion',
        originalError: documentsError.message
      });
    }

    // Delete from database
    const { error: fileDbError } = await supabase
      .from("class_files")
      .delete()
      .eq("path", filePath);

    if (fileDbError) {
      throw errorHandler.data.saveFailed({
        operation: 'deleteFile - database deletion',
        originalError: fileDbError.message
      });
    }

    // Get remaining files
    const { data: classFiles, error: classFilesError } = await supabase
      .from("class_files")
      .select("*")
      .eq("class_id", classId)
      .order("uploaded_at", { ascending: false });

    if (classFilesError) {
      throw errorHandler.data.loadFailed({
        operation: 'deleteFile - get remaining files',
        originalError: classFilesError.message
      });
    }

    return classFiles || [];
  },

  async deleteSyllabus(syllabusPath: string, classId: string): Promise<void> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      throw errorHandler.auth.notAuthenticated({
        operation: 'deleteSyllabus',
        originalError: userError?.message || "User not authenticated"
      });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("class-materials")
      .remove([syllabusPath]);

    if (storageError) {
      throw errorHandler.data.saveFailed({
        operation: 'deleteSyllabus - storage deletion',
        originalError: storageError.message
      });
    }

    // Delete from documents table (embeddings) first
    const fileName = syllabusPath.split('/').pop();
    const { error: documentsError } = await supabase
      .from("documents")
      .delete()
      .eq("class_id", classId)
      .eq("file_name", fileName);

    if (documentsError) {
      throw errorHandler.data.saveFailed({
        operation: 'deleteSyllabus - documents deletion',
        originalError: documentsError.message
      });
    }

    // Delete from database
    const { error: syllabusDbError } = await supabase
      .from("class_syllabi")
      .delete()
      .eq("class_id", classId);

    if (syllabusDbError) {
      throw errorHandler.data.saveFailed({
        operation: 'deleteSyllabus - database deletion',
        originalError: syllabusDbError.message
      });
    }
  },

  async getClassData(classId: string): Promise<ClassFilesData> {
    // Fetch latest syllabus from both old class_syllabi table and new class_files table
    const { data: legacySyllabusArr, error: syllabusError } = await supabase
      .from("class_syllabi")
      .select("*")
      .eq("class_id", classId)
      .order("uploaded_at", { ascending: false })
      .limit(1);

    if (syllabusError) {
      console.warn('Error fetching legacy syllabus:', syllabusError.message);
    }

    // Fetch all files from class_files table
    const { data: allFilesArr, error: filesError } = await supabase
      .from("class_files")
      .select("*")
      .eq("class_id", classId)
      .order("uploaded_at", { ascending: false });

    if (filesError) {
      console.warn('Error fetching class files:', filesError.message);
    }

    // Separate syllabus files from regular files
    const syllabusFiles = (allFilesArr || []).filter(file => file.type === "syllabus");
    const regularFiles = (allFilesArr || []).filter(file => file.type !== "syllabus");

    // Determine which syllabus to use (prefer newer syllabus from class_files)
    let latestSyllabus = null;
    if (syllabusFiles.length > 0) {
      latestSyllabus = syllabusFiles[0]; // Already ordered by uploaded_at desc
    } else if (legacySyllabusArr && legacySyllabusArr.length > 0) {
      latestSyllabus = legacySyllabusArr[0];
    }

    return {
      syllabus: latestSyllabus,
      files: regularFiles, // Only return non-syllabus files
    };
  },

  async downloadFile(filePath: string): Promise<string> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      throw errorHandler.auth.notAuthenticated({
        operation: 'downloadFile',
        originalError: userError?.message || "User not authenticated"
      });
    }

    // Determine which bucket to use based on file path
    // Syllabus files are stored in secure-syllabi bucket, others in class-materials
    const isSyllabusFile = filePath.includes('syllabus') || filePath.includes('Syllabus');
    const bucketName = isSyllabusFile ? SYLLABUS_SECURITY_CONFIG.BUCKET_NAME : "class-materials";

    logger.debug('Downloading file', {
      filePath,
      bucketName,
      isSyllabusFile,
      userId: userData.user.id
    });

    // Get signed URL for download
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600); // 1 hour expiry for download

    if (signedUrlError) {
      logger.error('Failed to create signed URL for download', {
        filePath,
        bucketName,
        error: signedUrlError.message,
        userId: userData.user.id
      });
      
      throw errorHandler.data.loadFailed({
        operation: 'downloadFile - signed URL creation',
        originalError: signedUrlError.message
      });
    }

    if (!signedUrlData?.signedUrl) {
      logger.error('No signed URL returned for download', {
        filePath,
        bucketName,
        userId: userData.user.id
      });
      
      throw errorHandler.data.loadFailed({
        operation: 'downloadFile - no signed URL returned',
        originalError: 'Failed to generate download URL'
      });
    }

    logger.debug('Successfully created download URL', {
      filePath,
      bucketName,
      userId: userData.user.id
    });

    return signedUrlData.signedUrl;
  },

  /**
   * Fallback PDF text extraction using PDF.js when Edge Function fails
   */
  async extractPDFTextFallback(file: File): Promise<string> {
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set up PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    try {
      // Convert file to array buffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Load PDF document
      const pdf = await pdfjsLib.getDocument(uint8Array).promise;
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items into a single string
        const pageText = textContent.items
          .filter((item: any) => item.str)
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
      }
      
      // Clean up the text
      const cleanedText = fullText
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n\s*\n/g, '\n') // Remove empty lines
        .trim();
      
      logger.info('PDF text extraction completed via fallback', {
        fileName: file.name,
        totalPages: pdf.numPages,
        extractedLength: cleanedText.length
      });
      
      return cleanedText;
      
    } catch (error) {
      logger.error('Fallback PDF text extraction failed', {
        fileName: file.name,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};