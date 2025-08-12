import React, { useState, useEffect, useCallback } from 'react';
import mammoth from 'mammoth';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileType: string;
}

interface ViewerState {
  isLoading: boolean;
  content: string;
  error: string | null;
  viewMode: 'pdf' | 'docx' | 'unsupported';
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileType
}) => {
  const [state, setState] = useState<ViewerState>({
    isLoading: false,
    content: '',
    error: null,
    viewMode: 'unsupported'
  });

  // Determine viewer mode based on file type
  const getViewMode = useCallback((mimeType: string, filename: string): ViewerState['viewMode'] => {
    const lowerFilename = filename.toLowerCase();
    
    // Check by MIME type first
    if (mimeType === 'application/pdf' || lowerFilename.endsWith('.pdf')) {
      return 'pdf';
    }
    
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        lowerFilename.endsWith('.docx')) {
      return 'docx';
    }
    
    return 'unsupported';
  }, []);

  // Load and process .docx files
  const loadDocxFile = useCallback(async (url: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Fetch the .docx file as array buffer
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Convert .docx to HTML using mammoth.js
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      if (result.messages.length > 0) {
        console.warn('Mammoth conversion warnings:', result.messages);
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        content: result.value,
        error: null
      }));
      
    } catch (error) {
      console.error('Error loading .docx file:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        content: '',
        error: error instanceof Error ? error.message : 'Failed to load document'
      }));
    }
  }, []);

  // Initialize viewer when modal opens
  useEffect(() => {
    if (!isOpen || !fileUrl || !fileName) {
      setState({
        isLoading: false,
        content: '',
        error: null,
        viewMode: 'unsupported'
      });
      return;
    }

    const viewMode = getViewMode(fileType, fileName);
    setState(prev => ({ ...prev, viewMode }));

    if (viewMode === 'docx') {
      loadDocxFile(fileUrl);
    } else if (viewMode === 'pdf') {
      // For PDFs, we'll use iframe - no need to load content
      setState(prev => ({ ...prev, isLoading: false, content: '', error: null }));
    } else {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        content: '', 
        error: 'Unsupported file type for in-app viewing' 
      }));
    }
  }, [isOpen, fileUrl, fileName, fileType, getViewMode, loadDocxFile]);

  // Handle download
  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [fileUrl, fileName]);

  // Handle print
  const handlePrint = useCallback(() => {
    if (state.viewMode === 'pdf') {
      // For PDFs, open in new window for printing
      const printWindow = window.open(fileUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } else if (state.viewMode === 'docx' && state.content) {
      // For .docx, create a printable version
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print ${fileName}</title>
              <style>
                body { font-family: 'Times New Roman', serif; margin: 1in; line-height: 1.6; }
                img { max-width: 100%; height: auto; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>${state.content}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
          printWindow.close();
        };
      }
    }
  }, [state.viewMode, state.content, fileUrl, fileName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10020] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col relative">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {state.viewMode === 'pdf' && (
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              )}
              {state.viewMode === 'docx' && (
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  <path d="M8 8h4v1H8V8zM8 10h4v1H8v-1zM8 12h2v1H8v-1z" />
                </svg>
              )}
              <h2 className="text-lg font-semibold truncate max-w-md">{fileName}</h2>
            </div>
          </div>
          
          {/* Control buttons */}
          <div className="flex items-center space-x-2">
            {!state.error && (
              <>
                <button
                  onClick={handlePrint}
                  className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                  title="Print document"
                  aria-label="Print document"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </button>
                
                <button
                  onClick={handleDownload}
                  className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                  title="Download document"
                  aria-label="Download document"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
              </>
            )}
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
              title="Close viewer"
              aria-label="Close document viewer"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {state.isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-slate-300">Loading document...</p>
              </div>
            </div>
          )}

          {state.error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">Unable to Display Document</h3>
                <p className="text-gray-600 dark:text-slate-300 mb-4">{state.error}</p>
                <button
                  onClick={handleDownload}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download File Instead
                </button>
              </div>
            </div>
          )}

          {!state.isLoading && !state.error && state.viewMode === 'pdf' && (
            <iframe
              src={fileUrl}
              className="w-full h-full border-0"
              title={`PDF viewer for ${fileName}`}
            />
          )}

          {!state.isLoading && !state.error && state.viewMode === 'docx' && state.content && (
            <div className="h-full overflow-auto p-6 bg-white dark:bg-slate-900">
              <div 
                className="max-w-4xl mx-auto bg-white dark:bg-slate-800 shadow-lg rounded-lg p-8 prose prose-slate dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: state.content }}
                style={{
                  fontFamily: '"Times New Roman", serif',
                  lineHeight: '1.6',
                  fontSize: '14px'
                }}
              />
            </div>
          )}

          {!state.isLoading && !state.error && state.viewMode === 'unsupported' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">File Type Not Supported</h3>
                <p className="text-gray-600 dark:text-slate-300 mb-4">
                  This file type cannot be displayed in the app. You can download it to view with an external application.
                </p>
                <button
                  onClick={handleDownload}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};