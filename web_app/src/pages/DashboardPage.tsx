import React, { useMemo } from 'react';
import {
    FileText,
    Clock,
    CheckCircle,
    FileSearch,
    TrendingUp,
    Activity
} from 'lucide-react';
import { DashboardStats, ValuationReport, ReportStatus, PropertyType } from '../types';
import { formatDate } from '../utils/formatDate';
import { mockDashboardStats } from '../data/mockData';
import { useNavigate } from "react-router-dom";
import { useReports } from '../hooks/useReports';
import { ApiReport } from '../apis/report.api';

export default function DashboardPage() {
    // Poll every 5s so importing status cards appear/disappear without manual refresh
    const { data: reportsData, isLoading } = useReports({ refetchInterval: 5000 });
    const navigate = useNavigate();

    const handleReportClick = (report: ValuationReport) => {
        switch (report.status) {
            case 'draft':
                navigate(`/upload/${report.id}?step=upload`);
                break;
            case 'process':
                navigate(`/upload/${report.id}?step=select`);
                break;
            case 'review':
                navigate(`/reports/${report.id}/edit`);
                break;
            case 'approved':
                navigate(`/reports/${report.id}/review`);
                break;
            default:
                navigate(`/upload/${report.id}`);
        }
    };

    // Stats calculation based on real data
    const stats: DashboardStats = useMemo(() => {
        if (!reportsData?.reports) return mockDashboardStats;

        const reports = reportsData.reports;
        return {
            totalReports: reports.length,
            draftReports: reports.filter(r => (r.report_status || r.status) === 'draft').length,
            processReports: reports.filter(r => (r.report_status || r.status) === 'process').length,
            reviewReports: reports.filter(r => (r.report_status || r.status) === 'review').length,
            approvedReports: reports.filter(r => (r.report_status || r.status) === 'approved').length,
            recentUploads: reports.filter(r => {
                const diff = new Date().getTime() - new Date(r.created_at).getTime();
                return diff < 7 * 24 * 60 * 60 * 1000;
            }).length
        };
    }, [reportsData]);

    const recentReports: ValuationReport[] = useMemo(() => {
        if (!reportsData?.reports) return [];

        let mappedReports = [...reportsData.reports]
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            .slice(0, 5) // Show only latest 5
            .map((r: ApiReport) => ({
                id: r.id,
                customerName: (r as any).report_name || r.customer_name || r.name || (r as any).property_owner || r.bank_name || 'Untitled Report',
                bankName: r.bank_name || 'Unknown Bank',
                propertyType: (r.property_type as PropertyType) || 'Residential',
                location: r.location || 'Unknown Location',
                status: ((r.report_status || r.status) as ReportStatus) || 'draft',
                createdAt: new Date(r.created_at),
                updatedAt: new Date(r.updated_at),
                year: new Date(r.created_at).getFullYear().toString(),
                month: (new Date(r.created_at).getMonth() + 1).toString().padStart(2, '0'),
                files: [], // Not needed for dashboard table
                metadata: {} as any,
                content: {} as any,
                comments: [],
                auditTrail: [],
            }));

        return mappedReports;
    }, [reportsData]);

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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'review': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    if (isLoading) {
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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                    <p className="text-slate-600 font-semibold mt-1">Overview of valuation reports and system activity</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/upload')}
                        className="bg-white text-sky-600 border-2 border-sky-100 hover:bg-sky-50 px-6 py-2.5 rounded-lg text-base font-bold flex items-center gap-2 shadow-sm transition-all hover:-translate-y-0.5 active:scale-95"
                    >
                        <FileSearch size={18} />
                        New Analysis
                    </button>
                    <button
                        onClick={() => navigate('/current-report')}
                        className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white px-6 py-2.5 rounded-lg text-base font-bold flex items-center gap-2 shadow-lg shadow-sky-200 transition-all hover:-translate-y-0.5"
                    >
                        <Activity size={18} />
                        Current Report
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {statCards.map((card, index) => (
                    <div
                        key={card.label}
                        onClick={() => navigate(card.path)}
                        className="cursor-pointer group bg-white rounded-xl border border-brand-100 p-6 shadow-lg hover:shadow-2xl hover:shadow-brand-200/40 transition-all duration-500 relative overflow-hidden hover:border-brand-200 isolate"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-start justify-between relative z-10">
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

            {/* Main Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Tables / Recent Reports */}
                <div className="lg:col-span-12 bg-white rounded-xl border border-brand-100 shadow-md overflow-hidden">
                    <div className="px-8 py-6 border-b border-sky-50 bg-sky-50/30 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Recent Activity</h2>
                            <p className="text-sm text-slate-500 font-semibold mt-1">Track your latest generated reports and their status.</p>
                        </div>
                        <button
                            onClick={() => navigate('/history')}
                            className="text-sm font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-6 py-2.5 rounded-lg transition-all border border-brand-100 active:scale-95"
                        >
                            View Full History
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-sky-50/50 border-b border-sky-100">
                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-[0.15em] w-1/4">
                                        Customer / Report
                                    </th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">
                                        Bank / Issuer
                                    </th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">
                                        Property Details
                                    </th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">
                                        Status
                                    </th>
                                    <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">
                                        Last Updated
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sky-50">
                                {recentReports.length > 0 ? recentReports.map((report) => (
                                    <tr
                                        key={report.id}
                                        className="hover:bg-brand-50/30 cursor-pointer transition-all group"
                                        onClick={() => handleReportClick(report)}
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                                                    {report.customerName[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-base font-bold text-slate-900 truncate group-hover:text-brand-600 transition-colors">{report.customerName}</div>
                                                    <div className="text-xs text-slate-400 font-bold truncate uppercase tracking-tight mt-0.5">{report.id.substring(0, 8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-base text-slate-600 font-bold tracking-tight">{report.bankName}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-base text-slate-600 font-semibold tracking-tight">{report.propertyType}</div>
                                            <div className="text-sm text-slate-400 font-medium mt-0.5">{report.location}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${getStatusColor(report.status)} shadow-sm`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="text-base text-slate-900 font-bold">{formatDate(report.updatedAt, 'short')}</div>
                                            <div className="text-xs text-slate-400 font-semibold mt-0.5 uppercase tracking-wide">Last active</div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                            No reports found. Start by creating a new analysis!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}