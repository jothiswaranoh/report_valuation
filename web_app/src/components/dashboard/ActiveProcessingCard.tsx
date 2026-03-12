import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsApi } from '../../apis/report.api';
import { ValuationReport } from '../../types';

interface ActiveProcessingCardProps {
    report: ValuationReport;
    onComplete?: () => void;
}

interface FileStatus {
    id: string;
    name: string;
    status: string;
    error?: string;
}

export default function ActiveProcessingCard({ report, onComplete }: ActiveProcessingCardProps) {
    const navigate = useNavigate();
    const [progress, setProgress] = useState({ percentage: 0, completed: 0, total: 0 });
    const [files, setFiles] = useState<FileStatus[]>([]);
    // Start as null (unknown) — render nothing until first poll resolves
    const [isProcessing, setIsProcessing] = useState<boolean | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const statusData = await reportsApi.getReportStatus(report.id);
                setProgress(statusData.progress);
                setFiles(statusData.files || []);

                if (statusData.status === 'processing') {
                    setIsProcessing(true);
                } else if (statusData.status === 'completed' && statusData.progress.percentage >= 100) {
                    setIsProcessing(false);
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    if (onComplete) onComplete();
                } else {
                    setIsProcessing(false);
                    if (pollingRef.current) clearInterval(pollingRef.current);
                }
            } catch (error) {
                console.error('Failed to get report status', error);
                setIsProcessing(false);
                if (pollingRef.current) clearInterval(pollingRef.current);
            }
        };

        checkStatus();
        pollingRef.current = setInterval(checkStatus, 3000);

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [report.id, onComplete]);

    // Find the file currently being actively processed
    const activeFile = files.find(f =>
        ['queued', 'processing', 'ocr_started', 'ocr_completed', 'translation_started', 'translation_completed'].includes(f.status)
    ) || files.find(f => f.status !== 'completed' && f.status !== 'failed');

    // null = still loading first poll; false = not processing — render nothing
    if (isProcessing !== true) return null;

    return (
        <div
            onClick={() => navigate(`/upload/${report.id}?step=process`)}
            className="group cursor-pointer bg-white rounded-2xl border border-blue-100 p-6 shadow-md hover:shadow-xl hover:shadow-blue-200/40 hover:border-blue-200 transition-all duration-300 relative overflow-hidden"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="min-w-0 flex-1 mr-3">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {report.customerName}
                    </h3>
                    <p className="text-sm font-semibold text-blue-500 mt-1 uppercase tracking-wide">
                        Processing AI Analysis...
                    </p>
                </div>
                <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold shrink-0">
                    {Math.round(progress.percentage)}%
                </div>
            </div>

            {/* Currently processing file name */}
            {activeFile && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-blue-50/60 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
                    <p className="text-xs text-blue-700 font-medium truncate">
                        {activeFile.name}
                    </p>
                </div>
            )}

            <div className="space-y-2 w-full">
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out relative"
                        style={{ width: `${progress.percentage}%` }}
                    >
                        <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse" />
                    </div>
                </div>
                {progress.total > 0 && (
                    <div className="text-xs font-medium text-slate-400 text-right">
                        {progress.completed} of {progress.total} files analyzed
                    </div>
                )}
            </div>
        </div>
    );
}
