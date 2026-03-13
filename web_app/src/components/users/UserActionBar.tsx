import React from 'react';
import { Search, Plus } from 'lucide-react';

interface UserActionBarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onAddClick: () => void;
}

export const UserActionBar: React.FC<UserActionBarProps> = ({
    searchTerm,
    onSearchChange,
    onAddClick,
}) => {
    return (
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-sky-200 rounded-lg text-base focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none shadow-sm transition-all font-medium text-slate-900 placeholder:text-slate-400"
                />
            </div>

            <button
                onClick={onAddClick}
                className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white px-6 py-2.5 rounded-lg text-base font-bold shadow-lg shadow-sky-200 transition-all hover:-translate-y-0.5 w-full md:w-auto justify-center"
            >
                <Plus size={16} />
                Add User
            </button>
        </div>
    );
};
