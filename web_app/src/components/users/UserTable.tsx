import React from 'react';
import { Users, Edit2, Trash2, Plus } from 'lucide-react';
import { User } from '../../types/User';
import Skeleton from 'react-loading-skeleton';

interface UserTableProps {
    users: User[];
    isLoading: boolean;
    searchTerm: string;
    onEdit: (user: User) => void;
    onDelete: (userId: string) => void;
    onAddClick: () => void;
}

export const UserTable: React.FC<UserTableProps> = ({
    users,
    isLoading,
    searchTerm,
    onEdit,
    onDelete,
    onAddClick,
}) => {
    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl border border-brand-100 overflow-hidden shadow-sm p-4 h-[400px]">
                <div className="flex flex-col gap-4">
                    <Skeleton height={40} className="w-full rounded-lg" />
                    <Skeleton height={60} count={4} className="w-full rounded-xl" style={{ marginBottom: '1rem' }} />
                </div>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="bg-slate-50/50 rounded-2xl border border-brand-100 p-12 text-center flex flex-col items-center">
                <div className="h-16 w-16 bg-white rounded-2xl shadow-sm border border-brand-100 flex items-center justify-center mb-6">
                    <Users className="h-8 w-8 text-brand-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {searchTerm ? 'No matching users found' : 'No users yet'}
                </h3>
                <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                    {searchTerm ? 'Try a different search term' : 'Get started by adding your first user'}
                </p>
                {!searchTerm && (
                    <button
                        onClick={onAddClick}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-700 to-brand-900 hover:from-brand-800 hover:to-brand-950 text-white px-6 py-2.5 rounded-xl text-base font-bold shadow-lg shadow-brand-300/40 transition-all hover:-translate-y-0.5 mt-2"
                    >
                        <Plus size={16} />
                        Add First User
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-brand-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/50">
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                User
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Role
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map((user) => (
                            <tr key={user.id} className="group odd:bg-brand-75 hover:bg-brand-100 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium text-sm">
                                            {user.first_name?.[0]?.toUpperCase()}
                                            {user.last_name?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">
                                                {user.first_name} {user.last_name}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-2">
                                        {user.roles && user.roles.length > 0 ? (
                                            user.roles.map((role) => (
                                                <span
                                                    key={role}
                                                    className={`px-2.5 py-1 text-xs font-medium rounded-full border ${role === 'admin'
                                                        ? 'bg-purple-50 text-purple-700 border-purple-100'
                                                        : 'bg-blue-50 text-blue-700 border-blue-100'
                                                        }`}
                                                >
                                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-slate-400">No roles</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onEdit(user)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit user"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(user.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete user"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
