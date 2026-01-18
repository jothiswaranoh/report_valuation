import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import usersApi from '../apis/users.api';
import type { CreateUserRequest, UpdateUserRequest, User } from '../types/User';

/* =========================
   Query Keys
========================= */

const USERS_KEY = ['users'];
const USER_KEY = (id: string) => ['users', id];
const ROLES_KEY = ['roles'];

/* =========================
   Hooks
========================= */

/**
 * Get all users
 */
export function useUsers() {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: usersApi.getUsers,
  });
}

/**
 * Get single user
 */
export function useUser(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? USER_KEY(userId) : [],
    queryFn: () => usersApi.getUserById(userId as string),
    enabled: !!userId,
  });
}

/**
 * Create user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserRequest) =>
      usersApi.createUser(data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}

/**
 * Update user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: UpdateUserRequest;
    }) => usersApi.updateUser(userId, data),

    onSuccess: (updatedUser: User) => {
      queryClient.setQueryData(USER_KEY(updatedUser.id), updatedUser);
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}

/**
 * Delete user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      usersApi.deleteUser(userId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}

/**
 * Get roles
 */
export function useRoles() {
  return useQuery({
    queryKey: ROLES_KEY,
    queryFn: usersApi.getRoles,
  });
}

/**
 * Create role
 */
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleName: string) =>
      usersApi.createRole(roleName),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_KEY });
    },
  });
}
