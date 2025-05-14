import { UserSession } from './auth';

// Client-side function to get cookie
export function getClientCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  
  // Improved cookie parsing that doesn't rely on regex which might be failing
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      console.log(`Found cookie ${name}:`, cookieValue.substring(0, 10) + '...');
      return cookieValue;
    }
  }
  
  // If we got here, we didn't find the cookie
  console.log(`Cookie ${name} not found in:`, document.cookie.substring(0, 20) + '...');
  return undefined;
}

// Client-side function to decode JWT
export function decodeJwt(token: string): any {
  try {
    console.log('Attempting to decode token:', token.substring(0, 10) + '...');
    
    // Simple client-side JWT decoding (base64 decoding of payload)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('Token does not have three parts:', tokenParts.length);
      return null;
    }
    
    const base64Url = tokenParts[1];
    console.log('Base64Url part:', base64Url.substring(0, 10) + '...');
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    try {
      const jsonPayload = atob(base64);
      const decodedData = JSON.parse(jsonPayload);
      console.log('Token decoded successfully, user exists:', !!decodedData?.user);
      return decodedData;
    } catch (decodeError) {
      console.error('Error during base64 decoding or JSON parsing:', decodeError);
      return null;
    }
  } catch (error) {
    console.error('Top level error decoding JWT:', error);
    return null;
  }
}

// Client-side function to get user from token
export function getClientSession(): UserSession | null {
  try {
    // First try to get from cookie
    const token = getClientCookie('auth-token');
    console.log('Auth token in getClientSession:', token ? 'found' : 'not found');
    
    if (token) {
      const decoded = decodeJwt(token);
      console.log('Decoded token:', decoded ? 'success' : 'failed');
      
      if (decoded && decoded.user) {
        return decoded.user as UserSession;
      }
    }
    
    // If cookie method fails, try localStorage
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('auth-user');
      if (storedUser) {
        console.log('Found user in localStorage');
        try {
          return JSON.parse(storedUser) as UserSession;
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
    }
    
    console.error('No user found in cookie or localStorage');
    return null;
  } catch (error) {
    console.error('Error getting client session:', error);
    return null;
  }
}

// Client-side logout function
export function logout(): void {
  document.cookie = 'auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  window.location.href = '/auth/signin';
}

// Check if user is authenticated on client-side
export function isAuthenticated(): boolean {
  return getClientSession() !== null;
} 