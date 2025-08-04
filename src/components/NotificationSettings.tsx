import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NotificationService from '../services/notificationService';
import { supabaseConfig } from '../config';
import type { NotificationSettings as NotificationSettingsType } from '../types/database';

interface NotificationSettingsProps {
  onClose?: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testEmailSending, setTestEmailSending] = useState(false);

  // Form state
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [useCustomEmail, setUseCustomEmail] = useState(false);
  const [notificationTimes, setNotificationTimes] = useState<string[]>(['7d', '3d', '1d', '2h']);
  const [activeHoursStart, setActiveHoursStart] = useState(9);
  const [activeHoursEnd, setActiveHoursEnd] = useState(21);

  useEffect(() => {
    if (user?.id) {
      loadSettings();
    }
  }, [user?.id]);

  const loadSettings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const userSettings = await NotificationService.getNotificationSettings(user.id);
      
      if (userSettings) {
        setSettings(userSettings);
        setEmailEnabled(userSettings.email_enabled);
        setCustomEmail(userSettings.email_address || '');
        setUseCustomEmail(!!userSettings.email_address);
        setNotificationTimes(userSettings.notification_times || ['7d', '3d', '1d', '2h']);
        setActiveHoursStart(userSettings.active_hours_start);
        setActiveHoursEnd(userSettings.active_hours_end);
      }
    } catch (err) {
      setError('Failed to load notification settings');
      console.error('Error loading notification settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await NotificationService.upsertNotificationSettings(user.id, {
        email_enabled: emailEnabled,
        email_address: useCustomEmail ? customEmail : undefined,
        notification_times: notificationTimes,
        active_hours_start: activeHoursStart,
        active_hours_end: activeHoursEnd,
      });

      setSuccess('Notification settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
      // Reload settings to get updated data
      await loadSettings();
    } catch (err) {
      setError('Failed to save notification settings');
      console.error('Error saving notification settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!user?.id) return;

    try {
      setTestEmailSending(true);
      setError(null);
      setSuccess(null);

      // Always save current settings before test email
      await NotificationService.upsertNotificationSettings(user.id, {
        email_enabled: emailEnabled,
        email_address: useCustomEmail ? customEmail : undefined,
        notification_times: notificationTimes,
        active_hours_start: activeHoursStart,
        active_hours_end: activeHoursEnd,
      });

      // If email is not enabled, show error
      if (!emailEnabled) {
        throw new Error('Please enable email notifications first');
      }

      // Wait a moment for database to update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get Supabase config from existing client
      if (process.env.NODE_ENV === 'development') {
        console.log('Supabase URL:', supabaseConfig.url);
        console.log('Has Supabase Key:', !!supabaseConfig.key);
      }
      
      if (!supabaseConfig.url || !supabaseConfig.key) {
        throw new Error('Supabase configuration missing. Please check your .env file has REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY set.');
      }

      // Call the Supabase function to send test email
      const response = await fetch(`${supabaseConfig.url}/functions/v1/send-email-notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseConfig.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          task_id: -1, // Use -1 for test emails (won't conflict with real task IDs)
          email_type: 'assignment_reminder',
          task_title: 'Test Assignment - Email Notification Setup',
          task_class: 'Email Configuration Test',
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
          due_time: '23:59',
          priority: 'medium'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send test email');
      }

      setSuccess(`✅ Test email sent successfully to ${result.email_address}! Check your inbox.`);
      setTimeout(() => setSuccess(null), 8000);
    } catch (err: any) {
      console.error('Test email error:', err);
      setError(`Failed to send test email: ${err.message}`);
    } finally {
      setTestEmailSending(false);
    }
  };

  const toggleNotificationTime = (time: string) => {
    setNotificationTimes(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time)
        : [...prev, time]
    );
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800/95 rounded-xl shadow-xl dark:shadow-slate-900/40 p-6 max-w-2xl mx-auto border border-gray-100 dark:border-slate-700/50">
        <div className="animate-pulse">
          <div className="flex items-center justify-center mb-6">
            <div className="h-12 w-12 bg-gray-200 dark:bg-slate-700 rounded-full mb-3"></div>
          </div>
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3 mx-auto mb-8"></div>
          <div className="space-y-6">
            <div className="h-16 bg-gray-100 dark:bg-slate-800 rounded-lg p-4">
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
            </div>
            <div className="h-32 bg-gray-100 dark:bg-slate-800 rounded-lg p-4">
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-3"></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded"></div>
                <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded"></div>
                <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded"></div>
                <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800/95 rounded-xl shadow-xl dark:shadow-slate-900/40 p-6 max-w-2xl mx-auto border border-gray-100 dark:border-slate-700/50 transform transition-all duration-200">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-full mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Email Notifications</h2>
            <p className="text-gray-600 dark:text-slate-400 text-sm">Stay on top of your assignments with smart email reminders</p>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-full transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center ml-4"
              aria-label="Close notification settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6" role="alert">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="font-medium text-sm">Configuration Error</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-sm">Success!</p>
              <p className="text-xs mt-1">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Enable/Disable Email Notifications */}
        <div className="relative overflow-hidden">
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800/50 shadow-sm">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 8h1l3-3h9l3 3h1a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V10a2 2 0 012-2z" />
                </svg>
                <h3 className="font-bold text-gray-900 dark:text-slate-100">Email Notifications</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">Get intelligent reminders about upcoming assignments and deadlines</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-6">
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-blue-600 shadow-lg"></div>
            </label>
          </div>
          {/* Decorative background element */}
          <div className="absolute -top-2 -right-2 w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full opacity-20 pointer-events-none"></div>
        </div>

        {emailEnabled && (
          <>
            {/* Email Address Settings */}
            <div className="border border-gray-200 dark:border-slate-700/50 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white dark:from-slate-800/50 dark:to-slate-800/30 shadow-sm">
              <div className="flex items-center mb-4">
                <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <h3 className="font-bold text-gray-900 dark:text-slate-100">Email Address</h3>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-center p-3 border border-gray-200 dark:border-slate-700/50 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="emailType"
                    checked={!useCustomEmail}
                    onChange={() => setUseCustomEmail(false)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mr-3"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-slate-100">Use my account email</span>
                    <span className="block text-xs text-gray-500 dark:text-slate-400 mt-1 font-mono bg-gray-100 dark:bg-slate-700/50 px-2 py-1 rounded">{user?.email}</span>
                  </div>
                </label>
                
                <label className="flex items-center p-3 border border-gray-200 dark:border-slate-700/50 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="emailType"
                    checked={useCustomEmail}
                    onChange={() => setUseCustomEmail(true)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mr-3"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-slate-100">Use a different email address</span>
                    <span className="block text-xs text-gray-500 dark:text-slate-400 mt-1">Send notifications to a custom email</span>
                  </div>
                </label>
                
                {useCustomEmail && (
                  <div className="mt-3">
                    <label htmlFor="customEmail" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Custom Email Address
                    </label>
                    <input
                      id="customEmail"
                      type="email"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Notification Timing */}
            <div className="border border-gray-200 dark:border-slate-700/50 rounded-xl p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-sm">
              <div className="flex items-center mb-4">
                <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-bold text-gray-900 dark:text-slate-100">Reminder Timing</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-4 leading-relaxed">Choose when you want to be notified before assignments are due</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: '7d', label: '7 days before', icon: '📅', color: 'from-blue-100 to-blue-50' },
                  { key: '3d', label: '3 days before', icon: '⏰', color: 'from-green-100 to-green-50' },
                  { key: '1d', label: '1 day before', icon: '⚠️', color: 'from-yellow-100 to-yellow-50' },
                  { key: '2h', label: '2 hours before', icon: '🚨', color: 'from-red-100 to-red-50' }
                ].map(({ key, label, icon, color }) => (
                  <label key={key} className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${notificationTimes.includes(key) ? 'border-purple-300 dark:border-purple-700/50 bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-900/20 shadow-sm' : `border-gray-200 dark:border-slate-700/50 bg-gradient-to-r ${color} hover:border-gray-300 dark:hover:border-slate-600`}`}>
                    <input
                      type="checkbox"
                      checked={notificationTimes.includes(key)}
                      onChange={() => toggleNotificationTime(key)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mr-3"
                    />
                    <span className="text-lg mr-2">{icon}</span>
                    <span className="text-sm font-medium text-gray-800 dark:text-slate-200">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Active Hours */}
            <div className="border border-gray-200 dark:border-slate-700/50 rounded-xl p-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 shadow-sm">
              <div className="flex items-center mb-4">
                <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <h3 className="font-bold text-gray-900 dark:text-slate-100">Quiet Hours</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-6 leading-relaxed">Set your preferred hours for receiving notifications</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800/50">
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-3 flex items-center">
                    <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Start sending at
                  </label>
                  <select
                    value={activeHoursStart}
                    onChange={(e) => setActiveHoursStart(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 font-medium"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{formatHour(i)}</option>
                    ))}
                  </select>
                </div>
                
                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800/50">
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-3 flex items-center">
                    <svg className="w-4 h-4 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    Stop sending at
                  </label>
                  <select
                    value={activeHoursEnd}
                    onChange={(e) => setActiveHoursEnd(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 font-medium"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{formatHour(i)}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-white dark:bg-slate-800/50 border border-indigo-200 dark:border-indigo-800/50 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-gray-700 dark:text-slate-300 font-medium">
                    You'll receive notifications between <span className="font-bold text-indigo-600">{formatHour(activeHoursStart)}</span> and <span className="font-bold text-indigo-600">{formatHour(activeHoursEnd)}</span>
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-6 border-t border-gray-200 dark:border-slate-700/50 mt-8">
          <div className="order-2 sm:order-1">
            {emailEnabled && (
              <button
                onClick={handleSendTestEmail}
                disabled={testEmailSending || !user?.id}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm font-medium transition-all duration-200 hover:shadow-lg min-h-[44px]"
              >
                {testEmailSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Sending Test...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Test Email
                  </>
                )}
              </button>
            )}
          </div>
          
          <div className="order-1 sm:order-2 flex flex-col sm:flex-row gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-all duration-200 min-h-[44px] font-medium"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !user?.id}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium transition-all duration-200 hover:shadow-lg min-h-[44px]"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Premium Notice */}
      <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800/50 rounded-xl shadow-sm relative overflow-hidden">
        <div className="flex items-start relative z-10">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 dark:text-slate-100 text-lg mb-2">Coming Soon: SMS Notifications</h4>
            <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed mb-3">Get instant text reminders for urgent deadlines. Perfect for those critical assignments that you can't afford to miss!</p>
            <div className="inline-flex items-center px-3 py-1 bg-white bg-opacity-60 rounded-full text-xs font-medium text-purple-700">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Coming Q2 2025
            </div>
          </div>
        </div>
        {/* Decorative background elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-200 dark:bg-purple-900/30 rounded-full opacity-30"></div>
        <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-pink-200 dark:bg-pink-900/30 rounded-full opacity-20"></div>
      </div>
    </div>
  );
};

export default NotificationSettings;

// Component enhancements:
// ✅ Modern visual design with gradients and improved layouts
// ✅ Enhanced accessibility with proper ARIA labels and semantic markup
// ✅ Professional loading states with skeleton screens
// ✅ Improved mobile responsiveness with proper touch targets
// ✅ Better visual hierarchy with icons and typography
// ✅ Enhanced user feedback with improved error/success states
// ✅ Consistent spacing and modern UI patterns
// ✅ Professional color scheme and interactive elements