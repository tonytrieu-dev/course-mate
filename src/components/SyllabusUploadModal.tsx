import React, { useState, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SyllabusSecurityService } from '../services/syllabusSecurityService';
import { SyllabusTaskGenerationService } from '../services/syllabusTaskGenerationService';
import { fileService } from '../services/fileService';
import { errorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';

interface SyllabusUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  onTasksGenerated?: (taskCount: number) => void;
}

interface ValidationState {
  isValidating: boolean;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

interface GenerationState {
  isGenerating: boolean;
  tasksGenerated: number;
  averageConfidence: number;
  warnings: string[];
  isComplete: boolean;
}

export const SyllabusUploadModal: React.FC<SyllabusUploadModalProps> = ({
  isOpen,
  onClose,
  classId,
  className,
  onTasksGenerated
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validation, setValidation] = useState<ValidationState>({
    isValidating: false,
    errors: [],
    warnings: [],
    isValid: false
  });
  const [generation, setGeneration] = useState<GenerationState>({
    isGenerating: false,
    tasksGenerated: 0,
    averageConfidence: 0,
    warnings: [],
    isComplete: false
  });
  const [currentStep, setCurrentStep] = useState<'select' | 'validate' | 'upload' | 'generate' | 'complete'>('select');

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setSelectedFile(file);
    setCurrentStep('validate');
    setValidation({ isValidating: true, errors: [], warnings: [], isValid: false });

    try {
      logger.info('Starting syllabus file validation', {
        fileName: file.name,
        fileSize: file.size,
        classId
      });

      // Comprehensive validation using security service
      const [fileValidation, rateLimitCheck, pdfValidation] = await Promise.all([
        Promise.resolve(SyllabusSecurityService.validateFileUpload(file, user)),
        SyllabusSecurityService.checkUserRateLimits(user.id),
        SyllabusSecurityService.validatePDFSecurity(file)
      ]);

      const allErrors = [
        ...fileValidation.errors,
        ...rateLimitCheck.errors,
        ...pdfValidation.errors
      ];

      const allWarnings = [
        ...fileValidation.warnings,
        ...rateLimitCheck.warnings,
        ...pdfValidation.warnings
      ];

      const isValid = allErrors.length === 0;

      setValidation({
        isValidating: false,
        errors: allErrors,
        warnings: allWarnings,
        isValid
      });

      if (isValid) {
        logger.info('Syllabus file validation passed', {
          fileName: file.name,
          warnings: allWarnings.length
        });
      } else {
        logger.warn('Syllabus file validation failed', {
          fileName: file.name,
          errors: allErrors
        });
      }

    } catch (error) {
      logger.error('Syllabus file validation error', error);
      setValidation({
        isValidating: false,
        errors: ['Validation failed: ' + (error instanceof Error ? error.message : String(error))],
        warnings: [],
        isValid: false
      });
    }
  }, [user, classId]);

  const handleUploadAndGenerate = useCallback(async () => {
    if (!selectedFile || !user || !validation.isValid) return;

    try {
      setCurrentStep('upload');
      setUploadProgress(10);

      // Upload syllabus file
      logger.info('Starting syllabus upload and task generation', {
        fileName: selectedFile.name,
        classId,
        className
      });

      const classData = { id: classId, name: className };
      const uploadedSyllabus = await fileService.uploadSyllabus(selectedFile, classData);
      
      setUploadProgress(40);
      setCurrentStep('generate');
      setGeneration({ isGenerating: true, tasksGenerated: 0, averageConfidence: 0, warnings: [], isComplete: false });

      // Use extracted text from the upload result (already processed by embed-file function)
      const fileText = uploadedSyllabus.extractedText;
      
      // Validate that text was successfully extracted
      if (!fileText || fileText.length < 50) {
        throw new Error('Failed to extract text from PDF. The file may be corrupted or contain no readable text.');
      }
      
      logger.info('Using extracted text for task generation', {
        fileName: selectedFile.name,
        textLength: fileText.length
      });
      
      setUploadProgress(60);

      // Generate tasks using AI
      const taskGenerationResult = await SyllabusTaskGenerationService.generateTasksFromSyllabus(
        fileText,
        classId,
        user
      );

      setUploadProgress(80);

      // Create tasks in database
      const createdTasks = await SyllabusTaskGenerationService.createTasksFromGenerated(
        taskGenerationResult.tasks,
        classId,
        user
      );

      setUploadProgress(100);
      setCurrentStep('complete');

      setGeneration({
        isGenerating: false,
        tasksGenerated: createdTasks.length,
        averageConfidence: taskGenerationResult.metadata.averageConfidence,
        warnings: taskGenerationResult.warnings,
        isComplete: true
      });

      // Notify parent component
      onTasksGenerated?.(createdTasks.length);

      logger.info('Syllabus upload and task generation completed', {
        fileName: selectedFile.name,
        classId,
        tasksGenerated: createdTasks.length,
        averageConfidence: taskGenerationResult.metadata.averageConfidence
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error('Syllabus upload and task generation failed', {
        error: errorMessage,
        fileName: selectedFile.name,
        classId,
        currentStep,
        uploadProgress
      });
      
      // Reset states
      setCurrentStep('select');
      setUploadProgress(0);
      setGeneration({ 
        isGenerating: false, 
        tasksGenerated: 0, 
        averageConfidence: 0, 
        warnings: [], 
        isComplete: false 
      });
      
      // Provide specific error messages based on error type
      let userFriendlyError = 'Upload failed: ';
      
      if (errorMessage.includes('Failed to extract text')) {
        userFriendlyError += 'Could not read the PDF file. Please ensure it contains readable text and try again.';
      } else if (errorMessage.includes('Gemini API')) {
        userFriendlyError += 'AI task generation temporarily unavailable. Please try again later.';
      } else if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
        userFriendlyError += 'Authentication error. Please refresh the page and try again.';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userFriendlyError += 'Network error. Please check your connection and try again.';
      } else if (errorMessage.includes('rate limit')) {
        userFriendlyError += 'Too many requests. Please wait a moment and try again.';
      } else {
        userFriendlyError += errorMessage;
      }
      
      setValidation({
        ...validation,
        errors: [...validation.errors, userFriendlyError]
      });
    }
  }, [selectedFile, user, validation.isValid, classId, className, onTasksGenerated]);

  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setCurrentStep('select');
    setValidation({ isValidating: false, errors: [], warnings: [], isValid: false });
    setGeneration({ isGenerating: false, tasksGenerated: 0, averageConfidence: 0, warnings: [], isComplete: false });
    setUploadProgress(0);
    onClose();
  }, [onClose]);

  const handleStartOver = useCallback(() => {
    setSelectedFile(null);
    setCurrentStep('select');
    setValidation({ isValidating: false, errors: [], warnings: [], isValid: false });
    setGeneration({ isGenerating: false, tasksGenerated: 0, averageConfidence: 0, warnings: [], isComplete: false });
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10010] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-[10011]">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Upload Syllabus</h2>
              <p className="text-blue-100 mt-1">Generate tasks automatically from your {className} syllabus</p>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-slate-300 mb-2">
            <span className={currentStep === 'select' ? 'text-blue-600 font-medium' : ''}>
              1. Select File
            </span>
            <span className={currentStep === 'validate' ? 'text-blue-600 font-medium' : ''}>
              2. Validate
            </span>
            <span className={currentStep === 'upload' ? 'text-blue-600 font-medium' : ''}>
              3. Upload
            </span>
            <span className={currentStep === 'generate' ? 'text-blue-600 font-medium' : ''}>
              4. Generate Tasks
            </span>
            <span className={currentStep === 'complete' ? 'text-green-600 font-medium' : ''}>
              5. Complete
            </span>
          </div>
          
          {uploadProgress > 0 && (
            <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: File Selection */}
          {currentStep === 'select' && (
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 transition-colors">
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">Upload PDF Syllabus</h3>
                <p className="text-gray-600 dark:text-slate-300 mb-4">
                  Select a PDF syllabus file to automatically extract assignments, exams, and due dates
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="syllabus-upload"
                />
                <label
                  htmlFor="syllabus-upload"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 cursor-pointer inline-block transition-colors"
                >
                  Choose PDF File
                </label>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                  Maximum file size: 10MB • PDF format only
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Validation */}
          {currentStep === 'validate' && (
            <div>
              <div className="flex items-center mb-4">
                {validation.isValidating ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3" />
                ) : validation.isValid ? (
                  <svg className="h-6 w-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100">
                  {validation.isValidating ? 'Validating file...' : validation.isValid ? 'File validated successfully' : 'Validation failed'}
                </h3>
              </div>

              {selectedFile && (
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <svg className="h-8 w-8 text-red-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
                      <p className="text-sm text-gray-600 dark:text-slate-300">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Errors */}
              {validation.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <h4 className="text-red-800 font-medium mb-2">Validation Errors:</h4>
                  <ul className="text-red-700 text-sm space-y-1">
                    {validation.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Validation Warnings */}
              {validation.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h4 className="text-yellow-800 font-medium mb-2">Warnings:</h4>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    {validation.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={handleStartOver}
                  className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-slate-100 transition-colors"
                >
                  Choose Different File
                </button>
                {validation.isValid && (
                  <button
                    onClick={handleUploadAndGenerate}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Upload & Generate Tasks
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Upload Progress */}
          {currentStep === 'upload' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">Uploading syllabus...</h3>
              <p className="text-gray-600 dark:text-slate-300">Securely uploading your file to our protected storage</p>
            </div>
          )}

          {/* Step 4: Task Generation */}
          {currentStep === 'generate' && (
            <div className="text-center">
              <div className="animate-pulse">
                <svg className="h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">Generating tasks with AI...</h3>
              <p className="text-gray-600 dark:text-slate-300">Analyzing syllabus content and extracting assignments, exams, and due dates</p>
            </div>
          )}

          {/* Step 5: Complete */}
          {currentStep === 'complete' && (
            <div className="text-center">
              <svg className="h-20 w-20 text-green-600 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-3xl font-bold text-green-600 mb-3">🎉 Tasks Generated Successfully!</h3>
              <p className="text-lg text-gray-700 dark:text-slate-300 mb-6">
                Your syllabus has been processed and {generation.tasksGenerated} new tasks have been added to your calendar and task list.
              </p>
              

              {generation.warnings.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-4 mb-6 text-left">
                  <h4 className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">Processing Notes:</h4>
                  <ul className="text-yellow-700 dark:text-yellow-300 text-sm space-y-1">
                    {generation.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 border border-blue-200 dark:border-blue-700/50">
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  ✅ Your tasks are now available in the Calendar and Tasks views. 
                  They've been automatically refreshed to show your new assignments.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleClose}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold text-lg shadow-lg"
                >
                  View My New Tasks
                </button>
                <button
                  onClick={handleStartOver}
                  className="px-6 py-3 text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-slate-100 transition-colors border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Upload Another Syllabus
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};