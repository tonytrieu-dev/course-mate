import type { User } from '@supabase/supabase-js';
import type { TaskInsert } from '../types/database';
import { addTask, getTasks, deleteTask, getTaskTypes } from './dataService';
import { logger } from '../utils/logger';
import { errorHandler } from '../utils/errorHandler';
import { parseICS, parseICSDate, CanvasEvent } from './canvas/icsParser';
import { fetchWithProxyFallback } from './canvas/proxyManager';
import { CanvasSecurityUtils } from './canvas/canvasSecurity';
import { convertEventToTask, ensureClassExists } from './canvas/taskConverter';

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


// Result interface for fetchCanvasCalendar
interface FetchCanvasResult {
  success: boolean;
  message: string;
  tasks: Partial<TaskInsert>[];
}

export const fetchCanvasCalendar = async (
  icsUrl: string, 
  useSupabase = false, 
  user: User | null = null,
  forceUpdate = false
): Promise<FetchCanvasResult> => {
  // Reduced logging for startup performance
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

    // Validate Canvas URL format using security utils
    if (!CanvasSecurityUtils.isValidCanvasFormat(icsUrl)) {
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
    // Canvas fetch attempt logged at INFO level only on errors
    
    // Fetch Canvas ICS data using multi-proxy strategy
    const fetchResult = await fetchWithProxyFallback(icsUrl, (url) => CanvasSecurityUtils.maskSensitiveUrl(url));
    const rawText = fetchResult.content;
    const successfulService = fetchResult.service;

    // Calendar fetched successfully - reduced logging for performance
    
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
      // parseICS completed with ${events.length} events
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
        // Event converted to task
        
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
        // Task added successfully
        
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
            // Task added as new
          } else {
            existingTasks.push(addedTask);
            // Task found as existing
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
    
    // Finished processing Canvas events
    
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




