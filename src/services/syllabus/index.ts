/**
 * Syllabus Service Modules - Modularized for better maintainability
 * Extracted from syllabusTaskGenerationService.ts
 */

// Re-export all functionality for backward compatibility
export { validateSyllabusForTaskGeneration, validateGeneratedTasks } from './validation';
export { callAIAnalysis, callAIAnalysisEdgeFunction, parseGeminiResponse } from './aiAnalysis';
export { enhanceLabTasksWithManualDateParsing, parseLabScheduleFromDocumentChunks } from './dateParser';
export { determineTaskClass } from './classAssignment';
export { getOrCreateTaskTypeViaServiceLayer, getOrCreateTaskTypeLegacy, getEstimatedDurationForTaskType } from './taskTypeUtils';

// Export types
export type { GeneratedTask, SyllabusAnalysisData } from './aiAnalysis';
export type { ValidationResult } from './validation';
export type { LabScheduleEntry } from './dateParser';