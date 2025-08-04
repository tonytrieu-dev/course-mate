import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { updateTheme, getThemeFromSettings, syncThemeFromContext } from '../../services/settings/settingsOperations';
import AppearanceSettings from './appearance/AppearanceSettings';
import UserExperienceSettings from './appearance/UserExperienceSettings';
import SettingsSaveControls from './controls/SettingsSaveControls';
import AboutSection from './controls/AboutSection';
import type { GeneralSettingsTabProps, GeneralSettingsState, SaveStatus } from './types';

const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({
  isNavCollapsed = false,
  setIsNavCollapsed = () => {}
}) => {
  const { mode, setMode, isDark } = useTheme();
  const { user } = useAuth();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // Initialize settings state
  const [settings, setSettings] = useState<GeneralSettingsState>({
    fontSize: 'medium',
    defaultView: 'calendar',
    taskCompletionSound: true,
    showWeekNumbers: false,
    showNavigationBar: true,
    theme: 'auto'
  });

  const [originalSettings, setOriginalSettings] = useState<GeneralSettingsState>(settings);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    try {
      if (user) {
        const savedTheme = getThemeFromSettings();
        if (savedTheme) {
          setSettings(prev => ({ ...prev, theme: savedTheme }));
          setOriginalSettings(prev => ({ ...prev, theme: savedTheme }));
        }
      }
      
      // Load other settings from localStorage
      const savedSettings = localStorage.getItem('generalSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
        setOriginalSettings(prev => ({ ...prev, ...parsedSettings }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, [user]);

  // Check for changes
  useEffect(() => {
    const hasChange = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(hasChange);
  }, [settings, originalSettings]);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    // Only update local settings state for preview - don't apply theme immediately
    handleSettingChange('theme', theme);
  };

  const handleNavigationToggle = (value: boolean) => {
    handleSettingChange('showNavigationBar', value);
    setIsNavCollapsed(!value);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    
    try {
      // Apply the theme to the context (this actually changes the theme)
      setMode(settings.theme);
      
      // Save theme to Supabase if user is authenticated
      if (user) {
        await updateTheme(settings.theme, user.id);
        syncThemeFromContext();
      }

      // Save other settings to localStorage
      localStorage.setItem('generalSettings', JSON.stringify(settings));
      
      // Update original settings to new saved state
      setOriginalSettings(settings);
      setHasChanges(false);
      setSaveStatus('saved');
      
      // Clear saved status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleReset = () => {
    const defaultSettings: GeneralSettingsState = {
      fontSize: 'medium',
      defaultView: 'calendar',
      taskCompletionSound: true,
      showWeekNumbers: false,
      showNavigationBar: true,
      theme: 'auto'
    };
    
    setSettings(defaultSettings);
    setMode('auto');
    setIsNavCollapsed(false);
  };

  return (
    <div className="space-y-6">
      <AppearanceSettings
        settings={settings}
        onSettingChange={handleSettingChange}
        onThemeChange={handleThemeChange}
        isDark={isDark}
        hasChanges={hasChanges}
        contextMode={mode}
      />
      
      <UserExperienceSettings
        settings={settings}
        onSettingChange={handleSettingChange}
        onNavigationToggle={handleNavigationToggle}
      />

      <SettingsSaveControls
        hasChanges={hasChanges}
        saveStatus={saveStatus}
        onSave={handleSave}
        onReset={handleReset}
      />

      <AboutSection />
    </div>
  );
};

export default GeneralSettingsTab;