// src/services/aiService.js
import { supabaseClient } from '../../config.js'; // Adjust based on your Supabase setup

/**
 * Enhance syllabus extraction with Supabase.ai - free AI built into Supabase!
 * - Uses pattern matching for offline mode
 * - Uses Supabase Edge Function with built-in AI for enhanced extraction
 * 
 * @param {string} syllabusText - Raw text from syllabus
 * @param {Object} basicInfo - Basic extracted information
 * @param {string} mode - 'offline' or 'ai'
 * @returns {Promise<Object>} - Enhanced data
 */
export async function enhanceWithAI(syllabusText, basicInfo, mode = 'offline') {
  // For offline mode, just do local pattern matching
  if (mode === 'offline') {
    return enhanceLocally(syllabusText, basicInfo);
  }
  
  try {
    // First, do local enhancement as a fallback
    const enhancedLocal = enhanceLocally(syllabusText, basicInfo);
    
    // For AI mode, call the Supabase Edge Function that uses Supabase.ai
    const { data, error } = await supabaseClient.functions.invoke('analyze-syllabus', {
      body: {
        syllabusText: syllabusText.substring(0, 10000), // Limit size
        basicInfo: enhancedLocal
      }
    });
    
    if (error) {
      console.error('Error calling Supabase Edge Function:', error);
      return enhancedLocal; // Fall back to local enhancement
    }
    
    return data;
  } catch (error) {
    console.error('Error in AI enhancement:', error);
    // Fall back to local enhancement
    return enhanceLocally(syllabusText, basicInfo);
  }
}

/**
 * Enhanced local pattern matching
 * @param {string} syllabusText - Text from syllabus  
 * @param {Object} basicInfo - Basic extracted information
 * @returns {Object} - Enhanced data using only local processing
 */
function enhanceLocally(syllabusText, basicInfo) {
  const enhanced = { ...basicInfo };
  
  // Enhanced pattern matching for office hours
  enhanced.instructorInfo = (enhanced.instructorInfo || []).map(instructor => {
    // Try several pattern variations to find office hours
    const patterns = [
      // Pattern 1: Look for name near office hours
      new RegExp(`${instructor.name?.split(' ')[0]}[^.]*?office hours[^.]*?(\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)[^.]*?)`, 'i'),
      // Pattern 2: Look for "office hours" general pattern
      /office hours:?\s*([^.]*?(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)[^.]*?))/i,
      // Pattern 3: Look for time patterns near "office"
      /office[^.]*?(\d{1,2}(?::\d{2})?\s*(?:am|pm)[^.]*?(?:am|pm))/i,
      // Pattern 4: Days of week with times
      /(Monday|Tuesday|Wednesday|Thursday|Friday|Mon|Tue|Wed|Thu|Fri)[^.]*?(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i
    ];
    
    // Try each pattern until one works
    for (const pattern of patterns) {
      const match = syllabusText.match(pattern);
      if (match && match[1]) {
        return {
          ...instructor,
          officeHours: match[1].trim()
        };
      }
    }
    
    return instructor;
  });
  
  // Enhanced pattern matching for TA office hours
  enhanced.taInfo = (enhanced.taInfo || []).map(ta => {
    const taName = ta.name?.split(' ')[0] || '';
    const patterns = [
      new RegExp(`${taName}[^.]*?office hours[^.]*?(\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)[^.]*?)`, 'i'),
      /ta[^.]*?office hours:?\s*([^.]*?(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)[^.]*?))/i,
      /(Monday|Tuesday|Wednesday|Thursday|Friday|Mon|Tue|Wed|Thu|Fri)[^.]*?(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i
    ];
    
    for (const pattern of patterns) {
      const match = syllabusText.match(pattern);
      if (match && match[1]) {
        return {
          ...ta,
          officeHours: match[1].trim()
        };
      }
    }
    
    return ta;
  });
  
  // Enhanced pattern matching for assignment due dates
  enhanced.assignments = (enhanced.assignments || []).map(assignment => {
    const assignType = assignment.type?.toLowerCase() || '';
    const assignNum = assignment.number || '';
    
    // Multiple patterns to try for due dates
    const patterns = [
      // Pattern 1: Look for assignment type and number near "due"
      new RegExp(`${assignType}\\s*${assignNum}[^.]*?due[^.]*?(\\d{1,2}/\\d{1,2}|\\w+ \\d{1,2})`, 'i'),
      // Pattern 2: Look for the assignment in weekly schedule
      new RegExp(`week\\s*\\d+[^.]*?${assignType}\\s*${assignNum}[^.]*?(\\d{1,2}/\\d{1,2}|\\w+ \\d{1,2})`, 'i'),
      // Pattern 3: Look for dates near the assignment mention
      new RegExp(`${assignType}\\s*${assignNum}[^.]*?(\\d{1,2}/\\d{1,2}|\\w+ \\d{1,2})`, 'i'),
      // Pattern 4: Look for due dates in a table-like structure
      new RegExp(`${assignType}[^\\n]*?${assignNum}[^\\n]*?(\\d{1,2}/\\d{1,2})`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = syllabusText.match(pattern);
      if (match && match[1]) {
        return {
          ...assignment,
          dueDate: match[1].trim()
        };
      }
    }
    
    return assignment;
  });
  
  // Enhanced assessment date extraction
  enhanced.assessments = (enhanced.assessments || []).map(assessment => {
    // If we already have a date, leave it
    if (assessment.date && assessment.date.match(/\d/)) {
      return assessment;
    }
    
    // Try to find time information for existing assessments
    const timePattern = new RegExp(`${assessment.type}[^.]*?(\\d{1,2}:\\d{2}\\s*(?:am|pm))`, 'i');
    const timeMatch = syllabusText.match(timePattern);
    
    if (timeMatch && timeMatch[1]) {
      return {
        ...assessment,
        time: timeMatch[1].trim()
      };
    }
    
    return assessment;
  });
  
  return enhanced;
}