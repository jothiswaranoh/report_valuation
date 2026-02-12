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
        <div className="bg-white rounded-xl border border-secondary-200 p-5 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        className="w-full pl-12 pr-6 py-3 border border-secondary-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all text-base font-medium bg-secondary-50/20"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                <button
                    onClick={onAddClick}
                    className="flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-xl hover:bg-brand-700 transition-all duration-300 font-bold text-base shadow-lg shadow-brand-100 transform hover:-translate-y-0.5"
                >
                    <Plus size={20} />
                    Add New User
                </button>
            </div>
        </div>
    );
};
