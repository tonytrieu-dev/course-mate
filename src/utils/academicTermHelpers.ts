// Academic term utilities for both semester and quarter systems

export type AcademicSystem = 'semester' | 'quarter';

export type SemesterTerm = 'Spring' | 'Summer' | 'Fall' | 'Winter';
export type QuarterTerm = 'Fall Quarter' | 'Winter Quarter' | 'Spring Quarter' | 'Summer Quarter';
export type AcademicTerm = SemesterTerm | QuarterTerm;

export interface AcademicTermInfo {
  term: AcademicTerm;
  startMonth: number; // 0-11 (January = 0)
  endMonth: number;   // 0-11
  isMainTerm: boolean; // Primary terms vs shorter/optional terms
}

export interface AcademicYearInfo {
  academicYear: number; // The year the academic year starts (e.g., 2024 for 2024-2025)
  terms: AcademicTermInfo[];
}

// Academic term configurations
export const SEMESTER_TERMS: AcademicTermInfo[] = [
  { term: 'Spring', startMonth: 0, endMonth: 4, isMainTerm: true },    // Jan-May
  { term: 'Summer', startMonth: 5, endMonth: 7, isMainTerm: false },   // Jun-Aug  
  { term: 'Fall', startMonth: 8, endMonth: 11, isMainTerm: true },     // Sep-Dec
  { term: 'Winter', startMonth: 11, endMonth: 0, isMainTerm: false }   // Dec-Jan (intersession)
];

export const QUARTER_TERMS: AcademicTermInfo[] = [
  { term: 'Fall Quarter', startMonth: 8, endMonth: 11, isMainTerm: true },     // Sep-Dec
  { term: 'Winter Quarter', startMonth: 0, endMonth: 2, isMainTerm: true },    // Jan-Mar
  { term: 'Spring Quarter', startMonth: 3, endMonth: 5, isMainTerm: true },    // Apr-Jun
  { term: 'Summer Quarter', startMonth: 6, endMonth: 8, isMainTerm: false }    // Jul-Sep
];

/**
 * Get current academic term based on the system and current date
 */
export const getCurrentAcademicTerm = (
  academicSystem: AcademicSystem,
  date: Date = new Date()
): AcademicTerm => {
  const month = date.getMonth();
  const terms = academicSystem === 'semester' ? SEMESTER_TERMS : QUARTER_TERMS;
  
  for (const termInfo of terms) {
    if (isDateInTerm(date, termInfo)) {
      return termInfo.term;
    }
  }
  
  // Fallback to most appropriate term
  return academicSystem === 'semester' ? 'Fall' : 'Fall Quarter';
};

/**
 * Check if a date falls within an academic term
 */
export const isDateInTerm = (date: Date, termInfo: AcademicTermInfo): boolean => {
  const month = date.getMonth();
  
  // Handle terms that cross year boundary (like Winter semester: Dec-Jan)
  if (termInfo.startMonth > termInfo.endMonth) {
    return month >= termInfo.startMonth || month <= termInfo.endMonth;
  }
  
  return month >= termInfo.startMonth && month <= termInfo.endMonth;
};

/**
 * Get all available terms for an academic system
 */
export const getAvailableTerms = (academicSystem: AcademicSystem): AcademicTerm[] => {
  const terms = academicSystem === 'semester' ? SEMESTER_TERMS : QUARTER_TERMS;
  return terms.map(t => t.term);
};

/**
 * Get term info for a specific term
 */
export const getTermInfo = (
  term: AcademicTerm,
  academicSystem?: AcademicSystem
): AcademicTermInfo | null => {
  // Auto-detect system if not provided
  const system = academicSystem || (term.includes('Quarter') ? 'quarter' : 'semester');
  const terms = system === 'semester' ? SEMESTER_TERMS : QUARTER_TERMS;
  
  return terms.find(t => t.term === term) || null;
};

/**
 * Get date range for a specific term and year
 */
export const getTermDateRange = (
  term: AcademicTerm,
  year: number,
  academicSystem?: AcademicSystem
): { startDate: Date; endDate: Date } => {
  const termInfo = getTermInfo(term, academicSystem);
  
  if (!termInfo) {
    throw new Error(`Invalid term: ${term}`);
  }
  
  let startYear = year;
  let endYear = year;
  
  // Handle terms that cross year boundary
  if (termInfo.startMonth > termInfo.endMonth) {
    // Term starts in previous year (like Winter semester: Dec 2023 - Jan 2024)
    if (termInfo.term === 'Winter' && !term.includes('Quarter')) {
      startYear = year - 1;
    }
    // Term ends in next year  
    else {
      endYear = year + 1;
    }
  }
  
  const startDate = new Date(startYear, termInfo.startMonth, 1);
  const endDate = new Date(endYear, termInfo.endMonth + 1, 0); // Last day of month
  
  return { startDate, endDate };
};

/**
 * Convert between semester and quarter terms (approximate mapping)
 */
export const convertTermBetweenSystems = (
  term: AcademicTerm,
  targetSystem: AcademicSystem
): AcademicTerm => {
  // If already in target system, return as-is
  const currentSystem = term.includes('Quarter') ? 'quarter' : 'semester';
  if (currentSystem === targetSystem) {
    return term;
  }
  
  // Semester to Quarter mapping
  if (targetSystem === 'quarter') {
    switch (term) {
      case 'Fall': return 'Fall Quarter';
      case 'Winter': return 'Winter Quarter';
      case 'Spring': return 'Spring Quarter';
      case 'Summer': return 'Summer Quarter';
      default: return 'Fall Quarter';
    }
  }
  
  // Quarter to Semester mapping
  if (targetSystem === 'semester') {
    switch (term) {
      case 'Fall Quarter': return 'Fall';
      case 'Winter Quarter': return 'Winter';
      case 'Spring Quarter': return 'Spring';
      case 'Summer Quarter': return 'Summer';
      default: return 'Fall';
    }
  }
  
  return term;
};

/**
 * Get academic year for a given date
 * Academic year typically runs from Fall to Summer
 */
export const getAcademicYear = (date: Date = new Date()): number => {
  const month = date.getMonth();
  const year = date.getFullYear();
  
  // If it's Fall or later (Aug-Dec), academic year starts this year
  // If it's before Fall (Jan-Jul), academic year started last year
  return month >= 7 ? year : year - 1;
};

/**
 * Get all terms for a specific academic year
 */
export const getTermsForAcademicYear = (
  academicYear: number,
  academicSystem: AcademicSystem
): AcademicYearInfo => {
  const terms = academicSystem === 'semester' ? SEMESTER_TERMS : QUARTER_TERMS;
  
  return {
    academicYear,
    terms: terms.map(termInfo => ({ ...termInfo }))
  };
};

/**
 * Validate if a term is valid for the academic system
 */
export const isValidTermForSystem = (
  term: AcademicTerm,
  academicSystem: AcademicSystem
): boolean => {
  const availableTerms = getAvailableTerms(academicSystem);
  return availableTerms.includes(term);
};

/**
 * Get the next term in sequence
 */
export const getNextTerm = (
  currentTerm: AcademicTerm,
  academicSystem?: AcademicSystem
): AcademicTerm => {
  const system = academicSystem || (currentTerm.includes('Quarter') ? 'quarter' : 'semester');
  const terms = system === 'semester' ? SEMESTER_TERMS : QUARTER_TERMS;
  
  const currentIndex = terms.findIndex(t => t.term === currentTerm);
  if (currentIndex === -1) return terms[0].term;
  
  const nextIndex = (currentIndex + 1) % terms.length;
  return terms[nextIndex].term;
};

/**
 * Get the previous term in sequence  
 */
export const getPreviousTerm = (
  currentTerm: AcademicTerm,
  academicSystem?: AcademicSystem
): AcademicTerm => {
  const system = academicSystem || (currentTerm.includes('Quarter') ? 'quarter' : 'semester');
  const terms = system === 'semester' ? SEMESTER_TERMS : QUARTER_TERMS;
  
  const currentIndex = terms.findIndex(t => t.term === currentTerm);
  if (currentIndex === -1) return terms[terms.length - 1].term;
  
  const prevIndex = currentIndex === 0 ? terms.length - 1 : currentIndex - 1;
  return terms[prevIndex].term;
};

/**
 * Format term display name
 */
export const formatTermDisplayName = (
  term: AcademicTerm,
  year?: number,
  includeYear = true
): string => {
  if (!includeYear || !year) {
    return term;
  }
  
  return `${term} ${year}`;
};

/**
 * Parse term from string (flexible parsing)
 */
export const parseTermFromString = (
  termString: string,
  defaultSystem: AcademicSystem = 'semester'
): AcademicTerm | null => {
  const normalized = termString.trim().toLowerCase();
  
  // Direct matches
  const allTerms = [...SEMESTER_TERMS, ...QUARTER_TERMS];
  for (const termInfo of allTerms) {
    if (termInfo.term.toLowerCase() === normalized) {
      return termInfo.term;
    }
  }
  
  // Partial matches
  if (normalized.includes('fall')) {
    return defaultSystem === 'quarter' ? 'Fall Quarter' : 'Fall';
  }
  if (normalized.includes('winter')) {
    return defaultSystem === 'quarter' ? 'Winter Quarter' : 'Winter';
  }
  if (normalized.includes('spring')) {
    return defaultSystem === 'quarter' ? 'Spring Quarter' : 'Spring';
  }
  if (normalized.includes('summer')) {
    return defaultSystem === 'quarter' ? 'Summer Quarter' : 'Summer';
  }
  
  return null;
};

/**
 * Get term order for sorting (0-based)
 */
export const getTermOrder = (term: AcademicTerm): number => {
  // Standard academic year order: Fall -> Winter -> Spring -> Summer
  const order: Record<AcademicTerm, number> = {
    'Fall': 0,
    'Fall Quarter': 0,
    'Winter': 1,
    'Winter Quarter': 1,
    'Spring': 2,
    'Spring Quarter': 2,
    'Summer': 3,
    'Summer Quarter': 3
  };
  
  return order[term] || 0;
};