/**
 * ID generation utilities
 */

/**
 * Generate a unique ID with prefix and timestamp
 */
export const generateUniqueId = (prefix: string = 'item'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Generate a unique ID from a name/title
 */
export const generateIdFromName = (name: string, prefix: string = ''): string => {
  const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now().toString().slice(-4);
  return prefix ? `${cleanName}_${prefix}_${timestamp}` : `${cleanName}_${timestamp}`;
};

/**
 * Generate a class ID specifically for task classes
 */
export const generateClassId = (className: string): string => {
  return generateIdFromName(className, 'task');
};

/**
 * Generate a task type ID
 */
export const generateTypeId = (typeName: string): string => {
  return generateIdFromName(typeName, 'type');
};