import React, { useState, useEffect } from "react";
import {
  getClasses,
  addClass,
  updateClass,
  deleteClass,
  getSettings,
  updateSettings,
  addTask,
} from "../services/dataService";
import { extractTextFromPDF } from "../services/pdfService";
import { extractBasicInfo } from "../services/extractionService";
import { enhanceWithAI } from "../services/aiService";
import { useAuth } from "../contexts/AuthContext";

const Sidebar = () => {
  const { isAuthenticated } = useAuth();
  const [title, setTitle] = useState("UCR");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [classes, setClasses] = useState([]);
  const [editingClassId, setEditingClassId] = useState(null);
  const [hoveredClassId, setHoveredClassId] = useState(null);
  const [newClassName, setNewClassName] = useState("");
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isHoveringClassArea, setIsHoveringClassArea] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [showAnalysisDetails, setShowAnalysisDetails] = useState(false);
  const [tasksAdded, setTasksAdded] = useState(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      // Load classes
      const fetchedClasses = await getClasses(isAuthenticated);
      setClasses(fetchedClasses);

      // Load settings
      const settings = getSettings();
      if (settings && settings.title) {
        setTitle(settings.title);
      }
    };

    loadData();
  }, [isAuthenticated]);

  // Title editing functions
  const handleTitleClick = () => {
    setIsEditingTitle(true);
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    // Save title in settings
    updateSettings({ title });
  };

  // Class editing functions
  const handleClassClick = (classId) => {
    const classObj = classes.find((c) => c.id === classId);
    setSelectedClass(classObj);
    setShowSyllabusModal(true);
    setShowAnalysisDetails(false);
  };

  const handleClassNameClick = (e, classId) => {
    e.stopPropagation();
    setEditingClassId(classId);
  };

  const handleClassChange = (e, classId) => {
    const updatedClasses = classes.map((c) =>
      c.id === classId ? { ...c, name: e.target.value } : c
    );
    setClasses(updatedClasses);
  };

  const handleClassBlur = async () => {
    // Save the updated class
    if (editingClassId) {
      const classToUpdate = classes.find((c) => c.id === editingClassId);
      if (classToUpdate) {
        await updateClass(editingClassId, classToUpdate, isAuthenticated);
      }
    }
    setEditingClassId(null);
  };

  const handleDeleteClass = async (e, classId) => {
    e.stopPropagation();
    await deleteClass(classId, isAuthenticated);
    setClasses(classes.filter((c) => c.id !== classId));
  };

  const handleAddClass = async () => {
    if (newClassName.trim()) {
      const newId = `class${Date.now()}`;
      const newClass = {
        id: newId,
        name: newClassName.trim(),
        syllabus: null,
      };

      // Add class to database/local storage
      const addedClass = await addClass(newClass, isAuthenticated);

      setClasses([...classes, addedClass]);
      setNewClassName("");
    } else {
      const newId = `class${Date.now()}`;
      const newClass = {
        id: newId,
        name: "New Class",
        syllabus: null,
      };

      // Add class to database/local storage
      const addedClass = await addClass(newClass, isAuthenticated);

      setClasses([...classes, addedClass]);
      setEditingClassId(newId);
    }
  };

  const handleClassKeyDown = (e, classId) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevents newline in input
      handleClassBlur(); // Close current editing
    }
  };

  // Syllabus handling functions
  const handleSyllabusUpload = async (e) => {
    const file = e.target.files[0];
    if (file && selectedClass) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const updatedClass = {
          ...selectedClass,
          syllabus: {
            name: file.name,
            type: file.type,
            size: file.size,
            data: event.target.result,
          },
        };

        // Update class in database/local storage
        await updateClass(selectedClass.id, updatedClass, isAuthenticated);

        const updatedClasses = classes.map((c) =>
          c.id === selectedClass.id ? updatedClass : c
        );
        setClasses(updatedClasses);

        // Update the selected class to show the uploaded syllabus
        setSelectedClass(updatedClass);
        
        // If it's a PDF, we can try to analyze it automatically
        if (file.type === "application/pdf") {
          handleAnalyzeSyllabus(updatedClass);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteSyllabus = async () => {
    if (selectedClass) {
      const updatedClass = {
        ...selectedClass,
        syllabus: null,
        syllabusAnalysis: null,
      };

      // Update class in database/local storage
      await updateClass(selectedClass.id, updatedClass, isAuthenticated);

      const updatedClasses = classes.map((c) =>
        c.id === selectedClass.id ? updatedClass : c
      );
      setClasses(updatedClasses);
      setSelectedClass(updatedClass);
      setShowAnalysisDetails(false);
    }
  };

  // Function to add syllabus data as tasks to the calendar
  const addSyllabusDataToCalendar = async (classObj, analysisData) => {
    const tasks = [];
    const className = classObj.name;
    
    // Add assessments (exams, quizzes, midterms) as tasks
    if (analysisData.assessments && analysisData.assessments.length > 0) {
      for (const assessment of analysisData.assessments) {
        // Parse the date
        let dueDate = null;
        try {
          // Convert various date formats to a JS Date
          if (assessment.date) {
            // Handle formats like "MM/DD" or "Month DD"
            const dateStr = assessment.date;
            const currentYear = new Date().getFullYear();
            
            if (dateStr.includes('/')) {
              // Format: MM/DD
              const [month, day] = dateStr.split('/').map(num => parseInt(num, 10));
              dueDate = new Date(currentYear, month - 1, day);
            } else if (/\w+ \d{1,2}/.test(dateStr)) {
              // Format: Month DD
              dueDate = new Date(`${dateStr}, ${currentYear}`);
            }
            
            // If we couldn't parse the date or it's invalid, skip
            if (!dueDate || isNaN(dueDate.getTime())) {
              continue;
            }
            
            // If the date is in the past, assume it's for next year
            if (dueDate < new Date() && dueDate.getMonth() < 6) { // If before July
              dueDate.setFullYear(currentYear + 1);
            }
          }
        } catch (e) {
          console.error("Error parsing date:", e);
          continue;
        }
        
        if (dueDate) {
          const taskType = assessment.type === 'final' ? 'final' : 
                          assessment.type === 'midterm' ? 'exam' : 
                          assessment.type === 'quiz' ? 'quiz' : 'exam';
          
          const task = {
            id: `${classObj.id}_${assessment.type}_${Date.now()}`,
            title: `${assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1)} - ${className}`,
            description: `${assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1)} for ${className}`,
            dueDate: dueDate.toISOString(),
            classId: classObj.id,
            className: className,
            taskType: taskType,
            completed: false,
            priority: assessment.type === 'final' || assessment.type === 'midterm' ? 'high' : 'medium'
          };
          
          tasks.push(task);
        }
      }
    }
    
    // Add assignments (homework) as tasks
    if (analysisData.assignments && analysisData.assignments.length > 0) {
      for (const assignment of analysisData.assignments) {
        // Parse the date
        let dueDate = null;
        try {
          if (assignment.dueDate) {
            // Handle formats like "MM/DD" or "Month DD"
            const dateStr = assignment.dueDate;
            const currentYear = new Date().getFullYear();
            
            if (dateStr.includes('/')) {
              // Format: MM/DD
              const [month, day] = dateStr.split('/').map(num => parseInt(num, 10));
              dueDate = new Date(currentYear, month - 1, day);
            } else if (/\w+ \d{1,2}/.test(dateStr)) {
              // Format: Month DD
              dueDate = new Date(`${dateStr}, ${currentYear}`);
            }
            
            // If we couldn't parse the date or it's invalid, skip
            if (!dueDate || isNaN(dueDate.getTime())) {
              continue;
            }
            
            // If the date is in the past, assume it's for next year
            if (dueDate < new Date() && dueDate.getMonth() < 6) { // If before July
              dueDate.setFullYear(currentYear + 1);
            }
          }
        } catch (e) {
          console.error("Error parsing date:", e);
          continue;
        }
        
        if (dueDate) {
          // Determine task type based on assignment type
          let taskType = 'homework';
          if (assignment.type === 'project') taskType = 'project';
          else if (assignment.type === 'lab') taskType = 'lab';
          
          const task = {
            id: `${classObj.id}_${assignment.type}_${assignment.number}_${Date.now()}`,
            title: `${assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)} ${assignment.number} - ${className}`,
            description: `${assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)} ${assignment.number} for ${className}`,
            dueDate: dueDate.toISOString(),
            classId: classObj.id,
            className: className,
            taskType: taskType,
            completed: false,
            priority: 'medium'
          };
          
          tasks.push(task);
        }
      }
    }
    
    // Add weekly schedule items as recurring tasks if they exist
    if (analysisData.weeklySchedule && analysisData.weeklySchedule.length > 0) {
      // This would require more complex scheduling logic to implement recurring tasks
      // For now, we'll skip this feature until we have a better system for recurring tasks
    }
    
    // Add all tasks to the calendar
    for (const task of tasks) {
      await addTask(task, isAuthenticated);
    }
    
    return tasks.length;
  };

  // New function to analyze syllabus
  const handleAnalyzeSyllabus = async (classObj) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setTasksAdded(false);
    
    try {
      const targetClass = classObj || selectedClass;
      
      if (!targetClass || !targetClass.syllabus) {
        throw new Error("No syllabus available to analyze");
      }
      
      if (targetClass.syllabus.type !== "application/pdf") {
        throw new Error("Only PDF syllabi can be analyzed");
      }
      
      // Extract text from PDF
      const extractedText = await extractTextFromPDF(targetClass.syllabus);
      
      if (!extractedText || extractedText === "Error extracting text from PDF") {
        throw new Error("Failed to extract text from PDF");
      }
      
      // Extract basic information using pattern matching
      const basicInfo = extractBasicInfo(extractedText);
      
      // Enhance with AI (or local pattern matching)
      const enhancedInfo = await enhanceWithAI(extractedText, basicInfo, 'offline');
      
      // Update class with analysis results
      const updatedClass = {
        ...targetClass,
        syllabusAnalysis: {
          extractedText: extractedText.substring(0, 1000) + "...", // Store just a preview
          data: enhancedInfo,
          analyzedAt: new Date().toISOString()
        }
      };
      
      // Update in database
      await updateClass(updatedClass.id, updatedClass, isAuthenticated);
      
      // Add syllabus data to calendar
      const tasksCount = await addSyllabusDataToCalendar(updatedClass, enhancedInfo);
      
      // Update local state
      const updatedClasses = classes.map(c => 
        c.id === updatedClass.id ? updatedClass : c
      );
      
      setClasses(updatedClasses);
      setSelectedClass(updatedClass);
      setShowAnalysisDetails(true);
      setTasksAdded(tasksCount > 0);
      
    } catch (error) {
      console.error("Error analyzing syllabus:", error);
      setAnalysisError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Render analysis section
  const renderAnalysisSection = () => {
    if (!selectedClass || !selectedClass.syllabus) return null;
    
    if (isAnalyzing) {
      return (
        <div className="mt-6 p-4 bg-blue-50 rounded">
          <p className="text-center">
            <span className="inline-block animate-spin mr-2">⏳</span>
            Analyzing syllabus... This may take a moment.
          </p>
        </div>
      );
    }
    
    if (analysisError) {
      return (
        <div className="mt-6 p-4 bg-red-50 rounded">
          <p className="text-red-600">Error: {analysisError}</p>
          <button
            onClick={() => setAnalysisError(null)}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            Dismiss
          </button>
        </div>
      );
    }
    
    if (selectedClass.syllabusAnalysis) {
      return (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">Syllabus Analysis</h3>
            <button
              onClick={() => setShowAnalysisDetails(!showAnalysisDetails)}
              className="text-blue-600 hover:text-blue-800"
            >
              {showAnalysisDetails ? "Hide Details" : "Show Details"}
            </button>
          </div>
          
          {showAnalysisDetails && (
            <div className="bg-gray-50 p-4 rounded">
              {/* Instructor Info */}
              {selectedClass.syllabusAnalysis.data.instructorInfo.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-1">Instructor</h4>
                  {selectedClass.syllabusAnalysis.data.instructorInfo.map((instructor, idx) => (
                    <div key={idx} className="pl-2 mb-2 border-l-2 border-blue-200">
                      <p><span className="font-medium">Name:</span> {instructor.name}</p>
                      <p><span className="font-medium">Email:</span> {instructor.email}</p>
                      <p><span className="font-medium">Office Hours:</span> {instructor.officeHours}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* TA Info */}
              {selectedClass.syllabusAnalysis.data.taInfo.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-1">Teaching Assistants</h4>
                  {selectedClass.syllabusAnalysis.data.taInfo.map((ta, idx) => (
                    <div key={idx} className="pl-2 mb-2 border-l-2 border-green-200">
                      <p><span className="font-medium">Name:</span> {ta.name}</p>
                      <p><span className="font-medium">Email:</span> {ta.email}</p>
                      <p><span className="font-medium">Office Hours:</span> {ta.officeHours}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Assessments */}
              {selectedClass.syllabusAnalysis.data.assessments.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-1">Exams & Quizzes</h4>
                  <ul className="pl-2 border-l-2 border-amber-200">
                    {selectedClass.syllabusAnalysis.data.assessments.map((assessment, idx) => (
                      <li key={idx} className="mb-1">
                        <span className="font-medium capitalize">{assessment.type}:</span> {assessment.date}
                        {assessment.time && ` at ${assessment.time}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Assignments */}
              {selectedClass.syllabusAnalysis.data.assignments.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-1">Assignments</h4>
                  <ul className="pl-2 border-l-2 border-purple-200">
                    {selectedClass.syllabusAnalysis.data.assignments.map((assignment, idx) => (
                      <li key={idx} className="mb-1">
                        <span className="font-medium capitalize">{assignment.type} {assignment.number}:</span>
                        {assignment.dueDate ? ` Due ${assignment.dueDate}` : " Due date not found"}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Weekly Schedule */}
              {selectedClass.syllabusAnalysis.data.weeklySchedule && selectedClass.syllabusAnalysis.data.weeklySchedule.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-1">Weekly Schedule</h4>
                  <ul className="pl-2 border-l-2 border-indigo-200">
                    {selectedClass.syllabusAnalysis.data.weeklySchedule.map((week, idx) => (
                      <li key={idx} className="mb-1">
                        <span className="font-medium">Week {week.weekNum}:</span> {week.items.join(", ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-4">
                Analyzed on {new Date(selectedClass.syllabusAnalysis.analyzedAt).toLocaleString()}
              </p>
            </div>
          )}
          
          {!showAnalysisDetails && (
            <p className="text-gray-600">
              We've analyzed your syllabus and extracted key information like exam dates, 
              assignments, and instructor details.
            </p>
          )}
        </div>
      );
    }
    
    // Option to analyze syllabus
    return (
      <div className="mt-6">
        <button
          onClick={() => handleAnalyzeSyllabus()}
          className="w-full py-2 px-4 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
        >
          Analyze Syllabus
        </button>
        <p className="text-xs text-gray-500 mt-1">
          Extract dates, assignments, and contact information automatically.
        </p>
      </div>
    );
  };

  // Syllabus Modal
  const renderSyllabusModal = () => {
    if (!showSyllabusModal || !selectedClass) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-10">
        <div className="bg-white p-5 rounded w-[600px] max-w-[90%] max-h-[90vh] overflow-auto">
          <h2 className="text-blue-600 mt-0 font-bold text-xl">
            {selectedClass.name}
          </h2>

          <div className="mb-5 mt-6">
            <h3 className="font-bold text-lg mb-2">Upload syllabus</h3>
            {!selectedClass.syllabus ? (
              <div className="border-2 border-dashed border-gray-300 p-5 text-center mb-5">
                <p>
                  Drag and drop a syllabus file here, or click to select one
                </p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleSyllabusUpload}
                  className="block mx-auto my-2.5"
                />
              </div>
            ) : (
              <div className="mb-5">
                <div className="flex justify-between items-center p-2.5 bg-gray-100 rounded mb-2.5">
                  <div>
                    <strong>Current Syllabus:</strong>{" "}
                    {selectedClass.syllabus.name}
                    <span className="ml-2.5 text-gray-500">
                      ({Math.round(selectedClass.syllabus.size / 1024)} KB)
                    </span>
                  </div>
                  <button
                    onClick={handleDeleteSyllabus}
                    className="bg-red-500 text-white border-none py-1 px-2.5 rounded cursor-pointer"
                  >
                    Remove
                  </button>
                </div>

                {selectedClass.syllabus.type === "application/pdf" && (
                  <embed
                    src={selectedClass.syllabus.data}
                    type="application/pdf"
                    className="w-full h-96 border border-gray-300"
                  />
                )}

                {/* Add the analysis section here */}
                {renderAnalysisSection()}

                <p className="mt-4">
                  Upload a new syllabus to replace the current one:
                </p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleSyllabusUpload}
                  className="block my-2.5"
                />
              </div>
            )}
          </div>

          <div className="flex justify-between mt-5">
            <button
              onClick={() => setShowSyllabusModal(false)}
              className="bg-gray-100 border border-gray-300 py-2 px-4 rounded cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={() => setShowSyllabusModal(false)}
              className="bg-blue-600 text-white border-none py-2 px-4 rounded cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-64 border-r border-gray-300 py-5 px-2.5 bg-white h-full box-border font-sans">
      {isEditingTitle ? (
        <input
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          autoFocus
          className="text-4xl font-bold w-[90%] p-0.5 text-blue-700 border border-gray-300 mt-0 mb-6 font-inherit"
        />
      ) : (
        <h1
          className="text-blue-700 cursor-pointer text-5xl mb-6 leading-tight font-inherit font-semibold text-center"
          onClick={handleTitleClick}
        >
          {title}
        </h1>
      )}

      <div
        className="relative"
        onMouseEnter={() => setIsHoveringClassArea(true)}
        onMouseLeave={() => setIsHoveringClassArea(false)}
      >
        <div className="flex">
          <h4 className="m-1 ml-8 text-amber-500 font-medium text-xl normal-case">
            Current Classes
          </h4>
        </div>

        <ul className="list-none p-0 pl-8 m-0">
          {classes.map((cls) => (
            <li
              key={cls.id}
              className={`my-0.5 flex justify-start items-center p-0.5 pl-0 gap-1.5 cursor-pointer rounded ${
                hoveredClassId === cls.id ? "bg-gray-100" : "bg-transparent"
              }`}
              onMouseEnter={() => setHoveredClassId(cls.id)}
              onMouseLeave={() => setHoveredClassId(null)}
              onClick={() => handleClassClick(cls.id)}
            >
              {editingClassId === cls.id ? (
                <input
                  value={cls.name}
                  onChange={(e) => handleClassChange(e, cls.id)}
                  onKeyDown={(e) => handleClassKeyDown(e, cls.id)}
                  onBlur={handleClassBlur}
                  autoFocus
                  className="w-4/5 p-0.5"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <div className="flex items-center pl-0 flex-1 relative">
                    <span className="mr-2 ml-0 text-blue-600 text-lg">•</span>
                    <span
                      onClick={(e) => handleClassNameClick(e, cls.id)}
                      className={`cursor-pointer ${
                        hoveredClassId === cls.id ? "font-bold" : "font-normal"
                      } transition-all duration-100`}
                    >
                      {cls.name}
                    </span>

                    {cls.syllabus && (
                      <span
                        className="ml-1 text-base text-blue-600"
                        title="Syllabus uploaded"
                      >
                        📄
                      </span>
                    )}
                  </div>
                  {hoveredClassId === cls.id && (
                    <button
                      onClick={(e) => handleDeleteClass(e, cls.id)}
                      className="bg-transparent border-none text-red-500 cursor-pointer text-base"
                    >
                      ×
                    </button>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>

        {(classes.length === 0 || isHoveringClassArea) && (
          <button
            onClick={handleAddClass}
            className="flex items-center mt-2.5 p-0.5 pl-8 text-blue-600 hover:text-blue-800 cursor-pointer bg-transparent border-none"
          >
            <span className="mr-1 text-lg">+</span>
            <span>Add class</span>
          </button>
        )}
      </div>

      {renderSyllabusModal()}
    </div>
  );
};

export default Sidebar;