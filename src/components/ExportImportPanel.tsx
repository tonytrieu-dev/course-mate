import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  exportService, 
  downloadBlob, 
  generateExportFilename,
  type ExportOptions,
  type ExportProgress 
} from '../services/exportService';
import { 
  importService,
  type ImportOptions,
  type ImportProgress,
  type ImportResult,
  type ImportPreview 
} from '../services/importService';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import { getAvailableTerms, getCurrentAcademicTerm, type AcademicSystem } from '../utils/academicTermHelpers';
import { storage } from '../utils/storage';
import type { AppSettings } from '../types/database';

interface ExportImportPanelProps {
  onClose?: () => void;
}

type ExportFormat = 'json' | 'csv' | 'ics';
type ImportFormat = 'json' | 'csv' | 'ics';

interface ExportState {
  isExporting: boolean;
  progress: ExportProgress | null;
  error: string | null;
}

interface ImportState {
  isImporting: boolean;
  progress: ImportProgress | null;
  error: string | null;
  preview: ImportPreview | null;
  showPreview: boolean;
  selectedFile: File | null;
}

const ExportImportPanel: React.FC<ExportImportPanelProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Academic system preference
  const [academicSystem, setAcademicSystem] = useState<AcademicSystem>('semester');

  // Export state
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    progress: null,
    error: null
  });

  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [exportOptions, setExportOptions] = useState({
    includeCompleted: true,
    startDate: '',
    endDate: '',
    semester: '',
    year: new Date().getFullYear()
  });

  // Initialize academic system preference
  useEffect(() => {
    const generalSettings = JSON.parse(localStorage.getItem('generalSettings') || '{}');
    const userAcademicSystem = generalSettings?.academicSystem || 'semester';
    setAcademicSystem(userAcademicSystem);
    
    // Set default term based on current academic term
    const term = getCurrentAcademicTerm(userAcademicSystem);
    setExportOptions(prev => ({ ...prev, semester: term }));
  }, []);

  // Import state
  const [importState, setImportState] = useState<ImportState>({
    isImporting: false,
    progress: null,
    error: null,
    preview: null,
    showPreview: false,
    selectedFile: null
  });

  const [importFormat, setImportFormat] = useState<ImportFormat>('json');
  const [importOptions, setImportOptions] = useState<{
    skipDuplicates: boolean;
    validateData: boolean;
    conflictResolution: 'skip' | 'overwrite' | 'merge';
  }>({
    skipDuplicates: true,
    validateData: true,
    conflictResolution: 'skip'
  });

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
        case 'json':
          blob = await exportService.exportJSON(options, onProgress);
          filename = generateExportFilename('json', 'complete', {
            semester: exportOptions.semester,
            year: exportOptions.semester ? exportOptions.year : undefined
          });
          break;

        case 'csv':
          blob = await exportService.exportGradesCSV(options, onProgress);
          filename = generateExportFilename('csv', 'grades');
          break;

        case 'ics':
          blob = await exportService.exportCalendarICS(options, onProgress);
          filename = generateExportFilename('ics', 'calendar');
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

  // Import handlers
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Auto-detect format from file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'json' || extension === 'csv' || extension === 'ics') {
      setImportFormat(extension);
    }

    setImportState(prev => ({
      ...prev,
      selectedFile: file,
      error: null,
      preview: null,
      showPreview: false
    }));
  }, []);

  const handlePreviewImport = useCallback(async () => {
    if (!importState.selectedFile) return;

    setImportState(prev => ({ ...prev, isImporting: true, error: null }));

    try {
      const options: ImportOptions = {
        format: importFormat,
        ...importOptions,
        preview: true
      };

      const preview = await importService.previewImport(importState.selectedFile, options);
      
      setImportState(prev => ({
        ...prev,
        isImporting: false,
        preview,
        showPreview: true
      }));

    } catch (error) {
      logger.error('Import preview failed', error);
      setImportState(prev => ({
        ...prev,
        isImporting: false,
        error: error instanceof Error ? error.message : 'Preview failed'
      }));
    }
  }, [importState.selectedFile, importFormat, importOptions]);

  const handleConfirmImport = useCallback(async () => {
    if (!importState.selectedFile) return;

    setImportState(prev => ({ ...prev, isImporting: true, error: null, showPreview: false }));

    try {
      const options: ImportOptions = {
        format: importFormat,
        ...importOptions
      };

      const onProgress = (progress: ImportProgress) => {
        setImportState(prev => ({ ...prev, progress }));
      };

      let result: ImportResult;

      switch (importFormat) {
        case 'json':
          result = await importService.importJSON(importState.selectedFile, options, onProgress);
          break;
        case 'csv':
          result = await importService.importTasksCSV(importState.selectedFile, options, onProgress);
          break;
        case 'ics':
          result = await importService.importCalendarICS(importState.selectedFile, options, onProgress);
          break;
        default:
          throw new Error(`Unsupported import format: ${importFormat}`);
      }

      if (result.success) {
        setImportState(prev => ({
          ...prev,
          isImporting: false,
          progress: {
            step: 'Complete',
            progress: 100,
            message: `Import completed! ${result.summary.imported.tasks + result.summary.imported.classes} items imported.`
          }
        }));

        // Clear progress after 3 seconds
        setTimeout(() => {
          setImportState(prev => ({ ...prev, progress: null, selectedFile: null, preview: null }));
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 3000);
      } else {
        throw new Error('Import failed with errors');
      }

    } catch (error) {
      logger.error('Import failed', error);
      setImportState(prev => ({
        ...prev,
        isImporting: false,
        error: error instanceof Error ? error.message : 'Import failed'
      }));
    }
  }, [importState.selectedFile, importFormat, importOptions]);

  const renderExportTab = () => (
    <div className="space-y-6">
      {/* Export Format Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
          Export Format
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { value: 'json', label: 'Complete Backup', desc: 'Full data backup (JSON)', icon: '📁' },
            { value: 'csv', label: 'Grade Report', desc: 'Grades and transcripts (CSV)', icon: '📊' },
            { value: 'ics', label: 'Calendar', desc: 'Academic calendar (ICS)', icon: '📅' }
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
              onChange={(e) => setExportOptions(prev => ({ ...prev, includeCompleted: e.target.checked }))}
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
              onChange={(e) => setExportOptions(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              placeholder="Start date"
            />
            <input
              type="date"
              value={exportOptions.endDate}
              onChange={(e) => setExportOptions(prev => ({ ...prev, endDate: e.target.value }))}
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
            onChange={(e) => setExportOptions(prev => ({ ...prev, semester: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          >
            <option value="">Select {academicSystem === 'quarter' ? 'Quarter' : 'Semester'}</option>
            {getAvailableTerms(academicSystem).map(term => (
              <option key={term} value={term}>{term}</option>
            ))}
          </select>
          
          <select
            value={exportOptions.year}
            onChange={(e) => setExportOptions(prev => ({ ...prev, year: parseInt(e.target.value) }))}
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

  const renderImportTab = () => (
    <div className="space-y-6">
      {/* File Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
          Select Import File
        </label>
        <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv,.ics"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {importState.selectedFile ? (
            <div className="space-y-2">
              <div className="text-lg">📄</div>
              <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                {importState.selectedFile.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-400">
                {(importState.selectedFile.size / 1024).toFixed(1)} KB
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Choose different file
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-2xl">📤</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">
                Click to select a file or drag and drop
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                Choose File
              </button>
              <div className="text-xs text-gray-500 dark:text-slate-400">
                Supported: JSON, CSV, ICS files
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Import Options */}
      {importState.selectedFile && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Import Options
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={importOptions.skipDuplicates}
                  onChange={(e) => setImportOptions(prev => ({ ...prev, skipDuplicates: e.target.checked }))}
                  className="rounded border-gray-300 dark:border-slate-600"
                />
                <span className="text-sm text-gray-700 dark:text-slate-300">Skip duplicate items</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={importOptions.validateData}
                  onChange={(e) => setImportOptions(prev => ({ ...prev, validateData: e.target.checked }))}
                  className="rounded border-gray-300 dark:border-slate-600"
                />
                <span className="text-sm text-gray-700 dark:text-slate-300">Validate data before import</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Conflict Resolution
            </label>
            <select
              value={importOptions.conflictResolution}
              onChange={(e) => {
                const value = e.target.value as 'skip' | 'overwrite' | 'merge';
                setImportOptions(prev => ({ 
                  ...prev, 
                  conflictResolution: value
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
            >
              <option value="skip">Skip conflicting items</option>
              <option value="overwrite">Overwrite existing items</option>
              <option value="merge">Merge with existing items</option>
            </select>
          </div>
        </div>
      )}

      {/* Import Buttons */}
      {importState.selectedFile && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handlePreviewImport}
            disabled={importState.isImporting}
            className="flex-1 sm:flex-none px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {importState.isImporting ? 'Analyzing...' : 'Preview Import'}
          </button>
          
          {importState.preview && (
            <button
              onClick={handleConfirmImport}
              disabled={importState.isImporting || !importState.preview.valid}
              className="flex-1 sm:flex-none px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Confirm Import
            </button>
          )}
        </div>
      )}

      {/* Import Preview */}
      {importState.preview && importState.showPreview && (
        <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-3">Import Preview</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {importState.preview.summary.tasks}
              </div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {importState.preview.summary.classes}
              </div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Classes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {importState.preview.summary.taskTypes}
              </div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Task Types</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {importState.preview.summary.estimatedImportTime}s
              </div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Est. Time</div>
            </div>
          </div>

          {importState.preview.validation.warnings.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-3">
              <div className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">Warnings:</div>
              <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                {importState.preview.validation.warnings.slice(0, 3).map((warning, index) => (
                  <li key={index}>• {warning.message}</li>
                ))}
                {importState.preview.validation.warnings.length > 3 && (
                  <li className="text-yellow-600 dark:text-yellow-400">
                    ... and {importState.preview.validation.warnings.length - 3} more
                  </li>
                )}
              </ul>
            </div>
          )}

          {!importState.preview.valid && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">Errors:</div>
              <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                {importState.preview.validation.errors.slice(0, 3).map((error, index) => (
                  <li key={index}>• {error.message}</li>
                ))}
                {importState.preview.validation.errors.length > 3 && (
                  <li className="text-red-600 dark:text-red-400">
                    ... and {importState.preview.validation.errors.length - 3} more
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Import Progress */}
      {importState.progress && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-900 dark:text-green-100">
              {importState.progress.step}
            </span>
            <span className="text-sm text-green-700 dark:text-green-300">
              {importState.progress.progress}%
            </span>
          </div>
          <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2 mb-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${importState.progress.progress}%` }}
            />
          </div>
          <p className="text-sm text-green-800 dark:text-green-200">{importState.progress.message}</p>
          {importState.progress.processed && importState.progress.total && (
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              {importState.progress.processed} of {importState.progress.total} items processed
            </p>
          )}
        </div>
      )}

      {/* Import Error */}
      {importState.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-red-500">⚠️</span>
            <span className="text-sm font-medium text-red-900 dark:text-red-100">Import Error</span>
          </div>
          <p className="text-sm text-red-800 dark:text-red-200 mt-1">{importState.error}</p>
        </div>
      )}
    </div>
  );

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
      {activeTab === 'export' ? renderExportTab() : renderImportTab()}
    </div>
  );
};

export default ExportImportPanel;