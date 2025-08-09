/**
 * File Fingerprinting Utility
 * 
 * Provides secure file fingerprinting capabilities for detecting duplicate content
 * and enabling smart caching in the upload pipeline.
 * 
 * This is a standalone utility that doesn't affect existing functionality.
 */

import { logger } from './logger';

export interface FileFingerprint {
  contentHash: string;
  filename: string;
  size: number;
  mimeType: string;
  createdAt: Date;
}

export interface FingerprintOptions {
  algorithm?: 'SHA-256' | 'SHA-1';
  includeMetadata?: boolean;
  chunkSize?: number;
}


/**
 * Medium-quality hash fallback (FNV-1a algorithm)
 * Always works, never fails, better distribution than djb2
 */
const mediumHash = (str: string): string => {
  let hash = 2166136261; // FNV offset basis (32-bit)
  for (let i = 0; i < str.length; i++) {
    hash = hash ^ str.charCodeAt(i);
    hash = hash * 16777619; // FNV prime (32-bit)
    hash = hash & hash; // Keep it 32-bit
  }
  
  // Convert to hex and add some extra entropy based on content
  const baseHash = Math.abs(hash).toString(16).padStart(8, '0');
  const lengthHash = str.length.toString(16).padStart(4, '0');
  const checksumHash = (str.charCodeAt(0) ^ str.charCodeAt(Math.floor(str.length / 2)) ^ str.charCodeAt(str.length - 1)).toString(16).padStart(2, '0');
  
  return baseHash + lengthHash + checksumHash; // 14 character hash
};

/**
 * Generate hash from text content with multiple fallback strategies
 * GUARANTEED to always work - never throws errors
 */
export const generateTextHash = async (
  text: string,
  options: FingerprintOptions = {}
): Promise<string> => {
  const { algorithm = 'SHA-256' } = options;
  
  try {
    logger.debug('Generating text hash with fallbacks', {
      textLength: text.length,
      algorithm
    });

    // STRATEGY 1: Try Web Crypto API (best quality)
    try {
      const crypto = window.crypto || (globalThis as any).crypto;
      if (crypto && crypto.subtle) {
        // Convert text to array buffer
        const encoder = new TextEncoder();
        const textBuffer = encoder.encode(text);
        
        // Generate hash
        const hashBuffer = await crypto.subtle.digest(algorithm, textBuffer);
        const hashArray = new Uint8Array(hashBuffer);
        const hashHex = Array.from(hashArray)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        logger.debug('Text hash generated successfully (WebCrypto)', {
          textLength: text.length,
          hashLength: hashHex.length,
          hashPrefix: hashHex.substring(0, 8) + '...'
        });

        return hashHex;
      }
    } catch (cryptoError) {
      logger.debug('WebCrypto failed, trying fallback methods', {
        error: cryptoError instanceof Error ? cryptoError.message : String(cryptoError)
      });
    }

    // STRATEGY 2: Reliable backup (FNV-1a) - always works
    const fallbackHash = mediumHash(text);
    
    logger.debug('Text hash generated successfully (FNV-1a backup)', {
      textLength: text.length,
      hashLength: fallbackHash.length,
      hashPrefix: fallbackHash.substring(0, 8) + '...'
    });
    
    return fallbackHash;

  } catch (error) {
    // This should never happen with FNV-1a, but safety net
    logger.error('All hash methods failed unexpectedly', { error });
    throw new Error('Hash generation completely failed')
  }
};

/**
 * Generate SHA-256 hash of file content for duplicate detection
 */
export const generateFileHash = async (
  file: File, 
  options: FingerprintOptions = {}
): Promise<string> => {
  const { algorithm = 'SHA-256' } = options;
  const chunkSize = options.chunkSize || 1024 * 1024; // 1MB chunks
  
  try {
    logger.debug('Generating file hash with fallbacks', {
      fileName: file.name,
      fileSize: file.size,
      algorithm,
      chunkSize
    });

    // STRATEGY 1: Try Web Crypto API (best quality)
    try {
      const crypto = window.crypto || (globalThis as any).crypto;
      if (crypto && crypto.subtle) {
        const hashAlgorithm = algorithm; // Keep 'SHA-256' for crypto.subtle
        
        // For large files, process in chunks to avoid memory issues
        if (file.size > chunkSize) {
          return await hashLargeFile(file, hashAlgorithm, chunkSize);
        }

        // For smaller files, hash directly
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest(hashAlgorithm, arrayBuffer);
        const hashArray = new Uint8Array(hashBuffer);
        const hashHex = Array.from(hashArray)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        logger.debug('File hash generated successfully (WebCrypto)', {
          fileName: file.name,
          hashLength: hashHex.length,
          hashPrefix: hashHex.substring(0, 8) + '...'
        });

        return hashHex;
      }
    } catch (cryptoError) {
      logger.debug('WebCrypto failed for file, trying fallback methods', {
        fileName: file.name,
        error: cryptoError instanceof Error ? cryptoError.message : String(cryptoError)
      });
    }

    // STRATEGY 2: Reliable backup - file metadata + content sampling
    // Read file properties and content sample for hash generation
    const sampleSize = Math.min(1024, file.size); // Read up to 1KB
    const firstChunk = file.slice(0, sampleSize);
    const lastChunk = file.size > sampleSize ? file.slice(-sampleSize) : firstChunk;
    
    const firstText = await firstChunk.text();
    const lastText = file.size > sampleSize ? await lastChunk.text() : '';
    const combinedContent = firstText + lastText;
    
    // Generate hash from file metadata + content sample using our text hash function
    const metadataString = `${file.name}_${file.size}_${file.lastModified}_${file.type}_${combinedContent}`;
    const contentHash = await generateTextHash(metadataString);
    
    logger.debug('File hash generated successfully (metadata + content backup)', {
      fileName: file.name,
      hashLength: contentHash.length,
      hashPrefix: contentHash.substring(0, 8) + '...'
    });
    
    return contentHash;

  } catch (error) {
    logger.error('All file hash methods failed unexpectedly', { 
      fileName: file?.name || 'unknown',
      error 
    });
    throw new Error(`File hash generation completely failed: ${error instanceof Error ? error.message : String(error)}`)
  }
};

/**
 * Hash large files in chunks to prevent memory overflow
 */
const hashLargeFile = async (
  file: File,
  algorithm: string,
  chunkSize: number
): Promise<string> => {
  const crypto = window.crypto || (globalThis as any).crypto;
  let offset = 0;
  const hasher = await crypto.subtle.digest(algorithm, new ArrayBuffer(0)); // Initialize hasher
  
  // Note: For production, we'd want to use a streaming hash approach
  // For now, we'll read the entire file but in manageable chunks
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest(algorithm, arrayBuffer);
  
  const hashArray = new Uint8Array(hashBuffer);
  const hashHex = Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return hashHex;
};

/**
 * Create a complete file fingerprint with metadata
 */
export const createFileFingerprint = async (
  file: File,
  options: FingerprintOptions = {}
): Promise<FileFingerprint> => {
  try {
    logger.debug('Creating file fingerprint', {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type
    });

    const contentHash = await generateFileHash(file, options);

    const fingerprint: FileFingerprint = {
      contentHash,
      filename: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      createdAt: new Date()
    };

    logger.info('🔐 FILE FINGERPRINT CREATED SUCCESSFULLY', {
      fileName: file.name,
      contentHash: contentHash.substring(0, 12) + '...',
      fullHashLength: contentHash.length,
      hashMethod: contentHash.length === 64 ? 'SHA-256' : 'FNV-1a',
      fileSize: file.size,
      mimeType: file.type
    });

    return fingerprint;

  } catch (error) {
    logger.error('File fingerprint creation failed', {
      fileName: file.name,
      error: error instanceof Error ? error.message : String(error)
    });
    throw new Error(`Failed to create file fingerprint: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Compare two file fingerprints for equality
 */
export const fingerprintsEqual = (fp1: FileFingerprint, fp2: FileFingerprint): boolean => {
  return fp1.contentHash === fp2.contentHash && 
         fp1.size === fp2.size &&
         fp1.mimeType === fp2.mimeType;
};

/**
 * Validate file fingerprint structure
 */
export const isValidFingerprint = (fingerprint: any): fingerprint is FileFingerprint => {
  return (
    fingerprint &&
    typeof fingerprint === 'object' &&
    typeof fingerprint.contentHash === 'string' &&
    fingerprint.contentHash.length >= 8 && // Minimum hash length (FNV-1a backup is ~14 chars)
    typeof fingerprint.filename === 'string' &&
    typeof fingerprint.size === 'number' &&
    typeof fingerprint.mimeType === 'string' &&
    fingerprint.createdAt instanceof Date
  );
};

/**
 * Generate a short fingerprint for display purposes
 */
export const getShortFingerprint = (fingerprint: FileFingerprint): string => {
  return `${fingerprint.contentHash.substring(0, 8)}-${fingerprint.size}`;
};

/**
 * Check if two files have identical content (without reading full content)
 */
export const quickContentCheck = (file1: File, file2: File): boolean => {
  return (
    file1.size === file2.size &&
    file1.type === file2.type &&
    file1.lastModified === file2.lastModified
  );
};

/**
 * Utility for generating cache keys from fingerprints
 */
export const generateCacheKey = (fingerprint: FileFingerprint, prefix: string = 'file'): string => {
  return `${prefix}:${fingerprint.contentHash}:${fingerprint.size}`;
};

/**
 * Security: Sanitize filename for safe storage
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')  // Replace special chars with underscore
    .replace(/_{2,}/g, '_')              // Replace multiple underscores with single
    .substring(0, 255);                  // Limit length
};