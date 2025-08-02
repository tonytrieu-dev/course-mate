import React from 'react';
import type { WorkloadAnalysis, StudyScheduleFeatureLimits } from '../../types/studySchedule';
import type { ClassWithRelations } from '../../types/database';

interface WorkloadAnalysisPanelProps {
  analysis: WorkloadAnalysis;
  classes: ClassWithRelations[];
  featureLimits: StudyScheduleFeatureLimits;
}

const WorkloadAnalysisPanel: React.FC<WorkloadAnalysisPanelProps> = ({
  analysis,
  classes,
  featureLimits
}) => {
  // Get class name from ID
  const getClassName = (classId: string) => {
    return classes.find(c => c.id === classId)?.name || classId;
  };
  
  // Calculate stress level color
  const getStressLevelColor = (level: number) => {
    if (level <= 3) return 'text-green-600 bg-green-100';
    if (level <= 6) return 'text-yellow-600 bg-yellow-100';
    if (level <= 8) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };
  
  const getStressLevelText = (level: number) => {
    if (level <= 3) return 'Low';
    if (level <= 6) return 'Moderate';
    if (level <= 8) return 'High';
    return 'Very High';
  };
  
  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Workload Analysis
      </h3>
      
      {/* Overall Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-900">{analysis.total_assignments}</div>
          <div className="text-sm text-gray-600">Total Assignments</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-900">{analysis.upcoming_deadlines}</div>
          <div className="text-sm text-gray-600">Due This Week</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-900">{Math.round(analysis.estimated_total_hours)}</div>
          <div className="text-sm text-gray-600">Est. Total Hours</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-900">{Math.round(analysis.recommended_daily_hours * 10) / 10}</div>
          <div className="text-sm text-gray-600">Daily Hours</div>
        </div>
      </div>
      
      {/* Stress Level Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Stress Level</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            getStressLevelColor(analysis.stress_level_prediction)
          }`}>
            {getStressLevelText(analysis.stress_level_prediction)} ({analysis.stress_level_prediction}/10)
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              analysis.stress_level_prediction <= 3 ? 'bg-green-500' :
              analysis.stress_level_prediction <= 6 ? 'bg-yellow-500' :
              analysis.stress_level_prediction <= 8 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${(analysis.stress_level_prediction / 10) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Class Workload Breakdown */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Class Workload Distribution</h4>
        <div className="space-y-3">
          {analysis.class_workloads
            .slice(0, featureLimits.max_classes_analyzed)
            .map((classWorkload, index) => {
              const totalHours = analysis.class_workloads.reduce((sum, cw) => sum + cw.total_estimated_hours, 0);
              const percentage = totalHours > 0 ? (classWorkload.total_estimated_hours / totalHours) * 100 : 0;
              
              return (
                <div key={classWorkload.class_id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 truncate" title={classWorkload.class_name}>
                      {classWorkload.class_name}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600">
                        {Math.round(classWorkload.total_estimated_hours)}h
                      </span>
                      {classWorkload.priority_score > 7 && (
                        <span className="text-xs bg-red-100 text-red-600 px-1 rounded" title="High Priority">
                          🚨
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{classWorkload.pending_assignments} assignments</span>
                    <span>{Math.round(classWorkload.recommended_daily_minutes)} min/day</span>
                  </div>
                  
                  {classWorkload.critical_deadlines.length > 0 && (
                    <div className="mt-2 text-xs text-red-600">
                      ⚠️ {classWorkload.critical_deadlines.length} critical deadline{classWorkload.critical_deadlines.length !== 1 ? 's' : ''} this week
                    </div>
                  )}
                </div>
              );
            })}
          
          {analysis.class_workloads.length > featureLimits.max_classes_analyzed && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
              <p className="text-sm text-orange-800">
                Showing {featureLimits.max_classes_analyzed} of {analysis.class_workloads.length} classes
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Upgrade to premium to analyze all classes
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Peak Workload Dates */}
      {analysis.peak_workload_dates.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-1 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Peak Workload Dates
          </h4>
          <div className="space-y-2">
            {analysis.peak_workload_dates.map(dateStr => {
              const date = new Date(dateStr);
              return (
                <div key={dateStr} className="flex items-center justify-between bg-orange-50 rounded-lg p-2">
                  <span className="text-sm font-medium text-orange-900">
                    {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-xs text-orange-600">High workload expected</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* AI Analysis Metadata */}
      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-1">
          <span>Analysis Date:</span>
          <span>{new Date(analysis.analysis_date).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center justify-between mb-1">
          <span>AI Model:</span>
          <span>{analysis.ai_model_version}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Canvas Sync:</span>
          <span>{new Date(analysis.canvas_sync_date).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default WorkloadAnalysisPanel;