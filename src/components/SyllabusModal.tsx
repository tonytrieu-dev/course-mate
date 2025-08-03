
import React, { useCallback, useState } from 'react';
import type { ClassWithRelations, ClassSyllabus, ClassFile } from '../types/database';
import { useFileManager } from '../hooks/useFileManager';
import { SyllabusUploadModal } from './SyllabusUploadModal';

interface SyllabusModalProps {
  show: boolean;
  selectedClass: ClassWithRelations | null;
  onClose: () => void;
  onSyllabusUpdate: (syllabusRecord: ClassSyllabus | null) => void;
  onFileUpdate: (fileRecord: ClassFile | null, remainingFiles?: ClassFile[]) => void;
}

const SyllabusModal: React.FC<SyllabusModalProps> = ({ 
  show, 
  selectedClass, 
  onClose, 
  onSyllabusUpdate, 
  onFileUpdate 
}) => {
  const [showAiUpload, setShowAiUpload] = useState(false);
  
  const {
    isUploading,
    isUploadingFile,
    uploadSyllabus,
    uploadFile,
    deleteFile,
    deleteSyllabus,
    downloadFile,
  } = useFileManager();

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
    
    await downloadFile(selectedClass.syllabus.path);
  }, [selectedClass, downloadFile]);

  const handleFileClick = useCallback(async (filePath: string) => {
    await downloadFile(filePath);
  }, [downloadFile]);

  const handleTasksGenerated = useCallback((taskCount: number) => {
    // Handle successful task generation
    console.log(`Successfully generated ${taskCount} tasks from syllabus`);
    setShowAiUpload(false); // Close the modal
    // You might want to trigger a refresh of the task list here
    // or show a notification to the user
  }, []);

  if (!show || !selectedClass) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[9999]">
      <div className="bg-white p-5 rounded-xl shadow-2xl w-[600px] max-w-[90%] max-h-[90vh] overflow-auto relative z-[10000]">
        <h2 className="text-blue-600 mt-0 font-bold text-xl">
          {selectedClass.name}
        </h2>

        <div className="mb-5 mt-6">
          <h3 className="font-bold text-lg mb-2">Upload syllabus</h3>
          
          {/* AI-Powered Upload Option */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div>
                  <h4 className="font-medium text-gray-900">Smart Upload with AI Task Generation</h4>
                  <p className="text-sm text-gray-600">Upload your syllabus and automatically generate tasks from assignments and due dates</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiUpload(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center"
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
            <summary className="cursor-pointer text-gray-700 hover:text-gray-900 font-medium flex items-center">
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H7a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Standard Upload (file storage only)
            </summary>
            
            <div className="mt-3">
              {!selectedClass.syllabus ? (
                <div className="border-2 border-dashed border-gray-300 p-5 text-center mb-5">
                  <p>
                    Drag and drop a syllabus file here, or click to select one
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleSyllabusUpload}
                    className="block mx-auto my-2.5"
                  />
                  {isUploading && (
                    <div className="text-center my-2">
                      <p className="text-blue-600">Uploading syllabus...</p>
                      <div className="animate-pulse mt-1 h-1 bg-blue-600 rounded"></div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-5">
                  <div className="flex justify-between items-center p-2.5 bg-gray-100 rounded mb-2.5">
                    <div>
                      <strong>Current Syllabus:</strong>{" "}
                      {selectedClass.syllabus.name}
                      {selectedClass.syllabus.size && (
                        <span className="ml-2.5 text-gray-500">
                          ({Math.round(selectedClass.syllabus.size / 1024)} KB)
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedClass.syllabus && (
                    <div className="mt-3 mb-3 p-4 bg-gray-50 rounded">
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
                            className="text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                            onClick={handleSyllabusClick}
                            title="Click to open syllabus"
                          >
                            {selectedClass.syllabus.name}
                          </span>
                        </div>
                        <button
                          onClick={handleDeleteSyllabus}
                          className="text-red-500 hover:text-red-700"
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="mt-4">
                    Upload a new syllabus to replace the current one:
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleSyllabusUpload}
                    className="block my-2.5"
                  />
                  {isUploading && (
                    <div className="text-center my-2">
                      <p className="text-blue-600">Uploading syllabus...</p>
                      <div className="animate-pulse mt-1 h-1 bg-blue-600 rounded"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </details>
        </div>

        <div className="mb-5">
          <h3 className="font-bold text-lg mb-2">Class files</h3>

          <div className="border-2 border-dashed border-gray-300 p-5 text-center mb-5">
            <p>
              Upload lecture notes, assignments, and other course materials
            </p>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
              onChange={handleFileUpload}
              className="block mx-auto my-2.5"
            />
            {isUploadingFile && (
              <div className="text-center my-2">
                <p className="text-blue-600">Uploading file...</p>
                <div className="animate-pulse mt-1 h-1 bg-blue-600 rounded"></div>
              </div>
            )}
          </div>

          {selectedClass.files && selectedClass.files.length > 0 ? (
            <div>
              <h4 className="font-semibold mb-2">Uploaded files</h4>
              <ul className="divide-y divide-gray-200">
                {selectedClass.files.map((file, index) => (
                  <li key={file.id || index} className="py-3 flex justify-between items-center">
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-blue-500 mr-2"
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
                        className="text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                        onClick={() => handleFileClick(file.path)}
                        title="Click to open file"
                      >
                        {file.name || 'No filename found'}
                      </span>
                      {file.size && (
                        <span className="ml-2 text-gray-500 text-sm">
                          ({Math.round(file.size / 1024)} KB)
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteFile(file.path, index)}
                      className="text-red-500 hover:text-red-700"
                      type="button"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500 text-center">No files uploaded yet</p>
          )}
        </div>

        <div className="flex justify-between mt-5">
          <button
            onClick={onClose}
            className="bg-gray-100 border border-gray-300 py-2 px-4 rounded cursor-pointer hover:bg-gray-200 transition-colors"
            type="button"
          >
            Close
          </button>

          <button
            onClick={onClose}
            className="bg-blue-600 text-white border-none py-2 px-4 rounded cursor-pointer hover:bg-blue-700 transition-colors"
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
    </div>
  );
};

export default SyllabusModal;