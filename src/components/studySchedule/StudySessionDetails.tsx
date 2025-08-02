import React, { useState } from 'react';
import type { StudySession } from '../../types/studySchedule';
import type { ClassWithRelations } from '../../types/database';

interface StudySessionDetailsProps {
  session: StudySession;
  onUpdate: (sessionId: string, status: StudySession['status'], feedback?: any) => void;
  onClose: () => void;
  classes: ClassWithRelations[];
}

const StudySessionDetails: React.FC<StudySessionDetailsProps> = ({
  session,
  onUpdate,
  onClose,
  classes
}) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedback, setFeedback] = useState({
    difficulty_rating: session.difficulty_rating || 3,
    effectiveness_rating: session.effectiveness_rating || 3,
    focus_quality: session.focus_quality || 3,
    notes: session.notes || ''
  });
  
  // Get class information
  const classInfo = classes.find(c => c.id === session.class_id) || {
    id: session.class_id,
    name: 'Unknown Class'
  };
  
  // Session type display mapping
  const sessionTypeLabels = {
    new_material: 'New Material',
    review: 'Review',
    practice: 'Practice',
    exam_prep: 'Exam Preparation',
    project_work: 'Project Work',
    break_recovery: 'Break Recovery'
  };
  
  // Status display mapping
  const statusLabels = {
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    completed: 'Completed',
    skipped: 'Skipped',
    rescheduled: 'Rescheduled'
  };
  
  // Status colors
  const getStatusColor = (status: StudySession['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'skipped':
        return 'bg-gray-100 text-gray-800';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Handle status update
  const handleStatusUpdate = (newStatus: StudySession['status']) => {
    if (newStatus === 'completed') {
      setShowFeedbackForm(true);
    } else {
      onUpdate(session.id, newStatus);
    }
  };
  
  // Handle completion with feedback
  const handleCompleteWithFeedback = () => {
    onUpdate(session.id, 'completed', feedback);
    setShowFeedbackForm(false);
  };
  
  // Get difficulty stars
  const getDifficultyStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < level ? 'text-red-500' : 'text-gray-300'}>
        ★
      </span>
    ));
  };
  
  // Get rating stars for feedback
  const getRatingStars = (rating: number, onChange: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => onChange(i + 1)}
        className={`text-lg transition-colors ${
          i < rating ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-300 hover:text-gray-400'
        }`}
      >
        ★
      </button>
    ));
  };
  
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Session Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
            getStatusColor(session.status)
          }`}>
            {statusLabels[session.status]}
          </span>
          <span className="text-sm text-gray-600">
            {new Date(session.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Basic Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Session Information</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Class:</span>
              <span className="text-sm font-medium text-gray-900">{classInfo.name}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Time:</span>
              <span className="text-sm font-medium text-gray-900">
                {session.start_time} - {session.end_time}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Duration:</span>
              <span className="text-sm font-medium text-gray-900">{session.duration_minutes} minutes</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Type:</span>
              <span className="text-sm font-medium text-gray-900">
                {sessionTypeLabels[session.session_type]}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Difficulty:</span>
              <div className="flex items-center space-x-1">
                {getDifficultyStars(session.difficulty_level)}
                <span className="text-sm text-gray-600 ml-2">({session.difficulty_level}/5)</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Focus Area */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Focus Area</h4>
          <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
            {session.focus_area}
          </p>
        </div>
        
        {/* Learning Objectives */}
        {session.learning_objectives.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Learning Objectives</h4>
            <ul className="space-y-1">
              {session.learning_objectives.map((objective, index) => (
                <li key={index} className="text-sm text-gray-900 flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  {objective}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Prerequisites */}
        {session.prerequisite_concepts.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Prerequisites</h4>
            <div className="flex flex-wrap gap-2">
              {session.prerequisite_concepts.map((concept, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {concept}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Actual Time Tracking */}
        {(session.actual_start_time || session.actual_end_time) && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Actual Time</h4>
            <div className="space-y-2 text-sm">
              {session.actual_start_time && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Started:</span>
                  <span className="text-gray-900">{session.actual_start_time}</span>
                </div>
              )}
              {session.actual_end_time && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Ended:</span>
                  <span className="text-gray-900">{session.actual_end_time}</span>
                </div>
              )}
              {session.actual_duration_minutes && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="text-gray-900">{session.actual_duration_minutes} minutes</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Feedback */}
        {(session.difficulty_rating || session.effectiveness_rating || session.focus_quality || session.notes) && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Your Feedback</h4>
            <div className="space-y-3">
              {session.difficulty_rating && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Difficulty:</span>
                  <div className="flex items-center space-x-1">
                    {getDifficultyStars(session.difficulty_rating)}
                    <span className="text-sm text-gray-600 ml-2">({session.difficulty_rating}/5)</span>
                  </div>
                </div>
              )}
              
              {session.effectiveness_rating && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Effectiveness:</span>
                  <div className="flex items-center space-x-1">
                    {getDifficultyStars(session.effectiveness_rating)}
                    <span className="text-sm text-gray-600 ml-2">({session.effectiveness_rating}/5)</span>
                  </div>
                </div>
              )}
              
              {session.focus_quality && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Focus Quality:</span>
                  <div className="flex items-center space-x-1">
                    {getDifficultyStars(session.focus_quality)}
                    <span className="text-sm text-gray-600 ml-2">({session.focus_quality}/5)</span>
                  </div>
                </div>
              )}
              
              {session.notes && (
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Notes:</span>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                    {session.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Feedback Form Modal */}
      {showFeedbackForm && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Feedback</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How difficult was this session?
                </label>
                <div className="flex items-center space-x-1">
                  {getRatingStars(feedback.difficulty_rating, (rating) => 
                    setFeedback(prev => ({ ...prev, difficulty_rating: rating }))
                  )}
                  <span className="text-sm text-gray-600 ml-2">({feedback.difficulty_rating}/5)</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How effective was this session?
                </label>
                <div className="flex items-center space-x-1">
                  {getRatingStars(feedback.effectiveness_rating, (rating) => 
                    setFeedback(prev => ({ ...prev, effectiveness_rating: rating }))
                  )}
                  <span className="text-sm text-gray-600 ml-2">({feedback.effectiveness_rating}/5)</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How well did you focus?
                </label>
                <div className="flex items-center space-x-1">
                  {getRatingStars(feedback.focus_quality, (rating) => 
                    setFeedback(prev => ({ ...prev, focus_quality: rating }))
                  )}
                  <span className="text-sm text-gray-600 ml-2">({feedback.focus_quality}/5)</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional notes (optional)
                </label>
                <textarea
                  value={feedback.notes}
                  onChange={(e) => setFeedback(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Any additional thoughts about this session..."
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowFeedbackForm(false)}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteWithFeedback}
                className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Complete Session
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {session.status === 'scheduled' && (
          <>
            <button
              onClick={() => handleStatusUpdate('in_progress')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Start Session
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleStatusUpdate('rescheduled')}
                className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
              >
                Reschedule
              </button>
              <button
                onClick={() => handleStatusUpdate('skipped')}
                className="px-3 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Skip
              </button>
            </div>
          </>
        )}
        
        {session.status === 'in_progress' && (
          <>
            <button
              onClick={() => handleStatusUpdate('completed')}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Complete Session
            </button>
            <button
              onClick={() => handleStatusUpdate('scheduled')}
              className="w-full px-3 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Pause Session
            </button>
          </>
        )}
        
        {session.status === 'completed' && (
          <div className="text-center text-sm text-gray-600">
            ✅ Session completed!
          </div>
        )}
        
        {(session.status === 'skipped' || session.status === 'rescheduled') && (
          <button
            onClick={() => handleStatusUpdate('scheduled')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Reschedule Session
          </button>
        )}
      </div>
    </div>
  );
};

export default StudySessionDetails;