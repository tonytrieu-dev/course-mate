/**
 * Extract basic information from syllabus text using pattern matching
 * @param {string} syllabusText - Extracted text from syllabus
 * @returns {Object} - Structured data extracted from syllabus
 */
export function extractBasicInfo(syllabusText) {
    const result = {
      instructorInfo: [],
      taInfo: [],
      assessments: [],
      assignments: []
    };
    
    // Extract instructor information
    const instructorPattern = /instructor(?:\(s\))?:?(.*?)(?:office hours|teaching assistant|ta|lab|lecture)/is;
    const instructorMatch = syllabusText.match(instructorPattern);
    if (instructorMatch) {
      const instructorText = instructorMatch[1].trim();
      const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
      const emails = instructorText.match(emailPattern) || [];
      
      result.instructorInfo = emails.map(email => ({
        email,
        name: extractNameFromContext(instructorText, email),
        officeHours: extractOfficeHours(syllabusText, 'instructor')
      }));
    }
    
    // Extract TA information
    const taPattern = /(?:teaching assistant|ta)(?:\(s\))?:?(.*?)(?:\n\n|\n[A-Z]|textbook|course)/is;
    const taMatch = syllabusText.match(taPattern);
    if (taMatch) {
      const taText = taMatch[1].trim();
      const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
      const emails = taText.match(emailPattern) || [];
      
      result.taInfo = emails.map(email => ({
        email,
        name: extractNameFromContext(taText, email),
        officeHours: extractOfficeHours(syllabusText, 'ta')
      }));
    }
    
    // Extract midterms and exams
    const midtermPattern = /(?:midterm|exam|quiz|test).*?(\d{1,2}\/\d{1,2}|\d{1,2}\.\d{1,2}|\w+ \d{1,2})/gi;
    let midtermMatch;
    while ((midtermMatch = midtermPattern.exec(syllabusText)) !== null) {
      const fullText = midtermMatch[0];
      const date = midtermMatch[1];
      const type = fullText.match(/midterm|exam|quiz|test/i)[0].toLowerCase();
      
      result.assessments.push({
        type: type === 'test' ? 'exam' : type,
        date,
        rawText: fullText
      });
    }
    
    // Extract final exam
    const finalPattern = /final\s+exam.*?(\d{1,2}\/\d{1,2}|\d{1,2}\.\d{1,2}|\w+ \d{1,2})/i;
    const finalMatch = syllabusText.match(finalPattern);
    if (finalMatch) {
      result.assessments.push({
        type: 'final',
        date: finalMatch[1],
        rawText: finalMatch[0]
      });
    }
    
    // Find assignments
    const assignmentTypes = ['homework', 'lab', 'assignment', 'project'];
    
    assignmentTypes.forEach(type => {
      const assignmentRegex = new RegExp(`${type}\\s*(\\d+)`, 'gi');
      let match;
      
      while ((match = assignmentRegex.exec(syllabusText)) !== null) {
        const assignmentNumber = match[1];
        
        // Check if this assignment is already recorded
        const exists = result.assignments.some(a => 
          a.type === type && a.number === assignmentNumber
        );
        
        if (!exists) {
          result.assignments.push({
            type,
            number: assignmentNumber,
            rawText: match[0],
            dueDate: findDueDate(syllabusText, type, assignmentNumber)
          });
        }
      }
    });
    
    // Try to extract weekly schedule
    const weekPattern = /week\s+(\d+).*?(homework|lab|assignment|midterm|exam|quiz|final)/gi;
    let weekMatch;
    const weeklyItems = [];
    
    while ((weekMatch = weekPattern.exec(syllabusText)) !== null) {
      const weekNum = parseInt(weekMatch[1]);
      const itemType = weekMatch[2].toLowerCase();
      
      weeklyItems.push({
        weekNum,
        itemType
      });
    }
    
    // Group by week for better organization
    if (weeklyItems.length > 0) {
      result.weeklySchedule = Object.values(
        weeklyItems.reduce((acc, item) => {
          if (!acc[item.weekNum]) {
            acc[item.weekNum] = { 
              weekNum: item.weekNum, 
              items: [] 
            };
          }
          acc[item.weekNum].items.push(item.itemType);
          return acc;
        }, {})
      ).sort((a, b) => a.weekNum - b.weekNum);
    }
    
    return result;
  }
  
  /**
   * Extract a name from context near an email
   * @param {string} text - Text containing name and email
   * @param {string} email - Email to find name for
   * @returns {string} - Extracted name or default
   */
  function extractNameFromContext(text, email) {
    // Try to extract name based on common patterns near email
    const prefix = email.split('@')[0];
    const namePattern = new RegExp(`([A-Z][a-z]+ ([A-Z]\\.? )?[A-Z][a-z]+)(?=.*${prefix})`, 'i');
    const nameMatch = text.match(namePattern);
    return nameMatch ? nameMatch[1] : 'Unknown';
  }
  
  /**
   * Extract office hours for instructor or TA
   * @param {string} text - Full syllabus text
   * @param {string} role - 'instructor' or 'ta'
   * @returns {string} - Extracted office hours or default
   */
  function extractOfficeHours(text, role) {
    const pattern = role === 'instructor' 
      ? /office hours:?\s*([^.]*?(?:\d{1,2}:\d{2}[^.]*?))/i
      : /(?:ta|teaching assistant)[^.]*?office hours:?\s*([^.]*?(?:\d{1,2}:\d{2}[^.]*?))/i;
    
    const match = text.match(pattern);
    return match ? match[1].trim() : 'Check syllabus for details';
  }
  
  /**
   * Find due date for an assignment
   * @param {string} text - Syllabus text
   * @param {string} type - Assignment type
   * @param {string} number - Assignment number
   * @returns {string|null} - Due date if found
   */
  function findDueDate(text, type, number) {
    const patterns = [
      new RegExp(`${type}\\s*${number}[^.]*?due[^.]*?(\\d{1,2}/\\d{1,2}|\\w+ \\d{1,2})`, 'i'),
      new RegExp(`week\\s*\\d+[^.]*?${type}\\s*${number}[^.]*?(\\d{1,2}/\\d{1,2}|\\w+ \\d{1,2})`, 'i'),
      new RegExp(`${type}\\s*${number}[^.]*?(\\d{1,2}/\\d{1,2}|\\w+ \\d{1,2})`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  }