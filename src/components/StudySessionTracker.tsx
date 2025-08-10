import React, { useState, useEffect } from 'react';
import { useStudySession } from '../hooks/useStudySession';
import classService from '../services/classService';
import type { ClassWithRelations } from '../types/database';

interface StudySessionTrackerProps {
  taskId?: string;
  className?: string;
}

export const StudySessionTracker: React.FC<StudySessionTrackerProps> = React.memo(({ 
  taskId, 
  className = '' 
}) => {
  const { 
    activeSession, 
    isLoading, 
    error, 
    startSession, 
    endSession, 
    addInterruption, 
    getSessionDuration, 
    clearError 
  } = useStudySession();
  
  const [classes, setClasses] = useState<ClassWithRelations[]>([]);
  
  // Get classes from the class service
  useEffect(() => {
    const loadClasses = () => {
      const currentClasses = classService.getCurrentClasses();
      setClasses(currentClasses);
    };
    
    loadClasses();
    
    // Subscribe to class changes
    const unsubscribe = classService.subscribe((updatedClasses) => {
      setClasses(updatedClasses);
    });
    
    return unsubscribe;
  }, []);
  
  const [showStartForm, setShowStartForm] = useState(false);
  const [showEndForm, setShowEndForm] = useState(false);
  const [sessionSubject, setSessionSubject] = useState('');
  const [sessionType, setSessionType] = useState<'focused' | 'review' | 'practice' | 'reading'>('focused');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [effectivenessRating, setEffectivenessRating] = useState<number>(3);
  const [sessionNotes, setSessionNotes] = useState('');
  const [currentDuration, setCurrentDuration] = useState(0);

  // Update duration display every minute
  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(() => {
      setCurrentDuration(getSessionDuration());
    }, 60000); // Update every minute

    // Initial update
    setCurrentDuration(getSessionDuration());

    return () => clearInterval(interval);
  }, [activeSession, getSessionDuration]);

  const handleStartSession = async () => {
    if (!sessionSubject.trim()) return;

    const success = await startSession(
      sessionSubject.trim(),
      sessionType,
      taskId,
      selectedClassId || undefined
    );

    if (success) {
      setShowStartForm(false);
      setSessionSubject('');
      setSelectedClassId('');
    }
  };

  const handleEndSession = async () => {
    const success = await endSession(effectivenessRating, sessionNotes.trim() || undefined);
    
    if (success) {
      setShowEndForm(false);
      setEffectivenessRating(3);
      setSessionNotes('');
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'focused': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'review': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'practice': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case 'reading': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
      default: return 'bg-gray-100 dark:bg-slate-700/50 text-gray-800 dark:text-slate-300';
    }
  };

  if (isLoading) {
    return (
      <div className={`study-session-tracker ${className}`}>
        <div className="animate-pulse bg-gray-200 dark:bg-slate-700/50 rounded-lg p-4">
          <div className="h-4 bg-gray-300 dark:bg-slate-600/50 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-300 dark:bg-slate-600/50 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`study-session-tracker animate-fadeIn ${className}`}>
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
          <div className="flex justify-between items-start">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            <button
              onClick={clearError}
              className="text-red-400 dark:text-red-300 hover:text-red-600 dark:hover:text-red-200 ml-2"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {activeSession ? (
        <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-600/50 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Active Study Session</span>
            </div>
            <span className="text-sm text-gray-500 dark:text-slate-400">{formatDuration(currentDuration)}</span>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Subject:</span>
              <span className="text-sm text-gray-900 dark:text-slate-100">{activeSession.subject}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Type:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSessionTypeColor(activeSession.sessionType)}`}>
                {activeSession.sessionType}
              </span>
            </div>
            {activeSession.interruptionsCount > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Interruptions:</span>
                <span className="text-sm text-red-600 dark:text-red-400">{activeSession.interruptionsCount}</span>
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={addInterruption}
              className="flex-1 px-3 py-2 text-sm font-medium text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-md hover:bg-orange-100 dark:hover:bg-orange-900/30 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              + Interruption
            </button>
            <button
              onClick={() => setShowEndForm(true)}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              End Session
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-600/50 rounded-lg p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">No active study session</p>
            <button
              onClick={() => setShowStartForm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Start Study Session
            </button>
          </div>
        </div>
      )}

      {/* Start Session Modal */}
      {showStartForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-4">Start Study Session</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={sessionSubject}
                  onChange={(e) => setSessionSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600/50 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What are you studying?"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Session Type
                </label>
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600/50 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="focused">Focused Study</option>
                  <option value="review">Review</option>
                  <option value="practice">Practice</option>
                  <option value="reading">Reading</option>
                </select>
              </div>

              {classes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Class (Optional)
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600/50 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No specific class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowStartForm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-600/50 border border-gray-300 dark:border-slate-600/50 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600/70 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleStartSession}
                disabled={!sessionSubject.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Session Modal */}
      {showEndForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-4">End Study Session</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  How effective was this session? (1-5)
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setEffectivenessRating(rating)}
                      className={`w-8 h-8 rounded-full text-sm font-medium ${
                        effectivenessRating === rating
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-slate-600/50 text-gray-700 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-slate-600/70'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600/50 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="How did the session go? What did you learn?"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEndForm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-600/50 border border-gray-300 dark:border-slate-600/50 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600/70 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleEndSession}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});