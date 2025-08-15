// Sentry stub for problematic ESM modules
export function flushIfServerless() {
  // No-op stub for browser environment
  return Promise.resolve();
}

export const isNodeEnv = () => false;
export const getPackage = () => null;
export const getRuntime = () => ({ name: "browser", version: "1.0.0" });

// Default export for compatibility
export default {
  flushIfServerless,
  isNodeEnv,
  getPackage,
  getRuntime,
};