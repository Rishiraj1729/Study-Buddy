'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ChatInterface from '@/components/chat/ChatInterface';
import DocumentUpload from '@/components/study/DocumentUpload';
import Sidebar from '@/components/ui/Sidebar';
import { getClientSession, getClientCookie } from '@/lib/auth.client';
import { UserSession } from '@/lib/auth';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [manualToken, setManualToken] = useState('');
  const [showManualLogin, setShowManualLogin] = useState(false);

  // Get user session on client-side
  useEffect(() => {
    const fetchSession = async () => {
      try {
        // For debugging
        const token = getClientCookie('auth-token');
        console.log('Auth token found:', !!token);
        console.log('All cookies:', document.cookie);
        
        const session = getClientSession();
        console.log('Session retrieved:', !!session);
        
        if (session) {
          setUser(session);
          setLoading(false);
          return;
        }
        
        // If we reach here, we couldn't find a session automatically
        // Show manual login option after 2 seconds of loading
        setTimeout(() => {
          if (!user) {
            setShowManualLogin(true);
          }
        }, 2000);
      } catch (error) {
        console.error('Error fetching session:', error);
        setShowManualLogin(true);
      }
    };
    
    fetchSession();
  }, []);

  // Handle manual token input
  const handleManualLogin = () => {
    try {
      if (!manualToken) {
        alert('Please enter your token');
        return;
      }
      
      // Manually parse the token
      const tokenParts = manualToken.split('.');
      if (tokenParts.length !== 3) {
        alert('Invalid token format');
        return;
      }
      
      try {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('Manual token payload:', payload);
        
        if (payload.user && payload.user.id && payload.user.name && payload.user.email) {
          // Set the user manually
          setUser(payload.user);
          setLoading(false);
          setShowManualLogin(false);
          
          // Also store in localStorage for future use
          localStorage.setItem('auth-user', JSON.stringify(payload.user));
          
          // Set cookie manually as well
          document.cookie = `auth-token=${manualToken}; path=/; max-age=${60 * 60 * 24 * 7}`;
        } else {
          alert('Invalid token: missing user data');
        }
      } catch (error) {
        console.error('Error parsing token:', error);
        alert('Could not parse token. Please check the format.');
      }
    } catch (error) {
      console.error('Manual login error:', error);
      alert('An error occurred during manual login');
    }
  };

  // Show loading state or manual login option
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        {showManualLogin ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Manual Authentication</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              We couldn't automatically authenticate you. Please paste your authentication token below:
            </p>
            <textarea
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mb-4 h-24"
              placeholder="Paste your JWT token here..."
            />
            <button
              onClick={handleManualLogin}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
            >
              Authenticate
            </button>
            <div className="mt-4 text-center">
              <Link href="/auth/signin" className="text-blue-600 hover:underline">
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">
              {activeTab === 'chat' ? 'Chat with StudyBuddy' : 'Document Processing'}
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-sm">
                Welcome, {user?.name || 'User'}
              </span>
              <img
                src={user?.image || '/default-avatar.png'}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'chat' ? (
            <ChatInterface />
          ) : activeTab === 'upload' ? (
            <DocumentUpload />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h2 className="text-xl font-bold mb-4">My Documents</h2>
              <p className="text-gray-500 dark:text-gray-400">
                You haven't uploaded any documents yet. Go to the{' '}
                <button
                  onClick={() => setActiveTab('upload')}
                  className="text-blue-600 hover:underline"
                >
                  Upload
                </button>{' '}
                section to get started.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 