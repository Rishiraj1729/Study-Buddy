import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from './mongoose';
import { User, IUser } from './models/User';
import { UserSession, JWT_SECRET, JWT_EXPIRES_IN } from './auth';

// Create JWT token
export async function createToken(user: UserSession): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secret);
  
  return token;
}

// Verify JWT token
export async function verifyToken(token: string): Promise<UserSession | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    return payload.user as UserSession;
  } catch (error) {
    return null;
  }
}

// Set auth cookie
export function setAuthCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set({
    name: 'auth-token',
    value: token,
    httpOnly: false, // Allow JavaScript access
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  
  console.log('Setting auth cookie with token:', token.substring(0, 15) + '...');
  return response;
}

// Get auth cookie from request
export function getAuthCookie(request: NextRequest): string | undefined {
  return request.cookies.get('auth-token')?.value;
}

// Get user session from cookies (for server components/API routes)
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }
  
  return await verifyToken(token);
}

// Authenticate user with credentials
export async function authenticateUser(email: string, password: string): Promise<{ user: UserSession | null; error?: string }> {
  try {
    await connectToDatabase();
    
    const user = await User.findOne({ email }) as IUser | null;
    
    if (!user) {
      return { user: null, error: 'User not found' };
    }
    
    // For simplicity, we're just checking if password matches without hashing
    // In production, you should use bcrypt to compare hashed passwords
    if (password !== 'password') { // Replace with proper password verification
      return { user: null, error: 'Invalid password' };
    }
    
    const userId = user._id ? user._id.toString() : '';
    
    return {
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        image: user.image,
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error: 'An error occurred during authentication' };
  }
}

// Register a new user
export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<{ user: UserSession | null; error?: string }> {
  try {
    await connectToDatabase();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { user: null, error: 'User with this email already exists' };
    }
    
    // In production, hash the password before storing
    // const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = await User.create({
      name,
      email,
      // password: hashedPassword, // Store hashed password in production
      password, // Only for development/demo
    }) as IUser;
    
    const userId = newUser._id ? newUser._id.toString() : '';
    
    return {
      user: {
        id: userId,
        name: newUser.name,
        email: newUser.email,
        image: newUser.image,
      }
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { user: null, error: 'An error occurred during registration' };
  }
} 