import React, { useState, useEffect, useCallback } from 'react';
import mammoth from 'mammoth';
import { renderAsync } from 'docx-preview';

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
  renderer: 'docx-preview' | 'mammoth' | null;
}

// Cache buster: Updated DocumentViewer with printer button removed and dark mode fixes
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
    viewMode: 'unsupported',
    renderer: null
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

  // Dual-system .docx loading: docx-preview primary, mammoth.js fallback (to avoid OAuth issues)
  const loadDocxFile = useCallback(async (url: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Fetch the .docx file as array buffer
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Try docx-preview first for better formatting
      try {
        console.log('Attempting docx-preview rendering...');
        
        // Create container for docx-preview
        const container = document.createElement('div');
        container.className = 'docx-preview-container';
        
        // Render with docx-preview
        await renderAsync(arrayBuffer, container, undefined, {
          className: 'docx',
          inWrapper: false,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
          trimXmlDeclaration: true,
          debug: false
        });
        
        // Check for OAuth issues by scanning for typical OAuth iframe content
        const oauthIndicators = [
          'oauth.officeapps.live.com',
          'view.officeapps.live.com',
          'Microsoft Office Online',
          'sign in to your account',
          'authentication required'
        ];
        
        const containerHTML = container.innerHTML.toLowerCase();
        const hasOAuthIssues = oauthIndicators.some(indicator => 
          containerHTML.includes(indicator.toLowerCase())
        );
        
        if (hasOAuthIssues || container.innerHTML.trim().length < 50) {
          throw new Error('docx-preview triggered OAuth authentication or failed to render content');
        }
        
        console.log('docx-preview rendering successful');
        
        // Keep original Word colors - no dark mode overrides for docx-preview
        console.log('docx-preview: keeping original Word document colors');
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          content: container.innerHTML,
          error: null,
          renderer: 'docx-preview'
        }));
        
      } catch (docxPreviewError) {
        console.warn('docx-preview failed, falling back to mammoth.js:', docxPreviewError);
        
        // Fallback to mammoth.js with enhanced style mapping
        const result = await mammoth.convertToHtml({ arrayBuffer }, {
          styleMap: [
            // Heading styles
            "p[style-name='Title'] => h1.document-title",
            "p[style-name='Heading 1'] => h1.heading-1",
            "p[style-name='Heading 2'] => h2.heading-2", 
            "p[style-name='Heading 3'] => h3.heading-3",
            "p[style-name='Heading 4'] => h4.heading-4",
            "p[style-name='Heading 5'] => h5.heading-5",
            "p[style-name='Heading 6'] => h6.heading-6",
            
            // Paragraph styles
            "p[style-name='Normal'] => p.normal-text",
            "p[style-name='Body Text'] => p.body-text",
            "p[style-name='Body Text Indent'] => p.body-text-indent",
            "p[style-name='Quote'] => blockquote.quote-text",
            "p[style-name='Intense Quote'] => blockquote.intense-quote",
            
            // Character styles
            "r[style-name='Strong'] => strong.strong-text",
            "r[style-name='Emphasis'] => em.emphasis-text",
            "r[style-name='Subtle Emphasis'] => span.subtle-emphasis",
            "r[style-name='Intense Emphasis'] => strong.intense-emphasis",
            "r[style-name='Book Title'] => cite.book-title",
            
            // List styles
            "p[style-name='List Paragraph'] => p.list-paragraph",
            "p[style-name='No Spacing'] => p.no-spacing"
          ]
        });
        
        if (result.messages.length > 0) {
          console.warn('Mammoth conversion warnings:', result.messages);
        }
        
        console.log('mammoth.js fallback successful');
        setState(prev => ({
          ...prev,
          isLoading: false,
          content: result.value,
          error: null,
          renderer: 'mammoth'
        }));
      }
      
    } catch (error) {
      console.error('Error loading .docx file with both renderers:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        content: '',
        error: error instanceof Error ? error.message : 'Failed to load document',
        renderer: null
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
        viewMode: 'unsupported',
        renderer: null
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
                body { 
                  font-family: 'Times New Roman', serif; 
                  margin: 1in; 
                  line-height: 1.6; 
                  font-size: 14px;
                  color: #1f2937;
                }
                h1.document-title {
                  font-size: 24px;
                  font-weight: bold;
                  text-align: center;
                  margin: 24px 0 18px 0;
                }
                h1.heading-1 { font-size: 20px; font-weight: bold; margin: 20px 0 12px 0; }
                h2.heading-2 { font-size: 18px; font-weight: bold; margin: 18px 0 10px 0; }
                h3.heading-3 { font-size: 16px; font-weight: bold; margin: 16px 0 8px 0; }
                h4.heading-4, h5.heading-5, h6.heading-6 { 
                  font-size: 14px; font-weight: bold; margin: 14px 0 6px 0; 
                }
                p.normal-text, p.body-text { margin: 12px 0; text-align: justify; }
                p.body-text-indent { margin: 12px 0; text-indent: 0.5in; text-align: justify; }
                blockquote.quote-text {
                  margin: 16px 20px; padding: 12px 20px; border-left: 4px solid #d1d5db;
                  background-color: #f9fafb; font-style: italic;
                }
                blockquote.intense-quote {
                  margin: 16px 20px; padding: 12px 20px; border-left: 4px solid #3b82f6;
                  background-color: #eff6ff; font-style: italic; font-weight: 500;
                }
                strong.strong-text, strong.intense-emphasis { font-weight: bold; }
                em.emphasis-text { font-style: italic; }
                span.subtle-emphasis { font-style: italic; color: #6b7280; }
                cite.book-title { font-style: italic; text-decoration: underline; }
                p.list-paragraph { margin: 6px 0 6px 20px; }
                p.no-spacing { margin: 0; }
                img { max-width: 100%; height: auto; margin: 16px 0; }
                table { 
                  border-collapse: collapse; 
                  width: 100%; 
                  margin: 16px 0; 
                  border: 1px solid #d1d5db; 
                }
                th, td { 
                  border: 1px solid #d1d5db; 
                  padding: 8px 12px; 
                  text-align: left; 
                  vertical-align: top; 
                }
                th { background-color: #f3f4f6; font-weight: bold; }
                ul, ol { margin: 12px 0; padding-left: 24px; }
                li { margin: 4px 0; line-height: 1.5; }
                @media print { 
                  body { margin: 0.5in; } 
                  h1.document-title { page-break-after: avoid; }
                  h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }
                  blockquote { page-break-inside: avoid; }
                  table { page-break-inside: avoid; }
                  img { page-break-inside: avoid; }
                }
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
        {/* Header - Updated to remove printer button */}
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
              {state.renderer && state.viewMode === 'docx' && (
                <span className="text-xs text-blue-200 ml-2">
                  via {state.renderer}
                </span>
              )}
            </div>
          </div>
          
          {/* Control buttons - NO PRINTER BUTTON (cache bust v2) */}
          <div className="flex items-center space-x-2">
            {!state.error && (
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
                className={`max-w-4xl mx-auto bg-white dark:bg-slate-800 shadow-lg rounded-lg p-8 max-w-none ${
                  state.renderer === 'docx-preview' ? 'docx-preview-content' : 'document-content prose prose-slate dark:prose-invert'
                }`}
                dangerouslySetInnerHTML={{ __html: state.content }}
                style={state.renderer === 'mammoth' ? {
                  fontFamily: '"Times New Roman", serif',
                  lineHeight: '1.6',
                  fontSize: '14px'
                } : {}}
              />
              <style data-version="cache-bust-v2">{`
                /* docx-preview specific styles - Same for light AND dark mode */
                .docx-preview-content {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Times New Roman', serif !important;
                  line-height: 1.5 !important;
                  background-color: white !important;
                  padding: 20px !important;
                  border-radius: 8px !important;
                }
                .docx-preview-content .docx {
                  width: 100% !important;
                  max-width: none !important;
                  margin: 0 !important;
                  background: white !important;
                  border: none !important;
                  box-shadow: none !important;
                }
                .docx-preview-content table {
                  width: 100% !important;
                  border-collapse: collapse !important;
                  border: 1px solid #d1d5db !important;
                  margin: 16px 0 !important;
                }
                .docx-preview-content td, .docx-preview-content th {
                  border: 1px solid #d1d5db !important;
                  padding: 8px 12px !important;
                  vertical-align: top !important;
                }
                .docx-preview-content th {
                  background-color: #f3f4f6 !important;
                  font-weight: bold !important;
                }
                .docx-preview-content p {
                  margin: 8px 0 !important;
                  line-height: 1.6 !important;
                }
                
                /* Mammoth.js specific styles (existing) */
                .document-content h1.document-title {
                  font-size: 24px;
                  font-weight: bold;
                  text-align: center;
                  margin: 24px 0 18px 0;
                  color: #1f2937;
                }
                .document-content h1.heading-1 {
                  font-size: 20px;
                  font-weight: bold;
                  margin: 20px 0 12px 0;
                  color: #1f2937;
                }
                .document-content h2.heading-2 {
                  font-size: 18px;
                  font-weight: bold;
                  margin: 18px 0 10px 0;
                  color: #374151;
                }
                .document-content h3.heading-3 {
                  font-size: 16px;
                  font-weight: bold;
                  margin: 16px 0 8px 0;
                  color: #4b5563;
                }
                .document-content h4.heading-4,
                .document-content h5.heading-5,
                .document-content h6.heading-6 {
                  font-size: 14px;
                  font-weight: bold;
                  margin: 14px 0 6px 0;
                  color: #6b7280;
                }
                .document-content p.normal-text,
                .document-content p.body-text {
                  margin: 12px 0;
                  text-align: justify;
                  color: #1f2937;
                }
                .document-content p.body-text-indent {
                  margin: 12px 0;
                  text-indent: 0.5in;
                  text-align: justify;
                  color: #1f2937;
                }
                .document-content blockquote.quote-text {
                  margin: 16px 20px;
                  padding: 12px 20px;
                  border-left: 4px solid #d1d5db;
                  background-color: #f9fafb;
                  font-style: italic;
                  color: #4b5563;
                }
                .document-content blockquote.intense-quote {
                  margin: 16px 20px;
                  padding: 12px 20px;
                  border-left: 4px solid #3b82f6;
                  background-color: #eff6ff;
                  font-style: italic;
                  font-weight: 500;
                  color: #1e40af;
                }
                .document-content strong.strong-text,
                .document-content strong.intense-emphasis {
                  font-weight: bold;
                  color: #1f2937;
                }
                .document-content em.emphasis-text {
                  font-style: italic;
                  color: #374151;
                }
                .document-content span.subtle-emphasis {
                  color: #6b7280;
                  font-style: italic;
                }
                .document-content cite.book-title {
                  font-style: italic;
                  text-decoration: underline;
                  color: #1e40af;
                }
                .document-content p.list-paragraph {
                  margin: 6px 0 6px 20px;
                  color: #1f2937;
                }
                .document-content p.no-spacing {
                  margin: 0;
                  color: #1f2937;
                }
                .document-content table {
                  border-collapse: collapse;
                  width: 100%;
                  margin: 16px 0;
                  border: 1px solid #d1d5db;
                }
                .document-content table th,
                .document-content table td {
                  border: 1px solid #d1d5db;
                  padding: 8px 12px;
                  text-align: left;
                  vertical-align: top;
                }
                .document-content table th {
                  background-color: #f3f4f6;
                  font-weight: bold;
                  color: #1f2937;
                }
                .document-content img {
                  max-width: 100%;
                  height: auto;
                  margin: 16px 0;
                  border-radius: 4px;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                .document-content ul,
                .document-content ol {
                  margin: 12px 0;
                  padding-left: 24px;
                }
                .document-content li {
                  margin: 4px 0;
                  line-height: 1.5;
                  color: #1f2937;
                }
                
                /* Dark mode styles */
                .dark .document-content h1.document-title,
                .dark .document-content h1.heading-1 { color: #f9fafb; }
                .dark .document-content h2.heading-2 { color: #e5e7eb; }
                .dark .document-content h3.heading-3 { color: #d1d5db; }
                .dark .document-content h4.heading-4,
                .dark .document-content h5.heading-5,
                .dark .document-content h6.heading-6 { color: #9ca3af; }
                .dark .document-content p.normal-text,
                .dark .document-content p.body-text,
                .dark .document-content p.body-text-indent,
                .dark .document-content p.list-paragraph,
                .dark .document-content p.no-spacing,
                .dark .document-content li { color: #f3f4f6; }
                .dark .document-content blockquote.quote-text {
                  border-left-color: #4b5563;
                  background-color: #374151;
                  color: #d1d5db;
                }
                .dark .document-content blockquote.intense-quote {
                  border-left-color: #60a5fa;
                  background-color: #1e3a8a;
                  color: #dbeafe;
                }
                .dark .document-content strong.strong-text,
                .dark .document-content strong.intense-emphasis { color: #f9fafb; }
                .dark .document-content em.emphasis-text { color: #e5e7eb; }
                .dark .document-content span.subtle-emphasis { color: #9ca3af; }
                .dark .document-content cite.book-title { color: #93c5fd; }
                .dark .document-content table {
                  border-color: #4b5563;
                }
                .dark .document-content table th,
                .dark .document-content table td {
                  border-color: #4b5563;
                }
                .dark .document-content table th {
                  background-color: #374151;
                  color: #f9fafb;
                }
              `}</style>
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