import React, { useState, useCallback, useMemo } from 'react';
import EditableText from './EditableText';
import InlineSizeControl from './InlineSizeControl';
import classService from '../services/classService';
import { generateUniqueId } from '../services/dataService';

const ClassList = ({ 
  classes, 
  setClasses,
  selectedClass,
  editingClassId,
  setEditingClassId,
  hoveredClassId,
  setHoveredClassId,
  onClassClick,
  classNameSize,
  setClassNameSize,
  showClassNameSizeControl,
  setShowClassNameSizeControl,
  isAuthenticated,
  isSidebarCollapsed,
  isHoveringClassArea
}) => {
  const [newClassName, setNewClassName] = useState("");

  const handleClassNameClick = useCallback((e, classId) => {
    e.stopPropagation();
    setEditingClassId(classId);
  }, [setEditingClassId]);

  const handleClassChange = useCallback((classId, newName) => {
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

  const handleDeleteClass = useCallback(async (e, classId) => {
    e.stopPropagation();
    await classService.deleteClass(classId, isAuthenticated);
  }, [isAuthenticated]);

  const handleAddClass = useCallback(async () => {
    const newId = generateUniqueId();
    const className = newClassName.trim() || "New Class";
    const newClass = {
      id: newId,
      name: className,
      syllabus: null,
      files: [],
    };

    await classService.addClass(newClass, isAuthenticated);
    
    if (!newClassName.trim()) {
      setEditingClassId(newId);
    }
    setNewClassName("");
  }, [newClassName, isAuthenticated, setEditingClassId]);

  return (
    <>
      <ul className="list-none p-0 m-0 space-y-1">
        {classes.map((c) => (
          <li
            key={c.id}
            className={`transition-all duration-200 rounded-lg ${
              hoveredClassId === c.id ? "bg-gray-50" : ""
            }`}
            onMouseEnter={() => setHoveredClassId(c.id)}
            onMouseLeave={() => setHoveredClassId(null)}
          >
            {isSidebarCollapsed ? (
              <div
                onClick={() => onClassClick(c.id)}
                className={`flex justify-center items-center py-2 px-2 cursor-pointer hover:bg-gray-100 transition-all duration-200 rounded-lg ${
                  selectedClass?.id === c.id ? "bg-blue-50 border border-blue-200" : ""
                }`}
                title={c.name}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-200 ${
                  selectedClass?.id === c.id ? "bg-blue-500" : "bg-gray-400"
                }`}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
              </div>
            ) : (
              <div
                onClick={() => onClassClick(c.id)}
                className={`flex justify-between items-center py-3 px-6 cursor-pointer hover:bg-gray-100 transition-all duration-200 rounded-lg group ${
                  selectedClass?.id === c.id ? "bg-blue-50 border border-blue-200 shadow-sm" : ""
                }`}
              >
                <div className="flex-1 flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    selectedClass?.id === c.id ? "bg-blue-500" : "bg-gray-300 group-hover:bg-gray-400"
                  }`}></div>
                  {editingClassId === c.id ? (
                    <EditableText
                      value={c.name}
                      onChange={(newName) => handleClassChange(c.id, newName)}
                      onBlur={handleClassBlur}
                      isEditing={true}
                      elementType="class-name"
                      className="flex-1 p-1 bg-transparent font-sans text-gray-800 outline-none border-b border-gray-300 focus:border-blue-500 rounded"
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
                      <span 
                        className="font-medium text-gray-700 hover:text-gray-900 transition-colors duration-150 cursor-text"
                        style={{ fontSize: `${classNameSize}px` }}
                        onDoubleClick={() => setShowClassNameSizeControl(c.id)}
                        title="Double-click to adjust size"
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
                    </span>
                  )}
                </div>
                {hoveredClassId === c.id && editingClassId !== c.id && (
                  <button
                    onClick={(e) => handleDeleteClass(e, c.id)}
                    className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50 transition-all duration-200 opacity-0 group-hover:opacity-100"
                    title="Delete class"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {(classes.length === 0 || isHoveringClassArea) && !isSidebarCollapsed && (
        <button
          onClick={handleAddClass}
          className="flex items-center mt-4 mb-4 p-3 mx-6 text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer bg-transparent border border-blue-200 border-dashed rounded-lg transition-all duration-200 hover:border-blue-300 hover:shadow-sm group w-auto"
        >
          <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors duration-200 mr-3">
            <span className="text-blue-600 text-sm font-medium">+</span>
          </div>
          <span className="text-sm font-medium">Add class</span>
        </button>
      )}
      {(classes.length === 0 || isHoveringClassArea) && isSidebarCollapsed && (
        <button
          onClick={handleAddClass}
          className="flex justify-center items-center mt-4 mb-4 p-2 mx-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer bg-transparent border border-blue-200 border-dashed rounded-lg transition-all duration-200 hover:border-blue-300 hover:shadow-sm"
          title="Add class"
        >
          <span className="text-blue-600 text-lg font-bold">+</span>
        </button>
      )}
    </>
  );
};

// Memoize the entire component to prevent unnecessary re-renders
const MemoizedClassList = React.memo(ClassList);

export default MemoizedClassList;