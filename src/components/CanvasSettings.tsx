import React, { useState, useEffect, useCallback } from "react";
import { fetchCanvasCalendar } from "../services/canvasService";
import { useAuth } from "../contexts/AuthContext";
import type { TaskInsert } from "../types/database";

interface SyncStatus {
  success?: boolean;
  message: string;
  tasks?: Partial<TaskInsert>[];
}

interface CanvasSettingsProps {
  onClose: () => void;
}

const CanvasSettings: React.FC<CanvasSettingsProps> = ({ onClose }) => {
  const { isAuthenticated, user } = useAuth();
  const [canvasUrl, setCanvasUrl] = useState<string>(() => 
    localStorage.getItem("canvas_calendar_url") || ""
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [autoSync, setAutoSync] = useState<boolean>(() => 
    localStorage.getItem("canvas_auto_sync") === "true"
  );

  useEffect(() => {
    const savedUrl = localStorage.getItem("canvas_calendar_url");
    if (savedUrl && !canvasUrl) {
      setCanvasUrl(savedUrl);
    }
  }, [canvasUrl]);

  const handleAutoSyncChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setAutoSync(isChecked);
    localStorage.setItem("canvas_auto_sync", isChecked.toString());
  }, []);

  const handleSyncNow = useCallback(async () => {
    if (!canvasUrl) {
      setSyncStatus({
        success: false,
        message: "Please enter your Canvas calendar URL"
      });
      return;
    }

    // Save URL for future use
    localStorage.setItem("canvas_calendar_url", canvasUrl);
    localStorage.setItem("canvas_auto_sync", autoSync.toString());

    setIsSyncing(true);
    setSyncStatus({ message: "Syncing with Canvas..." });

    try {
      const result = await fetchCanvasCalendar(canvasUrl, isAuthenticated, user);
      setSyncStatus(result);
      // Dispatch event to update calendar view after successful sync
      if (result.success) {
        window.dispatchEvent(new CustomEvent("calendar-update"));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSyncStatus({
        success: false,
        message: `Error syncing: ${errorMessage}`
      });
    } finally {
      setIsSyncing(false);
    }
  }, [canvasUrl, autoSync, isAuthenticated, user]);

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCanvasUrl(e.target.value);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-10">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[500px] max-w-lg relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="Close"
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h3 className="text-xl font-semibold mb-4 text-blue-600">
          Canvas Calendar Integration
        </h3>

        <div className="mb-4">
          <p className="text-gray-700 mb-4">
            <strong>Step 1:</strong> Go to Canvas and navigate to Calendar → Calendar Feed.<br/>
            <strong>Step 2:</strong> Copy the full calendar feed URL.<br/>
            <strong>Step 3:</strong> Paste the URL below and click "Sync Now".<br/>
            <span className="text-sm text-gray-600">
              The app uses a proxy service to access Canvas calendars from any browser.
            </span>
          </p>

          <label htmlFor="canvasUrl" className="block text-gray-700 mb-2">
            Canvas Calendar URL:
          </label>
          <input
            id="canvasUrl"
            type="text"
            value={canvasUrl}
            onChange={handleUrlChange}
            placeholder="https://elearn.ucr.edu/feeds/calendars/user_..."
            className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <div className="flex items-center mt-3">
            <input
              type="checkbox"
              id="autoSync"
              checked={autoSync}
              onChange={handleAutoSyncChange}
              className="mr-2"
            />
            <label htmlFor="autoSync" className="text-gray-700">
              Automatically sync on startup
            </label>
          </div>
        </div>

        {syncStatus && (
          <div className={`p-3 rounded mb-4 ${
            syncStatus.success 
              ? "bg-green-100 text-green-800" 
              : "bg-yellow-100 text-yellow-800"
          }`}>
            {syncStatus.message}
            {syncStatus.success && syncStatus.tasks && (
              <p className="mt-1 text-sm">
                {syncStatus.tasks.length} tasks imported successfully.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-between mt-6">
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition"
            type="button"
          >
            Close
          </button>

          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition ${
              isSyncing ? "opacity-70 cursor-not-allowed" : ""
            }`}
            type="button"
          >
            {isSyncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CanvasSettings;