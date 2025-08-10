import { logger } from '../../utils/logger';
import { errorHandler } from '../../utils/errorHandler';

// Response interface for proxy service
interface ProxyResponse {
  contents?: string;
  status?: number;
}

// Enhanced proxy service configuration with security focus
export interface ProxyService {
  name: string;
  url: (targetUrl: string) => string;
  responseAdapter: (response: Response) => Promise<string>;
  securityLevel: 'high' | 'medium' | 'low';
  supportsHttps: boolean;
}

// Secure multi-proxy configuration optimized for US student market
export const CORS_PROXY_SERVICES: ProxyService[] = [
  {
    name: 'corsproxy.io',
    url: (targetUrl: string) => `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    responseAdapter: async (response: Response) => {
      // corsproxy.io returns raw content
      return await response.text();
    },
    securityLevel: 'high',
    supportsHttps: true
  },
  {
    name: 'allorigins.win',
    url: (targetUrl: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
    responseAdapter: async (response: Response) => {
      const data: ProxyResponse = await response.json();
      if (!data.contents) {
        throw new Error('No content in wrapped response');
      }
      return data.contents;
    },
    securityLevel: 'medium',
    supportsHttps: true
  },
  {
    name: 'cors.sh',
    url: (targetUrl: string) => `https://cors.sh/${targetUrl}`,
    responseAdapter: async (response: Response) => {
      // cors.sh returns raw content directly
      return await response.text();
    },
    securityLevel: 'high',
    supportsHttps: true
  }
];

/**
 * Retry utility with exponential backoff for Canvas operations
 * 
 * @param operation - The async operation to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @param operationName - Name for logging purposes
 * @returns Promise that resolves with operation result or rejects with final error
 */
export const retryCanvasOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  operationName: string = 'Canvas operation'
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`[${operationName}] Attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Don't retry on certain error types
      if (!errorHandler.isRetryable(lastError as any)) {
        logger.debug(`[${operationName}] Error not retryable: ${lastError.message}`);
        throw lastError;
      }
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        logger.debug(`[${operationName}] Attempt ${attempt} failed, waiting ${delay}ms before retry:`, lastError.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        logger.debug(`[${operationName}] All ${maxRetries} attempts failed`);
      }
    }
  }
  
  throw lastError!;
};

/**
 * Attempts to fetch Canvas ICS data using multi-proxy strategy
 * 
 * @param icsUrl - Canvas ICS feed URL
 * @param maskSensitiveUrl - Function to mask sensitive URL for logging
 * @returns Promise that resolves with raw ICS text content
 * @throws Error when all proxy services and direct fetch fail
 */
export const fetchWithProxyFallback = async (
  icsUrl: string,
  maskSensitiveUrl: (url: string) => string
): Promise<{ content: string; service: string }> => {
  let rawText: string | null = null;
  let lastError: Error | null = null;
  let successfulService: string | null = null;

  // Try each proxy service in order
  for (const proxyService of CORS_PROXY_SERVICES) {
    try {
      logger.debug(`[fetchWithProxyFallback] Trying ${proxyService.name} proxy service`);
      
      const proxyUrl = proxyService.url(icsUrl);
      const response = await retryCanvasOperation(async () => {
        const proxyResponse = await fetch(proxyUrl, {
          signal: AbortSignal.timeout(15000), // 15 second timeout
          headers: {
            'Accept': 'application/json,text/plain,*/*',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
        
        // Check for rate limiting
        if (proxyResponse.status === 429) {
          throw errorHandler.canvas.rateLimited({ 
            service: proxyService.name,
            retryAfter: proxyResponse.headers.get('Retry-After') || 'unknown'
          });
        }
        
        if (!proxyResponse.ok) {
          if (proxyResponse.status >= 500) {
            throw errorHandler.canvas.networkError({ 
              status: proxyResponse.status,
              service: proxyService.name
            });
          }
          throw new Error(`${proxyService.name} proxy failed: ${proxyResponse.status}`);
        }
        
        return proxyResponse;
      }, 2, 1000, `${proxyService.name} proxy fetch`);
      
      // Use the service's response adapter to get raw content
      rawText = await proxyService.responseAdapter(response);
      successfulService = proxyService.name;
      
      if (!rawText || rawText.trim().length === 0) {
        throw new Error('Empty response from proxy service');
      }
      
      // Successfully retrieved calendar
      break; // Success! Exit the loop
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const cleanedError = maskSensitiveUrl(errorMessage);
      
      logger.debug(`[fetchWithProxyFallback] ${proxyService.name} failed: ${cleanedError}`);
      lastError = error instanceof Error ? error : new Error(`${proxyService.name} proxy error`);
      
      // Continue to next proxy service
      continue;
    }
  }

  // If all proxy services failed, try direct fetch as final fallback
  if (!rawText) {
    try {
      logger.debug("[fetchWithProxyFallback] All proxy services failed, trying direct fetch as final fallback");
      
      const directResponse = await retryCanvasOperation(async (): Promise<Response> => {
        const response = await fetch(icsUrl, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'text/calendar,text/plain,*/*',
            'User-Agent': 'ScheduleBud-Calendar-Sync/1.0',
            'Cache-Control': 'no-cache'
          },
          credentials: 'omit',
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (response.status === 429) {
          throw errorHandler.canvas.rateLimited({ 
            service: 'direct',
            retryAfter: response.headers.get('Retry-After') || 'unknown'
          });
        }
        
        if (!response.ok) {
          if (response.status >= 500) {
            throw errorHandler.canvas.networkError({ 
              status: response.status,
              service: 'direct'
            });
          }
          if (response.status === 403 || response.status === 401) {
            throw errorHandler.canvas.accessDenied({ 
              status: response.status,
              service: 'direct'
            });
          }
        }
        
        return response;
      }, 2, 2000, 'Canvas direct fetch');
      
      rawText = await directResponse.text();
      successfulService = 'direct-fetch';
      
      logger.debug("[fetchWithProxyFallback] Direct fetch completed successfully");
      
    } catch (directError) {
      const directErrorMessage = directError instanceof Error ? directError.message : 'Unknown error';
      const cleanedError = maskSensitiveUrl(directErrorMessage);
      
      logger.debug("[fetchWithProxyFallback] Direct fetch also failed:", cleanedError);
      lastError = directError instanceof Error ? directError : new Error('Direct fetch error');
    }
  }

  // Final validation - ensure we got valid content
  if (!rawText || rawText.trim().length === 0) {
    const errorToThrow = lastError || new Error('No content received from any proxy service');
    const cleanedError = maskSensitiveUrl(errorToThrow.message);
    
    throw errorHandler.canvas.accessDenied({
      icsUrl: 'Canvas ICS feed (masked for security)',
      lastError: cleanedError
    });
  }

  return {
    content: rawText,
    service: successfulService || 'unknown'
  };
};