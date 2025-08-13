import type { ClassWithRelations } from '../types/database';
import { logger } from './logger';

export interface MentionMatch {
  mention: string;        // Original @mention text (e.g., "@GCA")
  className: string;      // Extracted class name (e.g., "GCA")
  startIndex: number;     // Position in text
  endIndex: number;       // End position in text
  matchedClass?: ClassWithRelations; // Resolved class object
  confidence: number;     // Match confidence (0-1)
}

export interface MentionParseResult {
  mentions: MentionMatch[];
  hasValidMentions: boolean;
  cleanText: string;      // Text with @mentions removed or replaced
}

/**
 * Parse text to find @mentions and resolve them to classes
 */
export class ChatbotMentionParser {
  private classes: ClassWithRelations[];
  
  constructor(classes: ClassWithRelations[]) {
    this.classes = classes;
  }

  /**
   * Parse text for @mentions and return structured results
   */
  public parseText(text: string): MentionParseResult {
    // Defensive check: ensure we have classes loaded
    if (!this.classes || this.classes.length === 0) {
      logger.warn('No classes available for mention parsing', {
        classesCount: this.classes?.length || 0,
        originalText: text
      });
      
      // Return text as-is if no classes are loaded
      return {
        mentions: [],
        hasValidMentions: false,
        cleanText: text.trim()
      };
    }

    const mentions = this.extractMentions(text);
    const resolvedMentions = mentions.map(mention => this.resolveClassMention(mention));
    
    // Filter to only include mentions with matched classes
    const validMentions = resolvedMentions.filter(m => m.matchedClass && m.confidence > 0.3);
    
    // Create clean text by removing @mentions but keeping the rest of the question
    let cleanText = text;
    
    // Sort mentions by startIndex in descending order to avoid index shifting issues
    const sortedMentions = [...validMentions].sort((a, b) => b.startIndex - a.startIndex);
    
    for (const mention of sortedMentions) {
      // Validate indices before string manipulation
      if (mention.startIndex >= 0 && 
          mention.endIndex <= cleanText.length && 
          mention.startIndex < mention.endIndex) {
        
        const before = cleanText.substring(0, mention.startIndex);
        const after = cleanText.substring(mention.endIndex);
        cleanText = before + after;
        
        logger.debug('Removed mention from text', {
          mention: mention.mention,
          startIndex: mention.startIndex,
          endIndex: mention.endIndex,
          before: before.slice(-10),
          after: after.slice(0, 10),
          resultLength: cleanText.length
        });
      } else {
        logger.warn('Invalid mention indices, skipping removal', {
          mention: mention.mention,
          startIndex: mention.startIndex,
          endIndex: mention.endIndex,
          textLength: cleanText.length
        });
      }
    }
    
    // Clean up extra whitespace
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    // Final validation: ensure we didn't accidentally remove the entire question
    if (cleanText.length === 0 && text.trim().length > 0) {
      logger.error('Clean text is empty after mention removal, falling back to original', {
        originalText: text,
        mentionsFound: mentions.length,
        validMentions: validMentions.length
      });
      
      // Fallback: return original text without the @mentions using simple regex
      cleanText = text.replace(/@[A-Za-z0-9_-]+(?=\s|$|[.!?,:;])/g, '').replace(/\s+/g, ' ').trim();
    }

    logger.debug('Mention parsing result', {
      originalText: text,
      mentionsFound: mentions.length,
      validMentions: validMentions.length,
      cleanText,
      classesAvailable: this.classes.length
    });

    return {
      mentions: validMentions,
      hasValidMentions: validMentions.length > 0,
      cleanText: cleanText || text.trim() // Final fallback to ensure we never return empty text
    };
  }

  /**
   * Extract @mention patterns from text
   */
  private extractMentions(text: string): MentionMatch[] {
    // Enhanced regex that handles course codes and class names:
    // @EE -> matches "EE"
    // @EE123 -> matches "EE123" 
    // @EE 123 -> matches "EE 123"
    // @CS 101 -> matches "CS 101"
    const mentionRegex = /@([A-Za-z]+\s*\d+|[A-Za-z0-9_-]+)(?=\s|$|[.!?,:;])/g;
    const mentions: MentionMatch[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const fullMatch = match[0];
      const className = match[1].trim();
      
      // Additional validation: class names should be reasonable length
      if (className.length <= 50) { // Reasonable class name limit
        mentions.push({
          mention: fullMatch,
          className: className,
          startIndex: match.index,
          endIndex: match.index + fullMatch.length,
          confidence: 0
        });
        
        logger.debug('Extracted mention', {
          fullMatch,
          className,
          startIndex: match.index,
          endIndex: match.index + fullMatch.length,
          textLength: text.length
        });
      } else {
        logger.warn('Skipping overly long mention', {
          mention: fullMatch,
          className,
          length: className.length
        });
      }
    }

    return mentions;
  }

  /**
   * Resolve a @mention to an actual class using fuzzy matching
   */
  private resolveClassMention(mention: MentionMatch): MentionMatch {
    const searchTerm = mention.className.toLowerCase();
    let bestMatch: ClassWithRelations | undefined;
    let bestScore = 0;

    for (const classObj of this.classes) {
      const score = this.calculateMatchScore(searchTerm, classObj);
      if (score > bestScore && score > 0.3) { // Minimum confidence threshold
        bestScore = score;
        bestMatch = classObj;
      }
    }

    return {
      ...mention,
      matchedClass: bestMatch,
      confidence: bestScore
    };
  }

  /**
   * Calculate match score between search term and class
   */
  private calculateMatchScore(searchTerm: string, classObj: ClassWithRelations): number {
    const className = classObj.name.toLowerCase();
    
    // Exact match gets highest score
    if (className === searchTerm) {
      return 1.0;
    }

    // Check if search term is exact substring
    if (className.includes(searchTerm)) {
      return 0.9;
    }

    // Check if class name starts with search term
    if (className.startsWith(searchTerm)) {
      return 0.8;
    }

    // Check for acronym match (first letters of words)
    const acronym = this.extractAcronym(className);
    if (acronym === searchTerm) {
      return 0.9;
    }

    // Check for partial acronym match
    if (acronym.includes(searchTerm)) {
      return 0.7;
    }

    // Check for word boundary matches
    const words = className.split(/\s+/);
    const matchingWords = words.filter(word => 
      word.toLowerCase().includes(searchTerm) || 
      searchTerm.includes(word.toLowerCase())
    );
    
    if (matchingWords.length > 0) {
      return 0.6 * (matchingWords.length / words.length);
    }

    // Fuzzy string similarity for typos
    const similarity = this.calculateStringSimilarity(searchTerm, className);
    if (similarity > 0.7) {
      return similarity * 0.5; // Reduce confidence for fuzzy matches
    }

    return 0;
  }

  /**
   * Extract acronym from class name (first letter of each word)
   */
  private extractAcronym(text: string): string {
    return text
      .split(/\s+/)
      .map(word => word.charAt(0))
      .join('')
      .toLowerCase();
  }

  /**
   * Calculate string similarity using simple algorithm
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);
    
    if (maxLen === 0) return 1;
    
    let matches = 0;
    const minLen = Math.min(len1, len2);
    
    for (let i = 0; i < minLen; i++) {
      if (str1[i] === str2[i]) {
        matches++;
      }
    }
    
    // Factor in length difference
    const lengthPenalty = Math.abs(len1 - len2) / maxLen;
    const similarity = matches / maxLen;
    
    return Math.max(0, similarity - lengthPenalty * 0.5);
  }

  /**
   * Generate autocomplete suggestions for partial @mention
   */
  public getAutocompleteSuggestions(partialMention: string, limit: number = 5): ClassWithRelations[] {
    if (!partialMention || partialMention.length < 1) {
      return this.classes.slice(0, limit);
    }

    const searchTerm = partialMention.toLowerCase();
    const scoredClasses = this.classes
      .map(classObj => ({
        class: classObj,
        score: this.calculateMatchScore(searchTerm, classObj)
      }))
      .filter(item => item.score > 0.2) // Lower threshold for suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scoredClasses.map(item => item.class);
  }

  /**
   * Update the classes list (useful when classes change)
   */
  public updateClasses(classes: ClassWithRelations[]): void {
    this.classes = classes;
  }
}

/**
 * Utility functions for external use
 */
export const mentionUtils = {
  /**
   * Check if text contains any @mentions
   */
  hasAtMentions(text: string): boolean {
    return /@([A-Za-z]+\s+\d+|[A-Za-z0-9_-]+)/.test(text);
  },

  /**
   * Extract all @mention patterns from text (without resolution)
   */
  extractMentionPatterns(text: string): string[] {
    const matches = text.match(/@([A-Za-z]+\s+\d+|[A-Za-z0-9_-]+)(?=\s|$|[.!?,:;])/g);
    return matches || [];
  },

  /**
   * Remove all @mentions from text
   */
  stripMentions(text: string): string {
    return text.replace(/@([A-Za-z]+\s+\d+|[A-Za-z0-9_-]+)(?=\s|$|[.!?,:;])/g, '').replace(/\s+/g, ' ').trim();
  },

  /**
   * Replace @mentions with placeholder text
   */
  replaceMentions(text: string, replacement: string = '[CLASS]'): string {
    return text.replace(/@([A-Za-z]+\s+\d+|[A-Za-z0-9_-]+)(?=\s|$|[.!?,:;])/g, replacement);
  }
};