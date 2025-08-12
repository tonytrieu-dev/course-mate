
import React, { useCallback, useState } from 'react';
import type { ClassWithRelations, ClassSyllabus, ClassFile } from '../types/database';
import { useFileManager } from '../hooks/useFileManager';
import { useDocumentViewer } from '../hooks/useDocumentViewer';
import { DocumentViewer } from './DocumentViewer';
import { SyllabusUploadModal } from './SyllabusUploadModal';
import { logger } from '../utils/logger';

interface SyllabusModalProps {
  show: boolean;
  selectedClass: ClassWithRelations | null;
  onClose: () => void;
  onSyllabusUpdate: (syllabusRecord: ClassSyllabus | null) => void;
  onFileUpdate: (fileRecord: ClassFile | null, remainingFiles?: ClassFile[]) => void;
  onTasksRefresh?: () => void;
}

const SyllabusModal: React.FC<SyllabusModalProps> = ({ 
  show, 
  selectedClass, 
  onClose, 
  onSyllabusUpdate, 
  onFileUpdate,
  onTasksRefresh
}) => {
  const [showAiUpload, setShowAiUpload] = useState(false);
  
  const {
    isUploading,
    isUploadingFile,
    uploadSyllabus,
    uploadFile,
    deleteFile,
    deleteSyllabus,
    openFile,
    downloadFile,
  } = useFileManager();

  const { viewerState, openDocument, closeDocument } = useDocumentViewer();

  const handleSyllabusUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClass) return;

    await uploadSyllabus(file, selectedClass, (syllabusRecord: ClassSyllabus) => {
      onSyllabusUpdate(syllabusRecord);
    });
  }, [selectedClass, uploadSyllabus, onSyllabusUpdate]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClass) return;

    await uploadFile(file, selectedClass, (fileRecord: ClassFile) => {
      onFileUpdate(fileRecord);
    });
    
    e.target.value = ''; // Clear input
  }, [selectedClass, uploadFile, onFileUpdate]);

  const handleDeleteFile = useCallback(async (filePath: string, fileIndex: number) => {
    if (!selectedClass) return;
    
    await deleteFile(filePath, selectedClass.id, (remainingFiles: ClassFile[]) => {
      onFileUpdate(null, remainingFiles);
    });
  }, [selectedClass, deleteFile, onFileUpdate]);

  const handleDeleteSyllabus = useCallback(async () => {
    if (!selectedClass?.syllabus) return;
    
    await deleteSyllabus(selectedClass.syllabus.path, selectedClass.id, () => {
      onSyllabusUpdate(null);
    });
  }, [selectedClass, deleteSyllabus, onSyllabusUpdate]);

  const handleSyllabusClick = useCallback(async () => {
    if (!selectedClass?.syllabus) return;
    
    await openFile(
      selectedClass.syllabus.path, 
      selectedClass.syllabus.name, 
      selectedClass.syllabus.type || 'application/pdf',
      openDocument
    );
  }, [selectedClass, openFile, openDocument]);

  const handleFileClick = useCallback(async (filePath: string, fileName: string, fileType: string) => {
    await openFile(filePath, fileName, fileType, openDocument);
  }, [openFile, openDocument]);

  const handleTasksGenerated = useCallback((taskCount: number) => {
    // Handle successful task generation
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Successfully generated ${taskCount} tasks from syllabus`);
    }
    
    // Trigger task refresh to show new tasks in the UI
    if (onTasksRefresh) {
      onTasksRefresh();
    }
    
    // Note: We don't immediately close the modal here anymore
    // The SyllabusUploadModal will handle showing success confirmation
    // and provide user control over when to close
  }, [onTasksRefresh]);

  if (!show || !selectedClass) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[9999]">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-2xl w-[600px] max-w-[90%] max-h-[90vh] overflow-auto relative z-[10000]">
        <h2 className="text-blue-600 dark:text-blue-400 mt-0 font-bold text-xl">
          {selectedClass.name}
        </h2>

        <div className="mb-5 mt-6">
          <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Upload syllabus</h3>
          
          {/* AI-Powered Upload Option */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 border border-blue-200 dark:border-slate-500 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Smart Upload with AI Task Generation</h4>
                  <p className="text-sm text-gray-600 dark:text-slate-300">Automatically creates tasks from syllabus assignments and deadlines</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiUpload(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center ml-6 mr-2"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Smart Upload
              </button>
            </div>
          </div>

          {/* Regular Upload Option */}
          <details className="mb-4">
            <summary className="cursor-pointer text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white font-medium flex items-center">
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Standard Upload (file storage only)
            </summary>
            
            <div className="mt-3">
              {!selectedClass.syllabus ? (
                <div className="border border-gray-200 dark:border-slate-500 p-5 text-center mb-5 bg-gray-50 dark:bg-slate-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-gray-50 dark:hover:from-slate-600 dark:hover:to-slate-700 transition-all duration-200">
                  <p className="text-gray-700 dark:text-slate-300 mb-4">
                    Drag and drop a syllabus file here, or click to select one
                  </p>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleSyllabusUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="syllabus-upload-standard"
                    />
                    <label
                      htmlFor="syllabus-upload-standard"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg cursor-pointer transition-colors duration-200 shadow-sm"
                    >
                      Choose File
                    </label>
                  </div>
                  {isUploading && (
                    <div className="text-center my-2">
                      <p className="text-blue-600 dark:text-blue-400">Uploading syllabus...</p>
                      <div className="animate-pulse mt-1 h-1 bg-blue-600 dark:bg-blue-400 rounded"></div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-5">
                  <div className="flex justify-between items-center p-2.5 bg-gray-100 dark:bg-slate-700 rounded mb-2.5">
                    <div className="text-gray-900 dark:text-white">
                      <strong>Current Syllabus:</strong>{" "}
                      {selectedClass.syllabus.name}
                      {selectedClass.syllabus.size && (
                        <span className="ml-2.5 text-gray-500 dark:text-slate-400">
                          ({Math.round(selectedClass.syllabus.size / 1024)} KB)
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedClass.syllabus && (
                    <div className="mt-3 mb-3 p-4 bg-gray-50 dark:bg-slate-700 rounded">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-red-500 mr-2"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span 
                            className="text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                            onClick={handleSyllabusClick}
                            title="Click to open syllabus"
                          >
                            {selectedClass.syllabus.name}
                          </span>
                        </div>
                        <button
                          onClick={handleDeleteSyllabus}
                          className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="mt-4 text-gray-700 dark:text-slate-300">
                    Upload a new syllabus to replace the current one:
                  </p>
                  <div className="relative my-2.5">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleSyllabusUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="syllabus-replace-upload"
                    />
                    <label
                      htmlFor="syllabus-replace-upload"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg cursor-pointer transition-colors duration-200 shadow-sm"
                    >
                      Choose File
                    </label>
                  </div>
                  {isUploading && (
                    <div className="text-center my-2">
                      <p className="text-blue-600 dark:text-blue-400">Uploading syllabus...</p>
                      <div className="animate-pulse mt-1 h-1 bg-blue-600 dark:bg-blue-400 rounded"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </details>
        </div>

        <div className="mb-5">
          <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Class files</h3>

          {/* Modern Upload Zone */}
          <div className="relative group">
            <div className="border border-blue-200 dark:border-slate-500 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 rounded-xl p-8 text-center transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-gray-50 dark:hover:from-slate-600 dark:hover:to-slate-700">
              
              {/* Upload Icon */}
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>

              {/* Upload Text */}
              <div className="mb-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Upload course materials
                </h4>
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  Lecture notes, assignments, presentations, and other course materials
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  PDF, DOCX, JPG, PNG, TXT files supported
                </p>
              </div>

              {/* Modern File Input */}
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.docx,.jpg,.jpeg,.png,.txt"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg cursor-pointer transition-colors duration-200 shadow-sm"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Choose Files
                </label>
              </div>

              {/* Upload Progress */}
              {isUploadingFile && (
                <div className="mt-4">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-blue-600 dark:text-blue-400 font-medium">Uploading file...</p>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                    <div className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* File List */}
          {selectedClass.files && selectedClass.files.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                <svg className="h-5 w-5 mr-2 text-gray-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Uploaded files ({selectedClass.files.length})
              </h4>
              <div className="space-y-2">
                {selectedClass.files.map((file, index) => (
                  <div key={file.id || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors duration-150">
                    <div className="flex items-center flex-1 min-w-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-3 flex-shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <span 
                          className="text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium block truncate"
                          onClick={() => handleFileClick(file.path, file.name, file.type || '')}
                          title="Click to open file"
                        >
                          {file.name || 'No filename found'}
                        </span>
                        {file.size && (
                          <span className="text-xs text-gray-500 dark:text-slate-400">
                            {Math.round(file.size / 1024)} KB
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteFile(file.path, index)}
                      className="ml-3 p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-150 flex-shrink-0"
                      type="button"
                      title="Delete file"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6 pt-4 border-t border-gray-200 dark:border-slate-600">
          <button
            onClick={onClose}
            className="bg-gray-100 dark:bg-slate-600 border border-gray-300 dark:border-slate-500 text-gray-700 dark:text-slate-300 py-2 px-6 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-500 transition-colors duration-200 font-medium"
            type="button"
          >
            Close
          </button>

          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white border-none py-2 px-6 rounded-lg cursor-pointer transition-colors duration-200 font-medium shadow-sm"
            type="button"
          >
            Done
          </button>
        </div>
      </div>
      
      {/* AI-Powered Syllabus Upload Modal */}
      <SyllabusUploadModal
        isOpen={showAiUpload}
        onClose={() => setShowAiUpload(false)}
        classId={selectedClass.id}
        className={selectedClass.name}
        onTasksGenerated={handleTasksGenerated}
      />

      {/* Document Viewer Modal */}
      <DocumentViewer
        isOpen={viewerState.isOpen}
        onClose={closeDocument}
        fileUrl={viewerState.fileUrl}
        fileName={viewerState.fileName}
        fileType={viewerState.fileType}
      />
    </div>
  );
};

export default React.memo(SyllabusModal);