import React, { useState, useCallback } from 'react';
import type { ClassWithRelations } from '../types/database';
import EditableText from './EditableText';
import InlineSizeControl from './InlineSizeControl';
import classService from '../services/classService';
import { generateUniqueId } from '../services/dataService';

interface ClassListProps {
  classes: ClassWithRelations[];
  setClasses: (classes: ClassWithRelations[]) => void;
  selectedClass: ClassWithRelations | null;
  editingClassId: string | null;
  setEditingClassId: (id: string | null) => void;
  hoveredClassId: string | null;
  setHoveredClassId: (id: string | null) => void;
  onClassClick: (classId: string) => void;
  onExpandSidebar: () => void;
  classNameSize: number;
  setClassNameSize: (size: number) => void;
  showClassNameSizeControl: string | null;
  setShowClassNameSizeControl: (id: string | null) => void;
  isAuthenticated: boolean;
  isSidebarCollapsed: boolean;
  isHoveringClassArea: boolean;
}

const ClassList: React.FC<ClassListProps> = ({ 
  classes, 
  setClasses,
  selectedClass,
  editingClassId,
  setEditingClassId,
  hoveredClassId,
  setHoveredClassId,
  onClassClick,
  onExpandSidebar,
  classNameSize,
  setClassNameSize,
  showClassNameSizeControl,
  setShowClassNameSizeControl,
  isAuthenticated,
  isSidebarCollapsed,
  isHoveringClassArea
}) => {
  const [newClassName, setNewClassName] = useState<string>("");

  const handleCollapsedClassClick = useCallback((classId: string) => {
    // When sidebar is collapsed, clicking a class should expand the sidebar
    // and select the class for future interaction
    onExpandSidebar();
  }, [onExpandSidebar]);

  const handleClassNameClick = useCallback((e: React.MouseEvent, classId: string) => {
    e.stopPropagation();
    setEditingClassId(classId);
  }, [setEditingClassId]);

  const handleClassChange = useCallback((classId: string, newName: string) => {
    const updatedClasses = classes.map((c) =>
      c.id === classId ? { ...c, name: newName } : c
    );
    setClasses(updatedClasses);
  }, [classes, setClasses]);

  const handleClassBlur = useCallback(async () => {
    if (editingClassId) {
      const classToUpdate = classes.find((c) => c.id === editingClassId);
      if (classToUpdate) {
        await classService.updateClass(editingClassId, classToUpdate, isAuthenticated);
      }
    }
    setEditingClassId(null);
  }, [editingClassId, classes, isAuthenticated, setEditingClassId]);

  const handleDeleteClass = useCallback(async (e: React.MouseEvent, classId: string) => {
    e.stopPropagation();
    await classService.deleteClass(classId, isAuthenticated);
  }, [isAuthenticated]);

  const handleAddClass = useCallback(async () => {
    const newId = generateUniqueId();
    const className = newClassName.trim() || "New Class";
    const newClass = {
      id: newId,
      user_id: 'local-user', // This will be overwritten by the service with actual user_id
      name: className,
      syllabus: null,
      files: [],
      isTaskClass: false  // Explicitly mark as non-task class for Sidebar
    };

    await classService.addClass(newClass, isAuthenticated);
    
    if (!newClassName.trim()) {
      setEditingClassId(newId);
    }
    setNewClassName("");
  }, [newClassName, isAuthenticated, setEditingClassId]);

  return (
    <>
      <ul className="list-none p-0 m-0 space-y-2" role="list" aria-label="Class list">
        {classes.map((c) => (
          <li
            key={c.id}
            className={`transition-all duration-200 rounded-xl group ${
              hoveredClassId === c.id ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 shadow-sm" : ""
            }`}
            onMouseEnter={() => setHoveredClassId(c.id)}
            onMouseLeave={() => setHoveredClassId(null)}
            role="listitem"
          >
            {isSidebarCollapsed ? (
              <div
                onClick={() => handleCollapsedClassClick(c.id)}
                className={`flex justify-center items-center py-3 px-2 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-slate-700 dark:hover:to-slate-600 hover:scale-105 active:scale-95 transition-all duration-200 rounded-xl min-h-[44px] ${
                  selectedClass?.id === c.id ? "bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-slate-700 dark:to-slate-600 border-2 border-blue-300 dark:border-slate-500 shadow-md" : "border border-transparent"
                }`}
                title={`${c.name} - Click to expand sidebar`}
                role="button"
                aria-label={`Expand sidebar for ${c.name}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all duration-200 shadow-sm ${
                  selectedClass?.id === c.id ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-md" : "bg-gradient-to-r from-gray-400 to-gray-500"
                }`}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
              </div>
            ) : (
              <div
                onClick={() => onClassClick(c.id)}
                className={`flex justify-between items-center py-4 px-6 cursor-pointer hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all duration-200 rounded-xl group min-h-[44px] border ${
                  selectedClass?.id === c.id ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 border-blue-200 dark:border-slate-500 shadow-md" : "border-transparent hover:border-gray-200 dark:hover:border-slate-600"
                }`}
                role="button"
                aria-label={`Select ${c.name} class`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClassClick(c.id);
                  }
                }}
              >
                <div className="flex-1 flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full transition-all duration-200 shadow-sm ${
                    selectedClass?.id === c.id ? "bg-gradient-to-r from-blue-500 to-blue-600" : "bg-gradient-to-r from-gray-300 to-gray-400 group-hover:from-blue-400 group-hover:to-blue-500"
                  }`}></div>
                  {editingClassId === c.id ? (
                    <EditableText
                      value={c.name}
                      onChange={(newName) => handleClassChange(c.id, newName)}
                      onBlur={handleClassBlur}
                      isEditing={true}
                      className="flex-1 p-2 bg-white border-2 border-blue-300 font-medium text-gray-900 outline-none focus:border-blue-500 rounded-lg shadow-sm transition-all duration-200"
                      style={{ fontSize: `${classNameSize}px` }}
                    />
                  ) : (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClassNameClick(e, c.id);
                      }}
                      className="flex-1"
                    >
                      <div className="relative flex items-center">
                        <span 
                          className="font-semibold text-gray-800 dark:text-slate-100 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 cursor-text select-none"
                          style={{ fontSize: `${classNameSize}px` }}
                          onDoubleClick={() => setShowClassNameSizeControl(c.id)}
                          title="Click to edit"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              // Convert keyboard event to mouse event-like object for handler
                              const mouseEvent = new MouseEvent('click', {
                                bubbles: true,
                                cancelable: true,
                                view: window
                              });
                              handleClassNameClick(mouseEvent as any, c.id);
                            }
                          }}
                        >
                          {c.name}
                        </span>
                        {showClassNameSizeControl === c.id && (
                          <InlineSizeControl 
                            size={classNameSize} 
                            setSize={setClassNameSize} 
                            minSize={10} 
                            maxSize={24} 
                            show={true} 
                            setShow={() => setShowClassNameSizeControl(null)} 
                          />
                        )}
                      </div>
                    </span>
                  )}
                </div>
                {hoveredClassId === c.id && editingClassId !== c.id && (
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowClassNameSizeControl(showClassNameSizeControl === c.id ? null : c.id);
                      }}
                      className={`p-2 rounded-lg transition-all duration-200 min-h-[32px] min-w-[32px] flex items-center justify-center ${
                        showClassNameSizeControl === c.id 
                          ? 'text-blue-600 bg-blue-50 shadow-sm' 
                          : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      title={showClassNameSizeControl === c.id ? "Close text size control" : "Adjust text size"}
                      type="button"
                      aria-label={showClassNameSizeControl === c.id ? "Close text size control" : "Adjust class name text size"}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDeleteClass(e, c.id)}
                      className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all duration-200 min-h-[32px] min-w-[32px] flex items-center justify-center"
                      title="Delete class"
                      type="button"
                      aria-label={`Delete ${c.name} class`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {(classes.length === 0 || isHoveringClassArea) && !isSidebarCollapsed && (
        <button
          onClick={handleAddClass}
          className="flex items-center mt-6 mb-4 p-4 mx-6 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-slate-800 dark:hover:to-slate-700 cursor-pointer bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 border-2 border-blue-200 dark:border-slate-600 border-dashed rounded-xl transition-all duration-200 hover:border-blue-300 dark:hover:border-slate-500 hover:shadow-lg group w-auto min-h-[44px]"
          type="button"
          aria-label="Add new class"
        >
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-200 mr-3 shadow-sm">
            <svg className="w-4 h-4 text-blue-600 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-sm font-semibold">Add New Class</span>
        </button>
      )}
      {(classes.length === 0 || isHoveringClassArea) && isSidebarCollapsed && (
        <button
          onClick={handleAddClass}
          className="flex justify-center items-center mt-6 mb-4 p-3 mx-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-slate-800 dark:hover:to-slate-700 cursor-pointer bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 border-2 border-blue-200 dark:border-slate-600 border-dashed rounded-xl transition-all duration-200 hover:border-blue-300 dark:hover:border-slate-500 hover:shadow-lg hover:scale-105 active:scale-95 min-h-[44px] min-w-[44px]"
          title="Add new class"
          type="button"
          aria-label="Add new class"
        >
          <svg className="w-5 h-5 text-blue-600 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </>
  );
};

// Memoize the entire component to prevent unnecessary re-renders
const MemoizedClassList = React.memo(ClassList);

export default MemoizedClassList;

// Component enhancements:
// ✅ Enhanced visual design with gradients and modern styling
// ✅ Improved accessibility with ARIA labels, roles, and keyboard navigation
// ✅ Better touch targets (44px minimum) for mobile compliance
// ✅ Professional UI with icons and improved hover states
// ✅ Enhanced visual feedback with shadows and animations
// ✅ Better visual hierarchy with improved spacing and typography
// ✅ Consistent design patterns with rounded corners and borders
// ✅ Professional icon usage throughout the interface