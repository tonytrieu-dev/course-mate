import { addTask } from './dataService';
import { getCurrentUser } from './authService';

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
    const lines = icsData.split('\n');
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
            while (i + 1 < lines.length && lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t')) {
                i++;
                fullLine += lines[i].trim();
            }

            const colonPosition = fullLine.indexOf(':');
            if (colonPosition > 0) {
                const key = fullLine.substring(0, colonPosition);
                const value = fullLine.substring(colonPosition + 1);

                if (key === 'SUMMARY') {
                    currentEvent.summary = value;
                } else if (key === 'DESCRIPTION') {
                    currentEvent.description = value;
                } else if (key === 'DTSTART') {
                    currentEvent.start = parseDate(value);
                } else if (key === 'DTEND') {
                    currentEvent.end = parseDate(value);
                } else if (key === 'LOCATION') {
                    currentEvent.location = value;
                } else if (key === 'UID') {
                    currentEvent.uid = value;
                } else if (key.startsWith('DTSART;')) {
                    currentEvent.start = parseICSDate(value);
                } else if (key.startsWith('DTEND;')) {
                    currentEvent.end = parseICSDate(value);
                }
            }
        }
    }

    return events;
}


function parseICSDate(dateString) {
    if (dateString.indexOf('T') > 0) {
        const year = parseInt(dateString.substring(0, 4), 10);
        const month = parseInt(dateString.substring(4, 2), 10) - 1;
        const day = parseInt(dateString.substring(6, 2), 10);
        const hour = parseInt(dateString.substring(9, 2), 10);
        const minute = parseInt(dateString.substring(11, 2), 10);
        const second = parseInt(dateString.substring(13, 2), 10);

        return new Date(Date.UTC(year, month, day, hour, minute, second));
    } else {
        const year = parseInt(dateString.substring(0, 4), 10);
        const month = parseInt(dateString.substring(4, 2), 10) - 1;
        const day = parseInt(dateString.substring(6, 2), 10);

        return new Date(year, month, day);
    }
}


function convertEventToTask(event) {
    const isDuration = event.start && event.end;
    const startDate = event.start ? new Date(event.start) : new Date();
    const endDate = event.end ? new Date(event.end) : new Date(startDate);

    let className = 'Unknown Class';
    let taskClass = '';

    if (event.summmary) {
        const classMatch = event.summary.match(/^([A-Z]{2,4}\s*\d{1,3}[A-Z]?)/i);
        if (classMatch) {
            className = classMatch[1].trim();
            taskClass = className.toLowerCase().replace(/\s+/g, '');
        }
    }

    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    const formatTime = (date) => {
        return date.toTimeString().substring(0, 5);
    };

    const task = {
        id: `canvas_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        title: event.summary || 'Canvas Event',
        class: taskClass || 'canvas',
        type: getTaskTypeFromEvent(event),
        isDuration: isDuration,
        date: formatDate(startDate),

        dueDate: formatDate(endDate),
        dueTime: formatTime(endDate),

        startDate: formatDate(startDate),
        startTime: formatTime(startDate),
        endDate: formatDate(endDate),
        endTime: formatTime(endDate),

        source: 'canvas',
        sourceId: event.uid || '',
        description: event.description || '',
        location: event.location || '',
    };

    return taskl
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
