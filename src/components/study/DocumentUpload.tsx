'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/components/auth/Provider';

export default function DocumentUpload() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [isHandwritten, setIsHandwritten] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    text?: string;
    error?: string;
    documentId?: string;
    fileUrl?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelect(droppedFile);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    // Check if file is an image
    if (!selectedFile.type.startsWith('image/')) {
      alert('Please upload an image file (JPEG, PNG, etc.)');
      return;
    }
    
    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    
    setFile(selectedFile);
    // Set title to filename without extension if title is empty
    if (!title) {
      const filename = selectedFile.name.split('.').slice(0, -1).join('.');
      setTitle(filename);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      alert('Please select a file to upload');
      return;
    }
    
    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      formData.append('tags', tags);
      formData.append('isHandwritten', isHandwritten ? 'true' : 'false');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error uploading file');
      }

      setResult({
        success: true,
        text: data.text,
        documentId: data.documentId,
        fileUrl: data.fileUrl,
      });
    } catch (error) {
      console.error('Upload error:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setTitle('');
    setTags('');
    setIsHandwritten(false);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h2 className="text-xl font-bold mb-4">Upload Document</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Document Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter a title for your document"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="tags" className="block text-sm font-medium mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="math, calculus, homework"
            />
          </div>
          
           <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isHandwritten}
                onChange={(e) => setIsHandwritten(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span>This document contains handwritten text</span>
            </label>
          </div>
          
          <div 
            className={`mb-6 border-2 border-dashed rounded-md p-4 text-center ${
              file ? 'border-green-500' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex flex-col items-center">
                <p className="mb-2">File selected: {file.name}</p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <p className="mb-2">Drag & drop your image here, or</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="hidden"
                  id="fileInput"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Browse Files
                </button>
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={!file || isLoading}
            >
              {isLoading ? 'Processing...' : 'Upload & Process'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h2 className="text-xl font-bold mb-4">Processing Result</h2>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>Processing your document...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a moment depending on the image complexity.</p>
          </div>
        ) : result ? (
          result.success ? (
            <div>
              <div className="mb-4">
                <h3 className="font-medium text-lg">Extracted Text:</h3>
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md mt-2 max-h-96 overflow-y-auto whitespace-pre-wrap">
                  {result.text || 'No text was extracted.'}
                </div>
              </div>
              {result.fileUrl && (
                <div className="mt-4">
                  <img 
                    src={result.fileUrl} 
                    alt="Uploaded document" 
                    className="max-h-48 mx-auto object-contain" 
                  />
                </div>
              )}
              <div className="mt-4 text-center">
                <p className="text-green-600 dark:text-green-400">Document successfully processed!</p>
                <button
                  onClick={handleReset}
                  className="mt-2 text-blue-600 hover:underline"
                >
                  Upload another document
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md">
              <p className="font-bold">Error:</p>
              <p>{result.error || 'An unknown error occurred'}</p>
              <button
                onClick={handleReset}
                className="mt-2 text-blue-600 hover:underline"
              >
                Try again
              </button>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-16 w-16 mb-4"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            <p>Upload a document to see the processed result here.</p>
          </div>
        )}
      </div>
    </div>
  );
} 