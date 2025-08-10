/**
 * Security utilities for Canvas URL handling and data validation
 */

export interface UrlValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Security utilities for Canvas URL handling
 */
export const CanvasSecurityUtils = {
  /**
   * Mask sensitive tokens in URLs for logging
   * 
   * @param url - URL that may contain sensitive tokens
   * @returns URL with sensitive information masked
   */
  maskSensitiveUrl(url: string): string {
    // Mask user tokens in Canvas URLs (keep first 4 and last 4 characters)
    return url.replace(
      /user_([A-Za-z0-9]{8,})/g, 
      (match, token) => {
        if (token.length <= 8) return match;
        return `user_${token.substring(0, 4)}****${token.substring(token.length - 4)}`;
      }
    );
  },

  /**
   * Validate Canvas URL format and security
   * 
   * @param url - URL to validate
   * @returns Validation result with isValid flag and optional reason
   */
  validateCanvasUrl(url: string): UrlValidationResult {
    // Must be HTTPS
    if (!url.startsWith('https://')) {
      return { isValid: false, reason: 'Canvas URL must use HTTPS' };
    }

    // Must be .ics file
    if (!url.includes('.ics')) {
      return { isValid: false, reason: 'URL must be an ICS calendar feed' };
    }

    // Should contain Canvas-like domain or user pattern
    if (!url.includes('canvas') && !url.includes('elearn') && !url.includes('user_')) {
      return { isValid: false, reason: 'URL does not appear to be a Canvas calendar feed' };
    }

    return { isValid: true };
  },

  /**
   * Clean error messages to remove sensitive information
   * 
   * @param message - Error message that may contain sensitive data
   * @param originalUrl - Original URL to mask in the message
   * @returns Cleaned error message with sensitive data masked
   */
  cleanErrorMessage(message: string, originalUrl: string): string {
    const maskedUrl = this.maskSensitiveUrl(originalUrl);
    return message.replace(originalUrl, maskedUrl);
  },

  /**
   * Validate basic Canvas URL format for initial checks
   * 
   * @param icsUrl - Canvas ICS URL to validate
   * @returns true if URL passes basic format checks
   */
  isValidCanvasFormat(icsUrl: string): boolean {
    if (!icsUrl) return false;
    
    // Basic format validation
    return icsUrl.includes('elearn.ucr.edu') || 
           icsUrl.includes('canvas') || 
           icsUrl.includes('.ics');
  }
};