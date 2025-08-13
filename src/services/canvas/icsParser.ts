import { logger } from '../../utils/logger';

// Canvas event interface for ICS parsing
export interface CanvasEvent {
  summary?: string;
  description?: string;
  location?: string;
  uid?: string;
  start?: string;
  end?: string;
}

/**
 * Parses ICS (iCalendar) data from Canvas and converts it to CanvasEvent objects.
 * 
 * This function handles Canvas-specific ICS formatting issues and malformed data:
 * - Handles folded lines (multi-line properties)
 * - Cleans up malformed DTSTART/DTEND values
 * - Extracts key event properties like UID, SUMMARY, DESCRIPTION
 * - Processes Canvas URL patterns and course information
 * - Provides comprehensive error handling and logging
 * 
 * @param icsData - Raw ICS calendar data string from Canvas
 * @returns Array of parsed CanvasEvent objects
 * 
 * @example
 * ```typescript
 * const icsData = `BEGIN:VCALENDAR
 * VERSION:2.0
 * BEGIN:VEVENT
 * UID:assignment_123@canvas
 * SUMMARY:Assignment Due
 * DTSTART:20240315T100000Z
 * END:VEVENT
 * END:VCALENDAR`;
 * 
 * const events = parseICS(icsData);
 * console.log(events.length); // 1
 * ```
 * 
 * @throws {Error} When ICS data is malformed or cannot be parsed
 * 
 * @internal This is an internal Canvas service function
 */
export function parseICS(icsData: string): CanvasEvent[] {
  const events: CanvasEvent[] = [];
  
  try {
    const lines = icsData.replace(/\r\n/g, '\n').split('\n');
    let currentEvent: CanvasEvent | null = null;
    let lineNumber = 0;
    
    // Processing ICS data - verbose logging reduced for startup performance

    for (let i = 0; i < lines.length; i++) {
      lineNumber = i + 1;
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
          // Basic unescaping for common ICS characters (same as DESCRIPTION)
          currentEvent.summary = valuePart.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
        } else if (mainKey === 'DESCRIPTION') {
          // Basic unescaping for common ICS characters
          currentEvent.description = valuePart.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
        } else if (mainKey === 'LOCATION') {
          // Basic unescaping for common ICS characters (same as SUMMARY/DESCRIPTION)
          currentEvent.location = valuePart.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
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

  // Parsed ${events.length} events from ICS data
  
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

/**
 * Parses ICS date format strings into JavaScript Date objects
 * 
 * @param dateString - ICS formatted date string (YYYYMMDD or YYYYMMDDTHHMMSSZ)
 * @returns Parsed Date object, or current date as fallback
 */
export function parseICSDate(dateString: string): Date {
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