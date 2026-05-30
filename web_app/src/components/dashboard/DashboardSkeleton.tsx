import React from 'react';

export default function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                    <p className="text-slate-600 font-semibold mt-1">Overview of valuation reports and system activity</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-80 bg-slate-200 animate-pulse rounded-lg" />
                    <div className="h-10 w-10 bg-slate-200 animate-pulse rounded-lg" />
                    <div className="h-10 w-36 bg-slate-200 animate-pulse rounded-lg" />
                </div>
            </div>

            {/* Skeleton Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm h-36 flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                            <div className="w-12 h-12 rounded-xl bg-slate-200 animate-pulse" />
                            <div className="flex flex-col items-end gap-2">
                                <div className="w-16 h-3 bg-slate-200 animate-pulse rounded-full" />
                                <div className="w-8 h-8 bg-slate-200 animate-pulse rounded-full" />
                            </div>
                        </div>
                        <div className="w-20 h-5 bg-slate-200 animate-pulse rounded-full mt-auto" />
                    </div>
                ))}
            </div>

            {/* Skeleton Main Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-12 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                    <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="w-32 h-6 bg-slate-200 animate-pulse rounded-full" />
                            <div className="w-64 h-3 bg-slate-200 animate-pulse rounded-full" />
                        </div>
                        <div className="w-24 h-10 bg-slate-200 animate-pulse rounded-lg" />
                    </div>
                    <div className="p-8 space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-6 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                <div className="flex items-center gap-4 w-1/4">
                                    <div className="w-12 h-12 rounded-lg bg-slate-200 animate-pulse shrink-0" />
                                    <div className="space-y-2 w-full">
                                        <div className="w-2/3 h-4 bg-slate-200 animate-pulse rounded-full" />
                                        <div className="w-1/3 h-3 bg-slate-200 animate-pulse rounded-full" />
                                    </div>
                                </div>
                                <div className="w-1/4"><div className="w-24 h-4 bg-slate-200 animate-pulse rounded-full" /></div>
                                <div className="w-1/4 space-y-2">
                                    <div className="w-20 h-4 bg-slate-200 animate-pulse rounded-full" />
                                    <div className="w-16 h-3 bg-slate-200 animate-pulse rounded-full" />
                                </div>
                                <div className="w-1/6"><div className="w-16 h-6 bg-slate-200 animate-pulse rounded-full" /></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
