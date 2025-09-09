// Centralized API client for the frontend - FIXED for MySQL5 backend
// - Automatically extracts data from {success: true, data: [...]} responses
// - Handles JSON vs FormData bodies
// - Provides safe, masked logging for debugging
// - Compatible with existing VideoManagement and CoursesPage components
// - Fixed for Medsaidabidi02's education-platform MySQL5 backend

type JsonObject = { [key: string]: any };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    console.log(`🔌 API Client initialized for ${getCurrentUserTag()} with base URL: ${baseUrl} at 2025-09-09 16:14:44`);
  }

  // Utility to normalize endpoint and build full URL
  private buildUrl(endpoint: string) {
    const clean = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    return `${this.baseUrl}${clean}`;
  }

  // Convert HeadersInit to a plain object for merging/inspection
  private headersInitToObject(headersInit?: HeadersInit): Record<string, string> {
    const headers: Record<string, string> = {};
    if (!headersInit) return headers;

    if (headersInit instanceof Headers) {
      headersInit.forEach((v, k) => (headers[k] = v));
    } else if (Array.isArray(headersInit)) {
      headersInit.forEach(([k, v]) => (headers[k] = v));
    } else {
      Object.assign(headers, headersInit);
    }
    return headers;
  }

  // Mask token for safe logging (don't print full token)
  private maskToken(token: string) {
    if (!token) return '';
    if (token.length > 12) return `${token.slice(0, 6)}…${token.slice(-4)}`;
    return '***';
  }

  // ✅ FIXED: Extract data from MySQL5 backend response structure
  private extractData<T>(response: any): T {
    console.log('📦 Extracting data for Medsaidabidi02 from response:', typeof response, Array.isArray(response));
    
    // If it's already an array, return as-is
    if (Array.isArray(response)) {
      console.log('✅ Response is already an array for Medsaidabidi02:', response.length, 'items');
      return response as T;
    }
    
    // If it's an object with success/data structure (MySQL5 backend)
    if (response && typeof response === 'object') {
      if ('success' in response && response.success === true && 'data' in response) {
        console.log('✅ Extracting data from success response for Medsaidabidi02:', Array.isArray(response.data) ? response.data.length + ' items' : typeof response.data);
        return response.data as T;
      }
      
      if ('data' in response) {
        console.log('✅ Extracting data property for Medsaidabidi02');
        return response.data as T;
      }
      
      if ('success' in response && response.success && 'result' in response) {
        console.log('✅ Extracting result from success response for Medsaidabidi02');
        return response.result as T;
      }
    }
    
    console.log('✅ Returning response as-is for Medsaidabidi02');
    return response as T;
  }

  // The single request entrypoint used by get/post/put/delete
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = this.buildUrl(endpoint);
    console.log(`🔍 Making ${options.method || 'GET'} request for ${getCurrentUserTag()} to: ${url} at 2025-09-09 16:14:44`);

    // Prepare headers (start empty, fill below)
    const suppliedHeaders = this.headersInitToObject(options.headers);
    const headers: Record<string, string> = {};

    // If body is FormData we must not set Content-Type (browser will set with boundary)
    const isFormData = options.body instanceof FormData;

    // If not form data and Content-Type not explicitly provided, default to application/json
    if (!isFormData && !('content-type' in Object.keys(suppliedHeaders).reduce((acc, k) => (acc[k.toLowerCase()] = suppliedHeaders[k], acc), {} as Record<string,string>))) {
      headers['Content-Type'] = 'application/json';
    }

    // Merge supplied headers (preserve any explicit values)
    Object.assign(headers, suppliedHeaders);

    // Attach Authorization from localStorage *here* (ensures token is read at call time)
    try {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (token && !headers['Authorization'] && !headers['authorization']) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        // Debug: mask token presence
        if (headers['Authorization']) {
          console.log('🔐 Request will include Authorization header (masked):', `Bearer ${this.maskToken(String(headers['Authorization']).replace(/^Bearer\s+/, ''))}`, '->', url);
        } else {
          console.log('⚠️ Request will NOT include Authorization header ->', url);
        }
      }
    } catch (e) {
      console.warn('⚠️ Could not read auth token from localStorage', e);
    }

    // If FormData, ensure we don't send Content-Type header
    if (isFormData) {
      delete headers['Content-Type'];
      delete headers['content-type'];
    }

    // Build final fetch config
    const config: RequestInit = {
      ...options,
      headers,
    };

    let response: Response;
    try {
      response = await fetch(url, config);
    } catch (networkErr) {
      console.error(`❌ Network error while requesting ${url} for Medsaidabidi02:`, networkErr);
      throw new Error('Network error - please check your connection');
    }

    // Log status
    console.log(`📥 Response from ${url} for ${getCurrentUserTag()}: ${response.status} ${response.statusText}`);

    // Read response text if needed (for error parsing)
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    // Handle common auth errors without auto-clearing token (UI decides what to do)
    if (response.status === 401 || response.status === 403) {
      const text = await response.text();
      let parsed: any = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch (e) {
        // not JSON
      }
      const serverMessage = parsed?.error || parsed?.message || text || response.statusText;
      if (response.status === 401) {
        console.warn('🔐 Unauthorized response for Medsaidabidi02:', serverMessage);
        throw new Error(serverMessage || 'Authentication required. Please log in again.');
      } else {
        console.warn('⛔ Forbidden response for Medsaidabidi02:', serverMessage);
        throw new Error(serverMessage || 'Forbidden');
      }
    }

    // If response is not OK, try to parse JSON error
    if (!response.ok) {
      const text = await response.text();
      try {
        const parsed = text ? JSON.parse(text) : null;
        const message = parsed?.message || parsed?.error || text || `HTTP error ${response.status}`;
        console.error('❌ Error response for Medsaidabidi02:', message);
        throw new Error(message);
      } catch (err) {
        console.error('❌ Error response (non-JSON) for Medsaidabidi02:', text);
        throw new Error(text || `HTTP error ${response.status}`);
      }
    }

    // If caller expects JSON, parse and return
    if (isJson) {
      try {
        const rawData = await response.json();
        console.log('📊 Raw JSON response for Medsaidabidi02:', typeof rawData, Array.isArray(rawData) ? rawData.length + ' items' : 'object');
        
        // ✅ FIXED: Extract data from MySQL5 backend response structure
        const extractedData = this.extractData<T>(rawData);
        console.log('✅ Extracted data for Medsaidabidi02:', typeof extractedData, Array.isArray(extractedData) ? extractedData.length + ' items' : 'object');
        
        return extractedData;
      } catch (err) {
        console.error('❌ Failed to parse JSON response from', url, 'for Medsaidabidi02:', err);
        throw new Error('Invalid JSON response from server');
      }
    }

    // For non-JSON (text, blobs etc.), return text
    const textResponse = await response.text();
    // @ts-ignore - return as any for flexibility
    return textResponse as any as T;
  }

  // Public helpers

  async get<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  async post<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const body = data instanceof FormData ? data : data !== undefined ? JSON.stringify(data) : undefined;
    const headers = options?.headers || {};
    const config: RequestInit = {
      method: 'POST',
      body,
      ...options,
      headers,
    };
    return this.request<T>(endpoint, config);
  }

  async put<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const body = data instanceof FormData ? data : data !== undefined ? JSON.stringify(data) : undefined;
    const headers = options?.headers || {};
    const config: RequestInit = {
      method: 'PUT',
      body,
      ...options,
      headers,
    };
    return this.request<T>(endpoint, config);
  }

  async delete<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const body = data instanceof FormData ? data : data !== undefined ? JSON.stringify(data) : undefined;
    const headers = options?.headers || {};
    const config: RequestInit = {
      method: 'DELETE',
      body,
      ...options,
      headers,
    };
    return this.request<T>(endpoint, config);
  }

  // Upload helper with progress support (uses XHR so we can report progress reliably)
  async upload<T = any>(
    endpoint: string,
    formData: FormData,
    onProgress?: (percent: number) => void
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    console.log(`📤 Starting upload for ${getCurrentUserTag()} to: ${url} at 2025-09-09 16:14:44`);

    return new Promise<T>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);

      // Attach Authorization header from localStorage
      try {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('authToken') || localStorage.getItem('token');
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            console.log('🔐 Auth header added to upload request for', getCurrentUserTag());
          } else {
            console.log('⚠️ No auth token found for upload request -', getCurrentUserTag());
          }
        }
      } catch (e) {
        console.warn('⚠️ Error reading auth token for upload', e);
      }

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable && onProgress) {
          const percent = Math.round((ev.loaded / ev.total) * 100);
          onProgress(percent);
          console.log(`📊 Upload progress for ${getCurrentUserTag()}: ${percent}%`);
        }
      };

      xhr.onload = () => {
        console.log(`📥 Upload response for ${getCurrentUserTag()}: ${xhr.status} ${xhr.statusText}`);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const parsed = xhr.responseText ? JSON.parse(xhr.responseText) : {};
            const extracted = this.extractData<T>(parsed);
            resolve(extracted);
          } catch (err) {
            // Non-JSON but successful
            // @ts-ignore
            resolve(xhr.responseText as T);
          }
        } else {
          let message = `Upload failed with status ${xhr.status}`;
          try {
            const parsed = xhr.responseText ? JSON.parse(xhr.responseText) : null;
            message = parsed?.message || parsed?.error || message;
          } catch (_) {}
          console.error(`❌ Upload failed for ${getCurrentUserTag()}:`, message);
          reject(new Error(message));
        }
      };

      xhr.onerror = () => {
        console.error('❌ Upload network error for', getCurrentUserTag());
        reject(new Error('Upload failed - network error'));
      };

      xhr.send(formData);
    });
  }

  // Clears auth from localStorage (call UI-level explicit sign out)
  clearAuthData() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log(`🗑️ Auth data cleared for ${getCurrentUserTag()}`);
    }
  }
}

// Helper to identify developer/user in logs (non-sensitive)
function getCurrentUserTag() {
  try {
    if (typeof window === 'undefined') return 'Medsaidabidi02';
    const u = localStorage.getItem('user');
    if (!u) return 'Medsaidabidi02';
    const parsed = JSON.parse(u);
    return parsed?.email || parsed?.name || 'Medsaidabidi02';
  } catch {
    return 'Medsaidabidi02';
  }
}

/* ---------------------------------------------------------
   API utilities exposed for application use
   - apiUtils.getAuthToken() etc.
   - handleApiResponse for consistent response extraction
----------------------------------------------------------*/

export const api = new ApiClient(API_BASE_URL);
export default api;

export const apiUtils = {
  setAuthToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
      localStorage.setItem('token', token); // Backward compatibility
      console.log('🔑 Auth token stored in localStorage for Medsaidabidi02');
    }
  },

  removeAuthToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('🗑️ Auth token removed from localStorage for Medsaidabidi02');
    }
  },

  getAuthToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken') || localStorage.getItem('token');
    }
    return null;
  },

  setUserData: (user: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
      console.log('👤 User data stored for Medsaidabidi02:', user?.email || user?.name || 'unknown');
    }
  },

  getUserData: (): any | null => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('❌ Error parsing user data from localStorage for Medsaidabidi02:', e);
        return null;
      }
    }
    return null;
  },

  isAuthenticated: (): boolean => {
    const token = apiUtils.getAuthToken();
    const ok = !!token;
    console.log(`🔍 Authentication check for Medsaidabidi02: ${ok ? 'authenticated' : 'not authenticated'}`);
    return ok;
  },

  isAdmin: (): boolean => {
    const u = apiUtils.getUserData();
    return !!(u && (u.is_admin === true || u.isAdmin === true));
  },

  getUserRole: (): string => {
    const u = apiUtils.getUserData();
    if (!u) return 'guest';
    if (u.is_admin || u.isAdmin) return 'admin';
    return u.role || 'user';
  }
};

// ✅ FIXED: Extract data from API responses consistently - handles MySQL5 backend
export const handleApiResponse = <T = any>(response: any): T => {
  console.log('📦 Handling API response for Medsaidabidi02 at 2025-09-09 16:14:44:', typeof response);
  
  // If it's already an array, return as-is
  if (Array.isArray(response)) {
    console.log('✅ Response is already an array for Medsaidabidi02:', response.length, 'items');
    return response as T;
  }
  
  // If API returns { success: true, data: ... } use data
  if (response && typeof response === 'object') {
    if ('success' in response && response.success === true && 'data' in response) {
      console.log('✅ Extracting data from success response for Medsaidabidi02');
      return response.data as T;
    }
    if ('data' in response) {
      console.log('✅ Extracting data property for Medsaidabidi02');
      return response.data as T;
    }
    if ('success' in response && response.success && 'result' in response) {
      console.log('✅ Extracting result from success response for Medsaidabidi02');
      return response.result as T;
    }
  }
  
  console.log('✅ Returning response as-is for Medsaidabidi02');
  return response as T;
};

export const getErrorMessage = (error: any): string => {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  return JSON.stringify(error).slice(0, 200);
};

export const formatError = (error: any): { message: string; details?: string } => {
  return {
    message: getErrorMessage(error),
    details: error?.stack || error?.details || undefined,
  };
};

console.log('🚀 API Client fully loaded for Medsaidabidi02 education-platform at 2025-09-09 16:14:44');