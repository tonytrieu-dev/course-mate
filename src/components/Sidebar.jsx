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

  const parseDate = (dateStr) => {
    if (!dateStr) return null;

    console.log(`Trying to parse date: "${dateStr}"`);
    const currentYear = new Date().getFullYear();
    let dueDate = null;

    try {
      // Try multiple formats

      // Format: MM/DD or M/D
      if (/^\d{1,2}\/\d{1,2}$/.test(dateStr)) {
        const [month, day] = dateStr.split("/").map((num) => parseInt(num, 10));
        dueDate = new Date(currentYear, month - 1, day);
        console.log(`Parsed MM/DD format: ${dueDate.toISOString()}`);
      }
      // Format: Month DD or Month D
      else if (/^[A-Za-z]+\s+\d{1,2}$/.test(dateStr)) {
        dueDate = new Date(`${dateStr}, ${currentYear}`);
        console.log(`Parsed Month DD format: ${dueDate.toISOString()}`);
      }
      // Format: DD-MM or D-M
      else if (/^\d{1,2}-\d{1,2}$/.test(dateStr)) {
        const [day, month] = dateStr.split("-").map((num) => parseInt(num, 10));
        dueDate = new Date(currentYear, month - 1, day);
        console.log(`Parsed DD-MM format: ${dueDate.toISOString()}`);
      }
      // Try direct ISO parsing as last resort
      else {
        dueDate = new Date(dateStr);
        console.log(`Tried direct parsing: ${dueDate.toISOString()}`);
      }

      // Validate the date
      if (!dueDate || isNaN(dueDate.getTime())) {
        console.error(`Invalid date parsed from "${dateStr}"`);
        return null;
      }

      // If the date is in the past, assume it's for next year
      if (dueDate < new Date() && dueDate.getMonth() < 6) {
        // If before July
        dueDate.setFullYear(currentYear + 1);
        console.log(`Adjusted to next year: ${dueDate.toISOString()}`);
      }

      return dueDate;
    } catch (e) {
      console.error(`Error parsing date "${dateStr}":`, e);
      return null;
    }
  };

  // Function to add syllabus data as tasks to the calendar
  const addSyllabusDataToCalendar = async (classObj, analysisData) => {
    const tasks = [];
    const className = classObj.name;

    // Add assessments (exams, quizzes, midterms) as tasks
    if (analysisData.assessments && analysisData.assessments.length > 0) {
      for (const assessment of analysisData.assessments) {
        // Parse the date using our new function
        const dueDate = assessment.date ? parseDate(assessment.date) : null;

        if (dueDate) {
          const taskType =
            assessment.type === "final"
              ? "final"
              : assessment.type === "midterm"
              ? "exam"
              : assessment.type === "quiz"
              ? "quiz"
              : "exam";

          const task = {
            id: `${classObj.id}_${assessment.type}_${Date.now()}`,
            title: `${
              assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1)
            } - ${className}`,
            description: `${
              assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1)
            } for ${className}`,
            // Store both formats for compatibility
            date: dueDate.toISOString(), // For backward compatibility
            dueDate: dueDate.toISOString(), // For newer code
            dueTime: assessment.time || "23:59", // Add time if available
            classId: classObj.id,
            className: className,
            class: classObj.id, // Add this for compatibility with class field
            type: taskType, // Add this for compatibility with type field
            taskType: taskType,
            completed: false,
            priority:
              assessment.type === "final" || assessment.type === "midterm"
                ? "high"
                : "medium",
            // Add source info to help with debugging
            source: "syllabus",
            syllabusInfo: {
              originalDateText: assessment.date,
              assessmentType: assessment.type,
            },
          };

          tasks.push(task);
        }
      }
    }

    // Add assignments (homework) as tasks
    if (analysisData.assignments && analysisData.assignments.length > 0) {
      for (const assignment of analysisData.assignments) {
        // Parse the date using our new function
        const dueDate = assignment.dueDate
          ? parseDate(assignment.dueDate)
          : null;

        if (dueDate) {
          // Determine task type based on assignment type
          let taskType = "homework";
          if (assignment.type === "project") taskType = "project";
          else if (assignment.type === "lab") taskType = "lab";

          const task = {
            id: `${classObj.id}_${assignment.type}_${
              assignment.number
            }_${Date.now()}`,
            title: `${
              assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)
            } ${assignment.number} - ${className}`,
            description: `${
              assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)
            } ${assignment.number} for ${className}`,
            // Store both formats for compatibility
            date: dueDate.toISOString(), // For backward compatibility
            dueDate: dueDate.toISOString(), // For newer code
            dueTime: "23:59", // Default time
            classId: classObj.id,
            className: className,
            class: classObj.id, // Add this for compatibility with class field
            type: taskType, // Add this for compatibility with type field
            taskType: taskType,
            completed: false,
            priority: "medium",
            // Add source info to help with debugging
            source: "syllabus",
            syllabusInfo: {
              originalDateText: assignment.dueDate,
              assignmentType: assignment.type,
              assignmentNumber: assignment.number,
            },
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

    window.dispatchEvent(new CustomEvent("calendar-update"));

    return tasks.length;
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

                {selectedClass.syllabus && (
                  <div className="mt-3 mb-3 p-4 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-red-500 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();

                          // Log that the button was clicked
                          console.log("Download syllabus clicked");

                          try {
                            // Create a blob from the data URL
                            const dataUrl = selectedClass.syllabus.data;
                            const byteString = atob(dataUrl.split(",")[1]);
                            const mimeString = dataUrl
                              .split(",")[0]
                              .split(":")[1]
                              .split(";")[0];

                            const ab = new ArrayBuffer(byteString.length);
                            const ia = new Uint8Array(ab);
                            for (let i = 0; i < byteString.length; i++) {
                              ia[i] = byteString.charCodeAt(i);
                            }
                            const blob = new Blob([ab], { type: mimeString });

                            // Create a download link and trigger it
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = selectedClass.syllabus.name;
                            document.body.appendChild(link);
                            link.click();

                            // Clean up
                            setTimeout(() => {
                              document.body.removeChild(link);
                              URL.revokeObjectURL(url);
                            }, 100);
                          } catch (error) {
                            console.error("Error downloading syllabus:", error);
                            alert(
                              "Error downloading syllabus: " + error.message
                            );

                            // Fallback to opening in new tab
                            window.open(selectedClass.syllabus.data, "_blank");
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Download Syllabus: {selectedClass.syllabus.name}
                      </a>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Click the link above to open the syllabus in a new tab
                    </p>
                  </div>
                )}

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
                      ></span>
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
