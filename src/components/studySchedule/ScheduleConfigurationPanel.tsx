import React, { useState, useCallback } from 'react';
import type {
  StudyProfile,
  OptimizationGoal,
  ScheduleGenerationStatus,
  StudyScheduleFeatureLimits,
  StudyTimePreference
} from '../../types/studySchedule';
import type { ClassWithRelations } from '../../types/database';

interface ScheduleConfigurationPanelProps {
  studyProfile: StudyProfile | null;
  onProfileUpdate: (profile: StudyProfile) => void;
  onGenerateSchedule: (
    goals: OptimizationGoal[],
    startDate: Date,
    endDate: Date,
    includeClasses: string[]
  ) => Promise<void>;
  generationStatus: ScheduleGenerationStatus;
  featureLimits: StudyScheduleFeatureLimits;
  classes: ClassWithRelations[];
}

const ScheduleConfigurationPanel: React.FC<ScheduleConfigurationPanelProps> = ({
  studyProfile,
  onProfileUpdate,
  onGenerateSchedule,
  generationStatus,
  featureLimits,
  classes
}) => {
  // Configuration state
  const [selectedGoals, setSelectedGoals] = useState<OptimizationGoal[]>(['balance_subjects']);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    return twoWeeksFromNow.toISOString().split('T')[0];
  });
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [isGenerateExpanded, setIsGenerateExpanded] = useState(true);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  
  // Study profile editing state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<StudyProfile>>({});
  
  // Initialize profile form when editing starts
  const startEditingProfile = useCallback(() => {
    if (studyProfile) {
      setProfileForm({ ...studyProfile });
      setEditingProfile(true);
    }
  }, [studyProfile]);
  
  // Save profile changes
  const saveProfileChanges = useCallback(() => {
    if (profileForm && studyProfile) {
      const updatedProfile: StudyProfile = {
        ...studyProfile,
        ...profileForm,
        updated_at: new Date().toISOString()
      };
      onProfileUpdate(updatedProfile);
      setEditingProfile(false);
    }
  }, [profileForm, studyProfile, onProfileUpdate]);
  
  // Handle goal selection
  const toggleGoal = useCallback((goal: OptimizationGoal) => {
    setSelectedGoals(prev => {
      if (prev.includes(goal)) {
        return prev.filter(g => g !== goal);
      } else {
        // Check premium limitations
        if (!featureLimits.advanced_optimization_enabled && 
            (goal === 'maximize_retention' || goal === 'focus_difficult')) {
          alert('Advanced optimization goals require premium subscription');
          return prev;
        }
        return [...prev, goal];
      }
    });
  }, [featureLimits.advanced_optimization_enabled]);
  
  // Handle class selection
  const toggleClass = useCallback((classId: string) => {
    setSelectedClasses(prev => {
      if (prev.includes(classId)) {
        return prev.filter(id => id !== classId);
      } else {
        if (prev.length >= featureLimits.max_classes_analyzed) {
          alert(`Maximum ${featureLimits.max_classes_analyzed} classes can be selected with current plan`);
          return prev;
        }
        return [...prev, classId];
      }
    });
  }, [featureLimits.max_classes_analyzed]);
  
  // Generate schedule
  const handleGenerateSchedule = useCallback(async () => {
    if (selectedGoals.length === 0) {
      alert('Please select at least one optimization goal');
      return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      alert('End date must be after start date');
      return;
    }
    
    await onGenerateSchedule(selectedGoals, start, end, selectedClasses);
  }, [selectedGoals, startDate, endDate, selectedClasses, onGenerateSchedule]);
  
  const optimizationGoals: { value: OptimizationGoal; label: string; description: string; premium?: boolean }[] = [
    {
      value: 'balance_subjects',
      label: 'Balance Subjects',
      description: 'Equal time allocation across all classes'
    },
    {
      value: 'meet_deadlines',
      label: 'Meet Deadlines',
      description: 'Prioritize upcoming assignment deadlines'
    },
    {
      value: 'minimize_stress',
      label: 'Minimize Stress',
      description: 'Spread workload evenly to reduce stress'
    },
    {
      value: 'maximize_retention',
      label: 'Maximize Retention',
      description: 'Use spaced repetition for better learning',
      premium: true
    },
    {
      value: 'focus_difficult',
      label: 'Focus on Difficult',
      description: 'Allocate more time to challenging subjects',
      premium: true
    }
  ];
  
  if (!studyProfile) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        Loading study profile...
      </div>
    );
  }
  
  return (
    <div className="flex-1 overflow-auto">
      {/* Schedule Generation */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => setIsGenerateExpanded(!isGenerateExpanded)}
          className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Generate Schedule</h3>
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform ${isGenerateExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        
        {isGenerateExpanded && (
          <div className="px-4 pb-4">
        
        {/* Date Range */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Period</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Optimization Goals */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Optimization Goals</label>
          <div className="space-y-2">
            {optimizationGoals.map(goal => {
              const isSelected = selectedGoals.includes(goal.value);
              const isPremium = goal.premium && !featureLimits.advanced_optimization_enabled;
              
              return (
                <div
                  key={goal.value}
                  className={`relative flex items-start p-3 rounded-lg border transition-colors ${
                    isPremium
                      ? 'border-gray-200 bg-gray-50 opacity-60'
                      : isSelected
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                  }`}
                  onClick={() => !isPremium && toggleGoal(goal.value)}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isPremium}
                    onChange={() => toggleGoal(goal.value)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{goal.label}</span>
                      {goal.premium && (
                        <span className="ml-2 px-1.5 py-0.5 bg-orange-100 text-orange-600 text-xs rounded font-medium">
                          Premium
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{goal.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Class Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Classes to Include ({selectedClasses.length}/{featureLimits.max_classes_analyzed})
          </label>
          <div className="text-xs text-gray-600 mb-2">
            Leave empty to include all classes
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {classes.map(cls => {
              const isSelected = selectedClasses.includes(cls.id);
              const canSelect = selectedClasses.length < featureLimits.max_classes_analyzed;
              
              return (
                <label
                  key={cls.id}
                  className={`flex items-center p-2 rounded border text-sm transition-colors ${
                    isSelected
                      ? 'border-blue-300 bg-blue-50'
                      : canSelect || isSelected
                      ? 'border-gray-200 hover:border-gray-300 cursor-pointer'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={!canSelect && !isSelected}
                    onChange={() => toggleClass(cls.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span className="ml-2 flex-1 truncate" title={cls.name}>{cls.name}</span>
                </label>
              );
            })}
          </div>
        </div>
        
        {/* Generate Button */}
        <button
          onClick={handleGenerateSchedule}
          disabled={generationStatus.status !== 'idle' && generationStatus.status !== 'complete'}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            generationStatus.status !== 'idle' && generationStatus.status !== 'complete'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {generationStatus.status === 'idle' || generationStatus.status === 'complete'
            ? 'Generate Optimized Schedule'
            : generationStatus.current_step
          }
        </button>
        
        {/* Generation Progress */}
        {generationStatus.status !== 'idle' && generationStatus.status !== 'complete' && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationStatus.progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>{generationStatus.current_step}</span>
              <span>{generationStatus.progress}%</span>
            </div>
          </div>
        )}
        
        {generationStatus.status === 'error' && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-700">Generation Failed</span>
            </div>
            {generationStatus.error_message && (
              <p className="text-xs text-red-600 mt-1">{generationStatus.error_message}</p>
            )}
          </div>
        )}
          </div>
        )}
      </div>
      
      {/* Study Profile Settings */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => setIsProfileExpanded(!isProfileExpanded)}
          className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Study Profile</h3>
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform ${isProfileExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        
        {isProfileExpanded && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">Configure your study preferences</span>
              <button
                onClick={editingProfile ? saveProfileChanges : startEditingProfile}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  editingProfile
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {editingProfile ? 'Save' : 'Edit'}
              </button>
            </div>
            
            {editingProfile ? (
              <StudyProfileEditor
                profile={profileForm}
                onChange={setProfileForm}
                onCancel={() => setEditingProfile(false)}
              />
            ) : (
              <StudyProfileDisplay profile={studyProfile} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Study Profile Display Component
interface StudyProfileDisplayProps {
  profile: StudyProfile;
}

const StudyProfileDisplay: React.FC<StudyProfileDisplayProps> = ({ profile }) => {
  const getDayName = (dayIndex: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  };
  
  return (
    <div className="space-y-4 text-sm">
      {/* Study Times */}
      <div>
        <h4 className="font-medium text-gray-700 mb-2">Preferred Study Times</h4>
        <div className="space-y-1">
          {profile.preferred_study_times.map((timeSlot, index) => (
            <div key={index} className="flex justify-between items-center bg-gray-50 rounded px-3 py-2">
              <span className="font-medium">{getDayName(timeSlot.day_of_week)}</span>
              <span className="text-gray-600">
                {timeSlot.start_time} - {timeSlot.end_time}
              </span>
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                {timeSlot.productivity_score}/10
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Session Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-700 mb-1">Focus Duration</h4>
          <p className="text-gray-600">{profile.focus_duration_minutes} minutes</p>
        </div>
        <div>
          <h4 className="font-medium text-gray-700 mb-1">Break Duration</h4>
          <p className="text-gray-600">{profile.break_duration_minutes} minutes</p>
        </div>
        <div>
          <h4 className="font-medium text-gray-700 mb-1">Daily Limit</h4>
          <p className="text-gray-600">{profile.daily_study_limit_hours} hours</p>
        </div>
        <div>
          <h4 className="font-medium text-gray-700 mb-1">Retention Curve</h4>
          <p className="text-gray-600">{profile.retention_curve_steepness}</p>
        </div>
      </div>
    </div>
  );
};

// Study Profile Editor Component
interface StudyProfileEditorProps {
  profile: Partial<StudyProfile>;
  onChange: (profile: Partial<StudyProfile>) => void;
  onCancel: () => void;
}

const StudyProfileEditor: React.FC<StudyProfileEditorProps> = ({
  profile,
  onChange,
  onCancel
}) => {
  const updateProfile = (updates: Partial<StudyProfile>) => {
    onChange({ ...profile, ...updates });
  };
  
  const updateStudyTime = (index: number, updates: Partial<StudyTimePreference>) => {
    const studyTimes = [...(profile.preferred_study_times || [])];
    studyTimes[index] = { ...studyTimes[index], ...updates };
    updateProfile({ preferred_study_times: studyTimes });
  };
  
  return (
    <div className="space-y-4 text-sm">
      {/* Focus Duration */}
      <div>
        <label className="block font-medium text-gray-700 mb-1">Focus Duration (minutes)</label>
        <input
          type="number"
          min="30"
          max="180"
          value={profile.focus_duration_minutes || 90}
          onChange={(e) => updateProfile({ focus_duration_minutes: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      {/* Break Duration */}
      <div>
        <label className="block font-medium text-gray-700 mb-1">Break Duration (minutes)</label>
        <input
          type="number"
          min="5"
          max="60"
          value={profile.break_duration_minutes || 15}
          onChange={(e) => updateProfile({ break_duration_minutes: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      {/* Daily Study Limit */}
      <div>
        <label className="block font-medium text-gray-700 mb-1">Daily Study Limit (hours)</label>
        <input
          type="number"
          min="1"
          max="12"
          step="0.5"
          value={profile.daily_study_limit_hours || 6}
          onChange={(e) => updateProfile({ daily_study_limit_hours: parseFloat(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      {/* Study Times */}
      <div>
        <label className="block font-medium text-gray-700 mb-2">Preferred Study Times</label>
        <div className="space-y-2">
          {(profile.preferred_study_times || []).map((timeSlot, index) => (
            <div key={index} className="grid grid-cols-4 gap-2 items-center bg-gray-50 rounded p-2">
              <select
                value={timeSlot.day_of_week}
                onChange={(e) => updateStudyTime(index, { day_of_week: parseInt(e.target.value) })}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value={0}>Sun</option>
                <option value={1}>Mon</option>
                <option value={2}>Tue</option>
                <option value={3}>Wed</option>
                <option value={4}>Thu</option>
                <option value={5}>Fri</option>
                <option value={6}>Sat</option>
              </select>
              
              <input
                type="time"
                value={timeSlot.start_time}
                onChange={(e) => updateStudyTime(index, { start_time: e.target.value })}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              />
              
              <input
                type="time"
                value={timeSlot.end_time}
                onChange={(e) => updateStudyTime(index, { end_time: e.target.value })}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              />
              
              <input
                type="number"
                min="1"
                max="10"
                value={timeSlot.productivity_score}
                onChange={(e) => updateStudyTime(index, { productivity_score: parseInt(e.target.value) })}
                className="text-xs border border-gray-300 rounded px-2 py-1 w-16"
                placeholder="1-10"
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex space-x-2 pt-2">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ScheduleConfigurationPanel;