import * as pdfjs from 'pdfjs-dist';

// Correctly configured worker setup - this is critical for PDF.js to work
const pdfjsVersion = pdfjs.version || '2.16.105'; // Fallback to a known version if undefined

// Define both CDN and local worker paths
const CDN_WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;
const LOCAL_WORKER_URL = `${window.location.origin}/pdf.worker.min.js`;

// Try to set worker path - with improved error handling
try {
  console.log("Configuring PDF.js worker...");
  
  // First try using from CDN (most reliable)
  pdfjs.GlobalWorkerOptions.workerSrc = CDN_WORKER_URL;
  
  // Log the configuration for debugging
  console.log(`PDF.js version: ${pdfjsVersion}`);
  console.log(`Worker URL set to: ${pdfjs.GlobalWorkerOptions.workerSrc}`);
} catch (error) {
  console.error("Error configuring PDF.js worker:", error);
}

/**
 * Extract text content from a PDF file with improved error handling and logging
 * @param {File|Object} file - PDF file object or syllabus object with data property
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromPDF(file) {
  console.log("Starting PDF text extraction...");
  
  try {
    let pdfData;
    
    // If file is a syllabus object with data property, use that
    if (file.data && typeof file.data === 'string') {
      console.log("Processing PDF from data URL...");
      
      try {
        // For base64 data URLs from your database
        if (file.data.includes('base64')) {
          const base64Data = file.data.split(',')[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          pdfData = bytes.buffer;
        } else {
          throw new Error("Data URL format not recognized");
        }
      } catch (error) {
        console.error("Error processing data URL:", error);
        throw new Error(`Error processing data URL: ${error.message}`);
      }
    } else {
      // For direct file upload
      console.log("Processing PDF from file upload...");
      try {
        pdfData = await file.arrayBuffer();
      } catch (error) {
        console.error("Error reading file:", error);
        throw new Error(`Error reading file: ${error.message}`);
      }
    }
    
    console.log("Loading PDF document...");
    
    // Enhanced PDF loading with more options for robustness
    const loadingTask = pdfjs.getDocument({
      data: pdfData,
      cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/cmaps/`,
      cMapPacked: true,
      disableFontFace: false,
      standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/standard_fonts/`,
      useSystemFonts: true,
      useWorkerFetch: true,
      isEvalSupported: true,
      verbosity: 1  // Increase verbosity for debugging
    });
    
    // Add document loading progress callback
    loadingTask.onProgress = (progressData) => {
      console.log(`Loading PDF: ${progressData.loaded} / ${progressData.total || 'unknown'} bytes`);
    };
    
    const pdfDoc = await loadingTask.promise;
    console.log(`PDF loaded successfully. Pages: ${pdfDoc.numPages}`);
    
    // Extract text with robust error handling
    const extractedText = await extractText(pdfDoc);
    
    if (!extractedText || extractedText.trim() === '') {
      console.error("No text was extracted from the PDF");
      throw new Error("No text content found in PDF");
    }
    
    console.log(`Successfully extracted ${extractedText.length} characters from PDF`);
    return extractedText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    // Return a more detailed error message
    return `Error extracting text from PDF: ${error.message || 'Unknown error'}`;
  }
}

/**
 * Helper function to extract text from PDF document with enhanced robustness
 * @param {PDFDocumentProxy} pdfDoc - PDF document
 * @returns {Promise<string>} - Extracted text
 */
async function extractText(pdfDoc) {
  let fullText = '';
  let hasContent = false;
  
  console.log(`Extracting text from ${pdfDoc.numPages} pages...`);
  
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    try {
      console.log(`Processing page ${i}...`);
      const page = await pdfDoc.getPage(i);
      
      // Try multiple text extraction strategies
      let textContent;
      try {
        textContent = await page.getTextContent({
          normalizeWhitespace: true,
          disableCombineTextItems: false
        });
      } catch (err) {
        console.warn(`Standard text extraction failed for page ${i}, trying alternate method:`, err);
        textContent = await page.getTextContent({
          normalizeWhitespace: false,
          disableCombineTextItems: true
        });
      }
      
      if (!textContent || !textContent.items || textContent.items.length === 0) {
        console.warn(`No text content found on page ${i}. This might be a scanned/image-based page.`);
        continue;
      }
      
      // Process text items and maintain some formatting
      let lastY = null;
      let pageText = '';
      
      for (const item of textContent.items) {
        if (!item.str || item.str.trim() === '') continue;
        
        // Add newlines when y-position changes significantly (paragraph breaks)
        if (lastY !== null && Math.abs(lastY - item.transform[5]) > 5) {
          pageText += '\n';
        }
        
        pageText += item.str + ' ';
        lastY = item.transform[5];
        hasContent = true;
      }
      
      fullText += pageText.trim() + '\n\n';
      console.log(`Page ${i} processed. Text length: ${pageText.length}`);
    } catch (error) {
      console.error(`Error extracting text from page ${i}:`, error);
    }
  }
  
  if (!hasContent) {
    console.error("No extractable text found in any page of the PDF");
    throw new Error('No text could be extracted from this PDF. It might be a scanned document or image-based PDF.');
  }
  
  return fullText;
}