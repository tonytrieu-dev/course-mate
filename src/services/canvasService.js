import { addTask } from './dataService';
import { logger } from '../utils/logger';
import { errorHandler, ERROR_CODES } from '../utils/errorHandler';

export const fetchCanvasCalendar = async (icsUrl, useSupabase = false, user = null) => {
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
        let response;
        let lastError;

        // Primary strategy: Use CORS proxy service for reliable access
        try {
            logger.debug("[fetchCanvasCalendar] Using proxy service for Canvas access");
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(icsUrl)}`;
            const proxyResponse = await fetch(proxyUrl);
            logger.debug("[fetchCanvasCalendar] Proxy fetch completed. Response status:", proxyResponse.status);
            
            if (proxyResponse.ok) {
                const proxyData = await proxyResponse.json();
                if (proxyData.contents) {
                    // Create a response object with the content
                    response = {
                        ok: true,
                        status: 200,
                        text: () => Promise.resolve(proxyData.contents)
                    };
                    logger.debug("[fetchCanvasCalendar] Successfully retrieved calendar via proxy");
                } else {
                    throw new Error('No content received from proxy');
                }
            } else {
                throw new Error(`Proxy service failed: ${proxyResponse.status}`);
            }
        } catch (error) {
            logger.debug("[fetchCanvasCalendar] Proxy strategy failed:", error.message);
            lastError = error;
            
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
                logger.debug("[fetchCanvasCalendar] Direct fetch also failed:", directError.message);
                lastError = directError;
            }
        }

        if (!response || !response.ok) {
            throw lastError || errorHandler.canvas.accessDenied({
                icsUrl: icsUrl ? 'provided' : 'missing',
                lastError: lastError?.message
            });
        }

        logger.debug("[fetchCanvasCalendar] fetch successful. Response status:", response.status);
        if (!response.ok) {
            const error = errorHandler.network.connectionError({
                status: response.status,
                statusText: response.statusText,
                operation: 'fetchCanvasCalendar'
            });
            const handled = errorHandler.handle(error, 'fetchCanvasCalendar - response check');
            throw error;
        }
        const icsText = await response.text();
        logger.debug("[fetchCanvasCalendar] response.text() completed.");
        const events = parseICS(icsText);
        logger.debug(`[fetchCanvasCalendar] parseICS completed. Found ${events.length} events.`);
        const addedTasks = [];
        for (const event of events) {
            logger.debug(`[fetchCanvasCalendar] Processing event UID: "${event.uid || 'N/A'}", Summary: "${event.summary || 'N/A'}"`); // More specific log
            try {
                const task = convertEventToTask(event);
                logger.debug(`[fetchCanvasCalendar] Event "${event.summary || 'N/A'}" converted to task:`, task);
                const addedTask = await addTask(task, useSupabase, user);
                logger.debug(`[fetchCanvasCalendar] addTask for "${event.summary || 'N/A'}" completed. Result:`, addedTask !== null && addedTask !== undefined ? (addedTask.id ? `Task (ID: ${addedTask.id})` : 'Task object without ID') : 'No task returned (null/undefined)');
                if (addedTask) {
                    addedTasks.push(addedTask);
                }
            } catch (error) {
                const handled = errorHandler.handle(
                    error,
                    'fetchCanvasCalendar - task processing',
                    { 
                        eventUID: event.uid || 'N/A',
                        eventSummary: event.summary || 'N/A'
                    }
                );
                logger.warn(`Failed to process Canvas event: ${handled.userMessage}`);
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
        if (error.name === 'ServiceError') {
            return {
                success: false,
                message: error.message,
                tasks: []
            };
        }
        
        // Handle other errors with context-aware messaging
        const handled = errorHandler.handle(
            error,
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


function parseICS(icsData) {
    const events = [];
    const lines = icsData.replace(/\r\n/g, '\n').split('\n');
    let currentEvent = null;

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
                let keyPart = fullLine.substring(0, colonPosition);
                const valuePart = fullLine.substring(colonPosition + 1);
                let mainKey = keyPart.split(';')[0]; // Get main key like DTSTART, SUMMARY

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


function parseICSDate(dateString) {
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


function convertEventToTask(event) {
    // DTSTART;VALUE=DATE typically means the due DATE for Canvas assignments
    // The ICS file doesn't provide a specific time.
    const dueDate = event.start ? parseICSDate(event.start) : new Date();
    const isDuration = false; // Canvas assignments from ICS are usually just due dates

    const formatDate = (date) => {
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

    const task = {
        title: event.summary || 'Canvas Event',
        class: taskClass,
        type: getTaskTypeFromEvent(event),
        canvas_uid: event.uid,
        isDuration: isDuration,
        date: dueDate.toISOString(), // Primary date field based on due date

        // Use the parsed date for dueDate, default time to 23:59
        dueDate: formatDate(dueDate),
        dueTime: defaultDueTime,
    };

    return task;
}


function getTaskTypeFromEvent(event) {
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
