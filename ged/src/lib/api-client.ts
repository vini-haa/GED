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
    per_page: number;
    total: number;
    total_pages: number;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:4017/api/v1';
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<T> {
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

  delete<T>(path: string, options?: RequestInit) {
    return this.request<T>('DELETE', path, undefined, options);
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
