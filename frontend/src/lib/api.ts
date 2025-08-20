// FIXED: Remove duplicate /api from base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// API Client class
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    console.log(`🔌 API Client initialized for Azizkh07 at 2025-08-20 14:01:33 with base URL: ${baseUrl}`);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // FIXED: Ensure endpoint starts with /api
    const cleanEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;
    
    console.log(`🔍 Making ${options.method || 'GET'} request for Azizkh07 to: ${url}`);
    
    // ✅ FIXED: Get token from 'authToken' instead of 'token'
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Remove Content-Type if sending FormData
    if (options.body instanceof FormData) {
      delete (config.headers as any)['Content-Type'];
    }

    try {
      const response = await fetch(url, config);
      
      // Log the response status
      console.log(`📥 Response from ${url} for Azizkh07: ${response.status} ${response.statusText}`);
      
      // Handle authentication errors
      if (response.status === 401) {
        console.log('🔐 Unauthorized request for Azizkh07 - clearing auth data');
        this.clearAuthData();
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Check for non-JSON responses first
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('❌ Non-JSON response received for Azizkh07:', textResponse.substring(0, 150) + '...');
        throw new Error(`Expected JSON response but got: ${contentType || 'unknown'}`);
      }
      
      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Error response for Azizkh07:', data);
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      console.log(`✅ Success response from ${endpoint} for Azizkh07:`, typeof data === 'object' ? Object.keys(data) : 'primitive data');
      return data as T;
    } catch (error) {
      console.error(`❌ API request to ${endpoint} failed for Azizkh07:`, error);
      throw error;
    }
  }

  private clearAuthData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      console.log('🗑️ Auth data cleared for Azizkh07');
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const config: RequestInit = {
      method: 'POST',
      body: data ? (data instanceof FormData ? data : JSON.stringify(data)) : undefined,
      ...options
    };
    
    // Only set content-type to application/json if we're not sending FormData
    if (!(data instanceof FormData)) {
      config.headers = {
        'Content-Type': 'application/json',
        ...options?.headers
      };
    } else {
      // For FormData, don't set Content-Type (let browser set it with boundary)
      config.headers = {
        ...options?.headers
      };
    }
    
    return this.request<T>(endpoint, config);
  }

  // PUT request
  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const config: RequestInit = {
      method: 'PUT',
      body: data ? (data instanceof FormData ? data : JSON.stringify(data)) : undefined,
      ...options
    };
    
    // Only set content-type to application/json if we're not sending FormData
    if (!(data instanceof FormData)) {
      config.headers = {
        'Content-Type': 'application/json',
        ...options?.headers
      };
    } else {
      config.headers = {
        ...options?.headers
      };
    }
    
    return this.request<T>(endpoint, config);
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ✅ FIXED: Upload file with progress support and proper auth token
  async upload<T>(
    endpoint: string, 
    formData: FormData, 
    onProgress?: (percentage: number) => void
  ): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;
    // ✅ FIXED: Use 'authToken' instead of 'token'
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    console.log(`📤 Starting upload for Azizkh07 to: ${url} at 2025-08-20 14:01:33`);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            console.log(`📊 Upload progress for Azizkh07: ${percentage}%`);
            onProgress(percentage);
          }
        });
      }

      xhr.addEventListener('load', () => {
        console.log(`📥 Upload response for Azizkh07: ${xhr.status} ${xhr.statusText}`);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('✅ Upload successful for Azizkh07:', response);
            resolve(response);
          } catch (error) {
            console.log('✅ Upload successful for Azizkh07 (non-JSON response)');
            resolve(xhr.responseText as unknown as T);
          }
        } else {
          console.error(`❌ Upload failed for Azizkh07 with status: ${xhr.status}`);
          
          // Handle authentication errors
          if (xhr.status === 401) {
            this.clearAuthData();
            reject(new Error('Authentication required. Please log in again.'));
          } else {
            // Try to parse error message
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.message || `Upload failed with status: ${xhr.status}`));
            } catch (e) {
              reject(new Error(`Upload failed with status: ${xhr.status}`));
            }
          }
        }
      });

      xhr.addEventListener('error', () => {
        console.error('❌ Upload network error for Azizkh07');
        reject(new Error('Upload failed - network error'));
      });

      xhr.addEventListener('abort', () => {
        console.error('❌ Upload aborted for Azizkh07');
        reject(new Error('Upload aborted'));
      });

      xhr.open('POST', url);
      
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        console.log('🔐 Auth header added to upload request for Azizkh07');
      } else {
        console.log('⚠️ No auth token found for upload request - Azizkh07');
      }

      console.log('📤 Sending upload request for Azizkh07...');
      xhr.send(formData);
    });
  }
}

// Export API client instance
export const api = new ApiClient(API_BASE_URL);

// Export as default for backward compatibility
export default api;

// ✅ FIXED: Utility functions updated to use 'authToken' consistently
export const apiUtils = {
  // Set auth token
  setAuthToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token); // ✅ FIXED: Use 'authToken'
      console.log('🔑 Auth token stored in localStorage for Azizkh07 at 2025-08-20 14:01:33');
    }
  },

  // Remove auth token
  removeAuthToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken'); // ✅ FIXED: Use 'authToken'
      localStorage.removeItem('user');
      console.log('🗑️ Auth token removed from localStorage for Azizkh07 at 2025-08-20 14:01:33');
    }
  },

  // Get auth token
  getAuthToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken'); // ✅ FIXED: Use 'authToken'
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = apiUtils.getAuthToken();
    const hasToken = !!token;
    console.log(`🔍 Authentication check for Azizkh07: ${hasToken ? 'authenticated' : 'not authenticated'}`);
    return hasToken;
  },

  // Store user data
  setUserData: (user: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
      console.log('👤 User data stored for Azizkh07:', user.email || user.name || 'unknown user');
    }
  },

  // Get user data
  getUserData: () => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          console.log('👤 User data retrieved for Azizkh07:', parsed.email || parsed.name || 'unknown user');
          return parsed;
        } catch (e) {
          console.error('❌ Error parsing user data from localStorage for Azizkh07:', e);
        }
      }
    }
    return null;
  },

  // ✅ ADDED: Check if user is admin
  isAdmin: (): boolean => {
    const user = apiUtils.getUserData();
    return user?.is_admin === true || user?.isAdmin === true;
  },

  // ✅ ADDED: Get user role
  getUserRole: (): string => {
    const user = apiUtils.getUserData();
    if (user?.is_admin || user?.isAdmin) return 'admin';
    return user?.role || 'user';
  }
};

// Fixed: Handle API Response with proper typing and assertion
export const handleApiResponse = <T = any>(response: any): T => {
  // If response is already in the expected format (not wrapped in API response)
  if (!response.success && !response.data) {
    return response as T;
  }
  
  // If response follows API response format
  if (response.success && response.data !== undefined) {
    return response.data as T;
  }
  
  throw new Error(response.message || 'API request failed');
};

// Get Error Message from any error type
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.errors && Array.isArray(error.errors) && error.errors.length > 0) {
    return error.errors[0].msg || error.errors[0].message || 'Validation error';
  }
  
  return 'An unexpected error occurred';
};

// Format error for display
export const formatError = (error: any): { message: string; details?: string } => {
  const message = getErrorMessage(error);
  
  return {
    message,
    details: error?.details || error?.stack || undefined
  };
};

console.log('🌐 API client loaded for Azizkh07 at 2025-08-20 14:01:33');