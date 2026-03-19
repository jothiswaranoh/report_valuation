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

            <div className="flex flex-wrap gap-8 justify-evenly mb-8 w-full px-12">
                <div className="group bg-white rounded-lg border border-brand-100 p-6 shadow-lg hover:shadow-xl hover:shadow-brand-200/40 transition-all duration-500 relative overflow-hidden flex flex-col items-center justify-center text-center aspect-square isolate w-full max-w-[14rem]">
                    <div className="w-14 h-14 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 mb-4 group-hover:scale-110 transition-transform duration-500">
                        <Users size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 mb-1 uppercase tracking-wider">Total Users</p>
                        <p className="text-4xl font-black text-slate-900">{totalUsers}</p>
                    </div>
                </div>

                <div className="group bg-white rounded-lg border border-brand-100 p-6 shadow-lg hover:shadow-xl hover:shadow-brand-200/40 transition-all duration-500 relative overflow-hidden flex flex-col items-center justify-center text-center aspect-square isolate w-full max-w-[14rem]">
                    <div className="w-14 h-14 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform duration-500">
                        <Shield size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 mb-1 uppercase tracking-wider">Active Roles</p>
                        <p className="text-4xl font-black text-slate-900">{rolesCount}</p>
                    </div>
                </div>

                <div className="group bg-white rounded-lg border border-brand-100 p-6 shadow-lg hover:shadow-xl hover:shadow-brand-200/40 transition-all duration-500 relative overflow-hidden flex flex-col items-center justify-center text-center aspect-square isolate w-full max-w-[14rem]">
                    <div className="w-14 h-14 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform duration-500">
                        <UserPlus size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 mb-1 uppercase tracking-wider">Administrators</p>
                        <p className="text-4xl font-black text-slate-900">{adminsCount}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
