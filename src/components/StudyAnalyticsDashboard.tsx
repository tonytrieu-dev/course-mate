import React, { useEffect, useState } from 'react';
import { useStudySession } from '../hooks/useStudySession';
import type { StudyAnalytics, SubjectStudyData, StudyRecommendation } from '../types/database';

interface StudyAnalyticsDashboardProps {
  className?: string;
}

const StudyAnalyticsDashboard: React.FC<StudyAnalyticsDashboardProps> = ({ 
  className = '' 
}) => {
  const { analytics, loadAnalytics, isLoading } = useStudySession();
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    loadAnalytics(selectedPeriod);
  }, [selectedPeriod, loadAnalytics]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getEffectivenessColor = (score: number) => {
    if (score >= 4) return 'text-green-600 bg-green-50';
    if (score >= 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
    }
  };

  if (isLoading) {
    return (
      <div className={`study-analytics-dashboard ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
          <div className="bg-gray-200 rounded-lg h-64"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`study-analytics-dashboard ${className}`}>
        <div className="text-center py-8">
          <p className="text-gray-500">No study data available yet.</p>
          <p className="text-sm text-gray-400 mt-1">Start tracking your study sessions to see analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`study-analytics-dashboard ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Study Analytics</h2>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">
            {formatTime(analytics.totalStudyTime)}
          </div>
          <div className="text-sm text-gray-600">Total Study Time</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {analytics.sessionsThisWeek}
          </div>
          <div className="text-sm text-gray-600">Sessions This Week</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">
            {analytics.averageSessionDuration.toFixed(0)}m
          </div>
          <div className="text-sm text-gray-600">Avg Session Length</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className={`text-2xl font-bold ${getEffectivenessColor(analytics.effectivenessScore).split(' ')[0]}`}>
            {analytics.effectivenessScore.toFixed(1)}/5
          </div>
          <div className="text-sm text-gray-600">Effectiveness Score</div>
        </div>
      </div>

      {/* Subject Breakdown */}
      {analytics.subjectBreakdown.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Subject Breakdown</h3>
          <div className="space-y-3">
            {analytics.subjectBreakdown
              .sort((a, b) => b.totalTime - a.totalTime)
              .map((subject, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{subject.subject}</span>
                      <span className="text-sm text-gray-600">{formatTime(subject.totalTime)}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{subject.sessionCount} sessions</span>
                      <span>Effectiveness: {subject.averageEffectiveness.toFixed(1)}/5</span>
                      {subject.retentionScore > 0 && (
                        <span>Retention: {subject.retentionScore.toFixed(1)}%</span>
                      )}
                      <span>Last studied: {formatDate(subject.lastStudied)}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Weekly Trends */}
      {analytics.weeklyTrends.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Trends</h3>
          <div className="space-y-2">
            {analytics.weeklyTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Week of {formatDate(trend.date)}</span>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-900">{formatTime(trend.totalMinutes)}</span>
                  <span className="text-gray-600">{trend.sessionCount} sessions</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getEffectivenessColor(trend.averageEffectiveness)}`}>
                    {trend.averageEffectiveness.toFixed(1)}/5
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analytics.recommendations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
          <div className="space-y-3">
            {analytics.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                    {rec.priority}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{rec.message}</p>
                  <p className="text-xs text-gray-600 mt-1 capitalize">
                    Type: {rec.type.replace('_', ' ')}
                  </p>
                </div>
                {rec.actionable && (
                  <div className="flex-shrink-0">
                    <button className="text-xs text-blue-600 hover:text-blue-800">
                      Take Action
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {analytics.subjectBreakdown.length === 0 && analytics.weeklyTrends.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500">No detailed analytics available yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Complete more study sessions to see trends and insights.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudyAnalyticsDashboard;