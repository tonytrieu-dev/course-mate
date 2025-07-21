/**
 * ID generation utilities
 */

/**
 * Generate a unique ID with prefix and timestamp
 * @param {string} prefix - The prefix for the ID
 * @returns {string} A unique ID
 */
export const generateUniqueId = (prefix = 'item') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Generate a unique ID from a name/title
 * @param {string} name - The name to base the ID on
 * @param {string} prefix - Optional prefix
 * @returns {string} A unique ID
 */
export const generateIdFromName = (name, prefix = '') => {
  const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now().toString().slice(-4);
  return prefix ? `${cleanName}_${prefix}_${timestamp}` : `${cleanName}_${timestamp}`;
};

/**
 * Generate a class ID specifically for task classes
 * @param {string} className - The class name
 * @returns {string} A unique class ID
 */
export const generateClassId = (className) => {
  return generateIdFromName(className, 'task');
};

/**
 * Generate a task type ID
 * @param {string} typeName - The type name
 * @returns {string} A unique type ID
 */
export const generateTypeId = (typeName) => {
  return generateIdFromName(typeName, 'type');
};