import DocumentScanner from '@/components/DocumentScanner';

export default function ScanPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Document Scanner</h1>
          <p className="text-xl text-gray-600 mb-8">
            Upload your document and get an AI-powered analysis of its contents
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Supported Formats</h2>
            <ul className="space-y-2 text-gray-600">
              <li>• PDF Documents</li>
              <li>• Word Documents (DOC, DOCX)</li>
              <li>• Text Files (TXT)</li>
              <li>• Images (JPG, JPEG, PNG)</li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Features</h2>
            <ul className="space-y-2 text-gray-600">
              <li>• AI-powered content analysis</li>
              <li>• Detailed document summaries</li>
              <li>• Key points extraction</li>
              <li>• Format-specific analysis</li>
            </ul>
          </div>
        </div>

        <DocumentScanner />
      </div>
    </main>
  );
} 