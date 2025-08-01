import React, { useState, useEffect, useCallback } from "react";
import { fetchCanvasCalendar, debugICSParsing } from "../services/canvasService";
import { getSettings, updateSettings } from "../services/settings/settingsOperations";
import { useAuth } from "../contexts/AuthContext";
import type { TaskInsert, AppSettings } from "../types/database";

interface SyncStatus {
  success?: boolean;
  message: string;
  tasks?: Partial<TaskInsert>[];
}

interface CanvasSettingsProps {
  onClose?: () => void;
}

const CanvasSettings: React.FC<CanvasSettingsProps> = ({ onClose }) => {
  const { isAuthenticated, user, setLastCalendarSyncTimestamp } = useAuth();
  const [canvasUrl, setCanvasUrl] = useState<string>(() => 
    localStorage.getItem("canvas_calendar_url") || ""
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [autoSync, setAutoSync] = useState<boolean>(() => 
    localStorage.getItem("canvas_auto_sync") === "true"
  );
  const [forceSync, setForceSync] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [classNamingStyle, setClassNamingStyle] = useState<'technical' | 'descriptive'>(() => {
    const settings = getSettings();
    return settings.classNamingStyle || 'technical';
  });

  const handleDebugICS = useCallback(async () => {
    if (!canvasUrl) {
      alert("Please enter a Canvas URL first");
      return;
    }
    
    setIsSyncing(true);
    try {
      const result = await debugICSParsing(canvasUrl);
      setDebugInfo(result);
      console.log('ICS Debug Result:', result);
    } catch (error) {
      console.error('Debug error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [canvasUrl]);

  const handleAutoSyncChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setAutoSync(isChecked);
    localStorage.setItem("canvas_auto_sync", isChecked.toString());
  }, []);

  const handleClassNamingStyleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newStyle = e.target.checked ? 'descriptive' : 'technical';
    setClassNamingStyle(newStyle);
    
    // Update settings
    const currentSettings = getSettings();
    updateSettings({
      ...currentSettings,
      classNamingStyle: newStyle
    });
  }, []);

  const handleSyncNow = useCallback(async () => {
    if (!canvasUrl) {
      setSyncStatus({
        success: false,
        message: "Please enter your Canvas calendar URL"
      });
      return;
    }

    // Check for corrupted URL (multiple URLs concatenated)
    if (canvasUrl.includes('icshttps://') || canvasUrl.split('https://').length > 2) {
      setSyncStatus({
        success: false,
        message: "The URL appears to be corrupted (contains multiple URLs). Please clear and paste a single Canvas calendar URL."
      });
      return;
    }

    // Validate URL format
    if (!canvasUrl.startsWith('https://') || !canvasUrl.includes('.ics')) {
      setSyncStatus({
        success: false,
        message: "Please enter a valid Canvas calendar URL (must start with https:// and end with .ics)"
      });
      return;
    }

    // Save URL for future use
    localStorage.setItem("canvas_calendar_url", canvasUrl);
    localStorage.setItem("canvas_auto_sync", autoSync.toString());

    setIsSyncing(true);
    setSyncStatus({ message: "Syncing with Canvas..." });

    try {
      const result = await fetchCanvasCalendar(canvasUrl, isAuthenticated, user, forceSync);
      setSyncStatus(result);
      // Reset force sync after use
      setForceSync(false);
      // Update calendar sync timestamp to trigger calendar refresh
      if (result.success) {
        setLastCalendarSyncTimestamp(Date.now());
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
    // Clear any previous sync status when URL changes
    setSyncStatus(null);
  }, []);

  const handleClearUrl = useCallback(() => {
    setCanvasUrl("");
    localStorage.removeItem("canvas_calendar_url");
    setSyncStatus(null);
  }, []);

  return (
    <div className={onClose ? "fixed inset-0 bg-black/50 flex justify-center items-center z-10" : ""}>
      <div className={onClose ? "bg-white p-6 rounded-lg shadow-lg w-[500px] max-w-lg relative" : "space-y-6"}>
        {/* Close button - only show when used as modal */}
        {onClose && (
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
        )}

        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🔄 Canvas Sync</h2>
          <p className="text-gray-600 mb-6">
            Connect your Canvas LMS to automatically sync assignments and due dates.
          </p>
        </div>

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
          <div className="flex gap-2">
            <input
              id="canvasUrl"
              type="text"
              value={canvasUrl}
              onChange={handleUrlChange}
              placeholder="https://elearn.ucr.edu/feeds/calendars/user_..."
              className="flex-1 p-2 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleClearUrl}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
              title="Clear URL"
              type="button"
            >
              Clear
            </button>
          </div>
          
          {/* URL validation warning */}
          {canvasUrl && (canvasUrl.includes('icshttps://') || canvasUrl.split('https://').length > 2) && (
            <div className="mt-2 p-2 bg-red-100 text-red-800 text-sm rounded">
              ⚠️ The URL appears to be corrupted (contains multiple URLs). Please clear and paste a single Canvas calendar URL.
            </div>
          )}

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
          
          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              id="forceSync"
              checked={forceSync}
              onChange={(e) => setForceSync(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="forceSync" className="text-gray-700">
              Force re-import (delete existing Canvas tasks first)
            </label>
          </div>
          
          {forceSync && (
            <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 text-sm rounded">
              ⚠️ Warning: This will delete all existing Canvas tasks and re-import them from scratch.
            </div>
          )}

          <div className="flex items-center mt-3 pt-3 border-t border-gray-200">
            <input
              type="checkbox"
              id="classNamingStyle"
              checked={classNamingStyle === 'descriptive'}
              onChange={handleClassNamingStyleChange}
              className="mr-2"
            />
            <label htmlFor="classNamingStyle" className="text-gray-700">
              Use descriptive class names (e.g., "Computer Science 100" instead of "CS100")
            </label>
          </div>
          
          <div className="mt-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Technical style:</span>
              <span className="font-mono">UGRD198G, EE123</span>
            </div>
            <div className="flex justify-between">
              <span>Descriptive style:</span>
              <span>Undergraduate Course 198G, Electrical Engineering 123</span>
            </div>
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

        {onClose && (
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition"
              type="button"
            >
              Close
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleDebugICS}
              disabled={isSyncing || !canvasUrl}
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-3 rounded transition text-sm disabled:opacity-50"
              type="button"
              title="Debug ICS parsing - check console for results"
            >
              Debug
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
        )}

        {/* Debug Information Display */}
        {debugInfo && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
            <h4 className="font-semibold mb-2">Debug Results:</h4>
            <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-40">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasSettings;