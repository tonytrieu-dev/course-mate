// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

interface AIAnalysisRequest {
  type: 'syllabus_tasks' | 'schedule_analysis';
  data: any;
  config?: {
    temperature?: number;
    maxOutputTokens?: number;
    topK?: number;
    topP?: number;
  };
}

interface SyllabusTasksRequest {
  syllabusText: string;
  className: string;
  courseName: string;
}

interface ScheduleAnalysisRequest {
  tasks: Array<{
    title: string;
    type: string;
    dueDate: string;
    class: string;
    description?: string;
  }>;
  classWorkloads: any;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('AI Analysis function called');
    
    // Get Google API key from environment
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      console.error('GOOGLE_API_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ error: 'Google API key not configured on server' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: AIAnalysisRequest = await req.json();
    console.log('Request body type:', body.type);
    
    let prompt: string;
    let generationConfig: any;

    // Build prompt based on request type
    switch (body.type) {
      case 'syllabus_tasks':
        const syllabusData = body.data as SyllabusTasksRequest;
        prompt = buildSyllabusTaskPrompt(syllabusData);
        generationConfig = {
          temperature: 0.1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        };
        break;
        
      case 'schedule_analysis':
        const scheduleData = body.data as ScheduleAnalysisRequest;
        prompt = buildScheduleAnalysisPrompt(scheduleData);
        generationConfig = {
          temperature: 0.1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        };
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid analysis type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Override with custom config if provided
    if (body.config) {
      generationConfig = { ...generationConfig, ...body.config };
    }

    // Try Gemini 2.0 Flash first, fallback to 1.5 Flash if overloaded
    let geminiResponse;
    const models = ['gemini-2.0-flash-exp', 'gemini-1.5-flash'];
    let lastError;
    
    for (const model of models) {
      try {
        console.log(`Attempting to use model: ${model}`);
        geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: prompt }],
              }],
              generationConfig,
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
            }),
          }
        );
        
        if (geminiResponse.ok) {
          console.log(`Successfully using model: ${model}`);
          break;
        } else if (geminiResponse.status === 503) {
          console.log(`Model ${model} is overloaded, trying fallback...`);
          lastError = await geminiResponse.text();
          continue;
        } else {
          lastError = await geminiResponse.text();
          break;
        }
      } catch (error) {
        console.error(`Error with model ${model}:`, error);
        lastError = error;
        continue;
      }
    }

    if (!geminiResponse || !geminiResponse.ok) {
      console.error('All Gemini models failed:', {
        status: geminiResponse?.status,
        statusText: geminiResponse?.statusText,
        lastError: lastError,
        requestType: body.type,
        requestDataKeys: Object.keys(body.data || {}),
      });
      return new Response(
        JSON.stringify({ 
          error: 'AI analysis failed',
          details: `All Gemini models failed. Last error: ${lastError}`,
          geminiError: lastError
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiResult = await geminiResponse.json();
    const responseText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error('Unexpected response format from Gemini:', geminiResult);
      return new Response(
        JSON.stringify({ error: 'Invalid response from AI service' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON response for structured data - handle markdown code blocks
    let result;
    try {
      console.log('Raw Gemini response preview:', {
        length: responseText.length,
        preview: responseText.substring(0, 200),
        hasMarkdownJson: responseText.includes('```json'),
        hasMarkdown: responseText.includes('```'),
        startsWithBrace: responseText.trim().startsWith('{')
      });

      // Try direct JSON parse first (for clean responses)
      if (responseText.trim().startsWith('{')) {
        result = JSON.parse(responseText.trim());
        console.log('Successfully parsed direct JSON response');
      } else {
        // Extract JSON from markdown code blocks
        let cleanedText = responseText;
        
        // More robust markdown removal
        cleanedText = cleanedText.replace(/^```json\s*/gim, '');
        cleanedText = cleanedText.replace(/^```\s*/gim, '');
        cleanedText = cleanedText.replace(/```\s*$/gim, '');
        cleanedText = cleanedText.trim();
        
        console.log('Cleaned response for JSON parsing:', {
          originalLength: responseText.length,
          cleanedLength: cleanedText.length,
          startsWithBrace: cleanedText.startsWith('{'),
          endsWithBrace: cleanedText.endsWith('}'),
          cleanedPreview: cleanedText.substring(0, 200)
        });
        
        result = JSON.parse(cleanedText);
        console.log('Successfully parsed markdown-wrapped JSON');
      }
    } catch (parseError) {
      console.error('JSON parsing failed, attempting fallback extraction:', parseError);
      console.error('Raw response text (first 500 chars):', responseText.substring(0, 500));
      
      // More aggressive JSON extraction as fallback
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
          console.log('Successfully extracted JSON using regex fallback');
        } catch (secondParseError) {
          console.error('Regex extraction also failed:', secondParseError);
          result = { rawResponse: responseText };
        }
      } else {
        console.error('No JSON structure found in response');
        result = { rawResponse: responseText };
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Analysis function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'AI analysis request failed',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildSyllabusTaskPrompt(data: SyllabusTasksRequest): string {
  return `You are a specialized academic task extraction AI. Extract tasks, assignments, and important dates from this course syllabus.

CLASS INFORMATION:
- Class Name: ${data.className}
- Course Name: ${data.courseName}

SYLLABUS CONTENT:
${data.syllabusText}

EXTRACTION INSTRUCTIONS:
1. Extract all assignments, projects, exams, quizzes, labs, and deliverables
2. Find specific due dates, time periods, or scheduling information
3. Identify task types (Assignment, Project, Exam, Quiz, Lab, Reading, Essay, Presentation, Discussion, Other)
4. Extract point values, percentages, or grade weights when available
5. Include brief descriptions when provided

CRITICAL LAB DETECTION RULES:
- Any task with "Lab", "Laboratory", "Lab 0", "Lab 1", etc. in title MUST be type "Lab"
- Look for calendar entries like "Lab 0. LTspice Installation", "Lab 1. Power Characterization"
- Lab session dates (Tue, 07/29, Thu, 07/31, etc.) should be extracted as sessionDate
- Lab tasks are typically scheduled on specific days in laboratory calendar sections
- IMPORTANT: Use type "Lab" (not "Assignment") for all laboratory experiments

SPECIAL LAB ASSIGNMENT RULES:
For laboratory assignments, extract BOTH the assignment date AND the lab session date:
- Assignment Date: When the lab is assigned/announced
- Session Date: When the lab session actually occurs (use this for dueDate)
- If only one date is provided, determine if it's assignment or session based on context

SUBJECT DETECTION:
Identify the academic subject from course codes, titles, or content:
- Electrical Engineering: EE, ECE, Electrical Engineering, Power Electronics
- Chemistry: CHEM, Chemistry, Chemical
- Physics: PHYS, Physics, Physical Science
- Other subjects as applicable

RESPONSE FORMAT:
Return a JSON object with this exact structure:
{
  "tasks": [
    {
      "title": "Assignment/task name",
      "description": "Brief description or requirements",
      "type": "Assignment|Project|Exam|Quiz|Lab|Reading|Essay|Presentation|Discussion|Other",
      "dueDate": "YYYY-MM-DD or null if no specific date",
      "assignmentDate": "YYYY-MM-DD - when lab was assigned (for labs only)",
      "sessionDate": "YYYY-MM-DD - when lab session occurs (for labs only)",
      "priority": "high|medium|low",
      "points": "Point value or null",
      "weight": "Grade percentage or null",
      "notes": "Additional context or requirements",
      "subject": "Detected academic subject (EE, Chemistry, Physics, etc.)"
    }
  ],
  "courseInfo": {
    "className": "${data.className}",
    "courseName": "${data.courseName}",
    "subject": "Primary academic subject detected",
    "extractedDates": ["Important dates found"],
    "gradingScale": "If mentioned in syllabus",
    "policies": "Key policies mentioned"
  }
}

EE 123 SPECIFIC LAB SCHEDULE (use these exact dates and titles):
- Lab 0: LTspice Installation (Tue, 07/29) - type "Lab", sessionDate "2025-07-29"
- Lab 1: Power Characterization, Regular and Controlled Rectifiers (Thu, 07/31) - type "Lab", sessionDate "2025-07-31"
- Lab 2: Half-Wave Rectifiers and Commutation (Tue, 08/05) - type "Lab", sessionDate "2025-08-05"
- Lab 3: Full-Wave Bridge Rectifiers (Thu, 08/07) - type "Lab", sessionDate "2025-08-07"
- Lab 4: Phase-Controlled Rectifiers and Inverters (Tue, 08/12) - type "Lab", sessionDate "2025-08-12"
- Lab 5: Switch-Mode DC-DC Converters (Tue, 08/19) - type "Lab", sessionDate "2025-08-19"
- Lab 6: Flyback and Forward DC-DC Converters (Thu, 08/21) - type "Lab", sessionDate "2025-08-21"
- Lab 7: DC-AC and AC-AC Line Inverters (Tue, 08/26) - type "Lab", sessionDate "2025-08-26"

IMPORTANT RULES:
- Only extract tasks that have clear academic requirements
- For lab assignments, always try to extract both assignment and session dates
- Use "Lab" type specifically for laboratory experiments and practicals
- Set priority based on point value, weight, or stated importance
- Include subject detection for all tasks, especially labs
- Maximum 50 tasks to prevent overwhelming students
- Respond only with valid JSON, no additional text`;
}

function buildScheduleAnalysisPrompt(data: ScheduleAnalysisRequest): string {
  return `As an AI study schedule optimizer, analyze this student's workload and provide recommendations:

UPCOMING TASKS (${data.tasks.length} total):
${JSON.stringify(data.tasks, null, 2)}

CLASS WORKLOADS:
${JSON.stringify(data.classWorkloads, null, 2)}

Please analyze and respond with a JSON object containing:
1. estimatedTotalHours: Total hours needed for all assignments
2. stressLevel: Stress level prediction (1-10 scale)
3. recommendedDailyHours: Recommended daily study hours
4. peakWorkloadDates: Array of dates with highest workload (YYYY-MM-DD format)
5. recommendations: Object with immediate_actions, schedule_adjustments, long_term_strategies arrays
6. overloadRisk: Risk of being overloaded (0-1 scale)
7. deadlineConflicts: Number of conflicting deadlines
8. burnoutRisk: Risk of burnout (0-1 scale)

Consider:
- Assignment difficulty and time requirements
- Deadline proximity and distribution
- Subject matter complexity
- Realistic study capacity for students
- Work-life balance

Respond only with valid JSON, no additional text.`;
}