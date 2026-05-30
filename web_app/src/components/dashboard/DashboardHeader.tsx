import React from 'react';
import { FileSearch, Activity } from 'lucide-react';

interface DashboardHeaderProps {
    onNewAnalysis: () => void;
    onCurrentReport: () => void;
}

export default function DashboardHeader({ onNewAnalysis, onCurrentReport }: DashboardHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                <p className="text-slate-600 font-semibold mt-1">Overview of valuation reports and system activity</p>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={onNewAnalysis}
                    className="bg-white text-sky-600 border-2 border-sky-100 hover:bg-sky-50 px-6 py-2.5 rounded-lg text-base font-bold flex items-center gap-2 shadow-sm transition-all hover:-translate-y-0.5 active:scale-95"
                >
                    <FileSearch size={18} />
                    New Analysis
                </button>
                <button
                    onClick={onCurrentReport}
                    className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white px-6 py-2.5 rounded-lg text-base font-bold flex items-center gap-2 shadow-lg shadow-sky-200 transition-all hover:-translate-y-0.5"
                >
                    <Activity size={18} />
                    Current Report
                </button>
            </div>
        </div>
    );
}
