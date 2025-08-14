/**
 * Build configuration utilities
 * Manages feature flags and build modes
 */

export type BuildMode = 'personal' | 'saas';

export const getBuildMode = (): BuildMode => {
  return (process.env.REACT_APP_BUILD_MODE as BuildMode) || 'personal';
};

export const isPersonalMode = (): boolean => {
  return getBuildMode() === 'personal';
};

export const isSaaSMode = (): boolean => {
  return getBuildMode() === 'saas';
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
  stripe: getFeatureFlag('ENABLE_STRIPE'),
  subscriptions: getFeatureFlag('ENABLE_SUBSCRIPTIONS'),
  usageLimits: getFeatureFlag('ENABLE_USAGE_LIMITS'),
  upgradePrompts: getFeatureFlag('SHOW_UPGRADE_PROMPTS'),
  analytics: getFeatureFlag('SHOW_ANALYTICS'),
  emailVerification: getFeatureFlag('REQUIRE_EMAIL_VERIFICATION'),
  
  // Advanced feature visibility flags
  showGradeAnalytics: getFeatureFlag('SHOW_GRADE_ANALYTICS'),
  showEmailNotifications: getFeatureFlag('SHOW_EMAIL_NOTIFICATIONS'),
  showAdvancedFeatures: getFeatureFlag('SHOW_ADVANCED_FEATURES'),
  
  // Convenience flags
  isPersonalMode: isPersonalMode(),
  isSaaSMode: isSaaSMode(),
  aiCreditLimit: getAICreditLimit(),
};

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
  return isPersonalMode() ? 'UCR 🐻' : 'Your School';
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