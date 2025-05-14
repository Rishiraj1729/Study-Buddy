import { createWorker, PSM } from 'tesseract.js';

/**
 * Performs OCR on an image to extract text
 * @param imageData Base64 encoded image or URL
 * @returns Extracted text from the image
 */
export async function performOCR(imageData: string): Promise<{ text: string; success: boolean; error?: string }> {
  try {
    // Create a worker and load English language data
    const worker = await createWorker('eng');
    
    // Recognize text in the image
    const result = await worker.recognize(imageData);
    
    // Terminate the worker to free up resources
    await worker.terminate();
    
    return {
      text: result.data.text,
      success: true
    };
  } catch (error) {
    console.error('OCR processing error:', error);
    return { 
      text: '', 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown OCR error'
    };
  }
}

/**
 * Performs OCR specifically for handwritten text
 * For enhanced handwriting recognition, we configure Tesseract with specific parameters
 */
export async function performHandwritingOCR(
  imageData: string
): Promise<{ text: string; success: boolean; error?: string }> {
  try {
    const worker = await createWorker('eng');
    
    // Configure Tesseract for better handwriting recognition
    await worker.setParameters({
      tessedit_ocr_engine_mode: '2', // Use LSTM neural network mode
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK, // Assume a single uniform block of text
      preserve_interword_spaces: '1', // Preserve spaces between words
    });
    
    // Recognize text in the image
    const result = await worker.recognize(imageData);
    
    // Terminate worker
    await worker.terminate();
    
    // If the OCR result is too poor, we can fall back to using Gemini
    // for image analysis (handled in the upload API)
    return {
      text: result.data.text,
      success: true
    };
  } catch (error) {
    console.error('Handwriting OCR processing error:', error);
    return { 
      text: '', 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown handwriting OCR error'
    };
  }
} 