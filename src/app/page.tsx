'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/Provider';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [loading, user, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between text-sm lg:flex">
        <div className="fixed bottom-0 left-0 flex w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <div className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0">
            <Link href="/" className="font-bold text-xl">
              StudyBuddy
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/signin"
            className="font-medium px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Sign In
          </Link>
          <Link
            href="/about"
            className="font-medium hover:text-blue-600"
          >
            About
          </Link>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center text-center max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Your AI-Powered Study Companion
        </h1>
        <p className="text-lg md:text-xl mb-8">
          StudyBuddy uses advanced AI to help you learn more effectively, answer your questions, and process your study materials.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Link
            href="/auth/signin"
            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 text-center"
          >
            Get Started
          </Link>
          <Link
            href="/features"
            className="px-6 py-3 rounded-lg border border-gray-300 hover:border-gray-400 text-center"
          >
            Explore Features
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mb-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-3">AI Chat Assistant</h2>
          <p>Get instant answers to your academic questions with our advanced AI chat model.</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-3">Document Processing</h2>
          <p>Upload images, including handwritten notes, and convert them to editable text.</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-3">Math & LaTeX Support</h2>
          <p>Work with complex mathematical equations and formulas with full LaTeX rendering.</p>
        </div>
      </div>

      <footer className="w-full max-w-5xl text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} StudyBuddy. All rights reserved.</p>
      </footer>
    </main>
  );
}
