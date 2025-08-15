// Lazy loaded custom hooks for better code splitting

// Complex UI interaction hooks
export const useLazyResizable = () => 
  import("./useResizable").then(module => module);

export const useLazyDragAndResize = () => 
  import("./useDragAndResize").then(module => module);

// File management hooks
export const useLazyFileManager = () => 
  import("./useFileManager").then(module => module);

// Sidebar management hooks
export const useLazySidebarData = () => 
  import("./useSidebarData").then(module => module);

export const useLazySidebarState = () => 
  import("./useSidebarState").then(module => module);

// Chatbot interaction hooks
export const useLazyChatbot = () => 
  import("./useChatbot").then(module => module);

export const useLazyChatbotMentions = () => 
  import("./useChatbotMentions").then(module => module);

// Study management hooks
export const useLazyStudySession = () => 
  import("./useStudySession").then(module => module);

export const useLazyStudySchedule = () => 
  import("./useStudySchedule").then(module => module);

// Task management hooks
export const useLazyTaskForm = () => 
  import("./useTaskForm").then(module => module);

export const useLazyTaskManagement = () => 
  import("./useTaskManagement").then(module => module);

// Storage hooks
export const useLazyLocalStorageState = () => 
  import("./useLocalStorageState").then(module => module);