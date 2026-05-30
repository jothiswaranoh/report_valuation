import React from 'react';
import {
    FileText,
    Clock,
    CheckCircle,
    FileSearch,
    TrendingUp
} from 'lucide-react';
import { DashboardStats } from '../../types';

interface StatCardsGridProps {
    stats: DashboardStats;
    onNavigate: (path: string) => void;
}

export default function StatCardsGrid({ stats, onNavigate }: StatCardsGridProps) {
    const statCards = [
        {
            label: 'Total Reports',
            value: stats.totalReports,
            icon: <FileText size={20} />,
            color: 'text-brand-600',
            bg: 'bg-brand-100',
            border: 'border-brand-200',
            circleBg: 'bg-brand-300',
            trendColor: 'bg-brand-100 text-brand-700',
            trend: 'All generated reports',
            path: '/list'
        },
        {
            label: 'Draft',
            value: stats.draftReports,
            icon: <Clock size={20} />,
            color: 'text-amber-500',
            bg: 'bg-amber-100',
            border: 'border-amber-200',
            circleBg: 'bg-amber-300',
            trendColor: 'bg-amber-100 text-amber-700',
            trend: 'Awaiting file uploads',
            path: '/list?status=draft'
        },
        {
            label: 'Process',
            value: stats.processReports,
            icon: <TrendingUp size={20} />,
            color: 'text-blue-500',
            bg: 'bg-blue-100',
            border: 'border-blue-200',
            circleBg: 'bg-blue-300',
            trendColor: 'bg-blue-100 text-blue-700',
            trend: 'Ready for AI analysis',
            path: '/list?status=process'
        },
        {
            label: 'In Review',
            value: stats.reviewReports,
            icon: <FileSearch size={20} />,
            color: 'text-orange-500',
            bg: 'bg-orange-100',
            border: 'border-orange-200',
            circleBg: 'bg-orange-300',
            trendColor: 'bg-orange-100 text-orange-700',
            trend: 'Pending your approval',
            path: '/list?status=review'
        },
        {
            label: 'Approved',
            value: stats.approvedReports,
            icon: <CheckCircle size={20} />,
            color: 'text-emerald-500',
            bg: 'bg-emerald-100',
            border: 'border-emerald-200',
            circleBg: 'bg-emerald-300',
            trendColor: 'bg-emerald-100 text-emerald-700',
            trend: 'Finalized reports',
            path: '/list?status=approved'
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {statCards.map((card, index) => (
                <div
                    key={card.label}
                    onClick={() => onNavigate(card.path)}
                    className="cursor-pointer group bg-white rounded-xl border border-brand-100 p-6 shadow-lg hover:shadow-2xl hover:shadow-brand-200/40 transition-all duration-500 relative overflow-hidden hover:border-brand-200 isolate"
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    <div className="flex items-start justify-between gap-3 relative z-10">
                        <div className={`${card.bg} ${card.color} ${card.border} p-4 rounded-xl border group-hover:scale-110 transition-transform duration-500 shadow-md`}>
                            {React.cloneElement(card.icon as React.ReactElement, { size: 24 })}
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">{card.label}</span>
                            <span className="text-3xl font-bold text-slate-900 tracking-tight leading-none">{card.value}</span>
                        </div>
                    </div>
                    <div className="mt-8 flex items-center justify-start relative z-10">
                        <div className={`text-xs font-bold px-3 py-1 rounded-full ${card.trendColor}`}>
                            {card.trend}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
