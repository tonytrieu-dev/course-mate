import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import type { ConversionMetrics, ConversionEvent } from '../services/analyticsService';

interface AnalyticsDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ isVisible, onClose }) => {
  const [metrics, setMetrics] = useState<ConversionMetrics | null>(null);
  const [events, setEvents] = useState<ConversionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isVisible) {
      loadAnalyticsData();
    }
  }, [isVisible]);

  const loadAnalyticsData = () => {
    setLoading(true);
    try {
      const data = analyticsService.exportData();
      setMetrics(data.metrics);
      setEvents(data.events.slice(-50)); // Show last 50 events
      setLoading(false);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      setLoading(false);
    }
  };

  const downloadAnalyticsData = () => {
    const data = analyticsService.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedulebud-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              aria-label="Close analytics dashboard"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Pricing optimization A/B test results and conversion tracking
          </p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading analytics data...</span>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-700">Total Visitors</h3>
                    <p className="text-2xl font-bold text-blue-900">{metrics.totalVisitors}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-green-700">Conversions</h3>
                    <p className="text-2xl font-bold text-green-900">{metrics.conversions}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-700">Conversion Rate</h3>
                    <p className="text-2xl font-bold text-purple-900">{metrics.conversionRate.toFixed(1)}%</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-orange-700">Avg Session</h3>
                    <p className="text-2xl font-bold text-orange-900">{Math.round(metrics.averageSessionDuration)}s</p>
                  </div>
                </div>
              )}

              {/* Competitive Analysis */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Competitive Positioning</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Pricing Strategy</h4>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-green-600">$3.99/month</span> vs MyStudyLife (FREE) & Todoist ($4/month)
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium text-blue-600">$24/year</span> - 50% savings vs monthly
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Key Differentiators</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Canvas calendar sync (vs basic planners)</li>
                        <li>• AI syllabus processing (unique)</li>
                        <li>• Document Q&A chatbot</li>
                        <li>• Built by student credibility</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing A/B Test Results */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Configuration</h3>
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800">✅ Active Optimizations</h4>
                  <ul className="text-sm text-green-700 mt-2 space-y-1">
                    <li>• <strong>New Pricing:</strong> $3.99/month (was $4.99) & $24/year (was $30)</li>
                    <li>• <strong>Enhanced Free Tier:</strong> 25 files (was 10) & 3 AI queries (was 5)</li>
                    <li>• <strong>Accurate Messaging:</strong> "Canvas calendar sync" (not "Canvas integration")</li>
                  </ul>
                </div>
              </div>

              {/* Recent Events */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Events ({events.length})</h3>
                  <button
                    onClick={downloadAnalyticsData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Download Data
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                  {events.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {events.map((event, index) => (
                        <div key={index} className="p-3 text-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium text-gray-900">{event.event}</span>
                              {event.properties.location && (
                                <span className="ml-2 text-gray-500">({event.properties.location})</span>
                              )}
                            </div>
                            <span className="text-gray-400 text-xs">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          {event.variant && (
                            <div className="text-xs text-blue-600 mt-1">
                              Variant: {event.variant}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No events recorded yet
                    </div>
                  )}
                </div>
              </div>

              {/* Key Insights */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">💡 Key Insights</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• MyStudyLife (20M+ users, FREE) is main competitive threat</li>
                  <li>• Canvas integration messaging → Canvas calendar sync (accurate positioning)</li>
                  <li>• Competitive pricing: $3.99 vs $4-15/month alternatives</li>
                  <li>• Enhanced free tier (25 files, 3 AI queries) reduces conversion barrier</li>
                  <li>• Academic year billing differentiates from generic productivity apps</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;