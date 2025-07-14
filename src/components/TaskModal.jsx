import React, { useState } from "react";
import { addTaskType } from "../services/dataService";

const TaskModal = ({
  showModal,
  onClose,
  onSubmit,
  onDelete,
  editingTask,
  selectedDate,
  classes,
  taskTypes,
  isAuthenticated,
  setTaskTypes
}) => {
  const [task, setTask] = useState({
    title: editingTask?.title || "",
    class: editingTask?.class || (classes.length > 0 ? classes[0].id : ""),
    type: editingTask?.type || (taskTypes.length > 0 ? taskTypes[0].id : ""),
    isDuration: editingTask?.isDuration || false,
    dueDate: editingTask?.dueDate || (selectedDate ? selectedDate.toISOString().split('T')[0] : ""),
    dueTime: editingTask?.dueTime || "23:59",
    startDate: editingTask?.startDate || (selectedDate ? selectedDate.toISOString().split('T')[0] : ""),
    startTime: editingTask?.startTime || "08:00",
    endDate: editingTask?.endDate || (selectedDate ? selectedDate.toISOString().split('T')[0] : ""),
    endTime: editingTask?.endTime || "11:00",
    completed: editingTask?.completed || false,
  });

  const [showClassInput, setShowClassInput] = useState(false);
  const [showTypeInput, setShowTypeInput] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newTypeName, setNewTypeName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(task);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-10">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[500px] max-w-lg">
        <h3 className="text-xl font-semibold mb-4">
          {editingTask ? "Edit Task" : "Add Task"} for{" "}
          {selectedDate?.toLocaleDateString()}
        </h3>
        <form onSubmit={handleSubmit}>
          {/* Task Title */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Task title:</label>
            <input
              type="text"
              value={task.title}
              onChange={(e) => setTask({ ...task, title: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Class Selection with inline management */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Class:</label>
            <div className="flex flex-col space-y-2">
              <select
                value={task.class}
                onChange={(e) => {
                  if (e.target.value === "add-new") {
                    setShowClassInput(true);
                  } else {
                    setTask({ ...task, class: e.target.value });
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded shadow-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
                <option value="add-new">+ Add new class</option>
              </select>

              {showClassInput && (
                <div className="mt-2">
                  <div className="flex">
                    <input
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="Enter class name (e.g., CS 175)"
                      className="flex-1 p-2 border border-gray-300 rounded-l shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newClassName.trim()) {
                          const autoId = newClassName.trim().toLowerCase().replace(/[^a-z0-9]/g, "") + "_" + Date.now().toString().slice(-4);
                          const newClass = {
                            id: autoId,
                            name: newClassName.trim(),
                          };
                          setTask({ ...task, class: newClass.id });
                          setNewClassName("");
                          setShowClassInput(false);
                        }
                      }}
                      className="bg-green-500 text-white px-3 py-2 hover:bg-green-600 rounded-r"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewClassName("");
                        setShowClassInput(false);
                      }}
                      className="bg-gray-300 text-gray-700 px-2 ml-1 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Type Selection with inline management */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Type:</label>
            <div className="flex flex-col space-y-2">
              <select
                value={task.type}
                onChange={(e) => {
                  if (e.target.value === "add-new") {
                    setShowTypeInput(true);
                    setTask({ ...task, type: "" });
                  } else {
                    setTask({ ...task, type: e.target.value });
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded shadow-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a type</option>
                {taskTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
                <option value="add-new">+ Add new type</option>
              </select>

              {showTypeInput && (
                <div className="mt-2">
                  <div className="flex">
                    <input
                      type="text"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      placeholder="Enter type name (e.g., Midterm)"
                      className="flex-1 p-2 border border-gray-300 rounded-l shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (newTypeName.trim()) {
                          const autoId = newTypeName.trim().toLowerCase().replace(/[^a-z0-9]/g, "") + "_" + Date.now().toString().slice(-4);
                          const newType = {
                            id: autoId,
                            name: newTypeName.trim(),
                          };

                          try {
                            const savedType = await addTaskType(newType, isAuthenticated);
                            if (savedType) {
                              setTaskTypes(prevTypes => [...prevTypes, savedType]);
                              setTask({ ...task, type: savedType.id });
                            }
                          } catch (error) {
                            alert("Failed to save task type. Please try again.");
                          }

                          setNewTypeName("");
                          setShowTypeInput(false);
                        }
                      }}
                      className="bg-green-500 text-white px-3 py-2 hover:bg-green-600 rounded-r"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewTypeName("");
                        setShowTypeInput(false);
                      }}
                      className="bg-gray-300 text-gray-700 px-2 ml-1 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Time Options */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <label className="block text-gray-700 mr-4">Time Type:</label>
              <div className="flex border border-gray-300 rounded overflow-hidden">
                <button
                  type="button"
                  className={`px-3 py-1 ${!task.isDuration ? "bg-blue-500 text-white" : "bg-white text-gray-700"}`}
                  onClick={() => setTask({ ...task, isDuration: false })}
                >
                  Deadline
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 ${task.isDuration ? "bg-blue-500 text-white" : "bg-white text-gray-700"}`}
                  onClick={() => setTask({ ...task, isDuration: true })}
                >
                  Duration
                </button>
              </div>
            </div>

            {/* Deadline Mode */}
            {!task.isDuration && (
              <div className="bg-blue-50 p-3 rounded">
                <label className="block text-gray-700 mb-2">Due Date & Time:</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={task.dueDate || ""}
                    onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
                    className="p-2 border border-gray-300 rounded flex-1"
                    required
                  />
                  <input
                    type="time"
                    value={task.dueTime || ""}
                    onChange={(e) => setTask({ ...task, dueTime: e.target.value })}
                    className="p-2 border border-gray-300 rounded w-32"
                    required
                  />
                </div>
              </div>
            )}

            {/* Duration Mode */}
            {task.isDuration && (
              <div className="bg-green-50 p-3 rounded">
                <div className="mb-3">
                  <label className="block text-gray-700 mb-2">Start Date & Time:</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={task.startDate || ""}
                      onChange={(e) => setTask({ ...task, startDate: e.target.value })}
                      className="p-2 border border-gray-300 rounded flex-1"
                      required
                    />
                    <input
                      type="time"
                      value={task.startTime || ""}
                      onChange={(e) => setTask({ ...task, startTime: e.target.value })}
                      className="p-2 border border-gray-300 rounded w-32"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">End Date & Time:</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={task.endDate || ""}
                      onChange={(e) => setTask({ ...task, endDate: e.target.value })}
                      className="p-2 border border-gray-300 rounded flex-1"
                      required
                    />
                    <input
                      type="time"
                      value={task.endTime || ""}
                      onChange={(e) => setTask({ ...task, endTime: e.target.value })}
                      className="p-2 border border-gray-300 rounded w-32"
                      required
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Buttons */}
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition"
            >
              Cancel
            </button>
            <div>
              {editingTask && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded mr-2 transition"
                >
                  Delete
                </button>
              )}
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
              >
                {editingTask ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;