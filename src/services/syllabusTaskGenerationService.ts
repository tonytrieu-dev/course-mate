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
  courseCode?: string;
  courseName?: string;
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

      // Get class information for context
      const { getClasses } = await import('./class/classOperations');
      const classes = await getClasses(user.id);
      const classInfo = classes.find(c => c.id === classId);
      
      // Call AI Analysis Edge Function for task generation
      const aiResponse = await this.callAIAnalysis({
        syllabusText: syllabusContent,
        className: classInfo?.name || 'Unknown Class',
        courseName: classInfo?.name || 'Unknown Course'
      });
      
      // Parse and validate generated tasks
      const parsedTasks = this.parseGeminiResponse(aiResponse);
      
      // Debug: Log the first few parsed tasks to see their structure
      logger.debug('Parsed tasks structure analysis', {
        totalParsed: parsedTasks.length,
        firstTaskSample: parsedTasks.length > 0 ? {
          title: parsedTasks[0].title,
          taskType: parsedTasks[0].taskType,
          hasTaskType: !!parsedTasks[0].taskType,
          taskTypeType: typeof parsedTasks[0].taskType,
          allKeys: Object.keys(parsedTasks[0])
        } : 'No tasks found',
        validTaskTypes: TASK_GENERATION_CONFIG.TASK_VALIDATION_PATTERNS.VALID_TASK_TYPES
      });
      
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
   * Create actual tasks in the database from generated tasks with automatic class assignment
   */
  static async createTasksFromGenerated(
    generatedTasks: GeneratedTask[],
    fallbackClassId: string,
    user: User
  ): Promise<Task[]> {
    logger.info('Creating tasks from generated content with automatic class assignment', {
      fallbackClassId,
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

        // Determine the appropriate class for this task based on AI-detected course information
        const assignedClassId = await this.determineTaskClass(generatedTask, fallbackClassId, user);

        // Convert to the format expected by addTask
        const taskData = {
          title: generatedTask.title,
          class: assignedClassId, // Using automatically determined class
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
        
        logger.debug('Task created from syllabus with auto-assigned class', {
          taskId: task.id,
          title: task.title,
          assignedClass: assignedClassId,
          detectedCourse: generatedTask.courseCode || generatedTask.courseName || 'none',
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
        fallbackClassId,
        userId: user.id,
        errors,
        successfulTasks: createdTasks.length
      });
    }

    logger.info('Task creation completed', {
      fallbackClassId,
      userId: user.id,
      totalGenerated: generatedTasks.length,
      successfullyCreated: createdTasks.length,
      errors: errors.length
    });

    return createdTasks;
  }

  /**
   * Determine the appropriate class for a task based on AI-detected course information
   * This mimics the Canvas import automatic class assignment functionality
   */
  private static async determineTaskClass(
    generatedTask: GeneratedTask,
    fallbackClassId: string,
    user: User
  ): Promise<string> {
    try {
      // Import class operations
      const { getClasses, addClass } = await import('./class/classOperations');
      const { getSettings } = await import('./settings/settingsOperations');
      
      // If no course information was detected by AI, use fallback class
      if (!generatedTask.courseCode && !generatedTask.courseName) {
        logger.debug('No course information detected, using fallback class', {
          taskTitle: generatedTask.title,
          fallbackClassId
        });
        return fallbackClassId;
      }

      // Get existing classes for the user
      const existingClasses = await getClasses(user.id, true);
      
      // Try to find existing class based on detected course information
      const detectedCourseCode = generatedTask.courseCode?.toLowerCase();
      const detectedCourseName = generatedTask.courseName?.toLowerCase();
      
      logger.debug('Searching for matching class', {
        taskTitle: generatedTask.title,
        detectedCourseCode,
        detectedCourseName,
        existingClassCount: existingClasses.length
      });

      // Enhanced class matching logic (similar to Canvas import)
      const matchingClass = existingClasses.find(cls => {
        const classId = cls.id.toLowerCase();
        const className = cls.name.toLowerCase();
        
        // Direct course code match
        if (detectedCourseCode && classId === detectedCourseCode) {
          logger.debug('Found direct course code match', {
            taskTitle: generatedTask.title,
            matchedClass: cls.name,
            classId: cls.id
          });
          return true;
        }
        
        // Course code in class name
        if (detectedCourseCode && className.includes(detectedCourseCode)) {
          logger.debug('Found course code in class name', {
            taskTitle: generatedTask.title,
            matchedClass: cls.name,
            classId: cls.id
          });
          return true;
        }
        
        // Course name match
        if (detectedCourseName && className.includes(detectedCourseName)) {
          logger.debug('Found course name match', {
            taskTitle: generatedTask.title,
            matchedClass: cls.name,
            classId: cls.id
          });
          return true;
        }
        
        // Try subject matching (e.g., CS101 matches Computer Science)
        if (detectedCourseCode) {
          const subjectMatch = detectedCourseCode.match(/([a-z]+)(\d+)/);
          if (subjectMatch) {
            const [, subject] = subjectMatch;
            const subjectMappings: { [key: string]: string[] } = {
              'cs': ['computer', 'computing'],
              'math': ['mathematics', 'math'],
              'ee': ['electrical', 'engineering'],
              'me': ['mechanical', 'engineering'],
              'ce': ['computer', 'civil', 'engineering'],
              'phys': ['physics', 'physical'],
              'chem': ['chemistry', 'chemical'],
              'biol': ['biology', 'biological'],
              'psyc': ['psychology', 'psychological'],
              'econ': ['economics', 'economic'],
              'engl': ['english', 'literature'],
              'hist': ['history', 'historical']
            };
            
            const relatedTerms = subjectMappings[subject] || [subject];
            if (relatedTerms.some(term => className.includes(term))) {
              logger.debug('Found subject match', {
                taskTitle: generatedTask.title,
                subject,
                relatedTerms,
                matchedClass: cls.name,
                classId: cls.id
              });
              return true;
            }
          }
        }
        
        return false;
      });

      if (matchingClass) {
        logger.debug('Using existing matching class', {
          taskTitle: generatedTask.title,
          matchedClass: matchingClass.name,
          classId: matchingClass.id
        });
        return matchingClass.id;
      }

      // No existing class found, create a new one based on detected course information
      const settings = getSettings();
      const useDescriptiveNames = settings.classNamingStyle === 'descriptive';
      
      let newClassName: string;
      let newClassId: string;
      
      if (detectedCourseCode && detectedCourseName) {
        // We have both code and name
        newClassName = useDescriptiveNames ? detectedCourseName : detectedCourseCode.toUpperCase();
        newClassId = detectedCourseCode.toLowerCase();
      } else if (detectedCourseCode) {
        // Only have course code
        newClassName = useDescriptiveNames ? this.generateUserFriendlyClassName(detectedCourseCode) : detectedCourseCode.toUpperCase();
        newClassId = detectedCourseCode.toLowerCase();
      } else if (detectedCourseName) {
        // Only have course name
        newClassName = detectedCourseName;
        newClassId = detectedCourseName.toLowerCase().replace(/\s+/g, '');
      } else {
        // Fallback to default class
        return fallbackClassId;
      }

      // Create the new class
      logger.debug('Creating new class for detected course', {
        taskTitle: generatedTask.title,
        newClassName,
        newClassId,
        detectedCourseCode,
        detectedCourseName,
        useDescriptiveNames
      });

      await addClass({
        id: newClassId,
        name: newClassName,
        user_id: user.id,
        istaskclass: true, // Mark as task class since it's from AI-generated content
        created_at: new Date().toISOString()
      }, true);

      logger.debug('Successfully created new class for AI-detected course', {
        taskTitle: generatedTask.title,
        createdClass: newClassName,
        classId: newClassId
      });

      return newClassId;

    } catch (error) {
      logger.error('Error determining task class, using fallback', {
        taskTitle: generatedTask.title,
        fallbackClassId,
        error: error instanceof Error ? error.message : String(error)
      });
      return fallbackClassId;
    }
  }

  /**
   * Generate user-friendly class name from course code (similar to Canvas import)
   */
  private static generateUserFriendlyClassName(courseCode: string): string {
    // Remove common prefixes and clean up codes
    const cleanCode = courseCode.replace(/^(canvas|task)_?/i, '').toUpperCase();
    
    // Pattern matching for common course formats  
    if (cleanCode.match(/^[A-Z]{2,4}\d+[A-Z]*$/)) {
      // Format like EE123, CS100, MATH120
      const subject = cleanCode.match(/^[A-Z]{2,4}/)?.[0] || '';
      const number = cleanCode.replace(/^[A-Z]{2,4}/, '');
      
      // Common subject mappings
      const subjectNames: { [key: string]: string } = {
        'EE': 'Electrical Engineering',
        'CS': 'Computer Science', 
        'MATH': 'Mathematics',
        'PHYS': 'Physics',
        'CHEM': 'Chemistry',
        'BIOL': 'Biology',
        'ENGL': 'English',
        'HIST': 'History',
        'PSYC': 'Psychology',
        'ECON': 'Economics',
        'POLI': 'Political Science',
        'PHIL': 'Philosophy',
        'ANTH': 'Anthropology',
        'SOCI': 'Sociology',
        'ME': 'Mechanical Engineering',
        'CE': 'Civil Engineering'
      };
      
      const fullSubjectName = subjectNames[subject] || subject;
      return `${fullSubjectName} ${number}`;
    }
    
    // Fallback: capitalize and format nicely
    return cleanCode.replace(/([A-Z])(\d)/g, '$1 $2').replace(/_/g, ' ');
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
   * Build optimized prompt for Gemini API task extraction with class detection
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
6. IDENTIFY COURSE/CLASS INFORMATION for each task from course codes, department names, or subject areas mentioned in the syllabus

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
      "courseCode": "Course code or identifier if found (e.g., CS101, MATH120, EE123)",
      "courseName": "Full course name if available (e.g., Computer Science, Mathematics, Electrical Engineering)",
      "sourceText": "Original text excerpt"
    }
  ]
}

COURSE/CLASS DETECTION GUIDELINES:
- Look for course codes like CS101, MATH120, EE123, PSYC100, etc.
- Extract department names like Computer Science, Mathematics, Psychology, etc.
- Find subject areas mentioned in headers, titles, or course descriptions
- If multiple courses are mentioned, assign each task to the most relevant course
- If no specific course code is found, use the general subject area (e.g., "Science", "Math", "English")

IMPORTANT:
- Only extract tasks explicitly mentioned in the syllabus
- Do not infer or create tasks not directly stated
- Confidence score should reflect certainty of extraction
- Exclude general course information (policies, grading scales, etc.)
- Always try to identify course/class information for proper organization
- Maximum ${TASK_GENERATION_CONFIG.MAX_TASKS_PER_SYLLABUS} tasks
`;
  }

  /**
   * Call AI Analysis Edge Function for secure task generation
   */
  private static async callAIAnalysis(syllabusData: { syllabusText: string; className: string; courseName: string }): Promise<any> {
    logger.info('Calling AI Analysis Edge Function for task extraction', {
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
          logger.error('AI Analysis Edge Function error', error);
          throw new Error(`AI Analysis error: ${error.message}`);
        }

        if (!data || !data.result) {
          throw new Error('Invalid response from AI Analysis service');
        }

        logger.info('AI Analysis response received', {
          hasResult: !!data.result,
          resultType: typeof data.result
        });

        // Return the result directly - it should already be the task extraction text
        const responseText = typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
        
        logger.info('Successfully extracted response from AI Analysis', {
          responseLength: responseText.length
        });
        
        return responseText;
        
      } catch (error) {
        retries--;
        if (retries === 0) {
          logger.error('AI Analysis call failed after retries', { error: error instanceof Error ? error.message : String(error) });
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
  }

  /**
   * Parse Gemini response and extract task data
   */
  private static parseGeminiResponse(responseText: string): GeneratedTask[] {
    try {
      logger.debug('Parsing Gemini response', {
        responseLength: responseText.length,
        startsWithJson: responseText.trim().startsWith('```json'),
        startsWithBackticks: responseText.trim().startsWith('```'),
        firstChars: responseText.substring(0, 100)
      });

      // Extract JSON from response (handle markdown code blocks)
      let jsonText = responseText.trim();
      
      // Remove markdown code block markers if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      logger.debug('After markdown cleanup', {
        jsonTextLength: jsonText.length,
        firstChars: jsonText.substring(0, 200),
        lastChars: jsonText.substring(jsonText.length - 100)
      });

      // Handle potential nested rawResponse structure
      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch (parseError) {
        logger.warn('Initial JSON parse failed, checking for nested structure', { error: parseError });
        
        // Try to find JSON within the response
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
          parsed = JSON.parse(jsonText);
        } else {
          throw parseError;
        }
      }

      logger.debug('Successfully parsed JSON', {
        parsedKeys: Object.keys(parsed),
        hasTasks: !!parsed.tasks,
        tasksType: typeof parsed.tasks,
        tasksIsArray: Array.isArray(parsed.tasks)
      });

      // Handle different response structures
      let tasks = null;
      if (parsed.tasks && Array.isArray(parsed.tasks)) {
        tasks = parsed.tasks;
      } else if (parsed.rawResponse && typeof parsed.rawResponse === 'string') {
        // Handle nested rawResponse - clean markdown and parse
        logger.debug('Found rawResponse, parsing nested JSON');
        let cleanedRawResponse = parsed.rawResponse.trim();
        
        // Remove markdown code block markers from rawResponse
        if (cleanedRawResponse.startsWith('```json')) {
          cleanedRawResponse = cleanedRawResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedRawResponse.startsWith('```')) {
          cleanedRawResponse = cleanedRawResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        logger.debug('Cleaned rawResponse for parsing', {
          originalLength: parsed.rawResponse.length,
          cleanedLength: cleanedRawResponse.length,
          cleanedStartsWith: cleanedRawResponse.substring(0, 50)
        });
        
        const nestedParsed = JSON.parse(cleanedRawResponse);
        if (nestedParsed.tasks && Array.isArray(nestedParsed.tasks)) {
          tasks = nestedParsed.tasks;
        }
      }

      if (!tasks || !Array.isArray(tasks)) {
        logger.error('Invalid task format in Gemini response', {
          parsedStructure: Object.keys(parsed),
          tasksFound: !!tasks,
          tasksType: typeof tasks
        });
        throw new Error('Invalid task format in Gemini response');
      }

      logger.info('Successfully extracted tasks from response', {
        taskCount: tasks.length,
        maxTasks: TASK_GENERATION_CONFIG.MAX_TASKS_PER_SYLLABUS
      });

      return tasks.slice(0, TASK_GENERATION_CONFIG.MAX_TASKS_PER_SYLLABUS);
      
    } catch (error) {
      logger.error('Failed to parse Gemini response', { 
        error: error instanceof Error ? error.message : String(error),
        responseText: responseText.substring(0, 1000) // Log first 1000 chars for debugging
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
    return tasks.map(task => {
      // Fix missing or invalid taskType with smart inference
      if (!task.taskType || !TASK_GENERATION_CONFIG.TASK_VALIDATION_PATTERNS.VALID_TASK_TYPES.includes(task.taskType as any)) {
        const inferredType = this.inferTaskType(task.title, task.description || '');
        logger.debug('Task type inference applied', { 
          originalType: task.taskType, 
          inferredType, 
          taskTitle: task.title 
        });
        task.taskType = inferredType;
      }

      return task;
    }).filter(task => {
      // Basic validation
      if (!task.title || task.title.length < 3) {
        logger.warn('Task rejected: title too short', { title: task.title });
        return false;
      }

      // After inference, this should always pass, but keep as safety check
      if (!TASK_GENERATION_CONFIG.TASK_VALIDATION_PATTERNS.VALID_TASK_TYPES.includes(task.taskType as any)) {
        logger.warn('Task rejected: invalid task type after inference', { taskType: task.taskType });
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
   * Infer task type from title and description using keyword matching
   */
  private static inferTaskType(title: string, description: string): string {
    const text = (title + ' ' + description).toLowerCase();
    
    // Keyword patterns for different task types
    const typePatterns = {
      exam: /\b(exam|test|midterm|final|assessment)\b/i,
      quiz: /\b(quiz|short test|pop quiz)\b/i,
      assignment: /\b(assignment|homework|hw|problem set|exercise|submit|turn in)\b/i,
      lab: /\b(lab|laboratory|experiment|practical)\b/i,
      project: /\b(project|design|build|develop|create|presentation)\b/i,
      reading: /\b(reading|read|chapter|section|textbook|article)\b/i,
      discussion: /\b(discussion|forum|post|respond|participate|comment)\b/i
    };

    // Check for specific patterns
    for (const [type, pattern] of Object.entries(typePatterns)) {
      if (pattern.test(text)) {
        logger.debug('Task type inferred from pattern', { type, pattern: pattern.source, matchedText: text.substring(0, 100) });
        return type;
      }
    }

    // Default fallback based on common academic terms
    if (/\b(due|submit|complete|finish)\b/i.test(text)) {
      return 'assignment';
    }

    // Ultimate fallback
    logger.debug('Using fallback task type', { text: text.substring(0, 100) });
    return 'assignment';
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