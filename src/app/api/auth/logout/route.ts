import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Create response
  const response = NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    { status: 200 }
  );
  
  // Clear auth cookie
  response.cookies.set({
    name: 'auth-token',
    value: '',
    expires: new Date(0),
    path: '/',
  });
  
  return response;
} 