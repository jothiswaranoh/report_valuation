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
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading users...</p>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                <div className="h-16 w-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No matching users found' : 'No users yet'}
                </h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                    {searchTerm ? 'Try a different search term' : 'Get started by adding your first user'}
                </p>
                {!searchTerm && (
                    <button
                        onClick={onAddClick}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition"
                    >
                        <Plus size={18} />
                        Add First User
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                User
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Contact
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Roles
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                            <span className="font-medium text-blue-800">
                                                {user.first_name?.[0]?.toUpperCase()}
                                                {user.last_name?.[0]?.toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {user.first_name} {user.last_name}
                                            </p>
                                            <p className="text-sm text-gray-500 font-mono">ID: {user.id.substring(0, 8)}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="text-gray-900">{user.email}</p>
                                        <p className="text-sm text-gray-500">System account</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-2">
                                        {user.roles && user.roles.length > 0 ? (
                                            user.roles.map((role) => (
                                                <span
                                                    key={role}
                                                    className={`px-3 py-1 text-xs font-medium rounded-full ${role === 'admin'
                                                            ? 'bg-red-100 text-red-800'
                                                            : role === 'editor'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-blue-100 text-blue-800'
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
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                        >
                                            <Edit2 size={16} />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => onDelete(user.id)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
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
