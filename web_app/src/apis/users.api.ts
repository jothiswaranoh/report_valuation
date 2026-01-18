import { apiClient } from '../services/apiClient';
import type {
  User,
  Role,
  CreateUserRequest,
  UpdateUserRequest,
  GetUsersResponse,
} from '../types/User';

// Re-export types for consumers
export type { User, Role, CreateUserRequest, UpdateUserRequest, GetUsersResponse };

/* =========================
   API
========================= */

export const usersApi = {
  /**
   * GET /api/v1/users
   */
  getUsers: () =>
    apiClient.get<GetUsersResponse>('/api/v1/users'),

  /**
   * POST /api/v1/users
   */
  createUser: (data: CreateUserRequest) =>
    apiClient.post<User>('/api/v1/users', data),

  /**
   * GET /api/v1/users/{user_id}
   */
  getUserById: (userId: string) =>
    apiClient.get<User>(`/api/v1/users/${userId}`),

  /**
   * PUT /api/v1/users/{user_id}
   */
  updateUser: (userId: string, data: UpdateUserRequest) =>
    apiClient.put<User>(`/api/v1/users/${userId}`, data),

  /**
   * DELETE /api/v1/users/{user_id}
   */
  deleteUser: (userId: string) =>
    apiClient.delete<void>(`/api/v1/users/${userId}`),

  /**
   * GET /api/v1/roles
   */
  getRoles: () =>
    apiClient.get<Role[]>('/api/v1/roles'),

  /**
   * POST /api/v1/roles
   */
  createRole: (name: string) =>
    apiClient.post<Role>('/api/v1/roles', { name }),
};

export default usersApi;
