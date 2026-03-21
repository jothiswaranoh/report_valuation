import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useReports } from '../hooks/useReports';
import { ApiReport } from '../apis/report.api';
import { ValuationReport, ReportStatus, PropertyType } from '../types';
import { formatDate } from '../utils/formatDate';
import Skeleton from 'react-loading-skeleton';

const PAGE_SIZE = 15;

export default function ReportListPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const statusFilter = searchParams.get('status') as ReportStatus | null;

    const [currentPage, setCurrentPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search — reset to page 1 on new search
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
            setCurrentPage(1);
        }, 350);
        return () => clearTimeout(t);
    }, [searchInput]);

    // Reset page when status filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter]);

    const { data: reportsData, isLoading, isFetching } = useReports({
        page: currentPage,
        page_size: PAGE_SIZE,
        search: debouncedSearch || undefined,
    });

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

    // Apply client-side status filter on top of server results
    const allReports: ValuationReport[] = (reportsData?.reports ?? [])
        .filter(r => !statusFilter || (r.report_status || r.status) === statusFilter)
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
            files: [],
            metadata: {} as any,
            content: {} as any,
            comments: [],
            auditTrail: [],
        }));

    const total = reportsData?.total ?? 0;
    const totalPages = reportsData?.total_pages ?? 1;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'process': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'review': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const pageTitle = statusFilter
        ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Reports`
        : 'All Reports';

    const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
    const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

    // Build page numbers with ellipsis
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
        .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
            if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
            acc.push(p);
            return acc;
        }, []);

    if (isLoading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Skeleton height={40} width={40} borderRadius={12} />
                        <div>
                            <Skeleton height={36} width={200} className="mb-2" />
                            <Skeleton height={16} width={150} />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton height={40} width={320} borderRadius={12} />
                        <Skeleton height={40} width={40} borderRadius={12} />
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-brand-100 shadow-md p-4">
                    <Skeleton height={40} className="mb-4" />
                    <Skeleton count={8} height={60} className="mb-2" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all shadow-sm group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
                        <p className="text-slate-500 font-semibold mt-1 text-sm">
                            {isFetching && (
                                <span className="inline-block w-2 h-2 rounded-full bg-sky-400 animate-pulse mr-1.5" />
                            )}
                            {total} {total === 1 ? 'report' : 'reports'} total
                            {debouncedSearch && <span className="text-sky-600"> — searching "{debouncedSearch}"</span>}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors pointer-events-none" size={18} />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            placeholder="Search reports..."
                            className="pl-10 pr-9 py-2.5 bg-white border border-sky-200 rounded-lg text-base focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none w-80 shadow-sm transition-all font-medium text-slate-900 placeholder:text-slate-400"
                        />
                        {searchInput && (
                            <button
                                onClick={() => setSearchInput('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <button className="p-2.5 bg-white border border-sky-200 rounded-lg text-sky-600 hover:bg-sky-50 transition-all shadow-sm">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            {/* Main Content Table Section */}
            <div className={`bg-white rounded-xl border border-brand-100 shadow-md overflow-hidden transition-opacity duration-150 ${isFetching ? 'opacity-70' : 'opacity-100'}`}>
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
                            {allReports.length > 0 ? allReports.map((report) => (
                                <tr
                                    key={report.id}
                                    className="hover:bg-brand-50/30 cursor-pointer transition-all group"
                                    onClick={() => handleReportClick(report)}
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors">
                                                {report.customerName[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-base font-bold text-slate-900 truncate group-hover:text-sky-600 transition-colors">{report.customerName}</div>
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
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400 space-y-3">
                                            <div className="bg-slate-100 p-4 rounded-full">
                                                <Filter size={32} />
                                            </div>
                                            <div className="text-base font-bold">No reports found</div>
                                            <p className="text-sm">
                                                {debouncedSearch
                                                    ? `No reports match "${debouncedSearch}"`
                                                    : 'No reports match the current filter.'}
                                            </p>
                                            {debouncedSearch && (
                                                <button
                                                    onClick={() => setSearchInput('')}
                                                    className="text-xs font-semibold text-sky-500 hover:text-sky-700 underline underline-offset-2"
                                                >
                                                    Clear search
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {totalPages > 1 && (
                    <div className="px-8 py-4 border-t border-sky-50 bg-white flex items-center justify-between gap-4">
                        <p className="text-sm text-slate-500 font-medium">
                            Page <span className="font-bold text-slate-700">{currentPage}</span> of <span className="font-bold text-slate-700">{totalPages}</span>
                        </p>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={handlePrev}
                                disabled={currentPage <= 1}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all
                                    disabled:opacity-40 disabled:cursor-not-allowed
                                    bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 active:scale-95"
                            >
                                <ChevronLeft size={16} />
                                Prev
                            </button>

                            <div className="flex items-center gap-1">
                                {pageNumbers.map((p, idx) =>
                                    p === 'ellipsis' ? (
                                        <span key={`e-${idx}`} className="px-1.5 text-slate-400 text-sm font-bold">…</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => setCurrentPage(p as number)}
                                            className={`w-9 h-9 rounded-lg text-sm font-bold transition-all active:scale-95 ${currentPage === p
                                                    ? 'bg-sky-500 text-white shadow-sm shadow-sky-200'
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
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all
                                    disabled:opacity-40 disabled:cursor-not-allowed
                                    bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 active:scale-95"
                            >
                                Next
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <p className="text-sm text-slate-400 font-medium">
                            {total} total {total === 1 ? 'report' : 'reports'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
