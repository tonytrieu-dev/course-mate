import type { User } from '@supabase/supabase-js';
import type { Task } from '../types/index';
import { supabase } from './supabaseClient';
import { errorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { SyllabusSecurityService } from './syllabusSecurityService';

// Syllabus task generation configuration
const TASK_GENERATION_CONFIG = {
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
  MAX_PROMPT_LENGTH: 500000, // 500KB max prompt (increased for larger syllabi)
  MAX_TASKS_PER_SYLLABUS: 50,
  MIN_CONFIDENCE_SCORE: 0.7,
  TASK_VALIDATION_PATTERNS: {
    VALID_TASK_TYPES: ['assignment', 'exam', 'quiz', 'project', 'reading', 'discussion', 'lab'],
    DATE_PATTERNS: [
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/gi,
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
      /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g,
      /\bweek\s+\d+\b/gi,
    ],
    ACADEMIC_TERMS: [
      'assignment', 'homework', 'project', 'essay', 'paper', 'report', 'presentation',
      'exam', 'midterm', 'final', 'test', 'quiz', 'discussion', 'lab', 'reading'
    ]
  }
} as const;

// Task form data interface
interface TaskFormData {
  title: string;
  description?: string;
  due_date?: Date;
  priority: 'low' | 'medium' | 'high';
  class_id: string;
  type_id: string;
  tags?: string[];
  estimated_duration?: number;
}

// Generated task validation interface
interface GeneratedTask {
  title: string;
  description?: string;
  dueDate?: string;
  taskType: string;
  priority: 'low' | 'medium' | 'high';
  confidenceScore: number;
  sourceText?: string;
}

interface TaskGenerationResult {
  tasks: GeneratedTask[];
  warnings: string[];
  metadata: {
    totalTasksGenerated: number;
    averageConfidence: number;
    academicContentDetected: boolean;
    processingTimeMs: number;
  };
}

export class SyllabusTaskGenerationService {
  
  /**
   * Generate tasks from syllabus content using AI with security validation
   */
  static async generateTasksFromSyllabus(
    syllabusContent: string,
    classId: string,
    user: User
  ): Promise<TaskGenerationResult> {
    const startTime = Date.now();
    
    logger.info('Syllabus task generation started', {
      classId,
      userId: user.id,
      contentLength: syllabusContent.length
    });

    try {
      // SECURITY: Validate syllabus content
      const securityValidation = await this.validateSyllabusForTaskGeneration(syllabusContent, user.id);
      if (!securityValidation.isValid) {
        throw errorHandler.createError(
          'Syllabus content validation failed: ' + securityValidation.errors.join('; '),
          'DATA_VALIDATION_FAILED',
          {
            operation: 'generateTasksFromSyllabus - security validation',
            details: securityValidation.errors.join('; ')
          }
        );
      }

      // Generate AI prompt for task extraction
      const prompt = this.buildTaskExtractionPrompt(syllabusContent);
      
      // Call Gemini API for task generation
      const geminiResponse = await this.callGeminiAPI(prompt);
      
      // Parse and validate generated tasks
      const parsedTasks = this.parseGeminiResponse(geminiResponse);
      
      // Validate each generated task
      const validatedTasks = this.validateGeneratedTasks(parsedTasks, syllabusContent);
      
      // Calculate metadata
      const metadata = {
        totalTasksGenerated: validatedTasks.length,
        averageConfidence: validatedTasks.reduce((sum, task) => sum + task.confidenceScore, 0) / validatedTasks.length || 0,
        academicContentDetected: this.detectAcademicContent(syllabusContent),
        processingTimeMs: Date.now() - startTime
      };

      logger.info('Syllabus task generation completed', {
        classId,
        userId: user.id,
        tasksGenerated: validatedTasks.length,
        averageConfidence: metadata.averageConfidence,
        processingTime: metadata.processingTimeMs
      });

      return {
        tasks: validatedTasks,
        warnings: securityValidation.warnings,
        metadata
      };

    } catch (error) {
      logger.error('Syllabus task generation failed', {
        classId,
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
        processingTime: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Create actual tasks in the database from generated tasks
   */
  static async createTasksFromGenerated(
    generatedTasks: GeneratedTask[],
    classId: string,
    user: User
  ): Promise<Task[]> {
    logger.info('Creating tasks from generated content', {
      classId,
      userId: user.id,
      taskCount: generatedTasks.length
    });

    // Import the existing service layer functions
    const { addTask } = await import('./task/taskOperations');
    const { addTaskType } = await import('./taskType/taskTypeOperations');

    const createdTasks: Task[] = [];
    const errors: string[] = [];

    for (const generatedTask of generatedTasks) {
      try {
        // Only create tasks that meet confidence threshold
        if (generatedTask.confidenceScore < TASK_GENERATION_CONFIG.MIN_CONFIDENCE_SCORE) {
          logger.warn('Skipping low-confidence task', {
            taskTitle: generatedTask.title,
            confidence: generatedTask.confidenceScore,
            threshold: TASK_GENERATION_CONFIG.MIN_CONFIDENCE_SCORE
          });
          continue;
        }

        // Get or create task type using the service layer
        const taskTypeId = await this.getOrCreateTaskTypeViaServiceLayer(generatedTask.taskType, user.id);

        // Convert to the format expected by addTask
        const taskData = {
          title: generatedTask.title,
          class: classId, // Using 'class' as per the database schema
          type: taskTypeId, // Using 'type' as per the database schema
          dueDate: generatedTask.dueDate,
          priority: generatedTask.priority,
          canvas_uid: `syllabus-generated-${Date.now()}-${Math.random()}`, // Unique identifier
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Create task using the service layer (this handles authentication properly)
        const task = await addTask(taskData, true, user);

        createdTasks.push(task);
        
        logger.debug('Task created from syllabus', {
          taskId: task.id,
          title: task.title,
          confidence: generatedTask.confidenceScore
        });

      } catch (error) {
        errors.push(`Error creating task "${generatedTask.title}": ${error instanceof Error ? error.message : String(error)}`);
        logger.error('Task creation failed', {
          taskTitle: generatedTask.title,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    if (errors.length > 0) {
      logger.warn('Some tasks failed to create', {
        classId,
        userId: user.id,
        errors,
        successfulTasks: createdTasks.length
      });
    }

    logger.info('Task creation completed', {
      classId,
      userId: user.id,
      totalGenerated: generatedTasks.length,
      successfullyCreated: createdTasks.length,
      errors: errors.length
    });

    return createdTasks;
  }

  /**
   * Validate syllabus content for security before AI processing
   */
  private static async validateSyllabusForTaskGeneration(content: string, userId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Content length validation
    if (content.length > TASK_GENERATION_CONFIG.MAX_PROMPT_LENGTH) {
      errors.push('Syllabus content too large for processing');
    }

    if (content.length < 100) {
      errors.push('Syllabus content too short to generate meaningful tasks');
    }

    // Academic content validation
    const academicIndicators = TASK_GENERATION_CONFIG.TASK_VALIDATION_PATTERNS.ACADEMIC_TERMS
      .filter(term => content.toLowerCase().includes(term.toLowerCase())).length;

    if (academicIndicators < 3) {
      warnings.push('Content may not be a typical academic syllabus');
    }

    // Security pattern validation (reuse from security service)
    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /data:text\/html/gi
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        errors.push('Suspicious content detected in syllabus');
        break;
      }
    }

    SyllabusSecurityService.logSecurityEvent('syllabus_task_generation_validation', {
      userId,
      contentLength: content.length,
      academicIndicators,
      isValid: errors.length === 0,
      errors: errors.length,
      warnings: warnings.length
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Build optimized prompt for Gemini API task extraction
   */
  private static buildTaskExtractionPrompt(syllabusContent: string): string {
    return `
You are an academic task extraction specialist. Analyze this syllabus and extract all assignments, exams, projects, and academic tasks.

SYLLABUS CONTENT:
${syllabusContent}

EXTRACTION REQUIREMENTS:
1. Extract ONLY clearly defined academic tasks (assignments, exams, projects, readings, etc.)
2. Include due dates when available (convert to ISO format YYYY-MM-DD)
3. Classify task types accurately (assignment, exam, quiz, project, reading, discussion, lab)
4. Assign priority based on task importance (low, medium, high)
5. Provide confidence score (0.0-1.0) for each extracted task

OUTPUT FORMAT (JSON only):
{
  "tasks": [
    {
      "title": "Task name",
      "description": "Brief description if available",
      "dueDate": "YYYY-MM-DD or null if not available",
      "taskType": "assignment|exam|quiz|project|reading|discussion|lab",
      "priority": "low|medium|high",
      "confidenceScore": 0.95,
      "sourceText": "Original text excerpt"
    }
  ]
}

IMPORTANT:
- Only extract tasks explicitly mentioned in the syllabus
- Do not infer or create tasks not directly stated
- Confidence score should reflect certainty of extraction
- Exclude general course information (policies, grading scales, etc.)
- Maximum ${TASK_GENERATION_CONFIG.MAX_TASKS_PER_SYLLABUS} tasks
`;
  }

  /**
   * Call Gemini API with error handling and retries
   */
  private static async callGeminiAPI(prompt: string): Promise<any> {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw errorHandler.createError('Gemini API key not configured', 'MISSING_API_KEY', {
        service: 'Gemini',
        operation: 'syllabus task generation'
      });
    }

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.1, // Low temperature for precise extraction
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH", 
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    logger.info('Calling Gemini API for task extraction', {
      promptLength: prompt.length,
      apiUrl: TASK_GENERATION_CONFIG.GEMINI_API_URL
    });

    let retries = 3;
    while (retries > 0) {
      try {
        const response = await fetch(`${TASK_GENERATION_CONFIG.GEMINI_API_URL}?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorBody = await response.text();
          logger.error('Gemini API HTTP error', {
            status: response.status,
            statusText: response.statusText,
            responseBody: errorBody.substring(0, 500) // Log first 500 chars
          });
          throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        logger.info('Gemini API response received', {
          hasCandidates: !!data.candidates,
          candidatesCount: data.candidates?.length || 0,
          hasContent: !!(data.candidates && data.candidates[0] && data.candidates[0].content)
        });
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const responseText = data.candidates[0].content.parts[0].text;
          logger.info('Successfully extracted response from Gemini API', {
            responseLength: responseText.length
          });
          return responseText;
        } else {
          logger.error('Invalid Gemini API response format', {
            responseStructure: JSON.stringify(data, null, 2).substring(0, 1000)
          });
          throw new Error('Invalid response format from Gemini API');
        }
        
      } catch (error) {
        retries--;
        if (retries === 0) {
          logger.error('Gemini API call failed after retries', { error: error instanceof Error ? error.message : String(error) });
          throw errorHandler.createError('Gemini API call failed', 'API_CALL_FAILED', {
            service: 'Gemini API',
            operation: 'task extraction',
            originalError: error instanceof Error ? error.message : String(error)
          });
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Parse Gemini response and extract task data
   */
  private static parseGeminiResponse(responseText: string): GeneratedTask[] {
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonText = responseText.trim();
      
      // Remove markdown code block markers if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(jsonText);
      
      if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
        throw new Error('Invalid task format in Gemini response');
      }

      return parsed.tasks.slice(0, TASK_GENERATION_CONFIG.MAX_TASKS_PER_SYLLABUS);
      
    } catch (error) {
      logger.error('Failed to parse Gemini response', { 
        error: error instanceof Error ? error.message : String(error),
        responseText: responseText.substring(0, 500) // Log first 500 chars for debugging
      });
      
      throw errorHandler.createError('Failed to parse Gemini response', 'PARSE_FAILED', {
        operation: 'parseGeminiResponse',
        originalError: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Validate generated tasks for quality and security
   */
  private static validateGeneratedTasks(tasks: GeneratedTask[], originalContent: string): GeneratedTask[] {
    return tasks.filter(task => {
      // Basic validation
      if (!task.title || task.title.length < 3) {
        logger.warn('Task rejected: title too short', { title: task.title });
        return false;
      }

      if (!TASK_GENERATION_CONFIG.TASK_VALIDATION_PATTERNS.VALID_TASK_TYPES.includes(task.taskType as any)) {
        logger.warn('Task rejected: invalid task type', { taskType: task.taskType });
        return false;
      }

      // Confidence validation
      if (task.confidenceScore < TASK_GENERATION_CONFIG.MIN_CONFIDENCE_SCORE) {
        logger.warn('Task rejected: low confidence', { 
          title: task.title, 
          confidence: task.confidenceScore 
        });
        return false;
      }

      // Source verification (check if task title appears in original content)
      // Use more flexible matching - check if any key words from the title appear in content
      const titleWords = task.title.toLowerCase().split(' ').filter(word => word.length > 3);
      const hasRelevantWords = titleWords.some(word => 
        originalContent.toLowerCase().includes(word) ||
        // Check for related terms that might appear in syllabus
        originalContent.toLowerCase().includes(word.substring(0, 4)) // Partial matching
      );
      
      if (!hasRelevantWords && titleWords.length > 0) {
        logger.warn('Task rejected: not found in source', { 
          title: task.title,
          titleWords: titleWords,
          searchedFor: titleWords[0]
        });
        return false;
      }

      return true;
    });
  }

  /**
   * Detect if content appears to be academic material
   */
  private static detectAcademicContent(content: string): boolean {
    const academicTerms = TASK_GENERATION_CONFIG.TASK_VALIDATION_PATTERNS.ACADEMIC_TERMS;
    const foundTerms = academicTerms.filter(term => 
      content.toLowerCase().includes(term.toLowerCase())
    );
    
    return foundTerms.length >= 5; // Need at least 5 academic terms
  }

  /**
   * Get or create task type using the service layer (which handles RLS properly)
   */
  private static async getOrCreateTaskTypeViaServiceLayer(taskTypeName: string, userId: string): Promise<string> {
    try {
      // Import the service layer functions
      const { getTaskTypes, addTaskType } = await import('./taskType/taskTypeOperations');

      // First, try to find existing task type using the service layer
      const existingTypes = await getTaskTypes(userId, true);
      const existingType = existingTypes.find(type => 
        type.name.toLowerCase() === taskTypeName.toLowerCase()
      );

      if (existingType) {
        logger.debug('Found existing task type via service layer', {
          taskTypeName,
          userId,
          taskTypeId: existingType.id
        });
        return existingType.id;
      }

      logger.debug('Creating new task type via service layer', {
        taskTypeName,
        userId,
        color: this.getTaskTypeColor(taskTypeName)
      });

      // Create new task type using the service layer
      const newTaskType = await addTaskType({
        name: taskTypeName,
        color: this.getTaskTypeColor(taskTypeName),
        user_id: userId
      }, true);

      if (newTaskType) {
        logger.debug('Successfully created new task type via service layer', {
          taskTypeName,
          userId,
          taskTypeId: newTaskType.id
        });
        return newTaskType.id;
      }

      // Fallback to finding any existing task type
      logger.warn('Failed to create task type, trying fallback via service layer', {
        taskTypeName,
        userId
      });

      const allTypes = await getTaskTypes(userId, true);
      if (allTypes.length > 0) {
        const fallbackType = allTypes[0];
        logger.debug('Using first available task type as fallback', {
          taskTypeName,
          userId,
          fallbackTypeId: fallbackType.id,
          fallbackTypeName: fallbackType.name
        });
        return fallbackType.id;
      }

      // Generate a fallback ID if all else fails
      logger.warn('All task type operations failed, using hardcoded fallback', {
        taskTypeName,
        userId
      });
      
      return 'default-task-type-id'; // Ultimate fallback
      
    } catch (error) {
      logger.error('Task type creation failed with exception via service layer', {
        taskTypeName,
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      return 'default-task-type-id'; // Ultimate fallback
    }
  }

  /**
   * Get or create task type for generated tasks (legacy method - kept for compatibility)
   */
  private static async getOrCreateTaskType(taskTypeName: string, userId: string): Promise<string> {
    try {
      // First, try to find existing task type (remove .single() to avoid errors)
      const { data: existingTypes, error: findError } = await supabase
        .from('task_types')
        .select('id')
        .eq('name', taskTypeName)
        .eq('user_id', userId)
        .limit(1);

      if (!findError && existingTypes && existingTypes.length > 0) {
        logger.debug('Found existing task type', {
          taskTypeName,
          userId,
          taskTypeId: existingTypes[0].id
        });
        return existingTypes[0].id;
      }

      logger.debug('Creating new task type', {
        taskTypeName,
        userId,
        color: this.getTaskTypeColor(taskTypeName)
      });

      // Create new task type
      const { data: newTypes, error: createError } = await supabase
        .from('task_types')
        .insert({
          name: taskTypeName,
          color: this.getTaskTypeColor(taskTypeName),
          user_id: userId
        })
        .select('id');

      if (!createError && newTypes && newTypes.length > 0) {
        logger.debug('Successfully created new task type', {
          taskTypeName,
          userId,
          taskTypeId: newTypes[0].id
        });
        return newTypes[0].id;
      }

      logger.warn('Failed to create task type, trying fallback', {
        taskTypeName,
        userId,
        createError: createError?.message
      });

      // Fallback to default task type
      const { data: defaultTypes, error: defaultError } = await supabase
        .from('task_types')
        .select('id')
        .eq('is_default', true)
        .eq('user_id', userId)
        .limit(1);
      
      if (!defaultError && defaultTypes && defaultTypes.length > 0) {
        logger.debug('Using default task type as fallback', {
          taskTypeName,
          userId,
          defaultTypeId: defaultTypes[0].id
        });
        return defaultTypes[0].id;
      }

      // Generate a fallback ID if all else fails
      logger.warn('All task type lookups failed, using hardcoded fallback', {
        taskTypeName,
        userId,
        findError: findError?.message,
        createError: createError?.message,
        defaultError: defaultError?.message
      });
      
      return 'default-task-type-id'; // Ultimate fallback
      
    } catch (error) {
      logger.error('Task type creation failed with exception', {
        taskTypeName,
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      return 'default-task-type-id'; // Ultimate fallback
    }
  }

  /**
   * Get appropriate color for task type
   */
  private static getTaskTypeColor(taskType: string): string {
    const colorMap: Record<string, string> = {
      exam: '#EF4444',      // Red
      assignment: '#3B82F6', // Blue
      project: '#8B5CF6',    // Purple
      quiz: '#F59E0B',       // Amber
      reading: '#10B981',    // Emerald
      discussion: '#6B7280', // Gray
      lab: '#F97316'         // Orange
    };
    
    return colorMap[taskType.toLowerCase()] || '#6B7280';
  }

  /**
   * Estimate task duration based on task type
   */
  private static estimateTaskDuration(taskType: string): number {
    const durationMap: Record<string, number> = {
      exam: 180,        // 3 hours
      assignment: 120,  // 2 hours
      project: 480,     // 8 hours
      quiz: 30,         // 30 minutes
      reading: 60,      // 1 hour
      discussion: 45,   // 45 minutes
      lab: 180          // 3 hours
    };
    
    return durationMap[taskType.toLowerCase()] || 60; // Default 1 hour
  }
}

// Export configuration for external use
export const SYLLABUS_TASK_GENERATION_CONFIG = TASK_GENERATION_CONFIG;