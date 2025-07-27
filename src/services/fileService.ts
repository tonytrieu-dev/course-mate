import type { User } from '@supabase/supabase-js';
import type { ClassSyllabus, ClassFile } from '../types/database';
import { supabase } from './supabaseClient';
import { errorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';

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

export const fileService = {
  async uploadSyllabus(file: File, classData: ClassData): Promise<ClassSyllabus> {
    logger.debug('Syllabus upload started', {
      fileName: file?.name,
      fileSize: file?.size,
      classId: classData?.id,
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

    // Sanitize filename to remove special characters that cause storage issues
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileName = `${classData.id}/syllabus/${Date.now()}_${sanitizedFileName}`;
    
    logger.debug('Filename sanitization', {
      original: file.name,
      sanitized: sanitizedFileName,
      storagePath: fileName
    });
    
    // Upload file to storage
    const { data, error } = await supabase.storage
      .from("class-materials")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || 'application/pdf',
        // @ts-ignore - Supabase types don't include fileMetadata
        fileMetadata: { owner: user.id },
      });

    if (error) {
      logger.error('Syllabus storage upload failed', {
        errorMessage: error.message,
        fileName,
        fileSize: file.size,
        fileType: file.type,
        bucketName: 'class-materials',
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
      .from("class-materials")
      .createSignedUrl(fileName, SIGNED_URL_DURATION);

    if (signedUrlError) {
      throw errorHandler.data.loadFailed({
        operation: 'uploadSyllabus - signed URL creation',
        fileName: file.name,
        originalError: signedUrlError.message
      });
    }

    // Delete existing syllabus if any
    if (classData.syllabus?.path) {
      await supabase
        .from("class_syllabi")
        .delete()
        .eq("class_id", classData.id);
    }

    // Insert new syllabus record
    const { data: syllabusRecord, error: insertError } = await supabase
      .from("class_syllabi")
      .insert({
        class_id: classData.id,
        name: file.name,
        path: fileName,
        type: file.type,
        size: file.size,
        owner: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Syllabus database insert failed:', {
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
        operation: 'uploadSyllabus - database insert',
        fileName: file.name,
        originalError: insertError.message
      });
    }

    // Invoke embed-file function
    const { error: functionError } = await supabase.functions.invoke('embed-file', {
      body: { record: syllabusRecord },
    });

    if (functionError) {
      console.error('Error invoking embed-file function for syllabus:', functionError);
    }

    return syllabusRecord;
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

    // Sanitize filename to remove special characters that cause storage issues
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileName = `${classData.id}/files/${Date.now()}_${sanitizedFileName}`;
    
    // Upload file to storage
    const { data, error } = await supabase.storage
      .from("class-materials")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || 'application/octet-stream',
        // @ts-ignore - Supabase types don't include fileMetadata
        fileMetadata: { owner: user.id },
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
          classId: classData.id
        }
      });
    }

    // Invoke embed-file function
    const { error: functionError } = await supabase.functions.invoke('embed-file', {
      body: { record: fileRecord },
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
    // Fetch latest syllabus
    const { data: syllabusArr, error: syllabusError } = await supabase
      .from("class_syllabi")
      .select("*")
      .eq("class_id", classId)
      .order("uploaded_at", { ascending: false })
      .limit(1);

    if (syllabusError) {
      console.warn('Error fetching syllabus:', syllabusError.message);
    }

    // Fetch latest files
    const { data: filesArr, error: filesError } = await supabase
      .from("class_files")
      .select("*")
      .eq("class_id", classId)
      .order("uploaded_at", { ascending: false });

    if (filesError) {
      console.warn('Error fetching class files:', filesError.message);
    }

    return {
      syllabus: syllabusArr && syllabusArr.length > 0 ? syllabusArr[0] : null,
      files: filesArr || [],
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

    // Get signed URL for download
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("class-materials")
      .createSignedUrl(filePath, 3600); // 1 hour expiry for download

    if (signedUrlError) {
      throw errorHandler.data.loadFailed({
        operation: 'downloadFile - signed URL creation',
        originalError: signedUrlError.message
      });
    }

    if (!signedUrlData?.signedUrl) {
      throw errorHandler.data.loadFailed({
        operation: 'downloadFile - no signed URL returned',
        originalError: 'Failed to generate download URL'
      });
    }

    return signedUrlData.signedUrl;
  }
};