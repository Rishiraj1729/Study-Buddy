import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getAuthCookie } from './lib/auth.server';

// Define paths that require authentication
const PROTECTED_PATHS = ['/dashboard', '/api/chat', '/api/upload'];

// Define paths that should redirect to dashboard if already authenticated
const AUTH_PATHS = ['/auth/signin', '/auth/register'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Get token from cookie
  const token = getAuthCookie(request);
  
  // Check user authentication status
  const isAuthenticated = token ? await verifyToken(token) : null;
  
  // Handle protected routes
  if (PROTECTED_PATHS.some(path => pathname.startsWith(path))) {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      const url = new URL('/auth/signin', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }
  
  // Handle auth routes (signin/register)
  if (AUTH_PATHS.some(path => pathname === path)) {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      const url = new URL('/dashboard', request.url);
      return NextResponse.redirect(url);
    }
  }
  
  // Continue processing the request
  return NextResponse.next();
}

// Define which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next (Next.js internals)
     * - public (static files)
     * - favicon.ico (favicon file)
     * - assets (static assets)
     */
    '/((?!_next/|public/|favicon.ico|assets/).*)',
  ],
}; 