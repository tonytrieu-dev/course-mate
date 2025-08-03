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
  const [syncProgress, setSyncProgress] = useState<string>('');
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
    setSyncProgress('Connecting to Canvas...');
    setSyncStatus({ message: "Syncing with Canvas..." });

    try {
      // Simulate progress updates
      setSyncProgress('Fetching calendar data...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await fetchCanvasCalendar(canvasUrl, isAuthenticated, user, forceSync);
      
      setSyncProgress('Processing events...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setSyncStatus(result);
      
      // Reset force sync after use
      setForceSync(false);
      // Update calendar sync timestamp to trigger calendar refresh
      if (result.success) {
        setSyncProgress('Sync completed successfully!');
        setLastCalendarSyncTimestamp(Date.now());
        
        // Auto-clear progress after success
        setTimeout(() => {
          setSyncProgress('');
        }, 2000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSyncProgress('');
      setSyncStatus({
        success: false,
        message: `Canvas sync failed: ${errorMessage}. Please check your URL and internet connection.`
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
    <div className={onClose ? "fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[9999]" : ""}>
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

        {/* Progress indicator */}
        {isSyncing && syncProgress && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-800 text-sm font-medium">{syncProgress}</span>
            </div>
            <div className="mt-2 bg-blue-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
            </div>
          </div>
        )}

        {/* Sync status */}
        {syncStatus && (
          <div className={`p-3 rounded mb-4 ${
            syncStatus.success === false 
              ? "bg-red-100 text-red-800 border border-red-200" 
              : syncStatus.success === true
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-yellow-100 text-yellow-800 border border-yellow-200"
          }`}>
            <div className="flex items-start">
              {syncStatus.success === false && (
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {syncStatus.success === true && (
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              <div className="flex-1">
                <p className="font-medium">{syncStatus.message}</p>
                {syncStatus.success && syncStatus.tasks && (
                  <p className="mt-1 text-sm opacity-90">
                    {syncStatus.tasks.length} tasks processed successfully.
                  </p>
                )}
                {syncStatus.success === false && (
                  <div className="mt-2 text-sm">
                    <p>Common solutions:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Verify your Canvas calendar URL is correct</li>
                      <li>Check your internet connection</li>
                      <li>Try again in a few minutes if Canvas is temporarily unavailable</li>
                      <li>Contact Canvas support if the problem persists</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action buttons - always shown */}
        <div className="flex justify-between items-center mt-6">
          {onClose && (
            <button
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition"
              type="button"
            >
              Close
            </button>
          )}

          <div className={`flex gap-2 ${!onClose ? 'w-full justify-end' : ''}`}>
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