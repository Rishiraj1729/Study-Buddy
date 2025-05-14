'use client';

import { useState } from 'react';
import { Button, Card, CardBody, CardHeader, Divider, Spinner, Tabs, Tab, Progress } from '@nextui-org/react';
import { Upload, FileText, Image, AlertCircle, FileUp, FileType, Pencil, Clipboard, Download, Eye } from 'lucide-react';

// Updated Document types supported by the scanner with improved MIME types
const DOCUMENT_TYPES = [
  { 
    name: 'PDF', 
    icon: <FileText className="w-10 h-10 mb-2 text-red-500" />, 
    description: 'Upload PDF documents', 
    accept: '.pdf',
    mime: 'application/pdf' 
  },
  { 
    name: 'Document', 
    icon: <FileType className="w-10 h-10 mb-2 text-blue-500" />, 
    description: 'Upload DOC/DOCX files', 
    accept: '.doc,.docx',
    mime: 'application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
  },
  { 
    name: 'Image', 
    icon: <Image className="w-10 h-10 mb-2 text-purple-500" />, 
    description: 'Upload images with text', 
    accept: '.jpg,.jpeg,.png',
    mime: 'image/jpeg,image/png,image/jpg' 
  },
  { 
    name: 'Handwritten', 
    icon: <Pencil className="w-10 h-10 mb-2 text-green-500" />, 
    description: 'Upload handwritten notes', 
    accept: '.jpg,.jpeg,.png',
    mime: 'image/jpeg,image/png,image/jpg',
    isHandwritten: true
  },
];

export default function DocumentScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [fileInfo, setFileInfo] = useState<{
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl?: string;
    processingMethod?: string;
  } | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [fileTypeInfo, setFileTypeInfo] = useState<{
    type: string;
    isHandwritten: boolean;
  }>({ type: "all", isHandwritten: false });
  const [showOriginalFile, setShowOriginalFile] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size too large. Maximum size is 10MB.');
        return;
      }
      
      setFile(selectedFile);
      setError('');
      setResult('');
      setFileInfo(null);
      setShowOriginalFile(false);
      setProcessingStage('');
      setProcessingProgress(0);
      setDebugInfo(`Selected file: ${selectedFile.name} (${selectedFile.type}, ${formatFileSize(selectedFile.size)})`);
    }
  };

  const handleDocTypeSelect = (docType: typeof DOCUMENT_TYPES[0]) => {
    setFileTypeInfo({
      type: docType.name.toLowerCase(),
      isHandwritten: !!docType.isHandwritten
    });
    
    // Find input element and trigger click
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.accept = docType.accept;
      fileInput.click();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      alert('Text copied to clipboard!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');
    setProcessingStage('Uploading file...');
    setProcessingProgress(10);
    setDebugInfo(`Processing file: ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      
      // Set handwritten flag based on file type or user selection
      const isHandwritten = fileTypeInfo.isHandwritten || 
                           file.name.toLowerCase().includes('handwritten') || 
                           file.name.toLowerCase().includes('written') ||
                           file.name.toLowerCase().includes('note');
      
      formData.append('isHandwritten', String(isHandwritten));
      
      setProcessingStage('Sending to server...');
      setProcessingProgress(30);
      setDebugInfo(prev => `${prev}\nSending request to /api/upload (isHandwritten: ${isHandwritten})...`);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      setProcessingStage('Processing document...');
      setProcessingProgress(60);

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Server error: ${response.status}`);
        } else {
          const text = await response.text();
          setDebugInfo(prev => `${prev}\nNon-JSON response: ${text.substring(0, 200)}...`);
          throw new Error(`Server error: ${response.status}`);
        }
      }

      setProcessingStage('Analyzing results...');
      setProcessingProgress(90);
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error occurred');
      }

      setProcessingProgress(100);
      setProcessingStage('Complete!');
      
      setDebugInfo(prev => `${prev}\nProcessing successful! Method: ${data.processingMethod}`);
      setResult(data.text);
      setFileInfo({
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
        fileUrl: data.fileUrl,
        processingMethod: data.processingMethod
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error processing document. Please try again.';
      setError(errorMessage);
      setDebugInfo(prev => `${prev}\nError: ${errorMessage}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Add a helper component to display errors with suggestions
  const ErrorDisplay = ({ message }: { message: string }) => {
    // Extract meaningful error messages
    const isApiKeyError = message.includes('API key') || message.includes('apiKey');
    const isSizeError = message.includes('size') || message.includes('too large');
    const isFormatError = message.includes('format') || message.includes('type');
    
    return (
      <div className="flex flex-col gap-3 p-4 text-sm text-red-500 bg-red-50 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-medium">Error: {message}</p>
        </div>
        
        <div className="text-red-700 text-sm mt-2">
          <h4 className="font-semibold mb-1">Suggestions:</h4>
          <ul className="list-disc pl-5 space-y-1">
            {isApiKeyError && (
              <li>Check if the GEMINI_API_KEY environment variable is properly set</li>
            )}
            {isSizeError && (
              <li>Try with a smaller file (less than 10MB)</li>
            )}
            {isFormatError && (
              <li>Ensure your file is in a supported format (PDF, DOC, DOCX, TXT, JPG, PNG)</li>
            )}
            <li>Try converting your document to a different format (e.g., PDF to JPG)</li>
            <li>Ensure your document is not password protected or encrypted</li>
            <li>Try reopening the file and saving it in a different format</li>
          </ul>
        </div>
      </div>
    );
  };

  // Get file icon based on file type
  const getFileIcon = (file: File | null) => {
    if (!file) return null;
    
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    const extension = fileName.split('.').pop() || '';
    
    // PDF detection
    if (fileType.includes('pdf') || extension === 'pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    
    // Word document detection
    if (fileType.includes('word') || fileType.includes('doc') || 
        extension === 'doc' || extension === 'docx') {
      return <FileType className="w-5 h-5 text-blue-500" />;
    }
    
    // Image detection
    if (fileType.startsWith('image/') || 
        ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return <Image className="w-5 h-5 text-purple-500" />;
    }
    
    // Default icon
    return <FileType className="w-5 h-5 text-gray-500" />;
  };

  // Render file type in the file preview
  const renderFileType = (file: File) => {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    const extension = fileName.split('.').pop() || '';
    
    // PDF detection
    if (fileType.includes('pdf') || extension === 'pdf') {
      return 'PDF Document';
    }
    
    // Word document detection
    if (fileType.includes('word') || fileType.includes('doc') || 
        extension === 'doc' || extension === 'docx') {
      return extension.toUpperCase() + ' Document';
    }
    
    // Image detection
    if (fileType.startsWith('image/') || 
        ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return (extension.toUpperCase() || 'Image') + ' File';
    }
    
    // If MIME type is empty or application/octet-stream, use extension
    if (!fileType || fileType === 'application/octet-stream') {
      return extension.toUpperCase() + ' File';
    }
    
    // Default to the browser-provided MIME type
    return fileType;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="w-full">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-lg font-semibold">Document Scanner</p>
            <p className="text-small text-default-500">Upload your document for AI analysis</p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-4">
              <label className="text-sm font-medium">Select Document Type</label>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
                {DOCUMENT_TYPES.map((docType) => (
                  <div 
                    key={docType.name}
                    onClick={() => handleDocTypeSelect(docType)}
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg 
                      cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    {docType.icon}
                    <p className="text-sm font-semibold">{docType.name}</p>
                    <p className="text-xs text-gray-500 text-center mt-1">{docType.description}</p>
                  </div>
                ))}
              </div>
              
              <input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                className="hidden"
              />
              
              <div className="flex items-center justify-center w-full">
                <label 
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed 
                    rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center justify-center">
                    <Upload className="w-6 h-6 mr-2 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      <span className="font-semibold">Click to upload any document</span> or drag and drop
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX, TXT, JPG, JPEG, PNG (MAX. 10MB)
                  </p>
                </label>
              </div>
            </div>
            
            {file && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • {renderFileType(file)}
                  </p>
                </div>
              </div>
            )}
            
            {loading && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{processingStage}</span>
                  <span className="text-sm text-gray-600">{processingProgress}%</span>
                </div>
                <Progress 
                  value={processingProgress} 
                  color="primary" 
                  aria-label="Processing progress" 
                  className="w-full"
                />
              </div>
            )}
            
            {error && (
              <ErrorDisplay message={error} />
            )}
            
            <Button
              type="submit"
              color="primary"
              className="w-full"
              isLoading={loading}
              disabled={!file || loading}
            >
              {loading ? 'Processing...' : 'Scan Document'}
            </Button>
          </form>
        </CardBody>
      </Card>

      {debugInfo && process.env.NODE_ENV === 'development' && (
        <Card className="w-full">
          <CardHeader>
            <p className="text-md font-semibold">Debug Information</p>
          </CardHeader>
          <Divider />
          <CardBody>
            <pre className="whitespace-pre-wrap text-xs text-gray-600 bg-gray-50 p-3 rounded">
              {debugInfo}
            </pre>
          </CardBody>
        </Card>
      )}

      {result && (
        <Card className="w-full">
          <CardHeader className="flex justify-between items-center">
            <div className="flex flex-col">
              <p className="text-lg font-semibold">Analysis Results</p>
              {fileInfo && (
                <p className="text-small text-default-500">
                  {fileInfo.fileName} • {formatFileSize(fileInfo.fileSize)}
                  {fileInfo.processingMethod && ` • Processed with: ${fileInfo.processingMethod}`}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                isIconOnly 
                color="primary" 
                variant="light" 
                aria-label="Copy to clipboard"
                onClick={copyToClipboard}
              >
                <Clipboard className="w-5 h-5" />
              </Button>
              {fileInfo?.fileUrl && (
                <Button 
                  isIconOnly 
                  color="primary" 
                  variant="light" 
                  aria-label="View original document"
                  onClick={() => setShowOriginalFile(!showOriginalFile)}
                >
                  <Eye className="w-5 h-5" />
                </Button>
              )}
            </div>
          </CardHeader>
          <Divider />
          <CardBody>
            {showOriginalFile && fileInfo?.fileUrl && (
              <div className="mb-6">
                <p className="text-sm font-medium mb-2">Original Document:</p>
                {fileInfo.fileType.startsWith('image/') ? (
                  <img 
                    src={fileInfo.fileUrl} 
                    alt="Original document" 
                    className="max-w-full h-auto rounded-lg border border-gray-200"
                  />
                ) : fileInfo.fileType === 'application/pdf' ? (
                  <div className="border border-gray-200 rounded-lg p-2 mb-4">
                    <p className="text-sm text-gray-500 mb-2">PDF Preview not available</p>
                    <a 
                      href={fileInfo.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline flex items-center"
                    >
                      <FileText className="w-4 h-4 mr-1" /> Open PDF in new tab
                    </a>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-2 mb-4">
                    <a 
                      href={fileInfo.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline flex items-center"
                    >
                      <Download className="w-4 h-4 mr-1" /> Download original file
                    </a>
                  </div>
                )}
                <Divider className="my-4" />
              </div>
            )}
            
            <div className="prose max-w-none bg-gray-50 p-4 rounded-lg">
              <p className="whitespace-pre-wrap">{result}</p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
} 