import { useState } from 'react';
import ReportsSidebar from '../components/upload/ReportsSidebar';
import ReportDetailView from '../components/upload/ReportDetailView';

export default function HistoryPage() {
    const [selectedBrowseReportId, setSelectedBrowseReportId] = useState<string | null>(null);

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-sky-100 shadow-lg overflow-hidden">
                {/* Header */}
                <header className="shrink-0 sticky top-0 z-40 bg-white backdrop-blur-xl border-b border-slate-100">
                    <div className="w-full mx-auto px-2 sm:px-3 lg:px-4 py-4 md:py-6">
                        <div className="flex items-center justify-between w-full">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Report History</h1>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 min-h-0 overflow-y-auto max-w-7xl w-full mx-auto px-2 sm:px-3 lg:px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 min-h-full">
                        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col min-h-0">
                            <ReportsSidebar
                                selectedReportId={selectedBrowseReportId}
                                onReportSelect={setSelectedBrowseReportId}
                            />
                        </div>
                        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col min-h-0">
                            <ReportDetailView reportId={selectedBrowseReportId} />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
