import React, { useState, useEffect } from 'react';
import { type AcademicSystem, getCurrentAcademicTerm } from '../utils/academicTermHelpers';
import { 
  useExportFunctionality, 
  ExportTab,
  useImportFunctionality, 
  ImportTab,
  type ExportFormat,
  type ImportFormat 
} from './exportImport';

interface ExportImportPanelProps {
  onClose?: () => void;
}

const ExportImportPanel: React.FC<ExportImportPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  
  // Academic system preference
  const [academicSystem, setAcademicSystem] = useState<AcademicSystem>('semester');

  // Initialize academic system preference
  useEffect(() => {
    const generalSettings = JSON.parse(localStorage.getItem('generalSettings') || '{}');
    const userAcademicSystem = generalSettings?.academicSystem || 'semester';
    setAcademicSystem(userAcademicSystem);
  }, []);

  // Export functionality
  const exportHook = useExportFunctionality({ academicSystem });
  
  // Import functionality
  const importHook = useImportFunctionality();

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('export')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'export'
              ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-slate-100 shadow-sm'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
          }`}
        >
          📤 Export Data
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'import'
              ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-slate-100 shadow-sm'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
          }`}
        >
          📥 Import Data
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'export' ? (
        <ExportTab
          exportState={exportHook.exportState}
          exportFormat={exportHook.exportFormat}
          setExportFormat={exportHook.setExportFormat}
          exportOptions={exportHook.exportOptions}
          setExportOptions={exportHook.setExportOptions}
          handleExport={exportHook.handleExport}
          handleSemesterArchive={exportHook.handleSemesterArchive}
          academicSystem={academicSystem}
        />
      ) : (
        <ImportTab
          fileInputRef={importHook.fileInputRef}
          importState={importHook.importState}
          importFormat={importHook.importFormat}
          setImportFormat={importHook.setImportFormat}
          importOptions={importHook.importOptions}
          setImportOptions={importHook.setImportOptions}
          handleFileSelect={importHook.handleFileSelect}
          handlePreviewImport={importHook.handlePreviewImport}
          handleConfirmImport={importHook.handleConfirmImport}
        />
      )}
    </div>
  );
};

export default ExportImportPanel;