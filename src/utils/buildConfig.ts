/**
 * Build configuration utilities
 * Manages feature flags and build modes
 */

export type BuildMode = 'personal' | 'saas';

export const getBuildMode = (): BuildMode => {
  const mode = (process.env.REACT_APP_BUILD_MODE as BuildMode) || 'personal';
  console.log('🔧 DEBUG: Build mode calculation:', {
    'process.env.REACT_APP_BUILD_MODE': process.env.REACT_APP_BUILD_MODE,
    'finalMode': mode
  });
  return mode;
};

export const isPersonalMode = (): boolean => {
  const result = getBuildMode() === 'personal';
  console.log('🔧 DEBUG: isPersonalMode result:', result);
  return result;
};

export const isSaaSMode = (): boolean => {
  const result = getBuildMode() === 'saas';
  console.log('🔧 DEBUG: isSaaSMode result:', result);
  return result;
};

export const getFeatureFlag = (flag: string): boolean => {
  const value = process.env[`REACT_APP_${flag}`];
  return value === 'true';
};

export const getAICreditLimit = (): number => {
  const limit = process.env.REACT_APP_AI_CREDITS_LIMIT;
  return limit ? parseInt(limit, 10) : (isPersonalMode() ? -1 : 10);
};

// Feature flags
export const features = {
  stripe: getFeatureFlag('ENABLE_STRIPE') || isSaaSMode(),
  subscriptions: getFeatureFlag('ENABLE_SUBSCRIPTIONS') || isSaaSMode(),
  usageLimits: getFeatureFlag('ENABLE_USAGE_LIMITS') || isSaaSMode(),
  upgradePrompts: getFeatureFlag('SHOW_UPGRADE_PROMPTS') || isSaaSMode(),
  analytics: getFeatureFlag('SHOW_ANALYTICS') || isSaaSMode(),
  
  // Advanced feature visibility flags - Auto-enable for paid users
  showGradeAnalytics: getFeatureFlag('SHOW_GRADE_ANALYTICS') || isSaaSMode(),
  showEmailNotifications: getFeatureFlag('SHOW_EMAIL_NOTIFICATIONS'),
  showAdvancedFeatures: getFeatureFlag('SHOW_ADVANCED_FEATURES'),
  
  // Convenience flags
  isPersonalMode: isPersonalMode(),
  isSaaSMode: isSaaSMode(),
  aiCreditLimit: getAICreditLimit(),
};

// AGGRESSIVE DEBUG: Log features object
console.log('🚀 DEBUG: Features object created:', {
  features,
  'process.env': {
    'REACT_APP_BUILD_MODE': process.env.REACT_APP_BUILD_MODE,
    'REACT_APP_ENABLE_STRIPE': process.env.REACT_APP_ENABLE_STRIPE,
    'REACT_APP_ENABLE_SUBSCRIPTIONS': process.env.REACT_APP_ENABLE_SUBSCRIPTIONS,
  }
});


// UI text based on mode
export const getAppName = (): string => {
  return isPersonalMode() ? 'ScheduleBud' : 'ScheduleBud';
};

export const getAppDescription = (): string => {
  return isPersonalMode() 
    ? 'Your personal academic productivity companion'
    : 'Academic productivity platform for students';
};

// Sidebar title configuration
export const getDefaultSidebarTitle = (): string => {
  return isPersonalMode() ? 'UCR 🐻' : 'Your College';
};

// Classes title configuration  
export const getDefaultClassesTitle = (): string => {
  return isPersonalMode() ? 'Current Classes' : 'Classes';
};

export default {
  getBuildMode,
  isPersonalMode,
  isSaaSMode,
  features,
  getAppName,
  getAppDescription,
  getDefaultSidebarTitle,
  getDefaultClassesTitle
};