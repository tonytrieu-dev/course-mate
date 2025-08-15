// Lazy loaded service modules for better code splitting

// Canvas Integration - Heavy external dependency
export const lazyCanvasService = () => 
  import("./canvasService").then(module => module);

// File Management - Upload/download heavy
export const lazyFileService = () => 
  import("./fileService").then(module => module);

// Notifications - Email service integration
export const lazyNotificationService = () => 
  import("./notificationService").then(module => module);

export const lazyEmailNotificationTrigger = () => 
  import("./emailNotificationTrigger").then(module => module);

// Study Analytics - Complex calculations
export const lazyStudyScheduleService = () => 
  import("./studyScheduleService").then(module => module);

export const lazyStudySessionService = () => 
  import("./studySessionService").then(module => module);

// Sync Service - Background operations
export const lazySyncService = () => 
  import("./syncService").then(module => module);

// Domain-specific operations - Split by feature
export const lazyClassOperations = () => 
  import("./class/classOperations").then(module => module);

export const lazyTaskOperations = () => 
  import("./task/taskOperations").then(module => module);

export const lazyTaskTypeOperations = () => 
  import("./taskType/taskTypeOperations").then(module => module);

export const lazySettingsOperations = () => 
  import("./settings/settingsOperations").then(module => module);

export const lazyGradeOperations = () => 
  import("./grade/gradeOperations").then(module => module);

export const lazyGpaService = () => 
  import("./grade/gpaService").then(module => module);

export const lazyCanvasGradeIntegration = () => 
  import("./grade/canvasGradeIntegration").then(module => module);