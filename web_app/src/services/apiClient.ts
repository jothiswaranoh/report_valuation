import config from '../config/config';

export interface APIError {
    message: string;
    status: number;
    details?: unknown;
}

export interface RequestConfig {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    headers?: Record<string, string>;
    body?: unknown;
    signal?: AbortSignal;
}

class APIClient {
    private baseUrl: string;
    private defaultHeaders: Record<string, string>;

    constructor() {
        this.baseUrl = config.apiBaseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }

    private getAuthToken(): string | null {
        // Retrieve auth token from localStorage or other storage
        return localStorage.getItem('auth_token');
    }

    private buildHeaders(customHeaders?: Record<string, string>): Headers {
        const headers = new Headers({
            ...this.defaultHeaders,
            ...customHeaders,
        });

        const token = this.getAuthToken();
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        return headers;
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error: APIError = {
                message: errorData.detail || errorData.message || `HTTP error! status: ${response.status}`,
                status: response.status,
                details: errorData,
            };
            throw error;
        }

        // Handle empty responses
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return {} as T;
        }

        return response.json();
    }

    async request<T>(endpoint: string, options: RequestConfig = {}): Promise<T> {
        const { method = 'GET', headers, body, signal } = options;

        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

        const requestHeaders = this.buildHeaders(headers);

        // Remove Content-Type for FormData (browser will set it with boundary)
        if (body instanceof FormData) {
            requestHeaders.delete('Content-Type');
        }

        const fetchOptions: RequestInit = {
            method,
            headers: requestHeaders,
            signal,
        };

        if (body) {
            fetchOptions.body = body instanceof FormData ? body : JSON.stringify(body);
        }

        try {
            const response = await fetch(url, fetchOptions);
            return this.handleResponse<T>(response);
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw { message: 'Request was cancelled', status: 0 } as APIError;
            }
            throw error;
        }
    }

    async get<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET', signal });
    }

    async post<T>(endpoint: string, body?: unknown, signal?: AbortSignal): Promise<T> {
        return this.request<T>(endpoint, { method: 'POST', body, signal });
    }

    async put<T>(endpoint: string, body?: unknown): Promise<T> {
        return this.request<T>(endpoint, { method: 'PUT', body });
    }

    async patch<T>(endpoint: string, body?: unknown): Promise<T> {
        return this.request<T>(endpoint, { method: 'PATCH', body });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    async uploadFile<T>(endpoint: string, file: File, fieldName = 'file'): Promise<T> {
        const formData = new FormData();
        formData.append(fieldName, file);
        return this.request<T>(endpoint, { method: 'POST', body: formData });
    }

    async downloadBlob(endpoint: string): Promise<Blob> {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        const headers = this.buildHeaders();

        const response = await fetch(url, { headers });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw {
                message: errorData.detail || `HTTP error! status: ${response.status}`,
                status: response.status,
            } as APIError;
        }

        return response.blob();
    }

    createEventSource(endpoint: string): EventSource {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        return new EventSource(url);
    }
}

// Singleton instance
export const apiClient = new APIClient();

export default apiClient;
