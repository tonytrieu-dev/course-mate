import type { User } from '@supabase/supabase-js';
import type { TaskInsert } from '../types/database';
import { addTask } from './dataService';
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

// Response interface for proxy service
interface ProxyResponse {
  contents?: string;
  status?: number;
}

// Result interface for fetchCanvasCalendar
interface FetchCanvasResult {
  success: boolean;
  message: string;
  tasks: any[];
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
  user: User | null = null
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
    
    const icsText = await response.text();
    logger.debug("[fetchCanvasCalendar] response.text() completed.");
    const events = parseICS(icsText);
    logger.debug(`[fetchCanvasCalendar] parseICS completed. Found ${events.length} events.`);
    
    const addedTasks = [];
    for (const event of events) {
      logger.debug(`[fetchCanvasCalendar] Processing event UID: "${event.uid || 'N/A'}", Summary: "${event.summary || 'N/A'}"`);
      try {
        const task = convertEventToTask(event);
        logger.debug(`[fetchCanvasCalendar] Event "${event.summary || 'N/A'}" converted to task:`, task);
        const addedTask = await addTask(task, useSupabase, user);
        logger.debug(`[fetchCanvasCalendar] addTask for "${event.summary || 'N/A'}" completed. Result:`, addedTask !== null && addedTask !== undefined ? (addedTask.id ? `Task (ID: ${addedTask.id})` : 'Task object without ID') : 'No task returned (null/undefined)');
        if (addedTask) {
          addedTasks.push(addedTask);
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
    
    logger.debug(`[fetchCanvasCalendar] Finished processing all events. ${addedTasks.length} tasks were prepared.`);
    return {
      success: true,
      message: `Imported ${addedTasks.length} tasks from Canvas`,
      tasks: addedTasks
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (line === 'END:VEVENT' && currentEvent) {
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
          // Pass the raw value (like YYYYMMDD or YYYYMMDDTHHMMSSZ) to parseICSDate
          // parseICSDate is designed to handle both formats
          currentEvent.start = valuePart;
        } else if (mainKey === 'DTEND') {
          // Pass the raw value
          currentEvent.end = valuePart;
        }
      }
    }
  }

  return events;
}

function parseICSDate(dateString: string): Date {
  // Check if the date string includes time information
  if (dateString.includes('T')) {
    const year = parseInt(dateString.substring(0, 4), 10);
    const month = parseInt(dateString.substring(4, 6), 10) - 1; // Corrected index
    const day = parseInt(dateString.substring(6, 8), 10); // Corrected index
    const hour = parseInt(dateString.substring(9, 11), 10); // Corrected index (after 'T')
    const minute = parseInt(dateString.substring(11, 13), 10); // Corrected index
    const second = parseInt(dateString.substring(13, 15), 10); // Corrected index

    // Check if the date is UTC (ends with 'Z')
    if (dateString.endsWith('Z')) {
      return new Date(Date.UTC(year, month, day, hour, minute, second));
    } else {
      // Assume local time if 'Z' is not present
      return new Date(year, month, day, hour, minute, second);
    }
  } else {
    // Handle date-only strings (YYYYMMDD)
    const year = parseInt(dateString.substring(0, 4), 10);
    const month = parseInt(dateString.substring(4, 6), 10) - 1; // Corrected index
    const day = parseInt(dateString.substring(6, 8), 10); // Corrected index
    // Return as Date object (time will be midnight local time)
    return new Date(year, month, day);
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
    const classMatch = event.summary.match(/^([A-Z]{2,4}\s*\d{1,3}[A-Z]?)/i);
    if (classMatch) {
      const className = classMatch[1].trim();
      taskClass = className.toLowerCase().replace(/\s+/g, '');
    }
  }

  const task: Partial<TaskInsert> = {
    title: event.summary || 'Canvas Event',
    type: getTaskTypeFromEvent(event),
    canvas_uid: event.uid || undefined,
    due_date: formatDate(dueDate),
    // Additional canvas-specific metadata could go in description
    description: `Canvas task from class: ${taskClass}${event.description ? '\n\n' + event.description : ''}`,
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