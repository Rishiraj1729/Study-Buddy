import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY environment variable');
}

// Initialize the Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configure safety settings for the model
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Get the Gemini model
export function getGeminiModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    safetySettings,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
    },
  });
}

// Function to process text with Gemini
export async function generateWithGemini(
  prompt: string, 
  history: Array<{ role: string; content: string }> = []
): Promise<GeminiResult> {
  try {
    const model = getGeminiModel();
    
    // Map the history roles properly - convert 'assistant' to 'model' for Gemini
    const mappedHistory = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
    
    console.log('Mapped history for Gemini:', JSON.stringify(mappedHistory));
    
    const chat = model.startChat({
      history: mappedHistory,
    });
    
    const result = await chat.sendMessage(prompt);
    const response = result.response;
    const text = response.text();
    
    return { success: true, data: text };
  } catch (error) {
    console.error('Error generating content with Gemini:', error);
    return { 
      success: false, 
      data: '',
      error: error instanceof Error ? error.message : 'Unknown error with Gemini API' 
    };
  }
}

// Define interface for Gemini processing result
interface GeminiResult {
  success: boolean;
  data: string;
  error?: string;
}

/**
 * Process an image with Gemini
 * @param base64Image Base64 encoded image with data URL prefix
 * @param prompt The prompt to send to Gemini
 * @returns Processing result
 */
export async function processImageWithGemini(base64Image: string, prompt: string): Promise<GeminiResult> {
  try {
    console.log('Processing image with Gemini 1.5 Flash');
    
    // Initialize model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.2,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
      }
    });
    
    // Remove the data URL prefix if present
    const base64Data = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;
    
    // Get MIME type from the data URL
    let mimeType = 'image/jpeg';
    if (base64Image.includes('data:')) {
      const matches = base64Image.match(/data:([^;]+);/);
      if (matches && matches.length > 1) {
        mimeType = matches[1];
      }
    }
    
    console.log(`Using MIME type: ${mimeType} for image processing`);
    
    // Generate content with image
    const result = await model.generateContent([
      {
        text: prompt
      },
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    console.log(`Successfully processed image. Extracted ${text.length} characters`);
    
    return {
      success: true,
      data: text
    };
  } catch (error) {
    console.error('Gemini processing error:', error);
    return {
      success: false,
      data: '',
      error: `Gemini processing failed: ${(error as Error).message}`
    };
  }
}

/**
 * Process a document with Gemini
 * @param base64Data Base64 encoded document
 * @param mimeType The MIME type of the document
 * @param prompt The prompt to send to Gemini
 * @returns Processing result
 */
export async function processDocumentWithGemini(base64Data: string, mimeType: string, prompt: string): Promise<GeminiResult> {
  try {
    console.log(`Processing ${mimeType} document with Gemini 1.5 Flash`);
    
    // Initialize model with larger token limits for documents
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.2, // Lower temperature for more deterministic output
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192, // Maximum output size
      }
    });
    
    // We need to ensure the MIME type is correct for the model
    let actualMimeType = mimeType;
    
    // For PDFs, we need to ensure the MIME type is correct
    if (mimeType === 'application/pdf') {
      actualMimeType = 'application/pdf';
    }
    
    console.log(`Using MIME type: ${actualMimeType} for document processing`);
    
    // Generate content with document
    const result = await model.generateContent([
      {
        text: prompt
      },
      {
        inlineData: {
          data: base64Data,
          mimeType: actualMimeType
        }
      }
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    console.log(`Processed document successfully. Extracted ${text.length} characters`);
    
    return {
      success: true,
      data: text
    };
  } catch (error) {
    console.error('Gemini document processing error:', error);
    console.error('Error details:', error instanceof Error ? error.stack : 'No stack trace');
    
    return {
      success: false,
      data: '',
      error: `Gemini processing failed: ${(error as Error).message}`
    };
  }
} 