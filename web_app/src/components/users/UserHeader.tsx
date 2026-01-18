import React from 'react';
import { Users, Shield, UserPlus } from 'lucide-react';

interface UserHeaderProps {
    totalUsers: number;
    rolesCount: number;
    adminsCount: number;
}

export const UserHeader: React.FC<UserHeaderProps> = ({
    totalUsers,
    rolesCount,
    adminsCount,
}) => {
    return (
        <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
                <Users className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            </div>
            <p className="text-gray-600">
                Manage system users, roles, and permissions in one place
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Users</p>
                            <p className="text-2xl font-semibold text-gray-900 mt-1">{totalUsers}</p>
                        </div>
                        <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Active Roles</p>
                            <p className="text-2xl font-semibold text-gray-900 mt-1">{rolesCount}</p>
                        </div>
                        <div className="h-12 w-12 bg-purple-50 rounded-lg flex items-center justify-center">
                            <Shield className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Admins</p>
                            <p className="text-2xl font-semibold text-gray-900 mt-1">{adminsCount}</p>
                        </div>
                        <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
                            <UserPlus className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
