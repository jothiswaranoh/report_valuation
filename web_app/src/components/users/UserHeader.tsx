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
        <div className="mb-10">
            <div className="flex items-center gap-4 mb-2">
                <div className="p-2.5 bg-brand-50 rounded-xl shadow-inner">
                    <Users className="h-8 w-8 text-brand-600" />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-secondary-900 tracking-tight">User Management</h1>
                    <p className="text-lg text-secondary-500 font-medium">Manage system users, roles, and permissions in one place</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white rounded-2xl p-6 border border-secondary-200 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-secondary-400 uppercase tracking-widest">Total Users</p>
                            <p className="text-4xl font-black text-secondary-900 mt-1">{totalUsers}</p>
                        </div>
                        <div className="h-14 w-14 bg-brand-50 rounded-xl flex items-center justify-center shadow-inner">
                            <Users className="h-7 w-7 text-brand-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-secondary-200 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-secondary-400 uppercase tracking-widest">Active Roles</p>
                            <p className="text-4xl font-black text-secondary-900 mt-1">{rolesCount}</p>
                        </div>
                        <div className="h-14 w-14 bg-brand-50 rounded-xl flex items-center justify-center shadow-inner">
                            <Shield className="h-7 w-7 text-brand-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-secondary-200 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-secondary-400 uppercase tracking-widest">Admins</p>
                            <p className="text-4xl font-black text-secondary-900 mt-1">{adminsCount}</p>
                        </div>
                        <div className="h-14 w-14 bg-brand-50 rounded-xl flex items-center justify-center shadow-inner">
                            <UserPlus className="h-7 w-7 text-brand-600" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
