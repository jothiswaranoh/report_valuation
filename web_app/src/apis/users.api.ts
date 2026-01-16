import { apiClient } from '../services/apiClient';

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
    updated_at: string;
}

export interface CreateUserRequest {
    email: string;
    password: string;
    name: string;
    role: string;
}

export interface UpdateUserRequest {
    email?: string;
    name?: string;
    role?: string;
}

export interface UsersListResponse {
    users: User[];
    total: number;
    page: number;
    per_page: number;
}

export const usersApi = {
    getAll: async (page = 1, perPage = 10): Promise<UsersListResponse> => {
        return apiClient.get<UsersListResponse>(`/api/v1/users?page=${page}&per_page=${perPage}`);
    },

    getById: async (userId: string): Promise<User> => {
        return apiClient.get<User>(`/api/v1/users/${userId}`);
    },

    create: async (data: CreateUserRequest): Promise<User> => {
        return apiClient.post<User>('/api/v1/users', data);
    },

    update: async (userId: string, data: UpdateUserRequest): Promise<User> => {
        return apiClient.patch<User>(`/api/v1/users/${userId}`, data);
    },

    delete: async (userId: string): Promise<void> => {
        return apiClient.delete<void>(`/api/v1/users/${userId}`);
    },
};

export default usersApi;
