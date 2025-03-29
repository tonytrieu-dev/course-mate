import * as pdfjs from 'pdfjs-dist';

// Set worker path - make sure to add this to your public folder or use CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/**
 * Extract text content from a PDF file
 * @param {File|Object} file - PDF file object or syllabus object with data property
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromPDF(file) {
  try {
    // If file is a syllabus object with data property, use that
    if (file.data && typeof file.data === 'string') {
      // For base64 data URLs from your database
      const base64Data = file.data.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const pdfData = bytes.buffer;
      
      // Get PDF document from data
      const pdfDoc = await pdfjs.getDocument({data: pdfData}).promise;
      return extractText(pdfDoc);
    }
    
    // For direct file upload
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjs.getDocument({data: arrayBuffer}).promise;
    return extractText(pdfDoc);
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return 'Error extracting text from PDF';
  }
}

/**
 * Helper function to extract text from PDF document
 * @param {PDFDocumentProxy} pdfDoc - PDF document
 * @returns {Promise<string>} - Extracted text
 */
async function extractText(pdfDoc) {
  let fullText = '';
  
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}