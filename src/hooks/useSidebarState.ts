import { useState, useCallback } from 'react';
import type { ClassWithRelations, Position } from '../types/database';

interface UseSidebarStateReturn {
  // Core state
  title: string;
  setTitle: (title: string) => void;
  isEditingTitle: boolean;
  setIsEditingTitle: (editing: boolean) => void;
  
  // Classes state
  classes: ClassWithRelations[];
  setClasses: (classes: ClassWithRelations[]) => void;
  editingClassId: string | null;
  setEditingClassId: (id: string | null) => void;
  hoveredClassId: string | null;
  setHoveredClassId: (id: string | null) => void;
  classesTitle: string;
  setClassesTitle: (title: string) => void;
  isEditingClassesTitle: boolean;
  setIsEditingClassesTitle: (editing: boolean) => void;
  
  // Modal states
  showSyllabusModal: boolean;
  setShowSyllabusModal: (show: boolean) => void;
  selectedClass: ClassWithRelations | null;
  setSelectedClass: (cls: ClassWithRelations | null) => void;
  showLogin: boolean;
  setShowLogin: (show: boolean) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  
  // UI states
  isHoveringClassArea: boolean;
  setIsHoveringClassArea: (hovering: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  
  // Chatbot states
  showChatbotPanel: boolean;
  setShowChatbotPanel: (show: boolean) => void;
  chatbotPanelHeight: number;
  setChatbotPanelHeight: (height: number) => void;
  chatbotPosition: Position;
  setChatbotPosition: (position: Position) => void;
  
  // Size control states
  showTitleSizeControl: boolean;
  setShowTitleSizeControl: (show: boolean) => void;
  showClassesHeaderSizeControl: boolean;
  setShowClassesHeaderSizeControl: (show: boolean) => void;
  showClassNameSizeControl: string | null;
  setShowClassNameSizeControl: (id: string | null) => void;
  
  // Canvas sync state
  isCanvasSyncing: boolean;
  setIsCanvasSyncing: (syncing: boolean) => void;
  
  // Study analytics state
  showStudyAnalytics: boolean;
  setShowStudyAnalytics: (show: boolean) => void;
  
  // Event handlers
  handleTitleClick: () => void;
  handleSidebarToggle: () => void;
  handleClassesTitleBlur: () => void;
}

export const useSidebarState = (): UseSidebarStateReturn => {
  // Core state
  const [title, setTitle] = useState<string>("UCR 🐻");
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  
  // Classes state
  const [classes, setClasses] = useState<ClassWithRelations[]>([]);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [hoveredClassId, setHoveredClassId] = useState<string | null>(null);
  const [classesTitle, setClassesTitle] = useState<string>("Current Classes");
  const [isEditingClassesTitle, setIsEditingClassesTitle] = useState<boolean>(false);
  
  // Modal states
  const [showSyllabusModal, setShowSyllabusModal] = useState<boolean>(false);
  const [selectedClass, setSelectedClass] = useState<ClassWithRelations | null>(null);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // UI states
  const [isHoveringClassArea, setIsHoveringClassArea] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  
  // Chatbot states
  const [showChatbotPanel, setShowChatbotPanel] = useState<boolean>(false);
  const [chatbotPanelHeight, setChatbotPanelHeight] = useState<number>(400);
  const [chatbotPosition, setChatbotPosition] = useState<Position>({ x: 16, y: 0 });
  
  // Size control states
  const [showTitleSizeControl, setShowTitleSizeControl] = useState<boolean>(false);
  const [showClassesHeaderSizeControl, setShowClassesHeaderSizeControl] = useState<boolean>(false);
  const [showClassNameSizeControl, setShowClassNameSizeControl] = useState<string | null>(null);
  
  // Canvas sync state
  const [isCanvasSyncing, setIsCanvasSyncing] = useState<boolean>(false);
  
  // Study analytics state
  const [showStudyAnalytics, setShowStudyAnalytics] = useState<boolean>(false);

  // Event handlers
  const handleTitleClick = useCallback(() => {
    setIsEditingTitle(true);
  }, []);

  const handleSidebarToggle = useCallback(() => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  const handleClassesTitleBlur = useCallback(() => {
    setIsEditingClassesTitle(false);
  }, []);

  return {
    // Core state
    title,
    setTitle,
    isEditingTitle,
    setIsEditingTitle,
    
    // Classes state
    classes,
    setClasses,
    editingClassId,
    setEditingClassId,
    hoveredClassId,
    setHoveredClassId,
    classesTitle,
    setClassesTitle,
    isEditingClassesTitle,
    setIsEditingClassesTitle,
    
    // Modal states
    showSyllabusModal,
    setShowSyllabusModal,
    selectedClass,
    setSelectedClass,
    showLogin,
    setShowLogin,
    showSettings,
    setShowSettings,
    
    // UI states
    isHoveringClassArea,
    setIsHoveringClassArea,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    
    // Chatbot states
    showChatbotPanel,
    setShowChatbotPanel,
    chatbotPanelHeight,
    setChatbotPanelHeight,
    chatbotPosition,
    setChatbotPosition,
    
    // Size control states
    showTitleSizeControl,
    setShowTitleSizeControl,
    showClassesHeaderSizeControl,
    setShowClassesHeaderSizeControl,
    showClassNameSizeControl,
    setShowClassNameSizeControl,
    
    // Canvas sync state
    isCanvasSyncing,
    setIsCanvasSyncing,
    
    // Study analytics state
    showStudyAnalytics,
    setShowStudyAnalytics,
    
    // Event handlers
    handleTitleClick,
    handleSidebarToggle,
    handleClassesTitleBlur,
  };
};