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
  
  // Convenience flags
  isPersonalMode: isPersonalMode(),
  isSaaSMode: isSaaSMode(),
  aiCreditLimit: getAICreditLimit(),
};

// UI text based on mode
export const getAppName = (): string => {
  return isPersonalMode() ? 'CourseMate Personal' : 'CourseMate';
};

export const getAppDescription = (): string => {
  return isPersonalMode() 
    ? 'Your personal academic productivity companion'
    : 'Academic productivity platform for students';
};

export default {
  getBuildMode,
  isPersonalMode,
  isSaaSMode,
  features,
  getAppName,
  getAppDescription
};