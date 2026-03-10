import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter } from 'lucide-react';
import { useReports } from '../hooks/useReports';
import { ApiReport } from '../apis/report.api';
import { ValuationReport, ReportStatus, PropertyType } from '../types';
import { formatDate } from '../utils/formatDate';
import Skeleton from 'react-loading-skeleton';

export default function ReportListPage() {
    const { data: reportsData, isLoading } = useReports();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const statusFilter = searchParams.get('status') as ReportStatus | null;

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

    const filteredReports: ValuationReport[] = useMemo(() => {
        if (!reportsData?.reports) return [];

        let reports = reportsData.reports;
        if (statusFilter) {
            reports = reports.filter(r => (r.report_status || r.status) === statusFilter);
        }

        let mappedReports = reports
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
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
                files: [], // Not needed for simple list view
                metadata: {} as any,
                content: {} as any,
                comments: [],
                auditTrail: [],
            }));

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            mappedReports = mappedReports.filter(report =>
                report.customerName.toLowerCase().includes(query) ||
                report.bankName.toLowerCase().includes(query) ||
                report.propertyType.toLowerCase().includes(query) ||
                report.status.toLowerCase().includes(query) ||
                report.location.toLowerCase().includes(query)
            );
        }

        return mappedReports;
    }, [reportsData, statusFilter, searchQuery]);

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
                <div className="bg-white rounded-2xl border border-brand-100 shadow-md p-4">
                    <Skeleton height={40} className="mb-4" />
                    <Skeleton count={5} height={60} className="mb-2" />
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
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
                        <p className="text-slate-600 font-semibold mt-1">
                            Showing {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search reports..."
                            className="pl-10 pr-4 py-2.5 bg-white border border-brand-200 rounded-xl text-base focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none w-80 shadow-sm transition-all font-medium text-slate-900 placeholder:text-slate-400"
                        />
                    </div>
                    <button className="p-2.5 bg-white border border-brand-200 rounded-xl text-brand-600 hover:bg-brand-50 transition-all shadow-sm">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            {/* Main Content Table Section */}
            <div className="bg-white rounded-2xl border border-brand-100 shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
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
                        <tbody className="divide-y divide-gray-50">
                            {filteredReports.length > 0 ? filteredReports.map((report) => (
                                <tr
                                    key={report.id}
                                    className="hover:bg-brand-50/30 cursor-pointer transition-all group"
                                    onClick={() => handleReportClick(report)}
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
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
                                        <span className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${getStatusColor(report.status)} shadow-sm`}>
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
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400 space-y-3">
                                            <div className="bg-slate-100 p-4 rounded-full">
                                                <Filter size={32} />
                                            </div>
                                            <div className="text-base font-bold">No reports found</div>
                                            <p className="text-sm">There are no reports matching the current filter.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
