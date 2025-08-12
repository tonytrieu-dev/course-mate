import { useState, useCallback } from 'react'; // v2: DocumentViewer updated

interface DocumentViewerState {
  isOpen: boolean;
  fileUrl: string;
  fileName: string;
  fileType: string;
}

interface UseDocumentViewerReturn {
  viewerState: DocumentViewerState;
  openDocument: (fileUrl: string, fileName: string, fileType: string) => void;
  closeDocument: () => void;
}

/**
 * Hook for managing document viewer modal state
 */
export const useDocumentViewer = (): UseDocumentViewerReturn => {
  const [viewerState, setViewerState] = useState<DocumentViewerState>({
    isOpen: false,
    fileUrl: '',
    fileName: '',
    fileType: ''
  });

  const openDocument = useCallback((fileUrl: string, fileName: string, fileType: string) => {
    setViewerState({
      isOpen: true,
      fileUrl,
      fileName,
      fileType
    });
  }, []);

  const closeDocument = useCallback(() => {
    setViewerState({
      isOpen: false,
      fileUrl: '',
      fileName: '',
      fileType: ''
    });
  }, []);

  return {
    viewerState,
    openDocument,
    closeDocument
  };
};