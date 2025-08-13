import React, { useState, useEffect, useCallback } from "react";
import { fetchCanvasCalendar, debugICSParsing } from "../services/canvasService";
import { getSettings, updateSettings } from "../services/settings/settingsOperations";
import { useAuth } from "../contexts/AuthContext";
import { logger } from "../utils/logger";
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
  const [isQuickGuideExpanded, setIsQuickGuideExpanded] = useState<boolean>(() => 
    localStorage.getItem("canvas_quick_guide_expanded") !== "false"
  );

  const handleDebugICS = useCallback(async () => {
    if (!canvasUrl) {
      alert("Please enter a Canvas URL first");
      return;
    }
    
    setIsSyncing(true);
    try {
      const result = await debugICSParsing(canvasUrl);
      setDebugInfo(result);
      if (process.env.NODE_ENV === 'development') {
        // ICS debug result obtained
      }
    } catch (error) {
      logger.error('Debug error', { error });
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

  const toggleQuickGuide = useCallback(() => {
    const newExpanded = !isQuickGuideExpanded;
    setIsQuickGuideExpanded(newExpanded);
    localStorage.setItem("canvas_quick_guide_expanded", newExpanded.toString());
  }, [isQuickGuideExpanded]);

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
    setSyncStatus(null);

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
    <div className={onClose ? "fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[9999] p-4" : ""}>
      <div className={onClose ? "bg-white dark:bg-slate-800/95 p-6 rounded-xl shadow-2xl dark:shadow-slate-900/40 border border-gray-100 dark:border-slate-700/50 w-full max-w-lg mx-auto relative transform transition-all duration-200 animate-fadeIn" : "space-y-6"}>
        {/* Close button - only show when used as modal */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close Canvas Settings"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}


        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg mb-4">
            <button
              onClick={toggleQuickGuide}
              className="w-full p-4 text-left focus:outline-none transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-900/30 rounded-lg"
              aria-expanded={isQuickGuideExpanded}
              aria-controls="quick-setup-guide"
            >
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Quick Setup Guide
                </div>
                <svg 
                  className={`w-5 h-5 text-blue-600 transition-transform duration-200 ${isQuickGuideExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </h3>
            </button>
            
            {isQuickGuideExpanded && (
              <div id="quick-setup-guide" className="px-4 pb-4">
                <div className="space-y-2 text-sm text-gray-700 dark:text-slate-300">
                  <div className="flex items-start">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold mr-3 mt-0.5 flex-shrink-0">1</span>
                    <span>Go to Canvas → Calendar → Calendar Feed</span>
                  </div>
                  <div className="flex items-start">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold mr-3 mt-0.5 flex-shrink-0">2</span>
                    <span>Copy the full calendar feed URL</span>
                  </div>
                  <div className="flex items-start">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold mr-3 mt-0.5 flex-shrink-0">3</span>
                    <span>Paste URL below and click "Sync Now"</span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-white dark:bg-slate-800/50 border border-blue-200 dark:border-blue-700/50 rounded-md">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-xs text-gray-600 dark:text-slate-400">
                      Uses secure proxy service to parse Canvas ICS calendar feeds
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <label htmlFor="canvasUrl" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Canvas Calendar URL
          </label>
          <div className="flex gap-2">
            <input
              id="canvasUrl"
              type="url"
              value={canvasUrl}
              onChange={handleUrlChange}
              placeholder="https://elearn.ucr.edu/feeds/calendars/user_..."
              className="flex-1 p-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              aria-describedby={canvasUrl && (canvasUrl.includes('icshttps://') || canvasUrl.split('https://').length > 2) ? "url-error" : undefined}
            />
            <button
              onClick={handleClearUrl}
              className="px-4 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-300 rounded-lg transition-all duration-200 hover:shadow-sm border border-gray-200 dark:border-slate-600 min-h-[44px] flex items-center justify-center"
              title="Clear URL"
              type="button"
              aria-label="Clear Canvas URL"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          
          {/* URL validation warning */}
          {canvasUrl && (canvasUrl.includes('icshttps://') || canvasUrl.split('https://').length > 2) && (
            <div id="url-error" className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg" role="alert">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="font-medium">Invalid URL Format</p>
                  <p className="mt-1 text-xs">The URL appears to be corrupted (contains multiple URLs). Please clear and paste a single Canvas calendar URL.</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center mt-4 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700/50">
            <input
              type="checkbox"
              id="autoSync"
              checked={autoSync}
              onChange={handleAutoSyncChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
            />
            <label htmlFor="autoSync" className="text-sm text-gray-700 dark:text-slate-300 flex-1">
              <span className="font-medium">Automatically sync on startup</span>
              <span className="block text-xs text-gray-500 dark:text-slate-400 mt-1">Sync Canvas calendar each time you open the app</span>
            </label>
          </div>
          
          <div className="flex items-center mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800/50">
            <input
              type="checkbox"
              id="forceSync"
              checked={forceSync}
              onChange={(e) => setForceSync(e.target.checked)}
              className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded mr-3"
            />
            <label htmlFor="forceSync" className="text-sm text-gray-700 dark:text-slate-300 flex-1">
              <span className="font-medium">Force re-import</span>
              <span className="block text-xs text-gray-500 dark:text-slate-400 mt-1">Delete existing Canvas tasks and re-import from scratch</span>
            </label>
          </div>
          
          {forceSync && (
            <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-sm rounded">
              ⚠️ Warning: This will delete all existing Canvas tasks and re-import them from scratch.
            </div>
          )}

          <div className="flex items-center mt-3 pt-3 border-t border-gray-200 dark:border-slate-700/50">
            <input
              type="checkbox"
              id="classNamingStyle"
              checked={classNamingStyle === 'descriptive'}
              onChange={handleClassNamingStyleChange}
              className="mr-2"
            />
            <label htmlFor="classNamingStyle" className="text-gray-700 dark:text-slate-300">
              Use descriptive class names (e.g., "Computer Science 100" instead of "CS100")
            </label>
          </div>
          
          <div className="mt-2 text-sm text-gray-600 dark:text-slate-400">
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
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-800 dark:text-blue-300 text-sm font-medium">{syncProgress}</span>
            </div>
            <div className="mt-2 bg-blue-200 dark:bg-blue-800/50 rounded-full h-2">
              <div className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
            </div>
          </div>
        )}

        {/* Sync status */}
        {syncStatus && (
          <div className={`p-4 rounded-xl mb-6 border ${
            syncStatus.success === false 
              ? "bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-red-200" 
              : syncStatus.success === true
              ? "bg-gradient-to-r from-green-50 to-emerald-100 text-green-800 border-green-200"
              : "bg-gradient-to-r from-yellow-50 to-amber-100 text-yellow-800 border-yellow-200"
          }`}>
            <div className="flex items-start">
              {syncStatus.success === false && (
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              {syncStatus.success === true && (
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              {syncStatus.success === undefined && (
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-base leading-relaxed">{syncStatus.message}</p>
                {syncStatus.success && syncStatus.tasks && (
                  <div className="mt-3 p-3 bg-white bg-opacity-60 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">
                        {syncStatus.tasks.length} tasks processed successfully
                      </span>
                    </div>
                  </div>
                )}
                {syncStatus.success === false && (
                  <div className="mt-3 p-3 bg-white border border-red-200 rounded-md">
                    <p className="text-sm font-medium text-gray-900 mb-2">Troubleshooting Steps:</p>
                    <ul className="space-y-1.5 text-xs text-gray-600">
                      <li className="flex items-start">
                        <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                        Verify your Canvas calendar URL is correct
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                        Check your internet connection
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                        Try again in a few minutes if Canvas is temporarily unavailable
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                        Contact Canvas support if the problem persists
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action buttons - always shown */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-slate-700/50">
          {onClose && (
            <button
              onClick={onClose}
              className="order-2 sm:order-1 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-sm border border-gray-200 dark:border-slate-600 min-h-[44px]"
              type="button"
            >
              Cancel
            </button>
          )}

          <div className={`order-1 sm:order-2 flex flex-col sm:flex-row gap-3 ${!onClose ? 'w-full' : ''}`}>
            {/* Debug button - commented out for production */}
            {/* <button
              onClick={handleDebugICS}
              disabled={isSyncing || !canvasUrl}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm min-h-[44px] flex items-center justify-center"
              type="button"
              title="Debug ICS parsing - check console for results"
              aria-label="Debug Canvas ICS parsing"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Debug
            </button> */}
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className={`bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center ${isSyncing ? "shadow-inner" : "shadow-sm"}`}
              type="button"
            >
              {isSyncing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Syncing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* Debug Information Display */}
        {debugInfo && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl">
            <div className="flex items-center mb-3">
              <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h4 className="font-semibold text-gray-900 dark:text-slate-100">Debug Results</h4>
            </div>
            <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700/50 rounded-lg p-3 max-h-48 overflow-auto">
              <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-slate-300 font-mono leading-relaxed">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(CanvasSettings);

// Component enhancements:
// ✅ Enhanced visual hierarchy with proper headings and icons
// ✅ Improved accessibility with ARIA labels and semantic markup
// ✅ Professional UI with gradients, shadows, and modern styling
// ✅ Better mobile responsiveness with proper touch targets
// ✅ Enhanced loading states and progress indicators
// ✅ Improved error handling with actionable feedback
// ✅ Professional icon usage throughout the interface
// ✅ Consistent spacing and typography system