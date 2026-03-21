import { useState, useEffect } from 'react';
import { FileText, Calendar, ChevronRight, ChevronLeft, Search, X } from 'lucide-react';
import { useReports } from '../../hooks/useReports';
import { ApiReport } from '../../apis/report.api';
import Skeleton from 'react-loading-skeleton';

const PAGE_SIZE = 8;

interface ReportsSidebarProps {
    selectedReportId: string | null;
    onReportSelect: (reportId: string) => void;
}

export default function ReportsSidebar({ selectedReportId, onReportSelect }: ReportsSidebarProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search input — reset to page 1 on new search
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
            setCurrentPage(1);
        }, 350);
        return () => clearTimeout(t);
    }, [searchInput]);

    const { data: reportsData, isLoading, isFetching } = useReports({
        page: currentPage,
        page_size: PAGE_SIZE,
        search: debouncedSearch || undefined,
    });

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const reports = reportsData?.reports || [];
    const total = reportsData?.total ?? 0;
    const totalPages = reportsData?.total_pages ?? 1;

    const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
    const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

    const getBadgeClass = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-100 text-emerald-800';
            case 'review': return 'bg-orange-100 text-orange-800';
            case 'process': return 'bg-blue-100 text-blue-800';
            default: return 'bg-sky-100 text-sky-800';
        }
    };

    return (
        <div className="h-full bg-white flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-sky-100 bg-sky-50/50">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 tracking-tight mb-3">
                    <FileText size={22} className="text-sky-500" />
                    All Reports
                </h2>

                {/* Search Input */}
                <div className="relative group">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors pointer-events-none"
                    />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        placeholder="Search by name or bank…"
                        className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-sky-200 rounded-lg
                            focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400
                            placeholder-slate-400 text-slate-800 font-medium transition-all"
                    />
                    {searchInput && (
                        <button
                            onClick={() => setSearchInput('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Result count */}
                <p className="text-slate-500 text-xs mt-2 font-medium">
                    {isFetching && !isLoading && (
                        <span className="inline-block w-2 h-2 rounded-full bg-sky-400 animate-pulse mr-1.5" />
                    )}
                    {total} {total === 1 ? 'report' : 'reports'}
                    {debouncedSearch && <span className="text-sky-600"> for "{debouncedSearch}"</span>}
                </p>
            </div>

            {/* Reports List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="p-4 rounded-lg border border-slate-100">
                                <Skeleton height={18} width="75%" className="mb-2" />
                                <Skeleton height={13} width="50%" className="mb-3" />
                                <div className="flex justify-between items-center">
                                    <Skeleton height={12} width={80} />
                                    <Skeleton height={18} width={55} borderRadius={10} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : reports.length === 0 ? (
                    <div className="p-8 flex flex-col items-center justify-center text-center">
                        <div className="w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center mb-3">
                            <FileText className="text-sky-300" size={28} />
                        </div>
                        <p className="text-slate-700 font-semibold">
                            {debouncedSearch ? 'No results found' : 'No reports yet'}
                        </p>
                        <p className="text-slate-400 text-sm mt-1">
                            {debouncedSearch
                                ? `No reports match "${debouncedSearch}"`
                                : 'Create your first report to get started'}
                        </p>
                        {debouncedSearch && (
                            <button
                                onClick={() => setSearchInput('')}
                                className="mt-3 text-xs font-semibold text-sky-500 hover:text-sky-700 underline underline-offset-2"
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={`p-4 space-y-2 transition-opacity duration-150 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
                        {reports.map((report: ApiReport) => {
                            const status = (report as any).report_status ?? (report as any).status ?? 'draft';
                            return (
                                <button
                                    key={report.id}
                                    onClick={() => onReportSelect(report.id)}
                                    className={`w-full text-left p-4 rounded-lg border transition-all group hover:shadow-md ${selectedReportId === report.id
                                            ? 'border-sky-500 bg-sky-50 shadow-sm'
                                            : 'border-sky-100 hover:border-sky-300 bg-white'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-semibold truncate text-sm leading-snug ${selectedReportId === report.id
                                                    ? 'text-sky-900'
                                                    : 'text-slate-900 group-hover:text-sky-600'
                                                }`}>
                                                {report.report_name || report.name}
                                            </h3>

                                            {report.bank_name && (
                                                <p className="text-xs text-slate-500 mt-0.5 truncate">{report.bank_name}</p>
                                            )}

                                            <div className="flex items-center gap-3 mt-2">
                                                <div className="flex items-center gap-1 text-slate-400">
                                                    <Calendar size={12} />
                                                    <span className="text-xs">{formatDate(report.created_at)}</span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getBadgeClass(status)}`}>
                                                    {String(status).charAt(0).toUpperCase() + String(status).slice(1)}
                                                </span>
                                            </div>
                                        </div>

                                        <ChevronRight
                                            size={18}
                                            className={`flex-shrink-0 mt-0.5 transition-transform ${selectedReportId === report.id
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

            {/* Pagination Footer */}
            {totalPages > 1 && (
                <div className="shrink-0 border-t border-sky-100 bg-white px-4 py-3 flex items-center justify-between gap-2">
                    <button
                        onClick={handlePrev}
                        disabled={currentPage <= 1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                            disabled:opacity-40 disabled:cursor-not-allowed
                            bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 active:scale-95"
                    >
                        <ChevronLeft size={14} />
                        Prev
                    </button>

                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                            .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, idx) =>
                                p === 'ellipsis' ? (
                                    <span key={`e-${idx}`} className="px-1 text-slate-400 text-xs font-bold">…</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => setCurrentPage(p as number)}
                                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all active:scale-95 ${currentPage === p
                                                ? 'bg-sky-500 text-white shadow-sm'
                                                : 'text-slate-600 hover:bg-sky-50'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                )
                            )}
                    </div>

                    <button
                        onClick={handleNext}
                        disabled={currentPage >= totalPages}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                            disabled:opacity-40 disabled:cursor-not-allowed
                            bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 active:scale-95"
                    >
                        Next
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}