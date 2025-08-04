import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SyllabusUploadModal } from './SyllabusUploadModal';
import { fetchCanvasCalendar } from '../services/canvasService';
import { integrateCanvasTasksWithGrades } from '../services/grade/canvasGradeIntegration';
import { getClasses } from '../services/class/classOperations';
import { getTasks } from '../services/dataService';
import type { Class } from '../types/database';

interface AssignmentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (message: string) => void;
}

interface ImportMethod {
  id: 'syllabus' | 'canvas';
  title: string;
  description: string;
  icon: string;
  benefits: string[];
  requirements: string[];
}

interface CanvasImportStep {
  step: number;
  title: string;
  description: string;
  completed: boolean;
}

const AssignmentImportModal: React.FC<AssignmentImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const { user, isAuthenticated } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<'syllabus' | 'canvas' | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [syllabusModalOpen, setSyllabusModalOpen] = useState(false);
  const [canvasImportSteps, setCanvasImportSteps] = useState<CanvasImportStep[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    tasksImported: number;
    assignmentsCreated: number;
    categoriesCreated: number;
    errors: string[];
  } | null>(null);

  const importMethods: ImportMethod[] = [
    {
      id: 'syllabus',
      title: '🎯 AI Syllabus Upload',
      description: 'Upload your PDF syllabus and let AI extract all assignments automatically',
      icon: '📄',
      benefits: [
        'Extracts ALL assignments from syllabus',
        'Automatically detects due dates',
        'Creates proper assignment categories',
        'Works with any college syllabus format',
        'Perfect for start of semester'
      ],
      requirements: [
        'PDF syllabus file',
        'Clear assignment dates in syllabus',
        'Academic content (validated by AI)'
      ]
    },
    {
      id: 'canvas',
      title: '📅 Canvas Integration',
      description: 'Import assignments from your Canvas calendar and convert to gradeable assignments',
      icon: '🔗',
      benefits: [
        'Syncs with your Canvas calendar',
        'Imports all assignment due dates',
        'Converts to gradeable assignments',
        'Maintains Canvas assignment details',
        'Great for ongoing semester management'
      ],
      requirements: [
        'Canvas ICS calendar URL',
        'Active Canvas assignments',
        'Existing Canvas integration setup'
      ]
    }
  ];

  // Load classes when modal opens
  React.useEffect(() => {
    const loadClasses = async () => {
      if (!user?.id || !isOpen) return;
      
      try {
        const classesData = await getClasses(user.id, isAuthenticated);
        setClasses(classesData);
      } catch (error) {
        console.error('Error loading classes:', error);
      }
    };

    loadClasses();
  }, [user?.id, isAuthenticated, isOpen]);

  const handleMethodSelect = (method: 'syllabus' | 'canvas') => {
    setSelectedMethod(method);
    setImportResults(null);
    
    if (method === 'canvas') {
      setCanvasImportSteps([
        { step: 1, title: 'Import Canvas Tasks', description: 'Fetch assignments from Canvas calendar', completed: false },
        { step: 2, title: 'Analyze Tasks', description: 'AI analyzes task types and categories', completed: false },
        { step: 3, title: 'Create Categories', description: 'Set up grade categories automatically', completed: false },
        { step: 4, title: 'Create Assignments', description: 'Convert tasks to gradeable assignments', completed: false }
      ]);
    }
  };

  const handleSyllabusUpload = (classId: string) => {
    setSelectedClassId(classId);
    setSyllabusModalOpen(true);
  };

  const handleSyllabusTasksGenerated = (taskCount: number) => {
    setSyllabusModalOpen(false);
    onImportComplete?.(`Successfully generated ${taskCount} assignments from syllabus!`);
    onClose();
  };

  const handleCanvasImport = async () => {
    if (!selectedClassId || !user?.id) {
      alert('Please select a class first');
      return;
    }

    setIsImporting(true);
    
    try {
      // Step 1: Check for existing Canvas tasks
      const existingTasks = await getTasks(user.id, isAuthenticated);
      const canvasTasks = existingTasks.filter(task => task.canvas_uid);
      
      setCanvasImportSteps(prev => prev.map(step => 
        step.step === 1 ? { ...step, completed: true } : step
      ));

      if (canvasTasks.length === 0) {
        throw new Error('No Canvas tasks found. Please import Canvas calendar first from Settings → Canvas Sync');
      }

      // Step 2: Analyze and integrate tasks
      const { analyses, summary } = await integrateCanvasTasksWithGrades(user.id, {
        minConfidence: 0.6,
        createCategories: true,
        useSupabase: isAuthenticated
      });

      setCanvasImportSteps(prev => prev.map(step => 
        step.step <= 2 ? { ...step, completed: true } : step
      ));

      // Step 3 & 4: Categories and assignments created
      setCanvasImportSteps(prev => prev.map(step => ({ ...step, completed: true })));

      setImportResults({
        tasksImported: analyses.length,
        assignmentsCreated: summary.createdAssignments,
        categoriesCreated: summary.createdCategories,
        errors: summary.errors
      });

      if (summary.createdAssignments > 0) {
        onImportComplete?.(`Successfully created ${summary.createdAssignments} assignments from Canvas tasks!`);
      }

    } catch (error) {
      console.error('Canvas import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setImportResults({
        tasksImported: 0,
        assignmentsCreated: 0,
        categoriesCreated: 0,
        errors: [errorMessage]
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetModal = () => {
    setSelectedMethod(null);
    setSelectedClassId('');
    setImportResults(null);
    setCanvasImportSteps([]);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
        <div className="relative bg-white dark:bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200 dark:border-slate-700/50 w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700/50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Import Assignments</h2>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Choose how you want to import assignments for grading
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-auto max-h-[calc(90vh-140px)]">
            {!selectedMethod ? (
              /* Method Selection */
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Choose Your Import Method
                  </h3>
                  <p className="text-gray-600 dark:text-slate-400">
                    Both methods create assignment templates that you can manually grade
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {importMethods.map((method) => (
                    <div
                      key={method.id}
                      className="border-2 border-gray-200 dark:border-slate-700/50 rounded-lg p-6 hover:border-blue-300 dark:hover:border-blue-600/50 transition-colors cursor-pointer group"
                      onClick={() => handleMethodSelect(method.id)}
                    >
                      <div className="text-center mb-4">
                        <div className="text-4xl mb-2">{method.icon}</div>
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {method.title}
                        </h4>
                        <p className="text-gray-600 dark:text-slate-400 mt-2">
                          {method.description}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">✅ Benefits:</h5>
                          <ul className="text-sm text-gray-600 dark:text-slate-400 space-y-1">
                            {method.benefits.map((benefit, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-green-500 mr-2">•</span>
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">📋 Requirements:</h5>
                          <ul className="text-sm text-gray-600 dark:text-slate-400 space-y-1">
                            {method.requirements.map((requirement, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                {requirement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-6 text-center">
                        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
                          Select This Method
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-400 mb-1">Important Note</h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        These methods create assignment templates ready for grading. You'll need to manually enter actual grades. 
                        Canvas doesn't provide direct grade access through their public APIs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedMethod === 'syllabus' ? (
              /* Syllabus Upload Flow */
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => setSelectedMethod(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors mr-4"
                  >
                    <svg className="w-5 h-5 text-gray-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">🎯 AI Syllabus Upload</h3>
                    <p className="text-gray-600 dark:text-slate-400">Select a class and upload your syllabus</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Select Class
                    </label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600/50 rounded-lg bg-white dark:bg-slate-700/50 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Choose a class...</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedClassId && (
                    <div className="text-center py-8">
                      <button
                        onClick={() => handleSyllabusUpload(selectedClassId)}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-lg"
                      >
                        📄 Upload Syllabus
                      </button>
                      <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">
                        Click to open the syllabus upload wizard
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-400 mb-2">How It Works:</h4>
                  <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                    <li>Upload your PDF syllabus</li>
                    <li>AI extracts text and identifies assignments</li>
                    <li>Due dates and categories are detected automatically</li>
                    <li>Assignment templates are created ready for grading</li>
                    <li>You can review and edit before finalizing</li>
                  </ol>
                </div>
              </div>
            ) : (
              /* Canvas Import Flow */
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => setSelectedMethod(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors mr-4"
                  >
                    <svg className="w-5 h-5 text-gray-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">📅 Canvas Integration</h3>
                    <p className="text-gray-600 dark:text-slate-400">Convert Canvas tasks to gradeable assignments</p>
                  </div>
                </div>

                {/* Class Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Select Class
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    disabled={isImporting}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600/50 rounded-lg bg-white dark:bg-slate-700/50 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="">Choose a class...</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Import Steps */}
                {canvasImportSteps.length > 0 && (
                  <div className="bg-gray-50 dark:bg-slate-700/30 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">Import Progress:</h4>
                    <div className="space-y-3">
                      {canvasImportSteps.map((step) => (
                        <div key={step.step} className="flex items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
                            step.completed 
                              ? 'bg-green-500 text-white' 
                              : isImporting && step.step <= Math.max(...canvasImportSteps.filter(s => s.completed).map(s => s.step)) + 1
                                ? 'bg-blue-500 text-white animate-pulse'
                                : 'bg-gray-300 dark:bg-slate-600 text-gray-600 dark:text-slate-400'
                          }`}>
                            {step.completed ? '✓' : step.step}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{step.title}</div>
                            <div className="text-sm text-gray-600 dark:text-slate-400">{step.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Import Results */}
                {importResults && (
                  <div className={`rounded-lg p-4 ${
                    importResults.errors.length > 0 
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50'
                      : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50'
                  }`}>
                    <h4 className={`font-medium mb-2 ${
                      importResults.errors.length > 0 
                        ? 'text-red-900 dark:text-red-400'
                        : 'text-green-900 dark:text-green-400'
                    }`}>
                      Import Results:
                    </h4>
                    <div className="text-sm space-y-1">
                      <div className="text-gray-700 dark:text-slate-300">
                        • {importResults.tasksImported} Canvas tasks analyzed
                      </div>
                      <div className="text-gray-700 dark:text-slate-300">
                        • {importResults.assignmentsCreated} assignments created
                      </div>
                      <div className="text-gray-700 dark:text-slate-300">
                        • {importResults.categoriesCreated} categories created
                      </div>
                      {importResults.errors.length > 0 && (
                        <div className="mt-2">
                          <div className="text-red-700 dark:text-red-300 font-medium">Errors:</div>
                          {importResults.errors.map((error, index) => (
                            <div key={index} className="text-red-600 dark:text-red-400 text-xs ml-2">
                              • {error}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <div className="text-sm text-gray-600 dark:text-slate-400">
                    Make sure you've imported Canvas calendar first in Settings → Canvas Sync
                  </div>
                  <button
                    onClick={handleCanvasImport}
                    disabled={!selectedClassId || isImporting}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium disabled:cursor-not-allowed"
                  >
                    {isImporting ? 'Importing...' : 'Start Import'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-slate-700/50 p-4">
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                {importResults?.assignmentsCreated ? 'Done' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Syllabus Upload Modal */}
      {syllabusModalOpen && selectedClassId && (
        <SyllabusUploadModal
          isOpen={syllabusModalOpen}
          onClose={() => setSyllabusModalOpen(false)}
          classId={selectedClassId}
          className={classes.find(c => c.id === selectedClassId)?.name || 'Selected Class'}
          onTasksGenerated={handleSyllabusTasksGenerated}
        />
      )}
    </>
  );
};

export default AssignmentImportModal;