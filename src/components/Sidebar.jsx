import React, { useState, useEffect } from "react";
import {
  getClasses,
  addClass,
  updateClass,
  deleteClass,
  getSettings,
  updateSettings,
  //addTask,
} from "../services/dataService";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../services/supabaseClient";
import { fetchCanvasCalendar } from "../services/canvasService";
import LoginComponent from "./LoginComponent";
import CanvasSettings from "./CanvasSettings";

const Sidebar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [title, setTitle] = useState("UCR");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [classes, setClasses] = useState([]);
  const [editingClassId, setEditingClassId] = useState(null);
  const [hoveredClassId, setHoveredClassId] = useState(null);
  const [newClassName, setNewClassName] = useState("");
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isHoveringClassArea, setIsHoveringClassArea] = useState(false);
  //const [tasksAdded, setTasksAdded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [showCanvasSettings, setShowCanvasSettings] = useState(false);


  useEffect(() => {
    const autoSyncCanvas = async () => {
      const canvasUrl = localStorage.getItem("canvas_calendar_url");
      const autoSync = localStorage.getItem("canvas_auto_sync") === "true";

      if (canvasUrl && autoSync) {
        try {
          console.log("Auto-syncing Canvas calendar...");
          const result = await fetchCanvasCalendar(canvasUrl, isAuthenticated);
          console.log("fetchCanvasCalendar result:", result);

          // Dispatch event to update calendar view after successful auto-sync
          if (result && result.success) {
             console.log("Canvas auto-sync successful, dispatching calendar-update.");
             window.dispatchEvent(new CustomEvent("calendar-update"));
          } else {
            console.log("Canvas auto-sync did not report success or result was invalid. Result:", result);
          }
        } catch (error) {
          console.error("Error auto-syncing Canvas calendar:", error);
        }
      }
    };

    // autoSyncCanvas(); // Call directly
    const timerId = setTimeout(() => {
      autoSyncCanvas();
    }, 1500); // Delay of 1.5 seconds

    return () => clearTimeout(timerId); // Cleanup timer if component unmounts

  }, [isAuthenticated]);

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
        files: [],
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
        files: [],
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
      try {
        // Show loading state
        setIsUploading(true);

        // Get current user ID
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("User not authenticated");

        // Upload the file to Supabase Storage
        const fileName = `${selectedClass.id}/${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
          .from("class-materials")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: true,
            // Make sure owner is set correctly to the authenticated user
            fileMetadata: {
              owner: user.id,
            },
          });

        if (error) {
          console.error("Storage upload error:", error);
          throw error;
        }

        // Get a signed URL for the file (valid for 1 year)
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("class-materials")
          .createSignedUrl(fileName, 31536000);

        if (signedUrlError) {
          console.error("Error creating signed URL:", signedUrlError);
          throw signedUrlError;
        }

        // First, delete any existing syllabus records
        if (selectedClass.syllabus && selectedClass.syllabus.path) {
          // Delete old syllabus from class_syllabi table
          await supabase
            .from("class_syllabi")
            .delete()
            .eq("class_id", selectedClass.id);
        }

        // Create syllabus metadata
        const syllabusData = {
          name: file.name,
          type: file.type,
          size: file.size,
          path: fileName,
          url: signedUrlData.signedUrl,
          owner: user.id,
          class_id: selectedClass.id,
          uploaded_at: new Date().toISOString(),
        };

        // Store in class_syllabi table
        const { data: syllabusDbData, error: syllabusDbError } = await supabase
          .from("class_syllabi")
          .insert([syllabusData])
          .select();

        if (syllabusDbError) {
          console.error("Error storing syllabus metadata:", syllabusDbError);
          throw syllabusDbError;
        }

        // Update the local class object with syllabus
        const updatedClass = {
          ...selectedClass,
          syllabus: syllabusDbData[0],
        };

        // Update local state
        const updatedClasses = classes.map((c) =>
          c.id === selectedClass.id ? updatedClass : c
        );

        setClasses(updatedClasses);
        setSelectedClass(updatedClass);

        // Also update local storage
        localStorage.setItem('calendar_classes', JSON.stringify(updatedClasses));
      } catch (error) {
        console.error("Error uploading syllabus:", error);
        alert("Error uploading syllabus: " + error.message);
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Handle general file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file && selectedClass) {
      try {
        // Show loading state
        setIsUploadingFile(true);

        // Get current user ID
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("User not authenticated");

        // Upload the file to Supabase Storage
        const fileName = `${selectedClass.id}/${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
          .from("class-materials")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: true,
            // Make sure owner is set correctly to the authenticated user
            fileMetadata: {
              owner: user.id,
            },
          });

        if (error) {
          console.error("Storage upload error:", error);
          throw error;
        }

        // Get a signed URL for the file (valid for 1 year)
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("class-materials")
          .createSignedUrl(fileName, 31536000);

        if (signedUrlError) {
          console.error("Error creating signed URL:", signedUrlError);
          throw signedUrlError;
        }

        // Create file metadata
        const fileData = {
          name: file.name,
          type: file.type,
          size: file.size,
          path: fileName,
          url: signedUrlData.signedUrl,
          owner: user.id,
          class_id: selectedClass.id,
          uploaded_at: new Date().toISOString(),
        };

        // Store in class_files table
        const { data: fileDbData, error: fileDbError } = await supabase
          .from("class_files")
          .insert([fileData])
          .select();

        if (fileDbError) {
          console.error("Error storing file metadata:", fileDbError);
          throw fileDbError;
        }

        // Get all files for this class
        const { data: classFiles, error: classFilesError } = await supabase
          .from("class_files")
          .select("*")
          .eq("class_id", selectedClass.id)
          .order("uploaded_at", { ascending: false });

        if (classFilesError) {
          console.error("Error fetching class files:", classFilesError);
          throw classFilesError;
        }

        // Update the local class object with files
        const updatedClass = {
          ...selectedClass,
          files: classFiles || [],
        };

        // Update in local state only
        const updatedClasses = classes.map((c) =>
          c.id === selectedClass.id ? updatedClass : c
        );

        setClasses(updatedClasses);
        setSelectedClass(updatedClass);

        // Also update local storage
        localStorage.setItem('calendar_classes', JSON.stringify(updatedClasses));
      } catch (error) {
        console.error("Error uploading file:", error);
        alert("Error uploading file: " + error.message);
      } finally {
        setIsUploadingFile(false);
      }
    }
  };

  // Delete a file
  const handleDeleteFile = async (filePath, fileIndex) => {
    if (!selectedClass) return;

    try {
      // First get the current user to ensure we have valid auth
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error("Authentication error: " + (userError?.message || "User not authenticated"));
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("class-materials")
        .remove([filePath]);

      if (storageError) {
        console.error("Error deleting file from storage:", storageError);
        throw storageError;
      }

      // Delete from class_files table
      const { error: fileDbError } = await supabase
        .from("class_files")
        .delete()
        .eq("path", filePath);

      if (fileDbError) {
        console.error("Error deleting file metadata:", fileDbError);
        throw fileDbError;
      }

      // Get all remaining files for this class
      const { data: classFiles, error: classFilesError } = await supabase
        .from("class_files")
        .select("*")
        .eq("class_id", selectedClass.id)
        .order("uploaded_at", { ascending: false });

      if (classFilesError) {
        console.error("Error fetching class files:", classFilesError);
        throw classFilesError;
      }

      // Update the local class object with remaining files
      const updatedClass = {
        ...selectedClass,
        files: classFiles || [],
      };

      // Update local state
      const updatedClasses = classes.map((c) =>
        c.id === selectedClass.id ? updatedClass : c
      );

      setClasses(updatedClasses);
      setSelectedClass(updatedClass);

      // Also update local storage
      localStorage.setItem('calendar_classes', JSON.stringify(updatedClasses));

    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Error deleting file: " + error.message);
    }
  };

  // Delete syllabus
  const handleDeleteSyllabus = async () => {
    if (!selectedClass || !selectedClass.syllabus) return;

    try {
      // First get the current user to ensure we have valid auth
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error("Authentication error: " + (userError?.message || "User not authenticated"));
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("class-materials")
        .remove([selectedClass.syllabus.path]);

      if (storageError) {
        console.error("Error deleting syllabus from storage:", storageError);
        throw storageError;
      }

      // Delete from class_syllabi table
      const { error: syllabusDbError } = await supabase
        .from("class_syllabi")
        .delete()
        .eq("class_id", selectedClass.id);

      if (syllabusDbError) {
        console.error("Error deleting syllabus metadata:", syllabusDbError);
        throw syllabusDbError;
      }

      // Update the local class object with syllabus set to null
      const updatedClass = {
        ...selectedClass,
        syllabus: null,
      };

      // Update local state
      const updatedClasses = classes.map((c) =>
        c.id === selectedClass.id ? updatedClass : c
      );

      setClasses(updatedClasses);
      setSelectedClass(updatedClass);

      // Also update local storage
      localStorage.setItem('calendar_classes', JSON.stringify(updatedClasses));

    } catch (error) {
      console.error("Error deleting syllabus:", error);
      alert("Error deleting syllabus: " + error.message);
    }
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
                {isUploading && (
                  <div className="text-center my-2">
                    <p className="text-blue-600">Uploading syllabus...</p>
                    <div className="animate-pulse mt-1 h-1 bg-blue-600 rounded"></div>
                  </div>
                )}
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
                </div>

                {selectedClass.syllabus && (
                  <div className="mt-3 mb-3 p-4 bg-gray-50 rounded">
                    <div className="flex items-center justify-between">
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
                          href={selectedClass.syllabus.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {selectedClass.syllabus.name}
                        </a>
                      </div>
                      <button
                        onClick={handleDeleteSyllabus}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
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
                {isUploading && (
                  <div className="text-center my-2">
                    <p className="text-blue-600">Uploading syllabus...</p>
                    <div className="animate-pulse mt-1 h-1 bg-blue-600 rounded"></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* New section for class files */}
          <div className="mb-5">
            <h3 className="font-bold text-lg mb-2">Class files</h3>

            <div className="border-2 border-dashed border-gray-300 p-5 text-center mb-5">
              <p>
                Upload lecture notes, assignments, and other course materials
              </p>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
                onChange={handleFileUpload}
                className="block mx-auto my-2.5"
              />
              {isUploadingFile && (
                <div className="text-center my-2">
                  <p className="text-blue-600">Uploading file...</p>
                  <div className="animate-pulse mt-1 h-1 bg-blue-600 rounded"></div>
                </div>
              )}
            </div>

            {/* Display uploaded files */}
            {selectedClass.files && selectedClass.files.length > 0 ? (
              <div>
                <h4 className="font-semibold mb-2">Uploaded files</h4>
                <ul className="divide-y divide-gray-200">
                  {selectedClass.files.map((file, index) => (
                    <li key={index} className="py-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-blue-500 mr-2"
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
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {file.name}
                        </a>
                        <span className="ml-2 text-gray-500 text-sm">
                          ({Math.round(file.size / 1024)} KB)
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteFile(file.path, index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500 text-center">No files uploaded yet</p>
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
    <div className="w-64 border-r border-gray-300 py-3 px-2.5 bg-white h-full box-border font-sans flex flex-col">
      <div className="pt-16">
        {isEditingTitle ? (
          <input
            value={title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            autoFocus
            className="text-4xl font-bold w-[90%] p-0.5 text-blue-700 border border-gray-300 mt-0 mb-3 font-inherit"
          />
        ) : (
          <h1
            className="text-blue-700 cursor-pointer text-5xl mb-3 leading-tight font-inherit font-semibold text-center"
            onClick={handleTitleClick}
          >
            {title}
          </h1>
        )}
      </div>

      {/* Empty space to push content down */}
      <div className="mt-6"></div>

      <div
        className="relative flex-1"
        onMouseEnter={() => setIsHoveringClassArea(true)}
        onMouseLeave={() => setIsHoveringClassArea(false)}
      >
        <div className="flex">
          <h4 className="m-1 ml-8 text-yellow-500 font-medium text-xl normal-case">
            Current Classes
          </h4>
        </div>

        <ul className="list-none p-0 pl-8 m-0">
          {classes.map((cls) => (
            <li
              key={cls.id}
              className={`my-0.5 flex justify-start items-center p-0.5 pl-0 gap-1.5 cursor-pointer rounded hover:bg-gray-100 ${hoveredClassId === cls.id ? "bg-gray-100" : ""
                }`}
              onMouseEnter={() => setHoveredClassId(cls.id)}
              onMouseLeave={() => setHoveredClassId(null)}
            >
              {editingClassId === cls.id ? (
                <div className="flex items-center w-full">
                  <span className="mr-2 ml-0 text-blue-600 text-lg select-none">•</span>
                  <input
                    value={cls.name}
                    onChange={(e) => handleClassChange(e, cls.id)}
                    onKeyDown={(e) => handleClassKeyDown(e, cls.id)}
                    onBlur={handleClassBlur}
                    autoFocus
                    className="flex-1 p-0.5 bg-transparent"
                  />
                </div>
              ) : (
                <>
                  <div
                    className="flex items-center pl-0 flex-1 relative"
                    onClick={() => handleClassClick(cls.id)}
                  >
                    <span className="mr-2 ml-0 text-blue-600 text-lg select-none" aria-hidden="true">•</span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClassNameClick(e, cls.id);
                      }}
                      className={`cursor-pointer ${hoveredClassId === cls.id ? "font-bold" : "font-normal"
                        } transition-all duration-100`}
                    >
                      {cls.name}
                    </span>

                    {(cls.syllabus || (cls.files && cls.files.length > 0)) && (
                      <span
                        className="ml-1 text-base text-blue-600"
                        title={cls.files && cls.files.length > 0
                          ? `Syllabus and ${cls.files.length} file(s) uploaded`
                          : "Syllabus uploaded"}
                      >
                      </span>
                    )}
                  </div>
                  {hoveredClassId === cls.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClass(e, cls.id);
                      }}
                      className="bg-transparent border-none text-red-500 cursor-pointer text-base hover:text-red-700"
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

      {/* Canvas Integration Button */}
      <div className="px-2 mt-4 mb-2">
        <button
          onClick={() => setShowCanvasSettings(true)}
          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-1 px-3 rounded w-full flex items-center justify-center"
        >
          <span className="mr-2">🎓</span>
          Canvas Integration
        </button>
      </div>

      {/* Auth Controls - moved to bottom with margin-top */}
      <div className="px-2 mt-auto mb-8 text-center">
        {isAuthenticated ? (
          <div className="flex flex-col items-center">
            <span className="text-gray-600 mb-2">{user?.email}</span>
            <button
              onClick={logout}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded w-full"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {user?.email && (
              <span className="text-gray-600 mb-2">{user.email}</span>
            )}
            <button
              onClick={() => setShowLogin(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded w-full"
            >
              Login / Register
            </button>
          </div>
        )}
      </div>

      {renderSyllabusModal()}
      {showLogin && !isAuthenticated && (
        <LoginComponent onClose={() => setShowLogin(false)} />
      )}
      {showCanvasSettings && (
        <CanvasSettings onClose={() => setShowCanvasSettings(false)} />
      )}
    </div>
  );
};

export default Sidebar;
