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
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 8192,
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

    // Call Google Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleApiKey}`,
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

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error('Google Gemini API error:', errorBody);
      return new Response(
        JSON.stringify({ 
          error: 'AI analysis failed',
          details: `Gemini API returned ${geminiResponse.status}` 
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

    // Parse JSON response for structured data
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Return raw text if JSON parsing fails
      result = { rawResponse: responseText };
    }

    return new Response(JSON.stringify({ result }), {
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
1. Extract all assignments, projects, exams, quizzes, and deliverables
2. Find specific due dates, time periods, or scheduling information
3. Identify task types (Essay, Exam, Project, Assignment, Quiz, Reading, etc.)
4. Extract point values, percentages, or grade weights when available
5. Include brief descriptions when provided

RESPONSE FORMAT:
Return a JSON object with this exact structure:
{
  "tasks": [
    {
      "title": "Assignment/task name",
      "description": "Brief description or requirements",
      "type": "Assignment|Project|Exam|Quiz|Reading|Essay|Presentation|Discussion|Other",
      "dueDate": "YYYY-MM-DD or null if no specific date",
      "priority": "high|medium|low",
      "points": "Point value or null",
      "weight": "Grade percentage or null",
      "notes": "Additional context or requirements"
    }
  ],
  "courseInfo": {
    "className": "${data.className}",
    "courseName": "${data.courseName}",
    "extractedDates": ["Important dates found"],
    "gradingScale": "If mentioned in syllabus",
    "policies": "Key policies mentioned"
  }
}

IMPORTANT RULES:
- Only extract tasks that have clear academic requirements
- Use "Other" type only when no standard type fits
- Set priority based on point value, weight, or stated importance
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