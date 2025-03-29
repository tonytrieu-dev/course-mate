import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// The type definition import
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

// Interface for our syllabus data structure
interface EnhancedSyllabusData {
  instructorInfo: Array<{
    name: string;
    email: string;
    officeHours: string;
  }>;
  taInfo: Array<{
    name: string;
    email: string;
    officeHours: string;
  }>;
  assessments: Array<{
    type: string;
    date: string;
    rawText?: string;
  }>;
  assignments: Array<{
    type: string;
    number: string;
    dueDate: string;
    rawText?: string;
  }>;
  weeklySchedule?: Array<{
    weekNum: number;
    items: string[];
  }>;
}

// The main handler function using serve from Deno
serve(async (req) => {
  try {
    // Parse the request body
    const { syllabusText, basicInfo } = await req.json();

    if (!syllabusText) {
      return new Response(
        JSON.stringify({ error: "Missing syllabus text" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // First, use pattern matching to extract basic info
    const enhancedLocal = enhanceWithPatternMatching(syllabusText, basicInfo);

    // Now create a Supabase AI session and generate embeddings
    const embeddingModel = new Supabase.ai.Session('gte-small');
    
    // Generate an embedding for the syllabus to help with semantic analysis
    const embedding = await embeddingModel.run(syllabusText, {
      mean_pool: true,
      normalize: true,
    });

    // We can use the embedding to compare with known patterns of office hours, dates, etc.
    // For this simple example, we'll just return the pattern-matched data
    // In a real implementation, you could use the embedding for more sophisticated analysis

    // Return the enhanced data
    return new Response(
      JSON.stringify(enhancedLocal),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing syllabus:', error);
    return new Response(
      JSON.stringify({ error: "Failed to process syllabus", details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Enhanced extraction using pattern matching
 */
function enhanceWithPatternMatching(syllabusText: string, basicInfo: EnhancedSyllabusData): EnhancedSyllabusData {
  const enhanced = { ...basicInfo };
  
  // Enhanced pattern matching for office hours
  enhanced.instructorInfo = enhanced.instructorInfo.map(instructor => {
    const patterns = [
      new RegExp(`${instructor.name.split(' ')[0]}[^.]*?office hours[^.]*?(\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)[^.]*?)`, 'i'),
      /office hours:?\s*([^.]*?(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)[^.]*?))/i,
      /office hours:?\s*((?:Monday|Tuesday|Wednesday|Thursday|Friday|Mon|Tue|Wed|Thu|Fri)[^.]*?(?:\d{1,2}(?::\d{2})?\s*(?:am|pm))[^.]*?)/i,
      /((?:Monday|Tuesday|Wednesday|Thursday|Friday|Mon|Tue|Wed|Thu|Fri)[^.]*?(?:\d{1,2}(?::\d{2})?\s*(?:am|pm))[^.]*?office)/i
    ];
    
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
  enhanced.taInfo = enhanced.taInfo.map(ta => {
    const taName = ta.name.split(' ')[0];
    const patterns = [
      new RegExp(`${taName}[^.]*?office hours[^.]*?(\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)[^.]*?)`, 'i'),
      /ta[^.]*?office hours:?\s*([^.]*?(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)[^.]*?))/i,
      /office hours:?\s*((?:Monday|Tuesday|Wednesday|Thursday|Friday|Mon|Tue|Wed|Thu|Fri)[^.]*?(?:\d{1,2}(?::\d{2})?\s*(?:am|pm))[^.]*?)/i
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
  enhanced.assignments = enhanced.assignments.map(assignment => {
    const assignType = assignment.type.toLowerCase();
    const assignNum = assignment.number;
    
    const dueDate = findDueDate(syllabusText, assignType, assignNum);
    if (dueDate) {
      return {
        ...assignment,
        dueDate
      };
    }
    
    return assignment;
  });
  
  // Enhanced assessment date extraction
  enhanced.assessments = enhanced.assessments.map(assessment => {
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

/**
 * Find due date for an assignment
 */
function findDueDate(syllabusText: string, type: string, number: string): string | null {
  const patterns = [
    new RegExp(`${type}\\s*${number}[^.]*?due[^.]*?(\\d{1,2}/\\d{1,2}|\\w+ \\d{1,2})`, 'i'),
    new RegExp(`week\\s*\\d+[^.]*?${type}\\s*${number}[^.]*?(\\d{1,2}/\\d{1,2}|\\w+ \\d{1,2})`, 'i'),
    new RegExp(`${type}\\s*${number}[^.]*?(\\d{1,2}/\\d{1,2}|\\w+ \\d{1,2})`, 'i'),
    new RegExp(`${type}[^\\n]*?${number}[^\\n]*?(\\d{1,2}/\\d{1,2})`, 'i')
  ];
  
  for (const pattern of patterns) {
    const match = syllabusText.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}