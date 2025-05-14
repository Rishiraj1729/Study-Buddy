import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createToken, setAuthCookie } from '@/lib/auth.server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const { user, error } = await authenticateUser(email, password);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication failed' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await createToken(user);

    // Create response
    const response = NextResponse.json(
      { success: true, user },
      { status: 200 }
    );

    // Set auth cookie
    return setAuthCookie(response, token);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    );
  }
} 