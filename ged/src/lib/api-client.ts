type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

function isTokenExpired(): boolean {
  if (typeof window === 'undefined') return false;
  const expiresAt = localStorage.getItem('auth_expires_at');
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() <= Date.now();
}

function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_expires_at');
}

function redirectToLogin() {
  if (typeof window === 'undefined') return;
  const currentPath = window.location.pathname;
  if (currentPath !== '/login') {
    clearAuth();
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || '/api';
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  logout() {
    clearAuth();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !isTokenExpired();
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<T> {
    // Verificar expiração antes de requests autenticados
    if (isTokenExpired() && !path.startsWith('/auth/')) {
      redirectToLogin();
      throw { code: 'TOKEN_EXPIRED', message: 'Sessão expirada' } as ApiError;
    }

    const url = `${this.baseUrl}${path}`;
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

    if (!response.ok) {
      // 401 = token inválido/expirado no servidor
      if (response.status === 401 && !path.startsWith('/auth/')) {
        redirectToLogin();
        throw { code: 'UNAUTHORIZED', message: 'Sessão expirada' } as ApiError;
      }

      const errorBody = await response.json().catch(() => null);
      const apiError: ApiError = errorBody?.error || {
        code: 'UNKNOWN_ERROR',
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
      throw apiError;
    }

    if (response.status === 204) return undefined as T;

    return response.json();
  }

  get<T>(path: string, options?: RequestInit) {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(path: string, body: unknown, options?: RequestInit) {
    return this.request<T>('POST', path, body, options);
  }

  put<T>(path: string, body: unknown, options?: RequestInit) {
    return this.request<T>('PUT', path, body, options);
  }

  patch<T>(path: string, body: unknown, options?: RequestInit) {
    return this.request<T>('PATCH', path, body, options);
  }

  delete<T>(path: string, body?: unknown, options?: RequestInit) {
    return this.request<T>('DELETE', path, body, options);
  }

  async upload<T>(path: string, formData: FormData, options?: RequestInit) {
    const url = `${this.baseUrl}${path}`;
    const token = this.getToken();

    const headers: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      ...options,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const apiError: ApiError = errorBody?.error || {
        code: 'UPLOAD_ERROR',
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
      throw apiError;
    }

    return response.json() as Promise<T>;
  }
}

export const apiClient = new ApiClient();
