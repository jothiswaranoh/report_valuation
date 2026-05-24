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
        <div>
            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-2xl font-bold text-slate-900">People</h1>
                <p className="text-slate-500">Manage your team members and their permissions.</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="group bg-white rounded-xl border border-brand-100 px-6 py-4 shadow-sm hover:shadow-md hover:shadow-brand-200/40 transition-all duration-500 flex flex-row items-center gap-4 h-24">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0 group-hover:scale-110 transition-transform duration-500">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Total Users</p>
                        <p className="text-3xl font-black text-slate-900">{totalUsers}</p>
                    </div>
                </div>

                <div className="group bg-white rounded-xl border border-brand-100 px-6 py-4 shadow-sm hover:shadow-md hover:shadow-brand-200/40 transition-all duration-500 flex flex-row items-center gap-4 h-24">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0 group-hover:scale-110 transition-transform duration-500">
                        <Shield size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Active Roles</p>
                        <p className="text-3xl font-black text-slate-900">{rolesCount}</p>
                    </div>
                </div>

                <div className="group bg-white rounded-xl border border-brand-100 px-6 py-4 shadow-sm hover:shadow-md hover:shadow-brand-200/40 transition-all duration-500 flex flex-row items-center gap-4 h-24">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 transition-transform duration-500">
                        <UserPlus size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Administrators</p>
                        <p className="text-3xl font-black text-slate-900">{adminsCount}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
