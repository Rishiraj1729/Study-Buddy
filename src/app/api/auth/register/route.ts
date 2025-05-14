import { NextRequest, NextResponse } from 'next/server';
import { registerUser, createToken, setAuthCookie } from '@/lib/auth.server';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validate request data
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Register user
    const { user, error } = await registerUser(name, email, password);

    if (!user) {
      return NextResponse.json(
        { success: false, error: error || 'Registration failed' },
        { status: 400 }
      );
    }

    // Create JWT token
    const token = await createToken(user);

    // Create response
    const response = NextResponse.json(
      { success: true, user },
      { status: 201 }
    );

    // Set auth cookie
    return setAuthCookie(response, token);
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
} 