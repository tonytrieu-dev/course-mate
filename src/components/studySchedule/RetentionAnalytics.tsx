import React, { useState, useEffect } from 'react';
import type { ClassWithRelations } from '../../types/database';

interface RetentionAnalyticsProps {
  userId: string;
  timeRange: '1week' | '1month' | '3months' | 'semester';
  classes: ClassWithRelations[];
}

// Mock data interfaces for analytics
interface RetentionMetric {
  date: string;
  retentionRate: number;
  studyHours: number;
  completedSessions: number;
}

interface ClassPerformance {
  classId: string;
  className: string;
  averageRetention: number;
  studyEfficiency: number;
  strugglingConcepts: string[];
  improvementTrend: 'up' | 'down' | 'stable';
}

const RetentionAnalytics: React.FC<RetentionAnalyticsProps> = ({
  userId,
  timeRange,
  classes
}) => {
  const [retentionData, setRetentionData] = useState<RetentionMetric[]>([]);
  const [classPerformances, setClassPerformances] = useState<ClassPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'retention' | 'efficiency' | 'progress'>('retention');
  
  // Mock data generation (in real app, this would be API calls)
  useEffect(() => {
    const generateMockData = () => {
      setIsLoading(true);
      
      // Generate retention metrics over time
      const days = timeRange === '1week' ? 7 : timeRange === '1month' ? 30 : timeRange === '3months' ? 90 : 120;
      const mockRetentionData: RetentionMetric[] = [];
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        
        mockRetentionData.push({
          date: date.toISOString().split('T')[0],
          retentionRate: Math.max(0.3, Math.min(0.95, 0.7 + Math.sin(i * 0.1) * 0.2 + (Math.random() - 0.5) * 0.1)),
          studyHours: Math.max(0, 3 + Math.sin(i * 0.2) * 1.5 + (Math.random() - 0.5) * 0.5),
          completedSessions: Math.floor(Math.random() * 5) + 1
        });
      }
      
      // Generate class performance data
      const mockClassPerformances: ClassPerformance[] = classes.slice(0, 6).map(cls => ({
        classId: cls.id,
        className: cls.name,
        averageRetention: Math.max(0.4, Math.min(0.9, 0.6 + Math.random() * 0.3)),
        studyEfficiency: Math.max(0.3, Math.min(0.95, 0.65 + Math.random() * 0.25)),
        strugglingConcepts: [
          'Complex equations',
          'Abstract concepts',
          'Problem solving'
        ].slice(0, Math.floor(Math.random() * 3) + 1),
        improvementTrend: (['up', 'down', 'stable'] as const)[Math.floor(Math.random() * 3)]
      }));
      
      setTimeout(() => {
        setRetentionData(mockRetentionData);
        setClassPerformances(mockClassPerformances);
        setIsLoading(false);
      }, 1000);
    };
    
    generateMockData();
  }, [userId, timeRange, classes]);
  
  // Calculate summary statistics
  const summaryStats = {
    averageRetention: retentionData.length > 0 ? 
      retentionData.reduce((sum, d) => sum + d.retentionRate, 0) / retentionData.length : 0,
    totalStudyHours: retentionData.reduce((sum, d) => sum + d.studyHours, 0),
    totalCompletedSessions: retentionData.reduce((sum, d) => sum + d.completedSessions, 0),
    retentionTrend: retentionData.length > 10 ? 
      (retentionData.slice(-5).reduce((s, d) => s + d.retentionRate, 0) / 5) - 
      (retentionData.slice(-10, -5).reduce((s, d) => s + d.retentionRate, 0) / 5) : 0
  };
  
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
    }
  };
  
  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-gray-600';
    }
  };
  
  if (isLoading) {
    return (
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600">Loading retention analytics...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white border-t border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Retention Analytics
          <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full font-medium">
            Premium
          </span>
        </h3>
        
        {/* Metric Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['retention', 'efficiency', 'progress'] as const).map(metric => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors capitalize ${
                selectedMetric === metric
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {metric}
            </button>
          ))}
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-900">
            {Math.round(summaryStats.averageRetention * 100)}%
          </div>
          <div className="text-sm text-blue-700">Avg Retention</div>
          <div className={`text-xs flex items-center mt-1 ${
            summaryStats.retentionTrend > 0 ? 'text-green-600' : 
            summaryStats.retentionTrend < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {summaryStats.retentionTrend > 0 ? '↗️' : summaryStats.retentionTrend < 0 ? '↘️' : '➡️'}
            {Math.abs(summaryStats.retentionTrend * 100).toFixed(1)}% trend
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-900">
            {Math.round(summaryStats.totalStudyHours)}
          </div>
          <div className="text-sm text-green-700">Study Hours</div>
          <div className="text-xs text-green-600 mt-1">
            {Math.round(summaryStats.totalStudyHours / retentionData.length * 10) / 10} per day
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-900">
            {summaryStats.totalCompletedSessions}
          </div>
          <div className="text-sm text-purple-700">Sessions</div>
          <div className="text-xs text-purple-600 mt-1">
            {Math.round(summaryStats.totalCompletedSessions / retentionData.length * 10) / 10} per day
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-900">
            {Math.round(summaryStats.averageRetention / (summaryStats.totalStudyHours / retentionData.length) * 100)}%
          </div>
          <div className="text-sm text-orange-700">Efficiency</div>
          <div className="text-xs text-orange-600 mt-1">
            Retention per hour
          </div>
        </div>
      </div>
      
      {/* Chart Area */}
      <div className="mb-6">
        <div className="bg-gray-50 rounded-lg p-4 h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm">Interactive Chart</p>
            <p className="text-xs">{selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} over {timeRange}</p>
            <p className="text-xs text-gray-400 mt-1">Chart visualization would be implemented here</p>
          </div>
        </div>
      </div>
      
      {/* Class Performance Breakdown */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-4">Class Performance Breakdown</h4>
        <div className="space-y-3">
          {classPerformances.map((performance) => (
            <div key={performance.classId} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-gray-900">{performance.className}</h5>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${getTrendColor(performance.improvementTrend)}`}>
                    {getTrendIcon(performance.improvementTrend)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {Math.round(performance.averageRetention * 100)}% retention
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Retention Rate</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${performance.averageRetention * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {Math.round(performance.averageRetention * 100)}%
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-600 mb-1">Study Efficiency</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${performance.studyEfficiency * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {Math.round(performance.studyEfficiency * 100)}%
                  </div>
                </div>
              </div>
              
              {performance.strugglingConcepts.length > 0 && (
                <div>
                  <div className="text-xs text-gray-600 mb-2">Areas for improvement:</div>
                  <div className="flex flex-wrap gap-1">
                    {performance.strugglingConcepts.map((concept, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Insights and Recommendations */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Insights
        </h4>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• Your retention rate has improved by {Math.abs(summaryStats.retentionTrend * 100).toFixed(1)}% over the selected period</p>
          <p>• Best performance in {classPerformances[0]?.className || 'your strongest class'} with {Math.round((classPerformances[0]?.averageRetention || 0.7) * 100)}% retention</p>
          <p>• Consider increasing review frequency for subjects with lower retention rates</p>
          {summaryStats.averageRetention < 0.6 && (
            <p className="text-orange-700">• Your overall retention is below optimal. Consider shorter, more frequent study sessions</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RetentionAnalytics;