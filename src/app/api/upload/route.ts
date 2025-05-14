import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth.server';
import { connectToDatabase } from '@/lib/mongoose';
import Document from '@/lib/models/Document';
import { processImageWithGemini, processDocumentWithGemini } from '@/lib/gemini';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Maximum file size (10MB)
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);

// Supported file types and their MIME types
const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/jpg'
];

// Additional MIME types that might be reported by browsers
const ADDITIONAL_MIME_TYPES: Record<string, string> = {
  // PDF variants
  'application/x-pdf': 'application/pdf',
  'application/acrobat': 'application/pdf',
  'applications/vnd.pdf': 'application/pdf',
  'text/pdf': 'application/pdf',
  'text/x-pdf': 'application/pdf',
  
  // Word variants
  'application/vnd.ms-word': 'application/msword',
  'application/vnd.msword': 'application/msword',
  'application/doc': 'application/msword',
  'application/word': 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

// Map MIME types to document model fileType enum values
const fileTypeMap: Record<string, 'pdf' | 'text' | 'image' | 'handwritten'> = {
  'application/pdf': 'pdf',
  'application/msword': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'pdf',
  'text/plain': 'text',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/jpg': 'image'
};

// Add additional MIME types to the fileTypeMap
Object.entries(ADDITIONAL_MIME_TYPES).forEach(([mimetype, standardMime]) => {
  if (fileTypeMap[standardMime]) {
    fileTypeMap[mimetype] = fileTypeMap[standardMime];
  }
});

// Debug function
const debug = (message: string, data?: any) => {
  console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '');
};

// Get normalized MIME type
const getNormalizedMimeType = (mimeType: string): string => {
  return ADDITIONAL_MIME_TYPES[mimeType] || mimeType;
};

// Check if file extension matches the expected type
const getFileTypeFromName = (fileName: string): string | null => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (!extension) return null;
  
  if (extension === 'pdf') return 'application/pdf';
  if (extension === 'doc') return 'application/msword';
  if (extension === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (extension === 'txt') return 'text/plain';
  if (['jpg', 'jpeg'].includes(extension)) return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  
  return null;
};

/**
 * API route for handling file uploads
 * Supports multiple file types for processing
 */
export async function POST(req: NextRequest) {
  try {
    debug('Starting upload process');
    
    // Check authentication
    const user = await getSession();
    debug('User session', user);

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      );
    }

    // Get form data from request
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string || 'Untitled Document';
    const isHandwritten = formData.get('isHandwritten') === 'true';
    const tags = (formData.get('tags') as string || '').split(',').filter(Boolean);

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Log detailed file information for debugging
    debug('Form data received', { 
      fileName: file.name, 
      fileType: file.type,
      fileSize: file.size,
      title,
      isHandwritten,
      tags
    });

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds the ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Get the actual MIME type based on file extension if browser provides empty or incorrect type
    let detectedMimeType = file.type;
    
    if (!detectedMimeType || detectedMimeType === 'application/octet-stream') {
      const extensionType = getFileTypeFromName(file.name);
      if (extensionType) {
        detectedMimeType = extensionType;
        debug('Detected MIME type from file extension', { 
          fileName: file.name, 
          detectedMimeType
        });
      }
    }
    
    // Normalize the MIME type
    const normalizedMimeType = getNormalizedMimeType(detectedMimeType);
    debug('Normalized MIME type', { 
      original: detectedMimeType, 
      normalized: normalizedMimeType 
    });

    // Check if the file type is supported
    const isSupported = SUPPORTED_MIME_TYPES.includes(normalizedMimeType) || 
                       Object.keys(ADDITIONAL_MIME_TYPES).includes(detectedMimeType);
    
    if (!isSupported) {
      debug('Unsupported file type', { 
        type: detectedMimeType,
        normalized: normalizedMimeType,
        fileName: file.name
      });
      return NextResponse.json(
        { error: `Unsupported file type: ${detectedMimeType}. Please upload a PDF, DOC, DOCX, TXT, JPG, or PNG file.` },
        { status: 400 }
      );
    }

    // Read file as buffer
    debug('Reading file as buffer');
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Save file to disk
    const fileName = `${uuidv4()}-${file.name}`;
    const filePath = join(process.cwd(), 'public', 'uploads', fileName);
    await writeFile(filePath, fileBuffer);
    debug('File saved to disk', { filePath });
    
    // Process with Gemini based on file type
    let processedContent = '';
    let processingMethod = 'gemini_1.5_flash';
    
    debug('Processing file with Gemini 1.5 Flash');
    
    try {
      // Convert file to base64
      const base64Data = fileBuffer.toString('base64');
      
      if (normalizedMimeType.startsWith('image/')) {
        // For images, we use the data URL format
        const dataUrl = `data:${normalizedMimeType};base64,${base64Data}`;
        
        if (isHandwritten) {
          debug('Processing as handwritten image');
          const prompt = "This image contains handwritten text. Please extract and transcribe all handwritten text from this image. Preserve formatting where possible.";
          processingMethod = 'gemini_handwriting_1.5';
          
          const result = await processImageWithGemini(dataUrl, prompt);
          
          if (result.success) {
            processedContent = result.data;
            debug('Gemini handwriting processing successful', { textLength: processedContent.length });
          } else {
            throw new Error(result.error || 'Failed to process handwritten image');
          }
        } else {
          debug('Processing as standard image');
          const prompt = "Extract all text content from this image. Preserve formatting, tables, and structure as much as possible.";
          processingMethod = 'gemini_image_1.5';
          
          const result = await processImageWithGemini(dataUrl, prompt);
          
          if (result.success) {
            processedContent = result.data;
            debug('Gemini image processing successful', { textLength: processedContent.length });
          } else {
            throw new Error(result.error || 'Failed to process image');
          }
        }
      } else {
        // For non-image files (PDF, DOC, TXT)
        debug('Processing non-image file with Gemini 1.5 Flash');
        
        let prompt = "Extract all text content from this document. ";
        
        if (normalizedMimeType === 'application/pdf') {
          debug('Processing PDF document');
          prompt = "This is a PDF document. Extract all text content, preserving the structure, formatting, tables, and layout as much as possible.";
          processingMethod = 'gemini_pdf_1.5';
        } else if (normalizedMimeType.includes('word') || normalizedMimeType.includes('doc')) {
          debug('Processing Word document');
          prompt = "This is a Word document. Extract all text content, preserving the structure, formatting, tables, and layout as much as possible.";
          processingMethod = 'gemini_word_1.5';
        } else if (normalizedMimeType === 'text/plain') {
          debug('Processing text document');
          prompt = "This is a text document. Extract all content exactly as it appears.";
          processingMethod = 'gemini_text_1.5';
        }
        
        debug('Processing document with prompt', { promptLength: prompt.length });
        
        // Process document
        const result = await processDocumentWithGemini(base64Data, normalizedMimeType, prompt);
        
        if (result.success) {
          processedContent = result.data;
          debug('Gemini document processing successful', { textLength: processedContent.length });
        } else {
          throw new Error(result.error || `Failed to process ${normalizedMimeType} document`);
        }
      }
    } catch (error) {
      debug('Gemini processing error', { error: (error as Error).message });
      return NextResponse.json(
        { error: `Failed to process document: ${(error as Error).message}` },
        { status: 500 }
      );
    }
    
    // If we reached here but have no processed content, return an error
    if (!processedContent) {
      debug('No processed content generated');
      return NextResponse.json(
        { error: 'Failed to extract content from the document' },
        { status: 500 }
      );
    }
    
    // Connect to database
    debug('Connecting to database');
    await connectToDatabase();
    
    // Get correct fileType value for the document model
    // Default to 'text' if not found in the map
    let documentFileType: 'pdf' | 'text' | 'image' | 'handwritten' = 
      fileTypeMap[normalizedMimeType] || 'text';
    
    // Override with 'handwritten' if the flag is set
    if (isHandwritten && normalizedMimeType.startsWith('image/')) {
      documentFileType = 'handwritten';
    }
    
    debug('Document file type mapping', { 
      mimeType: normalizedMimeType, 
      documentFileType, 
      isHandwritten 
    });
    
    // Create document in database
    debug('Creating document in database');
    const document = await Document.create({
      userId: user.id,
      title,
      content: processedContent,
      originalText: processedContent,
      fileType: documentFileType,
      processingMethod,
      fileUrl: `/uploads/${fileName}`,
      tags,
    });
    
    debug('Document created successfully', { documentId: document._id });
    
    return NextResponse.json({
      success: true,
      documentId: document._id,
      text: processedContent,
      fileUrl: `/uploads/${fileName}`,
      fileName: file.name,
      fileType: normalizedMimeType,
      fileSize: file.size,
      processingMethod
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: `Something went wrong: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 