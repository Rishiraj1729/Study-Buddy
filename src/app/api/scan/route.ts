import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Supported file types
const SUPPORTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/jpg'
];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file type
    if (!SUPPORTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF, DOC, DOCX, TXT, JPG, or PNG file.' },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString('base64');
    
    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
    // Create prompt based on file type
    let prompt = "Please analyze this document and provide a detailed summary of its contents. ";
    
    if (file.type.startsWith('image/')) {
      prompt += "For this image, please describe the visual content and any text that appears in it. ";
    } else if (file.type === 'application/pdf') {
      prompt += "For this PDF document, please extract and summarize the main content, including any headings, key points, and important information. ";
    } else if (file.type.includes('word')) {
      prompt += "For this Word document, please analyze the structure and content, highlighting main sections, key points, and important information. ";
    } else if (file.type === 'text/plain') {
      prompt += "For this text document, please provide a comprehensive summary of the content, highlighting main topics and key information. ";
    }
    
    prompt += "Format the response with clear sections and bullet points where appropriate.";
    
    // Generate content
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      }
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    return NextResponse.json({ 
      result: text,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });
  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json(
      { error: 'Failed to process document. Please try again.' },
      { status: 500 }
    );
  }
} 