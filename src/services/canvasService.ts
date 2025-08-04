import type { User } from '@supabase/supabase-js';
import type { TaskInsert } from '../types/database';
import { addTask, getTasks, deleteTask, getTaskTypes } from './dataService';
import { addClass, getClasses } from './class/classOperations';
import { getSettings } from './settings/settingsOperations';
import { logger } from '../utils/logger';
import { errorHandler } from '../utils/errorHandler';

// Canvas event interface for ICS parsing
interface CanvasEvent {
  summary?: string;
  description?: string;
  location?: string;
  uid?: string;
  start?: string;
  end?: string;
}

// Debug utility to test ICS parsing manually
export const debugICSParsing = async (icsUrl: string): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    logger.debug('[debugICSParsing] Testing ICS URL:', icsUrl);
    
    // Try to fetch using the same method as the main function (use corsproxy.io)
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(icsUrl)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    const rawContent = await response.text();
    
    if (!rawContent) {
      return { success: false, error: 'No content received from proxy' };
    }
    
    // Handle base64-encoded ICS data (corsproxy.io returns raw content, so this is less likely)
    let icsContent = rawContent;
    let isBase64 = false;
    if (rawContent.startsWith('data:text/calendar') && rawContent.includes('base64,')) {
      isBase64 = true;
      const base64Data = rawContent.split('base64,')[1];
      try {
        icsContent = atob(base64Data);
      } catch (error) {
        return { success: false, error: 'Failed to decode base64 ICS data' };
      }
    }
    
    // Basic analysis
    const analysis = {
      contentLength: rawContent.length,
      decodedLength: icsContent.length,
      isBase64Encoded: isBase64,
      hasVCalendar: icsContent.includes('BEGIN:VCALENDAR'),
      hasVEvent: icsContent.includes('BEGIN:VEVENT'),
      veventCount: (icsContent.match(/BEGIN:VEVENT/g) || []).length,
      contentPreview: icsContent.substring(0, 500),
      lines: icsContent.split('\n').slice(0, 20)
    };
    
    // Try parsing
    const events = parseICS(icsContent);
    
    return {
      success: true,
      data: {
        analysis,
        parsedEvents: events.length,
        events: events.slice(0, 3) // First 3 events for inspection
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Response interface for proxy service
interface ProxyResponse {
  contents?: string;
  status?: number;
}

// Enhanced proxy service configuration with security focus
interface ProxyService {
  name: string;
  url: (targetUrl: string) => string;
  responseAdapter: (response: Response) => Promise<string>;
  securityLevel: 'high' | 'medium' | 'low';
  supportsHttps: boolean;
}

// Secure multi-proxy configuration optimized for US student market
const CORS_PROXY_SERVICES: ProxyService[] = [
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

// Security utilities for Canvas URL handling
const CanvasSecurityUtils = {
  /**
   * Mask sensitive tokens in URLs for logging
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
   */
  validateCanvasUrl(url: string): { isValid: boolean; reason?: string } {
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
   */
  cleanErrorMessage(message: string, originalUrl: string): string {
    const maskedUrl = this.maskSensitiveUrl(originalUrl);
    return message.replace(originalUrl, maskedUrl);
  }
};

// Result interface for fetchCanvasCalendar
interface FetchCanvasResult {
  success: boolean;
  message: string;
  tasks: Partial<TaskInsert>[];
}

// Retry utility with exponential backoff for Canvas operations
const retryCanvasOperation = async <T>(
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

// Mock response interface for proxy fallback
interface MockResponse {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}

export const fetchCanvasCalendar = async (
  icsUrl: string, 
  useSupabase = false, 
  user: User | null = null,
  forceUpdate = false
): Promise<FetchCanvasResult> => {
  logger.debug(`[fetchCanvasCalendar] Starting. URL: ${icsUrl ? 'Provided' : 'Not Provided'}, useSupabase: ${useSupabase}, User provided: ${!!user}`);
  try {
    if (!icsUrl) {
      const error = errorHandler.canvas.invalidUrl({ 
        operation: 'fetchCanvasCalendar',
        reason: 'No ICS URL provided'
      });
      const handled = errorHandler.handle(error, 'fetchCanvasCalendar - validation');
      logger.warn(handled.userMessage);
      return {
        success: false,
        message: handled.userMessage,
        tasks: []
      };
    }

    // Validate Canvas URL format
    if (!icsUrl.includes('elearn.ucr.edu') && !icsUrl.includes('canvas') && !icsUrl.includes('.ics')) {
      logger.warn(`[fetchCanvasCalendar] URL doesn't appear to be a Canvas ICS feed: ${icsUrl}`);
      return {
        success: false,
        message: 'Please provide a valid Canvas calendar feed URL (should contain .ics and be from your Canvas instance)',
        tasks: []
      };
    }

    // Security validation for Canvas URL
    const urlValidation = CanvasSecurityUtils.validateCanvasUrl(icsUrl);
    if (!urlValidation.isValid) {
      logger.warn(`[fetchCanvasCalendar] Invalid Canvas URL: ${urlValidation.reason}`);
      return {
        success: false,
        message: `Invalid Canvas URL: ${urlValidation.reason}`,
        tasks: []
      };
    }

    const maskedUrl = CanvasSecurityUtils.maskSensitiveUrl(icsUrl);
    logger.debug(`[fetchCanvasCalendar] Attempting to fetch: ${maskedUrl}`);
    
    // Multi-proxy strategy with security-focused fallback chain
    let rawText: string | null = null;
    let lastError: Error | null = null;
    let successfulService: string | null = null;

    // Try each proxy service in order
    for (const proxyService of CORS_PROXY_SERVICES) {
      try {
        logger.debug(`[fetchCanvasCalendar] Trying ${proxyService.name} proxy service`);
        
        const proxyUrl = proxyService.url(icsUrl);
        const response = await retryCanvasOperation(async () => {
          const proxyResponse = await fetch(proxyUrl, {
            signal: AbortSignal.timeout(15000), // 15 second timeout
            headers: {
              'Accept': 'application/json,text/plain,*/*',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
          
          logger.debug(`[fetchCanvasCalendar] ${proxyService.name} response status:`, proxyResponse.status);
          
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
        
        logger.debug(`[fetchCanvasCalendar] Successfully retrieved calendar via ${proxyService.name}`);
        break; // Success! Exit the loop
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const cleanedError = CanvasSecurityUtils.cleanErrorMessage(errorMessage, icsUrl);
        
        logger.debug(`[fetchCanvasCalendar] ${proxyService.name} failed: ${cleanedError}`);
        lastError = error instanceof Error ? error : new Error(`${proxyService.name} proxy error`);
        
        // Continue to next proxy service
        continue;
      }
    }

    // If all proxy services failed, try direct fetch as final fallback
    if (!rawText) {
      try {
        logger.debug("[fetchCanvasCalendar] All proxy services failed, trying direct fetch as final fallback");
        
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
          
          if (directResponse.status === 429) {
            throw errorHandler.canvas.rateLimited({ 
              service: 'direct',
              retryAfter: directResponse.headers.get('Retry-After') || 'unknown'
            });
          }
          
          if (!directResponse.ok) {
            if (directResponse.status >= 500) {
              throw errorHandler.canvas.networkError({ 
                status: directResponse.status,
                service: 'direct'
              });
            }
            if (directResponse.status === 403 || directResponse.status === 401) {
              throw errorHandler.canvas.accessDenied({ 
                status: directResponse.status,
                service: 'direct'
              });
            }
          }
          
          return directResponse;
        }, 2, 2000, 'Canvas direct fetch');
        
        rawText = await directResponse.text();
        successfulService = 'direct-fetch';
        
        logger.debug("[fetchCanvasCalendar] Direct fetch completed successfully");
        
      } catch (directError) {
        const directErrorMessage = directError instanceof Error ? directError.message : 'Unknown error';
        const cleanedError = CanvasSecurityUtils.cleanErrorMessage(directErrorMessage, icsUrl);
        
        logger.debug("[fetchCanvasCalendar] Direct fetch also failed:", cleanedError);
        lastError = directError instanceof Error ? directError : new Error('Direct fetch error');
      }
    }

    // Final validation - ensure we got valid content
    if (!rawText || rawText.trim().length === 0) {
      const errorToThrow = lastError || new Error('No content received from any proxy service');
      const cleanedError = CanvasSecurityUtils.cleanErrorMessage(errorToThrow.message, icsUrl);
      
      throw errorHandler.canvas.accessDenied({
        icsUrl: 'Canvas ICS feed (masked for security)',
        lastError: cleanedError
      });
    }

    logger.debug(`[fetchCanvasCalendar] Successfully fetched calendar via ${successfulService}`);
    logger.debug("[fetchCanvasCalendar] Raw response preview:", rawText.substring(0, 200) + (rawText.length > 200 ? "..." : ""));
    
    // Handle base64-encoded ICS data from Canvas
    let icsText = rawText;
    if (rawText.startsWith('data:text/calendar') && rawText.includes('base64,')) {
      logger.debug("[fetchCanvasCalendar] Detected base64-encoded ICS data, decoding...");
      const base64Data = rawText.split('base64,')[1];
      if (!base64Data) {
        throw errorHandler.canvas.malformedData({ 
          reason: 'Invalid base64 format in Canvas response'
        });
      }
      
      try {
        icsText = atob(base64Data);
        logger.debug("[fetchCanvasCalendar] Successfully decoded base64 ICS data");
        logger.debug("[fetchCanvasCalendar] Decoded ICS preview:", icsText.substring(0, 500) + (icsText.length > 500 ? "..." : ""));
      } catch (error) {
        logger.error("[fetchCanvasCalendar] Failed to decode base64 ICS data:", error);
        throw errorHandler.canvas.malformedData({ 
          reason: 'Failed to decode base64 ICS data',
          originalError: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Basic ICS format validation
    if (!icsText.includes('BEGIN:VCALENDAR')) {
      throw errorHandler.canvas.malformedData({ 
        reason: 'Response does not appear to be valid ICS calendar data',
        contentPreview: icsText.substring(0, 200)
      });
    }
    
    let events: CanvasEvent[];
    try {
      events = parseICS(icsText);
      logger.debug(`[fetchCanvasCalendar] parseICS completed. Found ${events.length} events.`);
    } catch (error) {
      logger.error("[fetchCanvasCalendar] Failed to parse ICS data:", error);
      throw errorHandler.canvas.parseError({ 
        reason: 'Failed to parse ICS calendar format',
        originalError: error instanceof Error ? error.message : 'Unknown error',
        contentLength: icsText.length
      });
    }
    
    // Check if we actually got events
    if (events.length === 0) {
      // This is actually okay - Canvas might just have no upcoming events
      logger.debug("[fetchCanvasCalendar] No events found in Canvas calendar");
    }
    
    // Debug each parsed event
    events.forEach((event, index) => {
      logger.debug(`[fetchCanvasCalendar] Event ${index + 1}:`, {
        summary: event.summary,
        uid: event.uid,
        start: event.start,
        end: event.end,
        description: event.description?.substring(0, 100)
      });
    });
    
    // If force update is requested, delete existing Canvas tasks first
    if (forceUpdate && user) {
      logger.debug(`[fetchCanvasCalendar] Force update requested. Removing existing Canvas tasks.`);
      try {
        const existingTasks = await getTasks(user.id, useSupabase);
        const canvasTasks = existingTasks.filter(task => task.canvas_uid && task.canvas_uid.trim() !== '');
        
        logger.debug(`[fetchCanvasCalendar] Found ${canvasTasks.length} existing Canvas tasks to remove.`);
        
        for (const task of canvasTasks) {
          try {
            await deleteTask(task.id, useSupabase);
            logger.debug(`[fetchCanvasCalendar] Deleted existing Canvas task: ${task.title}`);
          } catch (error) {
            logger.warn(`[fetchCanvasCalendar] Failed to delete Canvas task ${task.title}:`, error);
          }
        }
      } catch (error) {
        logger.warn(`[fetchCanvasCalendar] Error during force update cleanup:`, error);
      }
    }
    
    const addedTasks = [];
    const existingTasks = [];
    const processedUIDs = new Set<string>(); // Track processed UIDs to avoid duplicates
    
    for (const event of events) {
      logger.debug(`[fetchCanvasCalendar] Processing event UID: "${event.uid || 'N/A'}", Summary: "${event.summary || 'N/A'}"`);
      
      // Skip events without essential data
      if (!event.summary || !event.uid) {
        logger.warn(`[fetchCanvasCalendar] Skipping event with missing summary or UID:`, event);
        continue;
      }
      
      // Skip duplicate UIDs (can happen with malformed Canvas feeds)
      if (processedUIDs.has(event.uid)) {
        logger.debug(`[fetchCanvasCalendar] Skipping duplicate UID: "${event.uid}"`);
        continue;
      }
      processedUIDs.add(event.uid);
      
      try {
        const task = convertEventToTask(event);
        logger.debug(`[fetchCanvasCalendar] Event "${event.summary}" converted to task:`, task);
        
        // Ensure class exists before creating task and use the correct class ID
        if (task.class) {
          const actualClassId = await ensureClassExists(task.class, useSupabase, user);
          task.class = actualClassId; // Use the actual class ID (existing or newly created)
        }
        
        // Ensure task type exists and is valid
        const taskTypes = await getTaskTypes(user?.id, useSupabase);
        if (task.type && taskTypes.length > 0) {
          const existingType = taskTypes.find(t => 
            t.id.toLowerCase() === task.type?.toLowerCase() || 
            t.name.toLowerCase() === task.type?.toLowerCase()
          );
          if (existingType) {
            task.type = existingType.id; // Use the actual task type ID
          } else {
            // If no matching type found, use the first available type or default
            task.type = taskTypes[0]?.id || 'assignment';
            logger.debug(`[fetchCanvasCalendar] Task type "${task.type}" not found, using "${taskTypes[0]?.id || 'assignment'}"`);
          }
        } else if (taskTypes.length > 0) {
          // If no type specified, use first available type
          task.type = taskTypes[0].id;
        }
        
        // Enhanced logging for debugging
        if (!task.title || !task.dueDate) {
          logger.warn(`[fetchCanvasCalendar] Task missing essential fields:`, {
            title: task.title,
            dueDate: task.dueDate,
            canvas_uid: task.canvas_uid,
            class: task.class,
            type: task.type
          });
        }
        
        logger.debug(`[fetchCanvasCalendar] Task object being sent to addTask:`, {
          title: task.title,
          dueDate: task.dueDate,
          dueTime: task.dueTime,
          class: task.class,
          type: task.type,
          canvas_uid: task.canvas_uid,
          isDuration: task.isDuration,
          completed: task.completed
        });
        
        const addedTask = await addTask(task, useSupabase, user);
        logger.debug(`[fetchCanvasCalendar] addTask for "${event.summary}" completed. Result:`, addedTask !== null && addedTask !== undefined ? (addedTask.id ? `Task (ID: ${addedTask.id})` : 'Task object without ID') : 'No task returned (null/undefined)');
        
        if (!addedTask) {
          logger.warn(`[fetchCanvasCalendar] addTask returned null/undefined for "${event.summary}". Task not added.`);
          continue;
        }
        
        if (addedTask) {
          // Check if this is a newly created task or an existing one
          // If the task was just created, it should have a very recent created_at timestamp
          const taskCreatedAt = new Date(addedTask.created_at || 0);
          const now = new Date();
          const timeDiffMinutes = (now.getTime() - taskCreatedAt.getTime()) / (1000 * 60);
          
          // If created within the last 5 minutes, consider it "new"
          if (timeDiffMinutes <= 5) {
            addedTasks.push(addedTask);
            logger.debug(`[fetchCanvasCalendar] Task "${event.summary}" added as NEW (created ${timeDiffMinutes.toFixed(1)} min ago)`);
          } else {
            existingTasks.push(addedTask);
            logger.debug(`[fetchCanvasCalendar] Task "${event.summary}" found as EXISTING (created ${timeDiffMinutes.toFixed(1)} min ago)`);
          }
        }
      } catch (error) {
        const errorToHandle = error instanceof Error ? error : new Error('Task processing error');
        const handled = errorHandler.handle(
          errorToHandle,
          'fetchCanvasCalendar - task processing',
          { 
            eventUID: event.uid || 'N/A',
            eventSummary: event.summary || 'N/A'
          }
        );
        logger.warn(`Failed to process Canvas event: ${handled.userMessage || 'Unknown error'}`);
      }
    }
    
    logger.debug(`[fetchCanvasCalendar] Finished processing all events. ${addedTasks.length} new tasks, ${existingTasks.length} existing tasks.`);
    
    const totalProcessed = addedTasks.length + existingTasks.length;
    
    let successMessage: string;
    if (addedTasks.length > 0 && existingTasks.length > 0) {
      successMessage = `Canvas sync completed! Found ${addedTasks.length} new task${addedTasks.length === 1 ? '' : 's'} and ${existingTasks.length} existing task${existingTasks.length === 1 ? '' : 's'}. The new tasks have been added to your calendar.`;
    } else if (addedTasks.length > 0) {
      successMessage = `Successfully imported ${addedTasks.length} new task${addedTasks.length === 1 ? '' : 's'} from Canvas calendar. Check your calendar for the new assignments!`;
    } else if (existingTasks.length > 0) {
      successMessage = `Canvas sync completed! All ${existingTasks.length} assignment${existingTasks.length === 1 ? '' : 's'} from Canvas ${existingTasks.length === 1 ? 'is' : 'are'} already in your calendar. No new tasks to import.`;
    } else {
      successMessage = `Canvas sync completed, but no tasks were found in the feed. This could mean no upcoming assignments are available or the feed format has changed.`;
    }
    
    return {
      success: true,
      message: successMessage,
      tasks: [...addedTasks, ...existingTasks] // Return all processed tasks for reference
    };
  } catch (error) {
    // If it's already a ServiceError, use its message directly
    if (error instanceof Error && error.name === 'ServiceError') {
      return {
        success: false,
        message: error.message,
        tasks: []
      };
    }
    
    // Handle other errors with context-aware messaging
    const handled = errorHandler.handle(
      error instanceof Error ? error : new Error('Unknown error'),
      'fetchCanvasCalendar - main operation',
      { 
        icsUrl: icsUrl ? 'provided' : 'missing',
        useSupabase,
        userProvided: !!user
      }
    );
    
    return {
      success: false,
      message: handled.userMessage,
      tasks: []
    };
  }
};

function parseICS(icsData: string): CanvasEvent[] {
  const events: CanvasEvent[] = [];
  
  try {
    const lines = icsData.replace(/\r\n/g, '\n').split('\n');
    let currentEvent: CanvasEvent | null = null;
    let lineNumber = 0;
    
    logger.debug(`[parseICS] Processing ${lines.length} lines of ICS data`);
    logger.debug(`[parseICS] First 10 lines:`, lines.slice(0, 10));

    for (let i = 0; i < lines.length; i++) {
      lineNumber = i + 1;
      const line = lines[i].trim();

    if (line === 'BEGIN:VEVENT') {
      logger.debug(`[parseICS] Found VEVENT start at line ${i + 1}`);
      currentEvent = {};
    } else if (line === 'END:VEVENT' && currentEvent) {
      logger.debug(`[parseICS] Found VEVENT end at line ${i + 1}, adding event:`, currentEvent);
      events.push(currentEvent);
      currentEvent = null;
    } else if (currentEvent) {
      let fullLine = line;
      // Handle potential multi-line values (folded lines)
      while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
        i++;
        fullLine += lines[i].trim(); // Append unfolded part
      }

      const colonPosition = fullLine.indexOf(':');
      if (colonPosition > 0) {
        const keyPart = fullLine.substring(0, colonPosition);
        const valuePart = fullLine.substring(colonPosition + 1);
        const mainKey = keyPart.split(';')[0]; // Get main key like DTSTART, SUMMARY

        // Process common keys
        if (mainKey === 'SUMMARY') {
          currentEvent.summary = valuePart;
        } else if (mainKey === 'DESCRIPTION') {
          // Basic unescaping for common ICS characters
          currentEvent.description = valuePart.replace(/\\n/g, '\n').replace(/\\,/g, ',');
        } else if (mainKey === 'LOCATION') {
          currentEvent.location = valuePart;
        } else if (mainKey === 'UID') {
          currentEvent.uid = valuePart;
        } else if (mainKey === 'DTSTART') {
          // Handle Canvas's malformed DTSTART with duplicate VALUE=DATE
          // Clean up the value part by removing duplicate parameters
          let cleanValue = valuePart;
          // Check if keyPart contains VALUE=DATE parameters (Canvas bug)
          if (keyPart.includes('VALUE=DATE')) {
            logger.debug("[parseICS] Detected Canvas malformed DTSTART, cleaning up");
            // Extract just the date/time value, ignoring malformed parameters
            cleanValue = valuePart;
          }
          currentEvent.start = cleanValue;
        } else if (mainKey === 'DTEND') {
          // Handle potential malformed DTEND similarly
          let cleanValue = valuePart;
          if (keyPart.includes('VALUE=DATE')) {
            logger.debug("[parseICS] Detected Canvas malformed DTEND, cleaning up");
            cleanValue = valuePart;
          }
          currentEvent.end = cleanValue;
        }
      }
    }
  }

  logger.debug(`[parseICS] Parsed ${events.length} events from ICS data`);
  
  // If no events found, check for common issues
  if (events.length === 0) {
    logger.warn(`[parseICS] No events found! Checking for common issues...`);
    
    // Check if it's actually an ICS file
    if (!icsData.includes('BEGIN:VCALENDAR') && !icsData.includes('BEGIN:VEVENT')) {
      logger.error(`[parseICS] This doesn't appear to be a valid ICS file. Content start:`, icsData.substring(0, 200));
    }
    
    // Check for network errors in the response
    if (icsData.includes('404') || icsData.includes('Not Found') || icsData.includes('Error')) {
      logger.error(`[parseICS] Response appears to contain an error:`, icsData.substring(0, 300));
    }
    
    // Count VEVENT blocks manually for validation
    const veventCount = (icsData.match(/BEGIN:VEVENT/g) || []).length;
    logger.debug(`[parseICS] Manual count of VEVENT blocks: ${veventCount}`);
    
    // Validate parsing results
    if (veventCount > 0 && events.length === 0) {
      logger.warn(`[parseICS] Found ${veventCount} VEVENT blocks but parsed 0 events - possible parsing issue`);
    }
  }
  
  return events;
    
  } catch (error) {
    logger.error(`[parseICS] Error parsing ICS data:`, error);
    throw new Error(`ICS parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function parseICSDate(dateString: string): Date {
  try {
    // Clean up the date string - remove any whitespace and validate format
    const cleanDateString = dateString.trim();
    
    if (!cleanDateString || cleanDateString.length < 8) {
      logger.warn(`[parseICSDate] Invalid date string length: "${cleanDateString}"`);
      return new Date(); // Return current date as fallback
    }

    // Check if the date string includes time information
    if (cleanDateString.includes('T')) {
      // Format: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
      if (cleanDateString.length < 15) {
        logger.warn(`[parseICSDate] Invalid datetime string length: "${cleanDateString}"`);
        return new Date();
      }

      const year = parseInt(cleanDateString.substring(0, 4), 10);
      const month = parseInt(cleanDateString.substring(4, 6), 10) - 1; // Month is 0-based
      const day = parseInt(cleanDateString.substring(6, 8), 10);
      const hour = parseInt(cleanDateString.substring(9, 11), 10); // After 'T'
      const minute = parseInt(cleanDateString.substring(11, 13), 10);
      const second = parseInt(cleanDateString.substring(13, 15), 10);

      // Validate parsed values
      if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute) || isNaN(second)) {
        logger.warn(`[parseICSDate] Invalid datetime components in: "${cleanDateString}"`);
        return new Date();
      }

      // Check if the date is UTC (ends with 'Z')
      if (cleanDateString.endsWith('Z')) {
        return new Date(Date.UTC(year, month, day, hour, minute, second));
      } else {
        // Assume local time if 'Z' is not present
        return new Date(year, month, day, hour, minute, second);
      }
    } else {
      // Handle date-only strings (YYYYMMDD)
      if (cleanDateString.length !== 8) {
        logger.warn(`[parseICSDate] Invalid date-only string length: "${cleanDateString}"`);
        return new Date();
      }

      const year = parseInt(cleanDateString.substring(0, 4), 10);
      const month = parseInt(cleanDateString.substring(4, 6), 10) - 1; // Month is 0-based
      const day = parseInt(cleanDateString.substring(6, 8), 10);

      // Validate parsed values
      if (isNaN(year) || isNaN(month) || isNaN(day) || 
          year < 1900 || year > 2100 || month < 0 || month > 11 || day < 1 || day > 31) {
        logger.warn(`[parseICSDate] Invalid date components: year=${year}, month=${month}, day=${day} from "${cleanDateString}"`);
        return new Date();
      }

      // Return as Date object (time will be midnight local time)
      return new Date(year, month, day);
    }
  } catch (error) {
    logger.error(`[parseICSDate] Error parsing date string "${dateString}":`, error);
    return new Date(); // Return current date as fallback
  }
}

/**
 * Converts technical class codes to user-friendly names
 */
function generateUserFriendlyClassName(classCode: string): string {
  // Remove common prefixes and clean up codes
  const cleanCode = classCode.replace(/^(canvas|task)_?/i, '').toUpperCase();
  
  // Pattern matching for common course formats
  if (cleanCode.match(/^UGRD(\d+[A-Z]*)$/)) {
    const courseNum = cleanCode.replace('UGRD', '');
    return `Undergraduate Course ${courseNum}`;
  }
  
  if (cleanCode.match(/^[A-Z]{2,4}\d+[A-Z]*$/)) {
    // Format like EE123, CS100, MATH120
    const subject = cleanCode.match(/^[A-Z]{2,4}/)?.[0] || '';
    const number = cleanCode.replace(/^[A-Z]{2,4}/, '');
    
    // Common subject mappings
    const subjectNames: { [key: string]: string } = {
      'EE': 'Electrical Engineering',
      'CS': 'Computer Science',
      'MATH': 'Mathematics',
      'PHYS': 'Physics',
      'CHEM': 'Chemistry',
      'BIOL': 'Biology',
      'UGRD': 'Undergraduate',
      'ENGL': 'English',
      'HIST': 'History',
      'PSYC': 'Psychology',
      'ECON': 'Economics',
      'POLI': 'Political Science',
      'PHIL': 'Philosophy',
      'ANTH': 'Anthropology',
      'SOCI': 'Sociology'
    };
    
    const fullSubjectName = subjectNames[subject] || subject;
    return `${fullSubjectName} ${number}`;
  }
  
  // Fallback: capitalize and format nicely
  return cleanCode.replace(/([A-Z])(\d)/g, '$1 $2').replace(/_/g, ' ');
}

/**
 * Ensures a class exists, creating it if necessary
 */
async function ensureClassExists(classCode: string, useSupabase: boolean, user: User | null): Promise<string> {
  try {
    const userId = user?.id;
    const classes = await getClasses(userId, useSupabase);
    
    logger.debug(`[ensureClassExists] Looking for class "${classCode}" among ${classes.length} existing classes`);
    
    // Enhanced class matching - check multiple patterns
    const existingClass = classes.find(cls => {
      const classId = cls.id.toLowerCase();
      const className = cls.name.toLowerCase();
      const searchCode = classCode.toLowerCase();
      
      logger.debug(`[ensureClassExists] Checking class "${cls.name}" (id: ${cls.id}) against search code "${classCode}"`);
      
      // Direct ID match
      if (classId === searchCode) {
        logger.debug(`[ensureClassExists] Direct ID match found`);
        return true;
      }
      
      // Direct name match
      if (className === searchCode) {
        logger.debug(`[ensureClassExists] Direct name match found`);
        return true;
      }
      
      // Check if the class code matches common patterns
      // For example: "ugrd198g" should match "EE123" if that's what we're looking for
      // Convert Canvas codes to standard format for matching
      const standardizedCode = classCode.replace(/^ugrd/i, '').replace(/_/g, '');
      if (classId === standardizedCode.toLowerCase()) {
        logger.debug(`[ensureClassExists] Standardized code match found (${standardizedCode})`);
        return true;
      }
      if (className.replace(/\s/g, '').toLowerCase() === standardizedCode.toLowerCase()) {
        logger.debug(`[ensureClassExists] Standardized name match found (${standardizedCode})`);
        return true;
      }
      
      // Try to match against subject codes (e.g., EE123 matches EE 123)
      const subjectMatch = classCode.match(/([A-Z]+)(\d+)/i);
      if (subjectMatch) {
        const [, subject, number] = subjectMatch;
        const pattern = `${subject}${number}`.toLowerCase();
        if (classId === pattern) {
          logger.debug(`[ensureClassExists] Subject code ID match found (${pattern})`);
          return true;
        }
        if (className.replace(/\s/g, '').toLowerCase() === pattern) {
          logger.debug(`[ensureClassExists] Subject code name match found (${pattern})`);
          return true;
        }
      }
      
      // Additional check: reverse matching - check if existing class patterns match search code
      // E.g., if we have "EE123" class and search for "ee123"
      const existingSubjectMatch = cls.id.match(/([A-Z]+)(\d+)/i) || cls.name.match(/([A-Z]+)\s*(\d+)/i);
      if (existingSubjectMatch) {
        const [, existingSubject, existingNumber] = existingSubjectMatch;
        const existingPattern = `${existingSubject}${existingNumber}`.toLowerCase();
        if (searchCode === existingPattern) {
          logger.debug(`[ensureClassExists] Reverse subject match found (${existingPattern})`);
          return true;
        }
        
        // Also try without the subject (in case Canvas code is just numbers)
        if (searchCode === existingNumber.toLowerCase()) {
          logger.debug(`[ensureClassExists] Number-only match found (${existingNumber})`);
          return true;
        }
      }
      
      return false;
    });
    
    if (existingClass) {
      logger.debug(`[ensureClassExists] Found existing class: "${existingClass.name}" (id: ${existingClass.id}) for code "${classCode}"`);
      return existingClass.id; // Return the existing class ID
    }
    
    // Get user's naming preference - ensure we get the latest settings
    const settings = getSettings();
    const useDescriptiveNames = settings.classNamingStyle === 'descriptive';
    
    logger.debug(`[ensureClassExists] Settings retrieved:`, { 
      classNamingStyle: settings.classNamingStyle, 
      useDescriptiveNames,
      fullSettings: settings,
      rawClassNamingStyle: settings.classNamingStyle,
      isDescriptive: settings.classNamingStyle === 'descriptive',
      isTechnical: settings.classNamingStyle === 'technical',
      isUndefined: settings.classNamingStyle === undefined
    });
    
    // Double-check the settings logic
    logger.debug(`[ensureClassExists] Decision logic - useDescriptiveNames: ${useDescriptiveNames}, will use: ${useDescriptiveNames ? 'generateUserFriendlyClassName' : 'classCode.toUpperCase'}`);
    
    // Create the class with the user's preferred naming style
    const className = useDescriptiveNames 
      ? generateUserFriendlyClassName(classCode)
      : classCode.toUpperCase(); // Keep technical code but make it uppercase for consistency
    
    logger.debug(`[ensureClassExists] Creating new class: "${className}" (code: ${classCode}, style: ${settings.classNamingStyle || 'technical'})`);
    logger.debug(`[ensureClassExists] Name generation details:`, {
      input: classCode,
      useDescriptiveNames,
      generatedName: className,
      descriptiveName: generateUserFriendlyClassName(classCode),
      technicalName: classCode.toUpperCase()
    });
    
    await addClass({
      id: classCode.toLowerCase(),
      name: className,
      user_id: userId || 'local-user',
      istaskclass: true, // Mark as task class since it's from Canvas
      created_at: new Date().toISOString()
    }, useSupabase);
    
    logger.debug(`[ensureClassExists] Successfully created class: "${className}"`);
    return classCode.toLowerCase(); // Return the new class ID
  } catch (error) {
    logger.error(`[ensureClassExists] Error creating class "${classCode}":`, error);
    return classCode.toLowerCase(); // Return the original code as fallback
  }
}

function convertEventToTask(event: CanvasEvent): Partial<TaskInsert> {
  // DTSTART;VALUE=DATE typically means the due DATE for Canvas assignments
  // The ICS file doesn't provide a specific time.
  const dueDate = event.start ? parseICSDate(event.start) : new Date();
  const isDuration = false; // Canvas assignments from ICS are usually just due dates

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Default due time to end of day as Canvas often does
  const defaultDueTime = "23:59";

  let taskClass = 'canvas'; // Default class for canvas items
  let cleanTitle = event.summary || 'Canvas Event';
  
  if (event.summary) {
    // Try multiple patterns to extract class code from Canvas summary
    // Pattern 1: [UGRD_198G_F01_25U] format (from your Canvas data)
    let classMatch = event.summary.match(/\[([A-Z]+_\d+[A-Z]*_[^_\]]+(?:_[^_\]]+)*)\]/i);
    if (classMatch) {
      // Remove the course code from the title
      cleanTitle = event.summary.replace(/\s*\[[A-Z]+_\d+[A-Z]*_[^_\]]+(?:_[^_\]]+)*\]\s*/i, '').trim();
      
      // Convert Canvas format to readable class code
      const canvasCode = classMatch[1];
      // Extract course prefix and number (e.g., UGRD_198G -> UGRD198G)
      const simplifiedMatch = canvasCode.match(/^([A-Z]+)_(\d+[A-Z]*)/);
      if (simplifiedMatch) {
        taskClass = (simplifiedMatch[1] + simplifiedMatch[2]).toLowerCase();
      } else {
        taskClass = canvasCode.toLowerCase().replace(/_/g, '');
      }
    } else {
      // Pattern 2: Traditional format like "CS 100" or "MATH120"
      classMatch = event.summary.match(/^([A-Z]{2,4}\s*\d{1,3}[A-Z]?)/i);
      if (classMatch) {
        const className = classMatch[1].trim();
        taskClass = className.toLowerCase().replace(/\s+/g, '');
        // Don't remove this from title as it's usually part of the assignment name
      } else {
        // Pattern 3: Course code at end of summary like "Assignment 1 [EE_123_B01_25U]"
        classMatch = event.summary.match(/\[([A-Z]+_\d+[A-Z]*)/i);
        if (classMatch) {
          // Remove the course code from the title
          cleanTitle = event.summary.replace(/\s*\[[A-Z]+_\d+[A-Z]*_[^_\]]*\]\s*/i, '').trim();
          
          const coursePrefix = classMatch[1].replace(/_/g, '').toLowerCase();
          taskClass = coursePrefix;
        }
      }
    }
    
    logger.debug(`[convertEventToTask] Extracted class "${taskClass}" from summary: "${event.summary}"`);
    logger.debug(`[convertEventToTask] Cleaned title: "${cleanTitle}" (original: "${event.summary}")`);
  }

  const task: Partial<TaskInsert> = {
    title: cleanTitle,
    type: getTaskTypeFromEvent(event),
    canvas_uid: event.uid || undefined,
    // Use the correct field names that match your database schema
    dueDate: formatDate(dueDate),  // Database expects "dueDate" not "due_date"
    dueTime: defaultDueTime,       // Database expects "dueTime"
    class: taskClass,              // Database expects "class" field
    isDuration: isDuration,        // Database expects "isDuration"
    completed: false,              // Ensure completed is set
  };

  return task;
}

function getTaskTypeFromEvent(event: CanvasEvent): string {
  const summary = (event.summary || '').toLowerCase();
  const description = (event.description || '').toLowerCase();
  const fullText = `${summary} ${description}`.toLowerCase();

  logger.debug(`[getTaskTypeFromEvent] Analyzing: "${summary}" | Full text: "${fullText}"`);

  // Check reflection patterns first (before exam patterns that might match "final")
  if (fullText.match(/\b(reflection|journal|weekly reflection|week \d+ reflection)\b/)) {
    logger.debug(`[getTaskTypeFromEvent] Matched reflection pattern`);
    return 'homework';
  }
  
  // Homework/assignment patterns (check early to catch things like "HW 3")
  if (fullText.match(/\b(homework|hw \d+|assignment \d+|problem set|exercise|weekly assignment)\b/)) {
    logger.debug(`[getTaskTypeFromEvent] Matched homework pattern`);
    return 'homework';
  }
  
  // Exam-related patterns (more specific to avoid false matches)
  if (fullText.match(/\b(exam \d+|midterm exam?|final exam|test \d+)\b/) || 
      fullText.match(/\b(exam|midterm|test)\b/) && !fullText.match(/\b(reflection|journal|homework|assignment)\b/)) {
    logger.debug(`[getTaskTypeFromEvent] Matched exam pattern`);
    return 'exam';
  }
  
  // Quiz patterns
  if (fullText.match(/\b(quiz|quizzes)\b/)) {
    logger.debug(`[getTaskTypeFromEvent] Matched quiz pattern`);
    return 'quiz';
  }
  
  // Lab patterns
  if (fullText.match(/\b(lab \d+|laboratory|practical|lab report|lab assignment)\b/)) {
    logger.debug(`[getTaskTypeFromEvent] Matched lab pattern`);
    return 'lab';
  }
  
  // Project patterns  
  if (fullText.match(/\b(project|capstone|final project)\b/)) {
    logger.debug(`[getTaskTypeFromEvent] Matched project pattern`);
    return 'project';
  }
  
  // Discussion patterns
  if (fullText.match(/\b(discussion|forum|post|reply|respond)\b/)) {
    logger.debug(`[getTaskTypeFromEvent] Matched discussion pattern`);
    return 'discussion';
  }
  
  // Reading patterns
  if (fullText.match(/\b(reading|read|chapter|textbook)\b/)) {
    logger.debug(`[getTaskTypeFromEvent] Matched reading pattern`);
    return 'reading';
  }
  
  // Presentation patterns
  if (fullText.match(/\b(presentation|present|slide|demo)\b/)) {
    logger.debug(`[getTaskTypeFromEvent] Matched presentation pattern`);
    return 'presentation';
  }
  
  // Paper/essay patterns
  if (fullText.match(/\b(paper|essay|report|write|writing|draft)\b/)) {
    logger.debug(`[getTaskTypeFromEvent] Matched paper pattern`);
    return 'paper';
  }
  
  // Research patterns
  if (fullText.match(/\b(research|study|investigate|analysis|analyze)\b/)) {
    logger.debug(`[getTaskTypeFromEvent] Matched research pattern`);
    return 'research';
  }
  
  // Default fallback
  logger.debug(`[getTaskTypeFromEvent] Using default assignment type`);
  return 'assignment';
}