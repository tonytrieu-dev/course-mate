import { useState, useCallback } from 'react';
import { fileService } from '../services/fileService';
import type { Class, ClassFile, ClassSyllabus } from '../types/database';

/**
 * File upload callback type
 */
type SuccessCallback<T> = (result: T) => void;

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

  const downloadFile = useCallback(async (filePath: string) => {
    try {
      const downloadUrl = await fileService.downloadFile(filePath);
      // Open the file in a new tab/window
      window.open(downloadUrl, '_blank');
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
    downloadFile,
  };
};