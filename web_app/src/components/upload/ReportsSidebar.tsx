import { FileText, Calendar, ChevronRight } from 'lucide-react';
import { useReports } from '../../hooks/useReports';
import { ApiReport } from '../../apis/report.api';

import Skeleton from 'react-loading-skeleton';

interface ReportsSidebarProps {
    selectedReportId: string | null;
    onReportSelect: (reportId: string) => void;
}

export default function ReportsSidebar({ selectedReportId, onReportSelect }: ReportsSidebarProps) {
    const { data: reportsData, isLoading } = useReports();

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="h-full bg-white flex flex-col">
                <div className="p-6 border-b border-sky-100 bg-sky-50/50">
                    <Skeleton height={28} width={150} className="mb-2" />
                    <Skeleton height={16} width={100} />
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="p-4 rounded-lg border border-slate-100">
                            <Skeleton height={20} width="80%" className="mb-2" />
                            <Skeleton height={14} width="50%" className="mb-3" />
                            <div className="flex justify-between items-center">
                                <Skeleton height={12} width={80} />
                                <Skeleton height={20} width={60} borderRadius={10} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const reports = reportsData?.reports || [];

    return (
        <div className="h-full bg-white flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-sky-100 bg-sky-50/50">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                    <FileText size={24} className="text-sky-500" />
                    All Reports
                </h2>
                <p className="text-slate-500 text-sm mt-1 font-medium">
                    {reports.length} {reports.length === 1 ? 'report' : 'reports'} available
                </p>
            </div>

            {/* Reports List */}
            <div className="flex-1 overflow-y-auto">
                {reports.length === 0 ? (
                    <div className="p-6 text-center">
                        <FileText className="mx-auto text-gray-400 mb-3" size={48} />
                        <p className="text-gray-600 font-medium">No reports yet</p>
                        <p className="text-gray-500 text-sm mt-1">Create your first report to get started</p>
                    </div>
                ) : (
                    <div className="p-4 space-y-2">
                        {reports.map((report: ApiReport) => {
                            const status = (report as any).report_status ?? (report as any).status ?? 'draft';

                            const badgeClass =
                                status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : status === 'review'
                                        ? 'bg-orange-100 text-orange-800'
                                        : 'bg-sky-100 text-sky-800';

                            return (
                                <button
                                    key={report.id}
                                    onClick={() => onReportSelect(report.id)}
                                    className={`w-full text-left p-4 rounded-lg border transition-all group hover:shadow-soft ${selectedReportId === report.id
                                        ? 'border-sky-500 bg-sky-50 shadow-sm'
                                        : 'border-sky-100 hover:border-sky-300 bg-white'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h3
                                                className={`font-semibold truncate ${selectedReportId === report.id
                                                    ? 'text-sky-900'
                                                    : 'text-slate-900 group-hover:text-sky-600'
                                                    }`}
                                            >
                                                {report.report_name || report.name}
                                            </h3>

                                            {report.bank_name && (
                                                <p className="text-sm text-secondary-500 mt-1 truncate">{report.bank_name}</p>
                                            )}

                                            <div className="flex items-center gap-2 mt-2">
                                                <Calendar size={14} className="text-secondary-400" />
                                                <span className="text-xs text-secondary-500">{formatDate(report.created_at)}</span>
                                            </div>

                                            <div className="mt-2">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
                                                    {String(status).charAt(0).toUpperCase() + String(status).slice(1)}
                                                </span>
                                            </div>
                                        </div>

                                        <ChevronRight
                                            size={20}
                                            className={`flex-shrink-0 transition-transform ${selectedReportId === report.id
                                                ? 'text-sky-600 translate-x-1'
                                                : 'text-slate-300 group-hover:text-sky-500 group-hover:translate-x-1'
                                                }`}
                                        />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}