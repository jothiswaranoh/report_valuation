import { useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import { FileSearch, Activity, ArrowLeft } from 'lucide-react';
import { useReports } from '../hooks/useReports';
import { ApiReport } from '../apis/report.api';
import ActiveProcessingCard from '../components/dashboard/ActiveProcessingCard';
import { ValuationReport, PropertyType } from '../types';

export default function CurrentReportPage() {
    const { data: reportsData, isLoading } = useReports({ refetchInterval: 5000 });
    const navigate = useNavigate();

    const processingReports: ValuationReport[] = useMemo(() => {
        if (!reportsData?.reports) return [];

        return reportsData.reports
            .filter((r: ApiReport) => (r.report_status || r.status || '').toLowerCase() === 'importing')
            .map((r: ApiReport) => ({
                id: r.id,
                customerName: (r as any).report_name || r.customer_name || r.name || (r as any).property_owner || r.bank_name || 'Untitled Report',
                bankName: r.bank_name || 'Unknown Bank',
                propertyType: (r.property_type as PropertyType) || 'Residential',
                location: r.location || 'Unknown Location',
                status: 'process',
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
    }, [reportsData]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                </div>
            </div>
        );
    }

    const hasActiveProcess = processingReports.length > 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
                        title="Go back"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <Activity className="text-blue-500" size={32} />
                            Current Report
                        </h1>
                        <p className="text-slate-600 font-semibold mt-1">View currently processing AI analysis</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 min-h-[400px] flex flex-col">
                {hasActiveProcess ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {processingReports.map((report) => (
                            <ActiveProcessingCard key={`processing-${report.id}`} report={report} />
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-12">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                            <Activity size={48} className="text-slate-300" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-slate-700">No Active Process</h2>
                            <p className="text-slate-500 max-w-md mx-auto">
                                There are currently no reports undergoing AI processing. You can check the queue of reports waiting to be processed.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/list?status=process')}
                            className="mt-4 bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
                        >
                            <FileSearch size={20} />
                            View Reports in Process Queue
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
