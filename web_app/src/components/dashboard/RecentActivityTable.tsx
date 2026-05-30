import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ValuationReport } from '../../types';
import { formatDate } from '../../utils/formatDate';
import { getStatusColor } from './dashboardHelpers';

interface RecentActivityTableProps {
    recentReports: ValuationReport[];
    onReportClick: (report: ValuationReport) => void;
    onViewHistory: () => void;
}

export default function RecentActivityTable({ recentReports, onReportClick, onViewHistory }: RecentActivityTableProps) {
    const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

    return (
        <div className="lg:col-span-12 bg-white rounded-xl border border-brand-100 shadow-md overflow-hidden">
            <div className="px-8 py-6 border-b border-sky-50 bg-sky-50/30 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Recent Activity</h2>
                    <p className="text-sm text-slate-500 font-semibold mt-1">Track your latest generated reports and their status.</p>
                </div>
                <button
                    onClick={onViewHistory}
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
                            <th className="px-4 py-5 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sky-50">
                        {recentReports.length > 0 ? recentReports.map((report) => (
                            <React.Fragment key={report.id}>
                                <tr
                                    className="hover:bg-brand-50/30 cursor-pointer transition-all group"
                                    onClick={() => setExpandedReportId(expandedReportId === report.id ? null : report.id)}
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
                                    <td className="px-4 py-6 text-slate-400">
                                        {expandedReportId === report.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </td>
                                </tr>
                                {expandedReportId === report.id && (
                                    <tr className="bg-slate-50/50">
                                        <td colSpan={6} className="px-8 py-6 border-b border-sky-100">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-bold text-slate-900 mb-1">Generated Summary</h4>
                                                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap line-clamp-3">
                                                        {report.content?.summary}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onReportClick(report);
                                                    }}
                                                    className="shrink-0 bg-white hover:bg-brand-50 text-brand-600 border border-brand-200 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
                                                >
                                                    View Full Report
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        )) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                    No reports found. Start by creating a new analysis!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
