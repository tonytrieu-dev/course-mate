/**
 * AI Analysis Module - Handles Gemini AI integration for syllabus task generation
 * Extracted from syllabusTaskGenerationService.ts for better maintainability
 */

import { logger } from '../../utils/logger';
import { errorHandler } from '../../utils/errorHandler';
import { supabase } from '../supabaseClient';

// AI Analysis configuration
const AI_ANALYSIS_CONFIG = {
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
  MAX_PROMPT_LENGTH: 500000, // 500KB max prompt
  REQUEST_TIMEOUT: 30000, // 30 seconds
} as const;

/**
 * Generated task interface for AI responses
 */
export interface GeneratedTask {
  title: string;
  description?: string;
  dueDate?: string;
  assignmentDate?: string;
  sessionDate?: string;
  taskType: string;
  priority: 'low' | 'medium' | 'high';
  confidenceScore: number;
  courseCode?: string;
  courseName?: string;
  sourceText?: string;
  subject?: string;
}

/**
 * AI analysis input data structure
 */
export interface SyllabusAnalysisData {
  syllabusText: string;
  className: string;
  courseName: string;
}

/**
 * Build the task extraction prompt for Gemini AI
 */
export function buildTaskExtractionPrompt(syllabusContent: string): string {
  return `Please analyze this syllabus content and extract all tasks, assignments, and deadlines. 

SYLLABUS CONTENT:
${syllabusContent}

Extract the following information for each task/assignment:
1. Title (required)
2. Description (if available)
3. Due date (if specified)
4. Assignment date (when it was assigned, if different from due date)
5. Session date (if it's a session-based task like labs)
6. Task type (assignment, exam, quiz, project, reading, discussion, lab, etc.)
7. Priority level (low, medium, high based on importance)
8. Confidence score (0.0-1.0 how confident you are this is a real task)
9. Course code (if identifiable)
10. Course name (if identifiable)
11. Subject area (if identifiable)

IMPORTANT RULES:
- Only extract actual tasks/assignments with due dates or clear deadlines
- Be especially careful with LAB tasks - these are critical for engineering courses
- For labs, try to match them with specific dates from any lab schedule in the syllabus
- Use confidence scores: 0.9+ for clear tasks, 0.7-0.8 for likely tasks, 0.5-0.6 for uncertain
- Extract course information from headers, titles, or course identifiers
- If no specific date is given, leave dueDate empty but include the task if it's clearly an assignment

Format your response as a JSON array of objects with these exact field names:
- title (string)
- description (string, optional)
- dueDate (string in YYYY-MM-DD format, optional)
- assignmentDate (string in YYYY-MM-DD format, optional)
- sessionDate (string in YYYY-MM-DD format, optional)
- taskType (string)
- priority (string: "low", "medium", or "high")
- confidenceScore (number between 0.0 and 1.0)
- courseCode (string, optional)
- courseName (string, optional)
- subject (string, optional)

Respond with ONLY the JSON array, no additional text or markdown formatting.`;
}

/**
 * Call AI Analysis Edge Function for secure task generation
 */
export async function callAIAnalysisEdgeFunction(syllabusData: SyllabusAnalysisData): Promise<string> {
  logger.info('🔒 AI EDGE: Calling AI Analysis Edge Function for task extraction', {
    syllabusLength: syllabusData.syllabusText.length,
    className: syllabusData.className
  });

  let retries = 3;
  while (retries > 0) {
    try {
      const { data, error } = await supabase.functions.invoke('ai-analysis', {
        body: {
          type: 'syllabus_tasks',
          data: syllabusData,
          config: {
            temperature: 0.1,
            topK: 1,
            topP: 0.8,
            maxOutputTokens: 8192,
          }
        }
      });

      if (error) {
        logger.error('🔒 AI EDGE: Edge Function error', error);
        throw new Error(`AI Analysis error: ${error.message}`);
      }

      if (!data) {
        throw new Error('Invalid response from AI Analysis service');
      }

      logger.info('🔒 AI EDGE: Edge Function response received', {
        hasResult: !!data,
        resultType: typeof data
      });

      // Return the result directly - it should already be the task extraction text
      const responseText = typeof data === 'string' ? data : JSON.stringify(data);
      
      logger.info('✅ AI EDGE: Successfully extracted response from AI Analysis', {
        responseLength: responseText.length
      });
      
      return responseText;
      
    } catch (error) {
      retries--;
      if (retries === 0) {
        logger.error('🔒 AI EDGE: AI Analysis call failed after retries', { 
          error: error instanceof Error ? error.message : String(error) 
        });
        throw errorHandler.createError('AI Analysis call failed', 'AI_ANALYSIS_FAILED', {
          service: 'AI Analysis Edge Function',
          operation: 'task extraction',
          originalError: error instanceof Error ? error.message : String(error)
        });
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error('Unexpected error in callAIAnalysisEdgeFunction');
}

/**
 * Call Gemini AI for syllabus analysis (direct API call)
 */
export async function callAIAnalysis(syllabusData: SyllabusAnalysisData): Promise<GeneratedTask[]> {
  const startTime = Date.now();
  
  try {
    logger.info('🤖 AI ANALYSIS: Starting Gemini API call for syllabus task extraction', {
      contentLength: syllabusData.syllabusText.length,
      className: syllabusData.className
    });

    // Build the prompt
    const prompt = buildTaskExtractionPrompt(syllabusData.syllabusText);
    
    if (prompt.length > AI_ANALYSIS_CONFIG.MAX_PROMPT_LENGTH) {
      logger.warn('🤖 AI ANALYSIS: Prompt length exceeds maximum, truncating', {
        originalLength: prompt.length,
        maxLength: AI_ANALYSIS_CONFIG.MAX_PROMPT_LENGTH
      });
    }

    // Prepare Gemini API request
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt.substring(0, AI_ANALYSIS_CONFIG.MAX_PROMPT_LENGTH)
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH", 
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    logger.debug('🤖 AI ANALYSIS: Making Gemini API request', {
      requestBodySize: JSON.stringify(requestBody).length,
      temperature: 0.1
    });

    // Make the API call with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_ANALYSIS_CONFIG.REQUEST_TIMEOUT);

    const response = await fetch(AI_ANALYSIS_CONFIG.GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('🤖 AI ANALYSIS: Gemini API request failed', {
        status: response.status,
        statusText: response.statusText,
        errorPreview: errorText.substring(0, 500)
      });
      
      throw errorHandler.createError(
        `Gemini API request failed: ${response.status} ${response.statusText}`,
        'AI_API_ERROR',
        {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 1000)
        }
      );
    }

    const responseData = await response.json();
    const processingTime = Date.now() - startTime;

    logger.info('🤖 AI ANALYSIS: Gemini API response received', {
      processingTimeMs: processingTime,
      responseSize: JSON.stringify(responseData).length,
      hasCandidates: !!responseData.candidates
    });

    // Extract the generated content
    if (!responseData.candidates || responseData.candidates.length === 0) {
      throw errorHandler.createError(
        'No candidates in Gemini API response',
        'AI_RESPONSE_ERROR',
        { responseData }
      );
    }

    const generatedText = responseData.candidates[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      throw errorHandler.createError(
        'No generated text in Gemini API response',
        'AI_RESPONSE_ERROR',
        { candidate: responseData.candidates[0] }
      );
    }

    logger.debug('🤖 AI ANALYSIS: Raw Gemini response text received', {
      textLength: generatedText.length,
      textPreview: generatedText.substring(0, 200) + '...'
    });

    // Parse the response
    const tasks = parseGeminiResponse(generatedText);
    
    logger.info('✅ AI ANALYSIS: Successfully completed Gemini analysis', {
      totalProcessingTime: Date.now() - startTime,
      tasksExtracted: tasks.length,
      averageConfidence: tasks.length > 0 
        ? (tasks.reduce((sum, task) => sum + task.confidenceScore, 0) / tasks.length).toFixed(3)
        : 'N/A'
    });

    return tasks;

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error('🤖 AI ANALYSIS: Failed to complete Gemini analysis', {
      processingTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    if (error instanceof Error && error.name === 'AbortError') {
      throw errorHandler.createError(
        'AI analysis timed out - syllabus may be too large or API is slow',
        'AI_TIMEOUT_ERROR',
        { timeoutMs: AI_ANALYSIS_CONFIG.REQUEST_TIMEOUT }
      );
    }

    throw error;
  }
}

/**
 * Parse Gemini's JSON response into GeneratedTask objects
 */
export function parseGeminiResponse(responseText: string): GeneratedTask[] {
  try {
    logger.debug('🤖 AI PARSE: Starting Gemini response parsing', {
      responseLength: responseText.length
    });

    // Clean up the response text - remove markdown formatting if present
    let cleanedText = responseText.trim();
    
    // Remove markdown code block formatting
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Remove any leading/trailing whitespace again
    cleanedText = cleanedText.trim();

    logger.debug('🤖 AI PARSE: Cleaned response text', {
      originalLength: responseText.length,
      cleanedLength: cleanedText.length,
      cleanedPreview: cleanedText.substring(0, 200) + '...'
    });

    // Parse JSON
    let parsedData: any;
    try {
      parsedData = JSON.parse(cleanedText);
    } catch (parseError) {
      logger.warn('🤖 AI PARSE: Initial JSON parse failed, attempting repair', {
        parseError: parseError instanceof Error ? parseError.message : 'Unknown error',
        textPreview: cleanedText.substring(0, 500)
      });

      // Try to repair common JSON issues
      let repairedText = cleanedText;
      
      // Fix trailing commas
      repairedText = repairedText.replace(/,(\s*[}\]])/g, '$1');
      
      // Ensure proper array format
      if (!repairedText.startsWith('[')) {
        repairedText = '[' + repairedText;
      }
      if (!repairedText.endsWith(']')) {
        repairedText = repairedText + ']';
      }

      try {
        parsedData = JSON.parse(repairedText);
        logger.info('🤖 AI PARSE: Successfully repaired and parsed JSON');
      } catch (repairError) {
        logger.error('🤖 AI PARSE: JSON repair failed', {
          repairError: repairError instanceof Error ? repairError.message : 'Unknown error',
          repairedTextPreview: repairedText.substring(0, 500)
        });
        
        throw errorHandler.createError(
          'Failed to parse Gemini AI response as JSON',
          'AI_PARSE_ERROR',
          {
            originalError: parseError instanceof Error ? parseError.message : 'Unknown error',
            responsePreview: cleanedText.substring(0, 1000)
          }
        );
      }
    }

    // Ensure we have an array
    if (!Array.isArray(parsedData)) {
      if (typeof parsedData === 'object' && parsedData !== null) {
        // If it's a single object, wrap it in an array
        parsedData = [parsedData];
        logger.debug('🤖 AI PARSE: Wrapped single object in array');
      } else {
        throw errorHandler.createError(
          'Gemini AI response is not an array or object',
          'AI_PARSE_ERROR',
          { parsedDataType: typeof parsedData }
        );
      }
    }

    // Validate and transform each task
    const validTasks: GeneratedTask[] = [];
    let skippedTasks = 0;

    for (let i = 0; i < parsedData.length; i++) {
      const rawTask = parsedData[i];
      
      try {
        // Validate required fields
        if (!rawTask.title || typeof rawTask.title !== 'string') {
          logger.debug(`🤖 AI PARSE: Skipping task ${i} - missing or invalid title`);
          skippedTasks++;
          continue;
        }

        if (!rawTask.taskType || typeof rawTask.taskType !== 'string') {
          logger.debug(`🤖 AI PARSE: Skipping task ${i} - missing or invalid taskType`);
          skippedTasks++;
          continue;
        }

        if (typeof rawTask.confidenceScore !== 'number' || 
            rawTask.confidenceScore < 0 || rawTask.confidenceScore > 1) {
          logger.debug(`🤖 AI PARSE: Skipping task ${i} - invalid confidenceScore`);
          skippedTasks++;
          continue;
        }

        // Create validated task object
        const validTask: GeneratedTask = {
          title: rawTask.title.trim(),
          taskType: rawTask.taskType.toLowerCase().trim(),
          confidenceScore: rawTask.confidenceScore,
          priority: rawTask.priority === 'high' || rawTask.priority === 'medium' || rawTask.priority === 'low' 
            ? rawTask.priority 
            : 'medium', // Default priority
          description: typeof rawTask.description === 'string' ? rawTask.description.trim() : undefined,
          dueDate: typeof rawTask.dueDate === 'string' ? rawTask.dueDate.trim() : undefined,
          assignmentDate: typeof rawTask.assignmentDate === 'string' ? rawTask.assignmentDate.trim() : undefined,
          sessionDate: typeof rawTask.sessionDate === 'string' ? rawTask.sessionDate.trim() : undefined,
          courseCode: typeof rawTask.courseCode === 'string' ? rawTask.courseCode.trim() : undefined,
          courseName: typeof rawTask.courseName === 'string' ? rawTask.courseName.trim() : undefined,
          subject: typeof rawTask.subject === 'string' ? rawTask.subject.trim() : undefined
        };

        validTasks.push(validTask);

      } catch (error) {
        logger.warn(`🤖 AI PARSE: Error processing task ${i}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          rawTask
        });
        skippedTasks++;
      }
    }

    logger.info('🤖 AI PARSE: Completed Gemini response parsing', {
      totalRawTasks: parsedData.length,
      validTasks: validTasks.length,
      skippedTasks,
      successRate: `${((validTasks.length / parsedData.length) * 100).toFixed(1)}%`
    });

    return validTasks;

  } catch (error) {
    logger.error('🤖 AI PARSE: Critical error in Gemini response parsing', {
      error: error instanceof Error ? error.message : 'Unknown error',
      responsePreview: responseText.substring(0, 1000)
    });
    throw error;
  }
}

/**
 * Detect if content appears to be academic/syllabus material
 */
export function detectAcademicContent(content: string): boolean {
  const academicKeywords = [
    'syllabus', 'curriculum', 'course', 'assignment', 'homework', 'exam', 
    'quiz', 'lab', 'lecture', 'semester', 'quarter', 'grade', 'credit',
    'professor', 'instructor', 'student', 'university', 'college'
  ];
  
  const contentLower = content.toLowerCase();
  const keywordMatches = academicKeywords.filter(keyword => 
    contentLower.includes(keyword)
  ).length;
  
  return keywordMatches >= 3; // Require at least 3 academic keywords
}