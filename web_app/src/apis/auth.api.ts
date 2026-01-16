import { apiClient } from '../services/apiClient';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
}

export const authApi = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        return apiClient.post<LoginResponse>('/api/v1/auth/login', credentials);
    },

    register: async (data: RegisterRequest): Promise<LoginResponse> => {
        return apiClient.post<LoginResponse>('/api/v1/auth/register', data);
    },

    logout: async (): Promise<void> => {
        await apiClient.post<void>('/api/v1/auth/logout');
        localStorage.removeItem('auth_token');
    },

    refreshToken: async (): Promise<{ access_token: string }> => {
        return apiClient.post<{ access_token: string }>('/api/v1/auth/refresh');
    },

    getCurrentUser: async (): Promise<LoginResponse['user']> => {
        return apiClient.get<LoginResponse['user']>('/api/v1/auth/me');
    },
};

export default authApi;
