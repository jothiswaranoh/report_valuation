import { apiClient } from '../services/apiClient';

export interface Bank {
    id: string;
    name: string;
    created_at?: string;
}

export const banksApi = {
    getBanks: () => apiClient.get<Bank[]>('/api/v1/banks'),
    createBank: (name: string) => apiClient.post<Bank>('/api/v1/banks', { name }),
    updateBank: (id: string, name: string) => apiClient.put<Bank>(`/api/v1/banks/${id}`, { name }),
    deleteBank: (id: string) => apiClient.delete<{ success: boolean }>(`/api/v1/banks/${id}`),
};
