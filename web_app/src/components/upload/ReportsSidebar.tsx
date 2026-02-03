import { FileText, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { useReports } from '../../hooks/useReports';
import { ApiReport } from '../../apis/report.api';

interface ReportsSidebarProps {
    selectedReportId: string | null;
    onReportSelect: (reportId: string) => void;
}

export default function ReportsSidebar({ selectedReportId, onReportSelect }: ReportsSidebarProps) {
    const { data: reportsData, isLoading } = useReports();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    const reports = reportsData?.reports || [];

    return (
        <div className="h-full bg-white border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText size={24} />
                    All Reports
                </h2>
                <p className="text-indigo-100 text-sm mt-1">
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
                        {reports.map((report: ApiReport) => (
                            <button
                                key={report.id}
                                onClick={() => onReportSelect(report.id)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all group hover:shadow-md ${selectedReportId === report.id
                                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                                    : 'border-gray-200 hover:border-indigo-300 bg-white'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-semibold truncate ${selectedReportId === report.id
                                            ? 'text-indigo-900'
                                            : 'text-gray-900 group-hover:text-indigo-900'
                                            }`}>
                                            {report.name}
                                        </h3>
                                        {report.bank_name && (
                                            <p className="text-sm text-gray-600 mt-1 truncate">
                                                {report.bank_name}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                            <Calendar size={14} className="text-gray-500" />
                                            <span className="text-xs text-gray-600">
                                                {formatDate(report.created_at)}
                                            </span>
                                        </div>
                                        <div className="mt-2">
                                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${report.status === 'approved'
                                                ? 'bg-green-100 text-green-800'
                                                : report.status === 'review'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {report?.status?.charAt(0)?.toUpperCase() + report.status?.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight
                                        size={20}
                                        className={`flex-shrink-0 transition-transform ${selectedReportId === report.id
                                            ? 'text-indigo-600 translate-x-1'
                                            : 'text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1'
                                            }`}
                                    />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
