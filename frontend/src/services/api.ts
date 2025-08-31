export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:5000') {
    this.baseURL = baseURL;
    console.log('🚀 ApiClient initialized with baseURL:', baseURL);
  }

  setToken(token: string, sessionToken?: string) {
    console.log('🔑 ApiClient: Setting token:', token ? token.substring(0, 30) + '...' : 'Empty token');
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('authToken', token); // Keep both for compatibility
      if (sessionToken) {
        localStorage.setItem('sessionToken', sessionToken);
        console.log('🎫 Session token stored');
      }
      console.log('✅ Tokens stored in localStorage');
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('sessionToken');
      console.log('🗑️ All tokens removed from localStorage');
    }
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔐 Adding Authorization header with token:', token.substring(0, 30) + '...');
    } else {
      console.log('⚠️ No token found in localStorage');
    }
    
    return headers;
  }

  // Handle session conflict errors globally
  private async handleResponse(response: Response): Promise<Response> {
    if (!response.ok) {
      try {
        const errorData = await response.clone().json();
        
        // Handle session-related errors
        if (errorData.code === 'SESSION_INACTIVE' || 
            errorData.code === 'SESSION_NOT_FOUND' ||
            errorData.code === 'SESSION_EXPIRED' ||
            errorData.error === 'Session invalide ou expirée' ||
            errorData.error === 'Session terminated. Please log in again.' ||
            errorData.error === 'Invalid session. Please log in again.') {
          
          console.warn('🚫 Session conflict detected:', errorData);
          
          // Clear all auth data
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
          localStorage.removeItem('sessionToken');
          
          // Show user-friendly message
          let message = 'Votre session a expiré. Veuillez vous reconnecter.';
          if (errorData.code === 'SESSION_INACTIVE') {
            message = 'Votre session a été terminée car vous vous êtes connecté depuis un autre onglet ou appareil.';
          } else if (errorData.code === 'SESSION_EXPIRED') {
            message = 'Votre session a expiré. Veuillez vous reconnecter.';
          }
          
          alert(message);
          
          // Redirect to login
          window.location.href = '/login';
          
          throw new Error(message);
        }
      } catch (parseError) {
        // If response is not JSON, continue with original error handling
      }
    }
    
    return response;
  }

  async login(credentials: { email: string; password: string }) {
    console.log('🔐 ApiClient: Login attempt for:', credentials.email);
    
    try {
      const response = await this.post('/api/auth/login', credentials);
      
      console.log('📡 Login response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Login failed:', errorText);
        throw new Error(errorText || 'Login failed');
      }

      const data = await response.json();
      console.log('✅ Login response data:', data);
      
      if (data.success && data.token) {
        // Store both JWT token and session token
        this.setToken(data.token, data.sessionToken);
        console.log('✅ Login successful, tokens set');
      } else {
        console.error('❌ Login response missing token or success flag');
        throw new Error('Invalid login response');
      }
      
      return data;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

  async logout() {
    console.log('🚪 ApiClient: Logout attempt');
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      if (token) {
        const response = await fetch(`${this.baseURL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📡 Logout response status:', response.status);
        
        if (!response.ok) {
          console.warn('⚠️ Logout API call failed, but continuing with local cleanup');
        }
      }
    } catch (error) {
      console.error('❌ Logout API error:', error);
      // Continue with logout even if API call fails
    } finally {
      // Always clear tokens regardless of API call success
      this.setToken(''); // This will remove all tokens
      console.log('✅ Logout completed, tokens cleared');
    }
  }

  async validateSession(): Promise<boolean> {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const sessionToken = localStorage.getItem('sessionToken');
    
    if (!token || !sessionToken) {
      console.log('❌ No tokens found for session validation');
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/api/auth/validate-session`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ Session validation successful');
        return true;
      } else {
        const errorData = await response.json();
        console.warn('❌ Session validation failed:', errorData);
        
        // Handle session errors
        await this.handleResponse(response);
        return false;
      }
    } catch (error) {
      console.error('❌ Session validation error:', error);
      return false;
    }
  }

  async get(endpoint: string): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    console.log('🔗 GET request to:', url);
    
    const headers = this.getAuthHeaders();
    console.log('📋 GET headers:', headers);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 GET response status:', response.status);
    
    // Handle session conflicts
    return await this.handleResponse(response);
  }

  async post(endpoint: string, data: any): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    console.log('🔗 POST request to:', url);
    
    const headers = this.getAuthHeaders();
    console.log('📋 POST headers:', headers);

    let response: Response;

    // Handle FormData differently
    if (data instanceof FormData) {
      console.log('📎 Sending FormData');
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: data,
      });
    } else {
      console.log('📄 Sending JSON data:', data);
      response = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    }

    console.log('📡 POST response status:', response.status);
    
    // Handle session conflicts
    return await this.handleResponse(response);
  }

  async put(endpoint: string, data: any): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    console.log('🔗 PUT request to:', url);
    
    const headers = this.getAuthHeaders();
    console.log('📋 PUT headers:', headers);

    let response: Response;

    // Handle FormData differently
    if (data instanceof FormData) {
      console.log('📎 Sending FormData via PUT');
      response = await fetch(url, {
        method: 'PUT',
        headers,
        body: data,
      });
    } else {
      console.log('📄 Sending JSON data via PUT:', data);
      response = await fetch(url, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    }

    console.log('📡 PUT response status:', response.status);
    
    // Handle session conflicts
    return await this.handleResponse(response);
  }

  async delete(endpoint: string): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    console.log('🔗 DELETE request to:', url);
    
    const headers = this.getAuthHeaders();
    console.log('📋 DELETE headers:', headers);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 DELETE response status:', response.status);
    
    // Handle session conflicts
    return await this.handleResponse(response);
  }
}

export const apiClient = new ApiClient();