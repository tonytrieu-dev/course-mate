import { useState, useCallback } from 'react';
import { fileService } from '../services/fileService';

export const useFileManager = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const uploadSyllabus = useCallback(async (file, selectedClass, onSuccess) => {
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
      alert("Error uploading syllabus: " + error.message);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadFile = useCallback(async (file, selectedClass, onSuccess) => {
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
      alert("Error uploading file: " + error.message);
      throw error;
    } finally {
      setIsUploadingFile(false);
    }
  }, []);

  const deleteFile = useCallback(async (filePath, classId, onSuccess) => {
    try {
      const remainingFiles = await fileService.deleteFile(filePath, classId);
      
      if (onSuccess) {
        onSuccess(remainingFiles);
      }
      
      return remainingFiles;
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Error deleting file: " + error.message);
      throw error;
    }
  }, []);

  const deleteSyllabus = useCallback(async (syllabusPath, classId, onSuccess) => {
    try {
      await fileService.deleteSyllabus(syllabusPath, classId);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error deleting syllabus:", error);
      alert("Error deleting syllabus: " + error.message);
      throw error;
    }
  }, []);

  const getClassData = useCallback(async (classId) => {
    try {
      return await fileService.getClassData(classId);
    } catch (error) {
      console.error("Error fetching class data:", error);
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
  };
};