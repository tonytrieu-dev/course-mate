/**
 * Input validation utilities for secure data handling
 */

export const validation = {
  // Email validation
  email: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: regex.test(email),
      message: 'Please enter a valid email address'
    };
  },

  // Password validation
  password: (password) => {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    const isValid = password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers;
    
    return {
      isValid,
      message: isValid ? '' : 'Password must be at least 6 characters with uppercase, lowercase, and numbers'
    };
  },

  // URL validation
  url: (url) => {
    try {
      new URL(url);
      return { isValid: true, message: '' };
    } catch {
      return { isValid: false, message: 'Please enter a valid URL' };
    }
  },

  // Task title validation
  taskTitle: (title) => {
    const trimmed = title?.trim();
    const isValid = trimmed && trimmed.length >= 1 && trimmed.length <= 200;
    
    return {
      isValid,
      message: isValid ? '' : 'Task title must be between 1 and 200 characters'
    };
  },

  // Date validation
  date: (dateStr) => {
    const date = new Date(dateStr);
    const isValid = !isNaN(date.getTime()) && date > new Date('1900-01-01');
    
    return {
      isValid,
      message: isValid ? '' : 'Please enter a valid date'
    };
  },

  // Sanitize HTML input to prevent XSS
  sanitizeHtml: (input) => {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  },

  // Validate and sanitize user input
  userInput: (input, maxLength = 1000) => {
    if (typeof input !== 'string') {
      return { isValid: false, message: 'Input must be a string' };
    }
    
    const trimmed = input.trim();
    const isValid = trimmed.length <= maxLength;
    
    return {
      isValid,
      sanitized: validation.sanitizeHtml(trimmed),
      message: isValid ? '' : `Input must be less than ${maxLength} characters`
    };
  },

  // Validate form data
  validateForm: (fields) => {
    const errors = {};
    let isValid = true;

    Object.entries(fields).forEach(([key, config]) => {
      const { value, validator, required = false } = config;
      
      if (required && (!value || value.trim() === '')) {
        errors[key] = 'This field is required';
        isValid = false;
        return;
      }

      if (value && validator) {
        const result = validator(value);
        if (!result.isValid) {
          errors[key] = result.message;
          isValid = false;
        }
      }
    });

    return { isValid, errors };
  }
};

export default validation;