import React from 'react';
import { Users, Edit2, Trash2, Plus } from 'lucide-react';
import { User } from '../../types/User';

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
            <div className="bg-white rounded-xl border border-secondary-200 p-12 text-center shadow-sm">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mb-4"></div>
                <p className="text-secondary-600">Loading users...</p>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-secondary-200 p-12 text-center shadow-sm">
                <div className="h-16 w-16 mx-auto bg-secondary-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-secondary-400" />
                </div>
                <h3 className="text-lg font-medium text-secondary-900 mb-2">
                    {searchTerm ? 'No matching users found' : 'No users yet'}
                </h3>
                <p className="text-secondary-600 mb-6 max-w-sm mx-auto">
                    {searchTerm ? 'Try a different search term' : 'Get started by adding your first user'}
                </p>
                {!searchTerm && (
                    <button
                        onClick={onAddClick}
                        className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg hover:bg-brand-700 transition"
                    >
                        <Plus size={18} />
                        Add First User
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden shadow-md">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-secondary-50 border-b border-secondary-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-black text-secondary-800 uppercase tracking-widest">
                                User
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-black text-secondary-800 uppercase tracking-widest">
                                Contact
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-black text-secondary-800 uppercase tracking-widest">
                                Roles
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-black text-secondary-800 uppercase tracking-widest">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-secondary-100">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-brand-50/10 transition-all duration-300">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="h-12 w-12 bg-brand-100 rounded-xl flex items-center justify-center mr-4 shadow-inner">
                                            <span className="text-lg font-black text-brand-800">
                                                {user.first_name?.[0]?.toUpperCase()}
                                                {user.last_name?.[0]?.toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-secondary-900 leading-tight">
                                                {user.first_name} {user.last_name}
                                            </p>
                                            <p className="text-xs text-secondary-400 font-mono mt-0.5 opacity-70">ID: {user.id.substring(0, 8)}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <p className="text-sm font-bold text-secondary-900 leading-tight">{user.email}</p>
                                        <p className="text-xs text-secondary-400 mt-0.5 font-medium">System account</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-2">
                                        {user.roles && user.roles.length > 0 ? (
                                            user.roles.map((role) => (
                                                <span
                                                    key={role}
                                                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm border ${role === 'admin'
                                                        ? 'bg-red-50 text-red-700 border-red-100'
                                                        : role === 'editor'
                                                            ? 'bg-green-50 text-green-700 border-green-100'
                                                            : 'bg-brand-50 text-brand-700 border-brand-100'
                                                        }`}
                                                >
                                                    {role}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-gray-400 italic">No roles</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => onEdit(user)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-600 hover:text-brand-800 hover:bg-brand-50 rounded-lg transition-all border border-transparent hover:border-brand-200 shadow-sm"
                                        >
                                            <Edit2 size={16} />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => onDelete(user.id)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-200 shadow-sm"
                                        >
                                            <Trash2 size={16} />
                                            Delete
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
