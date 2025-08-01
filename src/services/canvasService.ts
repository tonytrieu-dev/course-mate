import type { User } from '@supabase/supabase-js';
import type { TaskInsert } from '../types/database';
import { addTask, getTasks, deleteTask } from './dataService';
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
    
    // Try to fetch using the same method as the main function
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(icsUrl)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    const proxyData = await response.json();
    const rawContent = proxyData.contents;
    
    if (!rawContent) {
      return { success: false, error: 'No content received from proxy' };
    }
    
    // Handle base64-encoded ICS data
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

// Result interface for fetchCanvasCalendar
interface FetchCanvasResult {
  success: boolean;
  message: string;
  tasks: Partial<TaskInsert>[];
}

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

    logger.debug(`[fetchCanvasCalendar] Attempting to fetch: ${icsUrl}`);
    
    // Use CORS proxy by default for maximum compatibility
    let response: Response | MockResponse | null = null;
    let lastError: Error | null = null;

    // Primary strategy: Use CORS proxy service for reliable access
    try {
      logger.debug("[fetchCanvasCalendar] Using proxy service for Canvas access");
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(icsUrl)}`;
      const proxyResponse = await fetch(proxyUrl);
      logger.debug("[fetchCanvasCalendar] Proxy fetch completed. Response status:", proxyResponse.status);
      
      if (proxyResponse.ok) {
        const proxyData: ProxyResponse = await proxyResponse.json();
        if (proxyData.contents) {
          // Create a response object with the content
          response = {
            ok: true,
            status: 200,
            text: () => Promise.resolve(proxyData.contents!)
          };
          logger.debug("[fetchCanvasCalendar] Successfully retrieved calendar via proxy");
        } else {
          throw new Error('No content received from proxy');
        }
      } else {
        throw new Error(`Proxy service failed: ${proxyResponse.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.debug("[fetchCanvasCalendar] Proxy strategy failed:", errorMessage);
      lastError = error instanceof Error ? error : new Error('Proxy error');
      
      // Fallback: Try direct fetch as secondary option
      try {
        logger.debug("[fetchCanvasCalendar] Trying direct fetch as fallback");
        response = await fetch(icsUrl, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'text/calendar,text/plain,*/*'
          },
          credentials: 'omit',
          cache: 'no-cache'
        });
        logger.debug("[fetchCanvasCalendar] Direct fetch completed. Response status:", response.status);
      } catch (directError) {
        const directErrorMessage = directError instanceof Error ? directError.message : 'Unknown error';
        logger.debug("[fetchCanvasCalendar] Direct fetch also failed:", directErrorMessage);
        lastError = directError instanceof Error ? directError : new Error('Direct fetch error');
      }
    }

    if (!response || !response.ok) {
      const errorToThrow = lastError || new Error('No response received');
      throw errorHandler.canvas.accessDenied({
        icsUrl: icsUrl ? 'provided' : 'missing',
        lastError: errorToThrow.message
      });
    }

    logger.debug("[fetchCanvasCalendar] fetch successful. Response status:", response.status);
    if (!response.ok) {
      const error = errorHandler.network.connectionError({
        status: response.status,
        statusText: 'statusText' in response ? response.statusText : 'Unknown status',
        operation: 'fetchCanvasCalendar'
      });
      errorHandler.handle(error, 'fetchCanvasCalendar - response check');
      throw error;
    }
    
    const rawText = await response.text();
    logger.debug("[fetchCanvasCalendar] response.text() completed.");
    logger.debug("[fetchCanvasCalendar] Raw response preview:", rawText.substring(0, 200) + (rawText.length > 200 ? "..." : ""));
    
    // Handle base64-encoded ICS data from Canvas
    let icsText = rawText;
    if (rawText.startsWith('data:text/calendar') && rawText.includes('base64,')) {
      logger.debug("[fetchCanvasCalendar] Detected base64-encoded ICS data, decoding...");
      const base64Data = rawText.split('base64,')[1];
      try {
        icsText = atob(base64Data);
        logger.debug("[fetchCanvasCalendar] Successfully decoded base64 ICS data");
        logger.debug("[fetchCanvasCalendar] Decoded ICS preview:", icsText.substring(0, 500) + (icsText.length > 500 ? "..." : ""));
      } catch (error) {
        logger.error("[fetchCanvasCalendar] Failed to decode base64 ICS data:", error);
        throw new Error('Failed to decode Canvas ICS data');
      }
    }
    
    const events = parseICS(icsText);
    logger.debug(`[fetchCanvasCalendar] parseICS completed. Found ${events.length} events.`);
    
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
  const lines = icsData.replace(/\r\n/g, '\n').split('\n');
  let currentEvent: CanvasEvent | null = null;
  
  logger.debug(`[parseICS] Processing ${lines.length} lines of ICS data`);
  logger.debug(`[parseICS] First 10 lines:`, lines.slice(0, 10));

  for (let i = 0; i < lines.length; i++) {
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
    
    // Count VEVENT blocks manually
    const veventCount = (icsData.match(/BEGIN:VEVENT/g) || []).length;
    logger.debug(`[parseICS] Manual count of VEVENT blocks: ${veventCount}`);
  }
  
  return events;
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
  if (event.summary) {
    // Try multiple patterns to extract class code from Canvas summary
    // Pattern 1: [UGRD_198G_F01_25U] format (from your Canvas data)
    let classMatch = event.summary.match(/\[([A-Z]+_\d+[A-Z]*_[^_\]]+(?:_[^_\]]+)*)\]/i);
    if (classMatch) {
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
      } else {
        // Pattern 3: Course code at end of summary like "Assignment 1 [EE_123_B01_25U]"
        classMatch = event.summary.match(/\[([A-Z]+_\d+[A-Z]*)/i);
        if (classMatch) {
          const coursePrefix = classMatch[1].replace(/_/g, '').toLowerCase();
          taskClass = coursePrefix;
        }
      }
    }
    
    logger.debug(`[convertEventToTask] Extracted class "${taskClass}" from summary: "${event.summary}"`);
  }

  const task: Partial<TaskInsert> = {
    title: event.summary || 'Canvas Event',
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

  if (summary.includes('exam') || summary.includes('midterm') || summary.includes('final')) {
    return 'exam';
  } else if (summary.includes('quiz')) {
    return 'quiz';
  } else if (summary.includes('assignment') || summary.includes('homework') || description.includes('submit')) {
    return 'homework';
  } else if (summary.includes('lab') || description.includes('lab')) {
    return 'lab';
  } else if (summary.includes('project')) {
    return 'project';
  } else {
    return 'assignment';
  }
}