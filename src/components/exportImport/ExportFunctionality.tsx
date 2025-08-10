import React, { useState, useCallback, useEffect } from 'react';
import { 
  exportService, 
  downloadBlob, 
  generateExportFilename,
  type ExportOptions,
  type ExportProgress 
} from '../../services/exportService';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../utils/logger';
import { getAvailableTerms, getCurrentAcademicTerm, type AcademicSystem } from '../../utils/academicTermHelpers';

export type ExportFormat = 'pdf' | 'ics' | 'zip';

export interface ExportState {
  isExporting: boolean;
  progress: ExportProgress | null;
  error: string | null;
}

interface ExportFunctionalityProps {
  academicSystem: AcademicSystem;
}

export const useExportFunctionality = ({ academicSystem }: ExportFunctionalityProps) => {
  const { user } = useAuth();
  
  // Export state
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    progress: null,
    error: null
  });

  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [exportOptions, setExportOptions] = useState({
    includeCompleted: true,
    startDate: '',
    endDate: '',
    semester: '',
    year: new Date().getFullYear()
  });

  // Initialize default term based on current academic term
  useEffect(() => {
    const term = getCurrentAcademicTerm(academicSystem);
    setExportOptions(prev => ({ ...prev, semester: term }));
  }, [academicSystem]);

  // Export handlers
  const handleExport = useCallback(async (format: ExportFormat) => {
    if (!user) {
      setExportState(prev => ({ ...prev, error: 'Please log in to export data' }));
      return;
    }

    setExportState(prev => ({ ...prev, isExporting: true, error: null, progress: null }));

    try {
      const options: ExportOptions = {
        format,
        includeCompleted: exportOptions.includeCompleted,
        startDate: exportOptions.startDate ? new Date(exportOptions.startDate) : undefined,
        endDate: exportOptions.endDate ? new Date(exportOptions.endDate) : undefined,
        dataTypes: ['tasks', 'classes', 'grades']
      };

      const onProgress = (progress: ExportProgress) => {
        setExportState(prev => ({ ...prev, progress }));
      };

      let blob: Blob;
      let filename: string;

      switch (format) {
        case 'pdf':
          blob = await exportService.exportPDF(options, onProgress);
          filename = generateExportFilename('pdf', 'academic-report', {
            semester: exportOptions.semester,
            year: exportOptions.semester ? exportOptions.year : undefined
          });
          break;

        case 'ics':
          blob = await exportService.exportCalendarICS(options, onProgress);
          filename = generateExportFilename('ics', 'calendar');
          break;

        case 'zip':
          blob = await exportService.exportUserFiles(onProgress);
          filename = generateExportFilename('zip', 'user-files');
          break;

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      downloadBlob(blob, filename);
      
      setExportState(prev => ({ 
        ...prev, 
        isExporting: false, 
        progress: { step: 'Complete', progress: 100, message: 'Export completed successfully!' } 
      }));

      // Clear progress after 3 seconds
      setTimeout(() => {
        setExportState(prev => ({ ...prev, progress: null }));
      }, 3000);

    } catch (error) {
      logger.error('Export failed', error);
      setExportState(prev => ({
        ...prev,
        isExporting: false,
        error: error instanceof Error ? error.message : 'Export failed'
      }));
    }
  }, [user, exportOptions]);

  const handleSemesterArchive = useCallback(async () => {
    if (!exportOptions.semester) {
      setExportState(prev => ({ ...prev, error: 'Please select a semester to archive' }));
      return;
    }

    setExportState(prev => ({ ...prev, isExporting: true, error: null }));

    try {
      const onProgress = (progress: ExportProgress) => {
        setExportState(prev => ({ ...prev, progress }));
      };

      const blob = await exportService.exportSemesterArchive(
        exportOptions.semester,
        exportOptions.year,
        onProgress
      );

      const filename = generateExportFilename('json', 'archive', {
        semester: exportOptions.semester,
        year: exportOptions.year
      });

      downloadBlob(blob, filename);
      
      setExportState(prev => ({ 
        ...prev, 
        isExporting: false,
        progress: { step: 'Complete', progress: 100, message: 'Archive created successfully!' }
      }));

      setTimeout(() => {
        setExportState(prev => ({ ...prev, progress: null }));
      }, 3000);

    } catch (error) {
      logger.error('Semester archive failed', error);
      setExportState(prev => ({
        ...prev,
        isExporting: false,
        error: error instanceof Error ? error.message : 'Archive creation failed'
      }));
    }
  }, [exportOptions.semester, exportOptions.year]);

  return {
    exportState,
    exportFormat,
    setExportFormat,
    exportOptions,
    setExportOptions,
    handleExport,
    handleSemesterArchive
  };
};

interface ExportTabProps {
  exportState: ExportState;
  exportFormat: ExportFormat;
  setExportFormat: (format: ExportFormat) => void;
  exportOptions: any;
  setExportOptions: (updater: any) => void;
  handleExport: (format: ExportFormat) => void;
  handleSemesterArchive: () => void;
  academicSystem: AcademicSystem;
}

export const ExportTab: React.FC<ExportTabProps> = ({
  exportState,
  exportFormat,
  setExportFormat,
  exportOptions,
  setExportOptions,
  handleExport,
  handleSemesterArchive,
  academicSystem
}) => {
  return (
    <div className="space-y-6">
      {/* Export Format Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
          Export Format
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { value: 'pdf', label: 'Academic Report', desc: 'Formatted PDF report', icon: '📄' },
            { value: 'ics', label: 'Calendar', desc: 'Academic calendar (ICS)', icon: '📅' },
            { value: 'zip', label: 'File Archive', desc: 'All uploaded files (ZIP)', icon: '📦' }
          ].map((format) => (
            <button
              key={format.value}
              onClick={() => setExportFormat(format.value as ExportFormat)}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                exportFormat === format.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xl">{format.icon}</span>
                <span className="font-medium text-gray-900 dark:text-slate-100">{format.label}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-slate-400">{format.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={exportOptions.includeCompleted}
              onChange={(e) => setExportOptions((prev: any) => ({ ...prev, includeCompleted: e.target.checked }))}
              className="rounded border-gray-300 dark:border-slate-600"
            />
            <span className="text-sm text-gray-700 dark:text-slate-300">Include completed tasks</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Date Range (Optional)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={exportOptions.startDate}
              onChange={(e) => setExportOptions((prev: any) => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              placeholder="Start date"
            />
            <input
              type="date"
              value={exportOptions.endDate}
              onChange={(e) => setExportOptions((prev: any) => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              placeholder="End date"
            />
          </div>
        </div>
      </div>

      {/* Semester Archive */}
      <div className="border-t pt-6 dark:border-slate-600">
        <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-4">
          {academicSystem === 'quarter' ? 'Quarter' : 'Semester'} Archive
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <select
            value={exportOptions.semester}
            onChange={(e) => setExportOptions((prev: any) => ({ ...prev, semester: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          >
            <option value="">Select {academicSystem === 'quarter' ? 'Quarter' : 'Semester'}</option>
            {getAvailableTerms(academicSystem).map(term => (
              <option key={term} value={term}>{term}</option>
            ))}
          </select>
          
          <select
            value={exportOptions.year}
            onChange={(e) => setExportOptions((prev: any) => ({ ...prev, year: parseInt(e.target.value) }))}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <button
            onClick={handleSemesterArchive}
            disabled={exportState.isExporting || !exportOptions.semester}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Create Archive
          </button>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleExport(exportFormat)}
          disabled={exportState.isExporting}
          className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {exportState.isExporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
        </button>
      </div>

      {/* Export Progress */}
      {exportState.progress && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {exportState.progress.step}
            </span>
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {exportState.progress.progress}%
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${exportState.progress.progress}%` }}
            />
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-200">{exportState.progress.message}</p>
        </div>
      )}

      {/* Export Error */}
      {exportState.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-red-500">⚠️</span>
            <span className="text-sm font-medium text-red-900 dark:text-red-100">Export Error</span>
          </div>
          <p className="text-sm text-red-800 dark:text-red-200 mt-1">{exportState.error}</p>
        </div>
      )}
    </div>
  );
};