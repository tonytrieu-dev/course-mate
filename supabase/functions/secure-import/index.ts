import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ImportRequest {
  file: string; // Base64 encoded file content
  filename: string;
  contentType: string;
  format: 'csv' | 'ics';
}

interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedContent?: string;
}

// Maximum file sizes (in bytes)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CSV_ROWS = 10000; // Maximum CSV rows
const MAX_ICS_EVENTS = 5000; // Maximum ICS events

// Allowed MIME types
const ALLOWED_MIME_TYPES = {
  csv: ['text/csv', 'application/csv', 'text/plain'],
  ics: ['text/calendar', 'application/ics', 'text/plain']
};

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body: ImportRequest = await req.json();

    // Validate request structure
    if (!body.file || !body.filename || !body.format) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: file, filename, format' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate format
    if (!['csv', 'ics'].includes(body.format)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid format. Only CSV and ICS files are allowed.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Decode and validate file
    let fileContent: string;
    try {
      fileContent = atob(body.file);
    } catch (e) {
      return new Response(JSON.stringify({ 
        error: 'Invalid file encoding' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // File size validation
    if (fileContent.length > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` 
      }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file extension
    const fileExt = body.filename.toLowerCase().split('.').pop();
    if (fileExt !== body.format) {
      return new Response(JSON.stringify({ 
        error: 'File extension does not match specified format' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Content type validation
    if (body.contentType && !ALLOWED_MIME_TYPES[body.format].includes(body.contentType)) {
      return new Response(JSON.stringify({ 
        error: `Invalid content type for ${body.format} file` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Security validation based on format
    let validation: SecurityValidationResult;
    if (body.format === 'csv') {
      validation = validateCSVContent(fileContent);
    } else {
      validation = validateICSContent(fileContent);
    }

    if (!validation.isValid) {
      return new Response(JSON.stringify({ 
        error: 'Security validation failed',
        details: validation.errors
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return validated and sanitized content
    return new Response(JSON.stringify({
      success: true,
      content: validation.sanitizedContent || fileContent,
      warnings: validation.warnings,
      metadata: {
        filename: body.filename,
        format: body.format,
        size: fileContent.length,
        processedAt: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });

  } catch (error) {
    console.error('Import validation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error during validation' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

function validateCSVContent(content: string): SecurityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Basic CSV structure validation
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      errors.push('CSV file appears to be empty');
      return { isValid: false, errors, warnings };
    }

    if (lines.length > MAX_CSV_ROWS) {
      errors.push(`CSV file has too many rows (${lines.length}). Maximum allowed: ${MAX_CSV_ROWS}`);
      return { isValid: false, errors, warnings };
    }

    // Check for required headers
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/['"]/g, ''));
    const requiredHeaders = ['title', 'due'];
    const hasRequired = requiredHeaders.some(req => 
      headers.some(header => header.includes(req))
    );

    if (!hasRequired) {
      errors.push('CSV must contain at least Title and Due Date columns');
      return { isValid: false, errors, warnings };
    }

    // Scan for suspicious patterns
    const suspiciousPatterns = [
      /<script[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /<iframe[\s\S]*?>/gi,
      /<object[\s\S]*?>/gi,
      /<embed[\s\S]*?>/gi
    ];

    let hasSuspiciousContent = false;
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        hasSuspiciousContent = true;
        break;
      }
    }

    if (hasSuspiciousContent) {
      errors.push('CSV contains potentially malicious content');
      return { isValid: false, errors, warnings };
    }

    // Validate data rows
    const dataRows = lines.slice(1);
    for (let i = 0; i < Math.min(dataRows.length, 100); i++) { // Sample first 100 rows
      const row = dataRows[i];
      const cells = row.split(',');
      
      // Check for extremely long cell content (potential attack)
      for (const cell of cells) {
        if (cell.length > 10000) {
          errors.push(`Row ${i + 2} contains suspiciously long content`);
          return { isValid: false, errors, warnings };
        }
      }
    }

    if (lines.length > 1000) {
      warnings.push(`Large CSV file with ${lines.length} rows may take longer to process`);
    }

    return { isValid: true, errors, warnings };

  } catch (error) {
    errors.push(`CSV parsing error: ${error.message}`);
    return { isValid: false, errors, warnings };
  }
}

function validateICSContent(content: string): SecurityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check for basic ICS structure
    if (!content.includes('BEGIN:VCALENDAR') || !content.includes('END:VCALENDAR')) {
      errors.push('Invalid ICS file structure - missing VCALENDAR block');
      return { isValid: false, errors, warnings };
    }

    // Count events
    const eventMatches = content.match(/BEGIN:VEVENT/g);
    const eventCount = eventMatches ? eventMatches.length : 0;

    if (eventCount === 0) {
      errors.push('ICS file contains no events');
      return { isValid: false, errors, warnings };
    }

    if (eventCount > MAX_ICS_EVENTS) {
      errors.push(`ICS file has too many events (${eventCount}). Maximum allowed: ${MAX_ICS_EVENTS}`);
      return { isValid: false, errors, warnings };
    }

    // Scan for suspicious patterns
    const suspiciousPatterns = [
      /<script[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /<iframe[\s\S]*?>/gi,
      /ATTACH;VALUE=URI:http[s]?:\/\/(?!.*\.(ics|pdf|doc|docx|txt)).*$/gmi // Suspicious attachments
    ];

    let hasSuspiciousContent = false;
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        hasSuspiciousContent = true;
        break;
      }
    }

    if (hasSuspiciousContent) {
      errors.push('ICS contains potentially malicious content');
      return { isValid: false, errors, warnings };
    }

    // Check for extremely long lines (potential buffer overflow)
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > 50000) {
        errors.push(`Line ${i + 1} is suspiciously long`);
        return { isValid: false, errors, warnings };
      }
    }

    if (eventCount > 1000) {
      warnings.push(`Large ICS file with ${eventCount} events may take longer to process`);
    }

    return { isValid: true, errors, warnings };

  } catch (error) {
    errors.push(`ICS parsing error: ${error.message}`);
    return { isValid: false, errors, warnings };
  }
}