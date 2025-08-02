import React, { useMemo } from 'react';
import type {
  StudySchedule,
  StudySession,
  StudyScheduleUIState,
  StudySessionType
} from '../../types/studySchedule';
import type { ClassWithRelations } from '../../types/database';

interface ScheduleCalendarViewProps {
  schedule: StudySchedule | null;
  sessions: StudySession[];
  uiState: StudyScheduleUIState;
  onUIStateChange: (state: StudyScheduleUIState) => void;
  onSessionUpdate: (sessionId: string, status: StudySession['status'], feedback?: any) => void;
  classes: ClassWithRelations[];
}

const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({
  schedule,
  sessions,
  uiState,
  onUIStateChange,
  onSessionUpdate,
  classes
}) => {
  // Get class info for sessions
  const getClassInfo = (classId: string) => {
    return classes.find(c => c.id === classId) || { id: classId, name: 'Unknown Class' };
  };
  
  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const grouped: Record<string, StudySession[]> = {};
    sessions.forEach(session => {
      if (!grouped[session.date]) {
        grouped[session.date] = [];
      }
      grouped[session.date].push(session);
    });
    
    // Sort sessions within each date by start time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    
    return grouped;
  }, [sessions]);
  
  // Generate week view dates
  const weekDates = useMemo(() => {
    if (uiState.viewMode !== 'week') return [];
    
    const startOfWeek = getWeekStart(uiState.selectedWeek);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [uiState.selectedWeek, uiState.viewMode]);
  
  const getSessionTypeColor = (sessionType: StudySessionType): string => {
    const colors = {
      new_material: 'bg-blue-100 border-blue-300 text-blue-800',
      review: 'bg-green-100 border-green-300 text-green-800',
      practice: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      exam_prep: 'bg-red-100 border-red-300 text-red-800',
      project_work: 'bg-purple-100 border-purple-300 text-purple-800',
      break_recovery: 'bg-gray-100 border-gray-300 text-gray-800'
    };
    return colors[sessionType] || colors.practice;
  };
  
  const getStatusIcon = (status: StudySession['status']) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'in_progress':
        return '🔄';
      case 'skipped':
        return '⏭️';
      case 'rescheduled':
        return '📅';
      default:
        return '📋';
    }
  };
  
  if (!schedule) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedule Generated</h3>
          <p className="text-gray-600 mb-4">Generate your first AI-optimized study schedule to get started.</p>
          <p className="text-sm text-gray-500">Use the configuration panel to set your preferences and generate a personalized schedule.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* View Controls */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          {/* View Mode Selector */}
          <div className="flex items-center space-x-2">
            <div className="flex bg-white rounded-lg border border-gray-300">
              {(['week', 'month', 'agenda'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => onUIStateChange({ ...uiState, viewMode: mode })}
                  className={`px-3 py-1 text-sm font-medium capitalize transition-colors ${
                    uiState.viewMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            
            {/* Week Navigation */}
            {uiState.viewMode === 'week' && (
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => {
                    const prevWeek = new Date(uiState.selectedWeek);
                    prevWeek.setDate(prevWeek.getDate() - 7);
                    onUIStateChange({ ...uiState, selectedWeek: prevWeek });
                  }}
                  className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-medium text-gray-900">
                  Week of {weekDates[0]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <button
                  onClick={() => {
                    const nextWeek = new Date(uiState.selectedWeek);
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    onUIStateChange({ ...uiState, selectedWeek: nextWeek });
                  }}
                  className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          {/* Filters and Options */}
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={uiState.showCompleted}
                onChange={(e) => onUIStateChange({ ...uiState, showCompleted: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">Show completed</span>
            </label>
            
            <button
              onClick={() => onUIStateChange({ ...uiState, showAnalytics: !uiState.showAnalytics })}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                uiState.showAnalytics
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>
        
        {/* Schedule Summary */}
        <div className="mt-3 flex items-center space-x-6 text-sm text-gray-600">
          <span>📚 {sessions.length} sessions scheduled</span>
          <span>⏱️ {Math.round(sessions.reduce((sum, s) => sum + s.duration_minutes, 0) / 60)} hours total</span>
          <span>✅ {sessions.filter(s => s.status === 'completed').length} completed</span>
        </div>
      </div>
      
      {/* Calendar Content */}
      <div className="flex-1 overflow-auto">
        {uiState.viewMode === 'week' ? (
          <WeekView
            weekDates={weekDates}
            sessionsByDate={sessionsByDate}
            getClassInfo={getClassInfo}
            getSessionTypeColor={getSessionTypeColor}
            getStatusIcon={getStatusIcon}
            onSessionSelect={(session) => onUIStateChange({ ...uiState, selectedSession: session })}
            onSessionUpdate={onSessionUpdate}
          />
        ) : uiState.viewMode === 'agenda' ? (
          <AgendaView
            sessions={sessions}
            getClassInfo={getClassInfo}
            getSessionTypeColor={getSessionTypeColor}
            getStatusIcon={getStatusIcon}
            onSessionSelect={(session) => onUIStateChange({ ...uiState, selectedSession: session })}
            onSessionUpdate={onSessionUpdate}
          />
        ) : (
          <MonthView
            sessionsByDate={sessionsByDate}
            selectedWeek={uiState.selectedWeek}
            onWeekSelect={(date) => onUIStateChange({ ...uiState, selectedWeek: date, viewMode: 'week' })}
          />
        )}
      </div>
    </div>
  );
};

// Week View Component
interface WeekViewProps {
  weekDates: Date[];
  sessionsByDate: Record<string, StudySession[]>;
  getClassInfo: (classId: string) => any;
  getSessionTypeColor: (type: StudySessionType) => string;
  getStatusIcon: (status: StudySession['status']) => string;
  onSessionSelect: (session: StudySession) => void;
  onSessionUpdate: (sessionId: string, status: StudySession['status']) => void;
}

const WeekView: React.FC<WeekViewProps> = ({
  weekDates,
  sessionsByDate,
  getClassInfo,
  getSessionTypeColor,
  getStatusIcon,
  onSessionSelect,
  onSessionUpdate
}) => {
  return (
    <div className="grid grid-cols-7 gap-px bg-gray-200 h-full">
      {/* Day Headers */}
      {weekDates.map(date => (
        <div key={date.toISOString()} className="bg-gray-50 p-2 border-b border-gray-200">
          <div className="text-center">
            <div className="text-xs font-medium text-gray-500 uppercase">
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className={`text-lg font-semibold ${
              date.toDateString() === new Date().toDateString()
                ? 'text-blue-600'
                : 'text-gray-900'
            }`}>
              {date.getDate()}
            </div>
          </div>
        </div>
      ))}
      
      {/* Day Cells */}
      {weekDates.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        const daySessions = sessionsByDate[dateStr] || [];
        
        return (
          <div key={dateStr} className="bg-white p-2 min-h-32 border-b border-gray-200">
            <div className="space-y-1">
              {daySessions.map(session => {
                const classInfo = getClassInfo(session.class_id);
                return (
                  <div
                    key={session.id}
                    onClick={() => onSessionSelect(session)}
                    className={`p-2 rounded border-l-4 cursor-pointer hover:shadow-sm transition-shadow ${
                      getSessionTypeColor(session.session_type)
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">
                        {session.start_time} - {session.end_time}
                      </span>
                      <span className="text-xs">{getStatusIcon(session.status)}</span>
                    </div>
                    <div className="text-xs font-medium truncate" title={classInfo.name}>
                      {classInfo.name}
                    </div>
                    <div className="text-xs text-gray-600 truncate" title={session.focus_area}>
                      {session.focus_area}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Agenda View Component
interface AgendaViewProps {
  sessions: StudySession[];
  getClassInfo: (classId: string) => any;
  getSessionTypeColor: (type: StudySessionType) => string;
  getStatusIcon: (status: StudySession['status']) => string;
  onSessionSelect: (session: StudySession) => void;
  onSessionUpdate: (sessionId: string, status: StudySession['status']) => void;
}

const AgendaView: React.FC<AgendaViewProps> = ({
  sessions,
  getClassInfo,
  getSessionTypeColor,
  getStatusIcon,
  onSessionSelect,
  onSessionUpdate
}) => {
  // Group sessions by date
  const sessionsByDate = sessions.reduce((grouped, session) => {
    if (!grouped[session.date]) {
      grouped[session.date] = [];
    }
    grouped[session.date].push(session);
    return grouped;
  }, {} as Record<string, StudySession[]>);
  
  return (
    <div className="p-4 space-y-6">
      {Object.entries(sessionsByDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, daySessions]) => {
          const dateObj = new Date(date);
          
          return (
            <div key={date} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-3 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">
                  {dateObj.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>
                <p className="text-sm text-gray-600">
                  {daySessions.length} session{daySessions.length !== 1 ? 's' : ''} • 
                  {Math.round(daySessions.reduce((sum, s) => sum + s.duration_minutes, 0) / 60 * 10) / 10} hours
                </p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {daySessions.map(session => {
                  const classInfo = getClassInfo(session.class_id);
                  
                  return (
                    <div
                      key={session.id}
                      onClick={() => onSessionSelect(session)}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              {session.start_time} - {session.end_time}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              getSessionTypeColor(session.session_type)
                            }`}>
                              {session.session_type.replace('_', ' ')}
                            </span>
                            <span className="text-lg">{getStatusIcon(session.status)}</span>
                          </div>
                          
                          <h4 className="font-medium text-gray-900 mb-1">
                            {classInfo.name}
                          </h4>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {session.focus_area}
                          </p>
                          
                          {session.learning_objectives.length > 0 && (
                            <div className="text-xs text-gray-500">
                              Objectives: {session.learning_objectives.join(', ')}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right text-xs text-gray-500">
                          <div>{session.duration_minutes} min</div>
                          <div>Difficulty: {session.difficulty_level}/5</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
    </div>
  );
};

// Month View Component
interface MonthViewProps {
  sessionsByDate: Record<string, StudySession[]>;
  selectedWeek: Date;
  onWeekSelect: (date: Date) => void;
}

const MonthView: React.FC<MonthViewProps> = ({
  sessionsByDate,
  selectedWeek,
  onWeekSelect
}) => {
  // Generate month calendar
  const monthStart = new Date(selectedWeek.getFullYear(), selectedWeek.getMonth(), 1);
  const monthEnd = new Date(selectedWeek.getFullYear(), selectedWeek.getMonth() + 1, 0);
  const startDate = getWeekStart(monthStart);
  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
  
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    currentWeek.push(new Date(date));
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  
  return (
    <div className="p-4">
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-50 p-3 text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {/* Calendar Cells */}
        {weeks.flat().map(date => {
          const dateStr = date.toISOString().split('T')[0];
          const daySessions = sessionsByDate[dateStr] || [];
          const isCurrentMonth = date.getMonth() === selectedWeek.getMonth();
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={dateStr}
              onClick={() => onWeekSelect(date)}
              className={`bg-white p-2 min-h-24 cursor-pointer hover:bg-gray-50 transition-colors ${
                !isCurrentMonth ? 'text-gray-400' : ''
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${
                isToday ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {date.getDate()}
              </div>
              
              <div className="space-y-1">
                {daySessions.slice(0, 3).map(session => (
                  <div
                    key={session.id}
                    className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate"
                    title={session.focus_area}
                  >
                    {session.start_time}
                  </div>
                ))}
                {daySessions.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{daySessions.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Helper function
function getWeekStart(date: Date): Date {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day;
  return new Date(start.setDate(diff));
}

export default ScheduleCalendarView;