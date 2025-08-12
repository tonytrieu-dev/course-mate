import { useState, useCallback } from 'react';
import { fileService } from '../services/fileService';
import type { Class, ClassFile, ClassSyllabus } from '../types/database';

/**
 * File upload callback type
 */
type SuccessCallback<T> = (result: T) => void;

/**
 * File opening callback type for document viewer
 */
type FileOpenCallback = (fileUrl: string, fileName: string, fileType: string) => void;

/**
 * Return type for useFileManager hook
 */
interface UseFileManagerReturn {
  isUploading: boolean;
  isUploadingFile: boolean;
  uploadSyllabus: (
    file: File, 
    selectedClass: Class, 
    onSuccess?: SuccessCallback<ClassSyllabus>
  ) => Promise<ClassSyllabus | undefined>;
  uploadFile: (
    file: File, 
    selectedClass: Class, 
    onSuccess?: SuccessCallback<ClassFile>
  ) => Promise<ClassFile | undefined>;
  deleteFile: (
    filePath: string, 
    classId: string, 
    onSuccess?: SuccessCallback<ClassFile[]>
  ) => Promise<ClassFile[] | undefined>;
  deleteSyllabus: (
    syllabusPath: string, 
    classId: string, 
    onSuccess?: SuccessCallback<void>
  ) => Promise<void>;
  getClassData: (classId: string) => Promise<{
    files: ClassFile[];
    syllabus: ClassSyllabus | null;
  }>;
  openFile: (
    filePath: string, 
    fileName: string, 
    fileType: string, 
    onOpenInViewer?: FileOpenCallback
  ) => Promise<void>;
  downloadFile: (filePath: string) => Promise<void>;
}

/**
 * Hook for managing file uploads, downloads, and deletions for classes
 */
export const useFileManager = (): UseFileManagerReturn => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);

  const uploadSyllabus = useCallback(async (
    file: File, 
    selectedClass: Class, 
    onSuccess?: SuccessCallback<ClassSyllabus>
  ): Promise<ClassSyllabus | undefined> => {
    if (!file || !selectedClass) return;

    try {
      setIsUploading(true);
      const syllabusRecord = await fileService.uploadSyllabus(file, selectedClass);
      
      if (onSuccess) {
        onSuccess(syllabusRecord);
      }
      
      return syllabusRecord;
    } catch (error) {
      console.error("Error uploading syllabus:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert("Error uploading syllabus: " + errorMessage);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadFile = useCallback(async (
    file: File, 
    selectedClass: Class, 
    onSuccess?: SuccessCallback<ClassFile>
  ): Promise<ClassFile | undefined> => {
    if (!file || !selectedClass) return;

    try {
      setIsUploadingFile(true);
      const fileRecord = await fileService.uploadClassFile(file, selectedClass);
      
      if (onSuccess) {
        onSuccess(fileRecord);
      }
      
      return fileRecord;
    } catch (error) {
      console.error("Error uploading file:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert("Error uploading file: " + errorMessage);
      throw error;
    } finally {
      setIsUploadingFile(false);
    }
  }, []);

  const deleteFile = useCallback(async (
    filePath: string, 
    classId: string, 
    onSuccess?: SuccessCallback<ClassFile[]>
  ): Promise<ClassFile[] | undefined> => {
    try {
      const remainingFiles = await fileService.deleteFile(filePath, classId);
      
      if (onSuccess) {
        onSuccess(remainingFiles);
      }
      
      return remainingFiles;
    } catch (error) {
      console.error("Error deleting file:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert("Error deleting file: " + errorMessage);
      throw error;
    }
  }, []);

  const deleteSyllabus = useCallback(async (
    syllabusPath: string, 
    classId: string, 
    onSuccess?: SuccessCallback<void>
  ): Promise<void> => {
    try {
      await fileService.deleteSyllabus(syllabusPath, classId);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error deleting syllabus:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert("Error deleting syllabus: " + errorMessage);
      throw error;
    }
  }, []);

  const getClassData = useCallback(async (classId: string) => {
    try {
      return await fileService.getClassData(classId);
    } catch (error) {
      console.error("Error fetching class data:", error);
      throw error;
    }
  }, []);

  // Helper function to determine if file should open in viewer
  const shouldOpenInViewer = useCallback((fileName: string, fileType: string): boolean => {
    const lowerFileName = fileName.toLowerCase();
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    // Check by MIME type
    if (supportedTypes.includes(fileType)) {
      return true;
    }
    
    // Check by file extension as fallback
    if (lowerFileName.endsWith('.pdf') || lowerFileName.endsWith('.docx')) {
      return true;
    }
    
    return false;
  }, []);

  const openFile = useCallback(async (
    filePath: string, 
    fileName: string, 
    fileType: string, 
    onOpenInViewer?: FileOpenCallback
  ) => {
    try {
      const fileUrl = await fileService.downloadFile(filePath);
      
      // Determine how to open the file
      if (shouldOpenInViewer(fileName, fileType) && onOpenInViewer) {
        // Open in the in-app document viewer
        onOpenInViewer(fileUrl, fileName, fileType);
      } else {
        // Open in new tab (fallback for unsupported types)
        window.open(fileUrl, '_blank');
      }
    } catch (error) {
      console.error("Error opening file:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert("Error opening file: " + errorMessage);
      throw error;
    }
  }, [shouldOpenInViewer]);

  const downloadFile = useCallback(async (filePath: string) => {
    try {
      const downloadUrl = await fileService.downloadFile(filePath);
      
      // Force download by creating a temporary link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filePath.split('/').pop() || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading file:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert("Error downloading file: " + errorMessage);
      throw error;
    }
  }, []);

  return {
    isUploading,
    isUploadingFile,
    uploadSyllabus,
    uploadFile,
    deleteFile,
    deleteSyllabus,
    getClassData,
    openFile,
    downloadFile,
  };
};