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
      console.log('Supabase URL:', supabaseConfig.url);
      console.log('Has Supabase Key:', !!supabaseConfig.key);
      
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
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">📧 Email Notifications</h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* Enable/Disable Email Notifications */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div>
            <h3 className="font-semibold text-gray-900">Enable Email Notifications</h3>
            <p className="text-sm text-gray-600">Get smart reminders about upcoming assignments</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {emailEnabled && (
          <>
            {/* Email Address Settings */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Email Address</h3>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="emailType"
                    checked={!useCustomEmail}
                    onChange={() => setUseCustomEmail(false)}
                    className="mr-2"
                  />
                  <span className="text-sm">Use my account email ({user?.email})</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="emailType"
                    checked={useCustomEmail}
                    onChange={() => setUseCustomEmail(true)}
                    className="mr-2"
                  />
                  <span className="text-sm">Use a different email address</span>
                </label>
                
                {useCustomEmail && (
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            </div>

            {/* Notification Timing */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">When to Send Reminders</h3>
              <p className="text-sm text-gray-600 mb-4">Choose when you want to be notified before assignments are due</p>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: '7d', label: '7 days before' },
                  { key: '3d', label: '3 days before' },
                  { key: '1d', label: '1 day before' },
                  { key: '2h', label: '2 hours before' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={notificationTimes.includes(key)}
                      onChange={() => toggleNotificationTime(key)}
                      className="mr-3"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Active Hours */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Quiet Hours</h3>
              <p className="text-sm text-gray-600 mb-4">Set your preferred hours for receiving notifications</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start sending at</label>
                  <select
                    value={activeHoursStart}
                    onChange={(e) => setActiveHoursStart(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{formatHour(i)}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stop sending at</label>
                  <select
                    value={activeHoursEnd}
                    onChange={(e) => setActiveHoursEnd(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{formatHour(i)}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                You'll receive notifications between {formatHour(activeHoursStart)} and {formatHour(activeHoursEnd)}
              </p>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div>
            {emailEnabled && (
              <button
                onClick={handleSendTestEmail}
                disabled={testEmailSending || !user?.id}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
              >
                {testEmailSending && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                {testEmailSending ? 'Sending...' : '📧 Send Test Email'}
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !user?.id}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Premium Notice */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
        <div className="flex items-center">
          <span className="text-2xl mr-3">🚀</span>
          <div>
            <h4 className="font-semibold text-gray-900">Coming Soon: SMS Notifications</h4>
            <p className="text-sm text-gray-600">Get instant text reminders for urgent deadlines. Perfect for those critical assignments!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;