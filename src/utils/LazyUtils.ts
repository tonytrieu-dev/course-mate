// Lazy loaded utility modules for better code splitting and performance

// Heavy utility modules that can be loaded on demand

// Schedule Optimization - Complex algorithms
export const lazyScheduleOptimizer = () => 
  import("./scheduleOptimizer").then(module => module);

// Chatbot Mentions - AI processing
export const lazyChatbotMentions = () => 
  import("./chatbotMentions").then(module => module);

// Cache Management - Advanced caching strategies
export const lazyCacheHelpers = () => 
  import("./cacheHelpers").then(module => module);

// Storage Operations - File and data management
export const lazyStorageHelpers = () => 
  import("./storageHelpers").then(module => module);

export const lazyStorage = () => 
  import("./storage").then(module => module);

// Supabase Utilities - Database operations
export const lazySupabaseHelpers = () => 
  import("./supabaseHelpers").then(module => module);

// Service Helpers - Service layer utilities
export const lazyServiceHelpers = () => 
  import("./serviceHelpers").then(module => module);

// Task Styling - UI styling calculations
export const lazyTaskStyles = () => 
  import("./taskStyles").then(module => module);

// Style Helpers - UI utility functions
export const lazyStyleHelpers = () => 
  import("./styleHelpers").then(module => module);

// Error Handling - Error management utilities
export const lazyErrorHandler = () => 
  import("./errorHandler").then(module => module);

// Validation - Form and data validation
export const lazyValidation = () => 
  import("./validation").then(module => module);

// ID Helpers - ID generation and management
export const lazyIdHelpers = () => 
  import("./idHelpers").then(module => module);