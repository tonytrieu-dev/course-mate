import React, { useCallback } from 'react';
import type { ClassWithRelations, ClassSyllabus, ClassFile } from '../types/database';
import { useFileManager } from '../hooks/useFileManager';

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

  if (!show || !selectedClass) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[9999]">
      <div className="bg-white p-5 rounded-xl shadow-2xl w-[600px] max-w-[90%] max-h-[90vh] overflow-auto relative z-[10000]">
        <h2 className="text-blue-600 mt-0 font-bold text-xl">
          {selectedClass.name}
        </h2>

        <div className="mb-5 mt-6">
          <h3 className="font-bold text-lg mb-2">Upload syllabus</h3>
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
    </div>
  );
};

export default SyllabusModal;