import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Loader2,
    CheckCircle2,
    AlertCircle,
    Copy,
    Home,
    ChevronRight,
    RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { reportsApi } from '../apis/report.api';

type StatusState = 'processing' | 'completed' | 'failed' | 'timeout';

export default function ProcessingPage() {
    const { reportId } = useParams<{ reportId: string }>();
    const navigate = useNavigate();

    const [status, setStatus] = useState<StatusState>('processing');
    const [progress, setProgress] = useState({ completed: 0, total: 0, percentage: 0 });
    const [errorHeader, setErrorHeader] = useState<string | null>(null);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const pollStatus = useCallback(async () => {
        if (!reportId) return;

        try {
            const data = await reportsApi.getReportStatus(reportId);

            setProgress(data.progress);

            if (data.status === 'completed') {
                setStatus('completed');
                // Auto-redirect after a short delay
                setTimeout(() => {
                    navigate(`/reports/${reportId}/edit`);
                }, 2000);
            } else if (data.status === 'failed') {
                setStatus('failed');
                const failedFile = data.files.find(f => f.status === 'failed');
                setErrorHeader('Processing failed');
                setErrorDetails(failedFile?.error || 'An unexpected error occurred during analysis.');
            } else {
                // Keep processing
                setStatus('processing');
            }
        } catch (err: any) {
            console.error('Polling error:', err);
            // Don't show error popup early per requirements
        }
    }, [reportId, navigate]);

    useEffect(() => {
        if (status !== 'processing') return;

        const startTime = new Date().getTime();
        const interval = setInterval(() => {
            if (new Date().getTime() > startTime + 10 * 60 * 1000) { // 10 minutes timeout
                setStatus('timeout');
                clearInterval(interval);
            } else {
                pollStatus();
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [status, pollStatus]);

    const handleCopyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setIsCopied(true);
        toast.success('Link copied to clipboard');
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleGoHome = () => navigate('/');
    const handleTryAgain = () => navigate('/upload');
    const handleRefresh = () => {
        setStatus('processing');
        pollStatus();
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
            <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 md:p-12 text-center transition-all">

                {/* STATE: PROCESSING */}
                {status === 'processing' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="relative mx-auto w-24 h-24">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                            <div
                                className="absolute inset-0 rounded-full border-4 border-sky-500 border-t-transparent animate-spin"
                                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 size={40} className="text-sky-500 animate-pulse" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                                Your document is processing...
                            </h2>
                            <p className="text-slate-500 font-medium">
                                You can come back later — this page will auto-update.
                            </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <span>{progress.completed} of {progress.total} files</span>
                                <span>{Math.round(progress.percentage)}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-sky-500 transition-all duration-1000 ease-out"
                                    style={{ width: `${progress.percentage}%` }}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <button
                                onClick={handleCopyLink}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sky-50 text-sky-600 font-semibold hover:bg-sky-100 transition-all border border-sky-100"
                            >
                                {isCopied ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
                                {isCopied ? 'Copied!' : 'Copy Link'}
                            </button>
                            <button
                                onClick={handleGoHome}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-sky-100 text-slate-600 font-semibold hover:bg-sky-50 transition-all"
                            >
                                <Home size={18} />
                                Go to Home
                            </button>
                        </div>
                    </div>
                )}

                {/* STATE: COMPLETED */}
                {status === 'completed' && (
                    <div className="space-y-8 animate-in zoom-in-95 duration-500">
                        <div className="mx-auto w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={48} className="text-green-500" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                                Processing Complete!
                            </h2>
                            <p className="text-slate-500">
                                Your valuation report is ready for review.
                            </p>
                        </div>

                        <button
                            onClick={() => navigate(`/reports/${reportId}/edit`)}
                            className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-sky-500 text-white font-bold hover:bg-sky-600 shadow-lg shadow-sky-200 transition-all group"
                        >
                            <span>View Report</span>
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>

                        <p className="text-xs text-slate-400">
                            Auto-redirecting in 2 seconds...
                        </p>
                    </div>
                )}

                {/* STATE: FAILED */}
                {status === 'failed' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center">
                            <AlertCircle size={48} className="text-red-500" />
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                                {errorHeader}
                            </h2>
                            <div className="px-4 py-3 bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm font-medium">
                                {errorDetails}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                onClick={handleTryAgain}
                                className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-sky-500 text-white font-bold hover:bg-sky-600 transition-all shadow-md shadow-sky-200"
                            >
                                Upload new file
                            </button>
                            <button
                                onClick={handleGoHome}
                                className="w-full px-4 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                Cancel and return to Home
                            </button>
                        </div>
                    </div>
                )}

                {/* STATE: TIMEOUT */}
                {status === 'timeout' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="mx-auto w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center">
                            <RefreshCw size={48} className="text-amber-500" />
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                                Taking longer than usual...
                            </h2>
                            <p className="text-slate-500">
                                Still processing, check later. You can also try refreshing the status.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                onClick={handleRefresh}
                                className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-sky-500 text-white font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-200"
                            >
                                <RefreshCw size={18} />
                                Refresh Status
                            </button>
                            <button
                                onClick={handleGoHome}
                                className="w-full px-4 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                Go to Home
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
