// Centralized API client for the frontend
// - Attaches Authorization header from localStorage on every request
// - Handles JSON vs FormData bodies
// - Provides safe, masked logging for debugging
// - Does NOT auto-clear auth on 401/403 (client code should handle re-login UI)
// - Includes upload helper with progress using XHR

type JsonObject = { [key: string]: any };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    console.log(`🔌 API Client initialized for ${getCurrentUserTag()} with base URL: ${baseUrl}`);
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

  // The single request entrypoint used by get/post/put/delete
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = this.buildUrl(endpoint);
    console.log(`🔍 Making ${options.method || 'GET'} request for ${getCurrentUserTag()} to: ${url}`);

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
        const token = localStorage.getItem('authToken');
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
      console.error(`❌ Network error while requesting ${url}:`, networkErr);
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
        console.warn('🔐 Unauthorized response:', serverMessage);
        throw new Error(serverMessage || 'Authentication required. Please log in again.');
      } else {
        console.warn('⛔ Forbidden response:', serverMessage);
        throw new Error(serverMessage || 'Forbidden');
      }
    }

    // If response is not OK, try to parse JSON error
    if (!response.ok) {
      const text = await response.text();
      try {
        const parsed = text ? JSON.parse(text) : null;
        const message = parsed?.message || parsed?.error || text || `HTTP error ${response.status}`;
        console.error('❌ Error response:', message);
        throw new Error(message);
      } catch (err) {
        console.error('❌ Error response (non-JSON):', text);
        throw new Error(text || `HTTP error ${response.status}`);
      }
    }

    // If caller expects JSON, parse and return
    if (isJson) {
      try {
        const data = await response.json();
        return data as T;
      } catch (err) {
        console.error('❌ Failed to parse JSON response from', url, err);
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
    // If sending JSON, ensure caller likely intends application/json; request() will ensure header if absent.
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
    console.log(`📤 Starting upload for ${getCurrentUserTag()} to: ${url}`);

    return new Promise<T>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);

      // Attach Authorization header from localStorage
      try {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('authToken');
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
            resolve(parsed as T);
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
      localStorage.removeItem('user');
      console.log(`🗑️ Auth data cleared for ${getCurrentUserTag()}`);
    }
  }
}

// Helper to identify developer/user in logs (non-sensitive)
function getCurrentUserTag() {
  try {
    if (typeof window === 'undefined') return 'client';
    const u = localStorage.getItem('user');
    if (!u) return 'guest';
    const parsed = JSON.parse(u);
    return parsed?.email || parsed?.name || 'user';
  } catch {
    return 'user';
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
      console.log('🔑 Auth token stored in localStorage');
    }
  },

  removeAuthToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      console.log('🗑️ Auth token removed from localStorage');
    }
  },

  getAuthToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  },

  setUserData: (user: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
      console.log('👤 User data stored:', user?.email || user?.name || 'unknown');
    }
  },

  getUserData: (): any | null => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('❌ Error parsing user data from localStorage', e);
        return null;
      }
    }
    return null;
  },

  isAuthenticated: (): boolean => {
    const token = apiUtils.getAuthToken();
    const ok = !!token;
    console.log(`🔍 Authentication check: ${ok ? 'authenticated' : 'not authenticated'}`);
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

// Extract data from API responses consistently
export const handleApiResponse = <T = any>(response: any): T => {
  // If API returns { success: true, data: ... } use data
  if (response && typeof response === 'object') {
    if ('data' in response) return response.data as T;
    if ('success' in response && response.success && 'result' in response) return response.result as T;
    return response as T;
  }
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