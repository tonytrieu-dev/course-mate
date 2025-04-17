import { addTask } from './dataService';

export const fetchCanvasCalendar = async (icsUrl, useSupabase = false) => {
    try {
        const response = await fetch(icsUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch calendar: ${response.statusText}`);
        }
        const icsText = await response.text();
        const events = parseICS(icsText);
        const addedTasks = [];
        for (const event of events) {
            try {
                // Convert event to task format
                const task = convertEventToTask(event);

                // Add task to the datastore
                const addedTask = await addTask(task, useSupabase);
                if (addedTask) {
                    addedTasks.push(addedTask);
                }
            } catch (error) {
                console.error(`Error adding task for event "${event.summary}":`, error);
            }
        }

        return {
            success: true,
            message: `Imported ${addedTasks.length} tasks from Canvas`,
            tasks: addedTasks
        };
    } catch (error) {
        console.error('Error fetching Canvas calendar:', error);
        return {
            success: false,
            message: error.message,
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
