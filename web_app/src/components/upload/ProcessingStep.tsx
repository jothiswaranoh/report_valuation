import { useState } from 'react';
import { Loader2, CheckCircle2, Copy, Home, XCircle, AlertTriangle } from 'lucide-react';
import { UploadedFile } from './types';
import toast from 'react-hot-toast';

interface ProcessingStepProps {
    files: UploadedFile[];
    selectedFiles: string[];
    progress?: { completed: number; total: number; percentage: number };
    onCopyLink?: () => Promise<boolean | void>;
    onGoHome?: () => void;
    onCancel?: () => Promise<void>;
}

export default function ProcessingStep({
    files,
    selectedFiles,
    progress,
    onCopyLink,
    onGoHome,
    onCancel,
}: ProcessingStepProps) {
    const pct = progress ? Math.round(progress.percentage) : 0;
    const done = progress?.completed ?? 0;
    const total = progress?.total ?? selectedFiles.length;

    const [copied, setCopied] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const selectedUploadFiles = files.filter((f) => selectedFiles.includes(f.id));
    const getStatusLabel = (file: UploadedFile) => {
        if (file.status === 'completed') return 'Done';
        if (file.status === 'error') return 'Failed';
        if (file.status === 'processing') return 'Analyzing';
        if (file.status === 'uploading') return 'Uploading';
        return 'Pending';
    };

    const handleConfirmCancel = async () => {
        if (!onCancel) return;
        setIsCancelling(true);
        try {
            await onCancel();
            toast.success('Processing cancelled successfully.');
            // onCancel unmounts this component, so we don't need to do much more
        } catch (error: any) {
            toast.error(error?.message || 'Cancel failed. Please try again.');
        } finally {
            setIsCancelling(false);
            setShowCancelDialog(false);
        }
    };



    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-8 text-center relative overflow-hidden">
                {/* Animated top bar */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 animate-pulse" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none opacity-50" />

                <div className="relative z-10 pt-4">
                    <div className="w-16 h-16 bg-sky-50/50 rounded-xl flex items-center justify-center mx-auto mb-6 border border-sky-100/50 shadow-sm">
                        <Loader2 size={32} className="text-sky-500 animate-spin" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Processing Documents</h2>
                    <p className="text-slate-500 text-sm mb-4 max-w-md mx-auto font-medium">
                        Our AI is analyzing{' '}
                        <span className="font-bold text-sky-600 underline decoration-sky-200 decoration-2 underline-offset-4">
                            {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'}
                        </span>
                        . This might take a moment.
                    </p>

                    {/* Currently processing file banner */}
                    {(() => {
                        const activeFile = selectedUploadFiles.find((f) => (f.progress ?? 0) < 100);
                        return activeFile ? (
                            <div className="flex items-center justify-center gap-2 mb-5 px-4 py-2.5 bg-sky-50 border border-sky-100 rounded-lg max-w-sm mx-auto">
                                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shrink-0" />
                                <p className="text-xs font-semibold text-sky-700 truncate">
                                    <span className="text-sky-400 font-medium mr-1">Analyzing:</span>
                                    {activeFile.name || activeFile.file?.name}
                                </p>
                            </div>
                        ) : null;
                    })()}

                    {/* Overall progress bar */}
                    <div className="mb-6 space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <span>{done} of {total} files</span>
                            <span>{pct}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-sky-500 transition-all duration-1000 ease-out"
                                style={{ width: `${progress?.percentage ?? 0}%` }}
                            />
                        </div>
                    </div>

                    {/* Action buttons — inside the card, above the file list */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <button
                            id="processing-copy-link-btn"
                            onClick={async () => {
                                if (onCopyLink) {
                                    const ok = await onCopyLink();
                                    if (ok) setCopied(true);
                                }
                            }}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${copied
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                : 'bg-white text-sky-600 border-2 border-sky-100 hover:bg-sky-50 active:scale-95'
                                }`}
                        >
                            {copied ? (
                                <>
                                    <CheckCircle2 size={15} />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy size={15} />
                                    Copy Link
                                </>
                            )}
                        </button>

                        <button
                            onClick={onGoHome}
                            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-sky-200 transition-all hover:-translate-y-0.5"
                        >
                            <Home size={18} />
                            Go to Dashboard
                        </button>
                    </div>

                    {/* Cancel Processing Button */}
                    {onCancel && (
                        <div className="pt-2 pb-2 border-slate-100">
                            <button
                                onClick={() => setShowCancelDialog(true)}
                                className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-red-500 font-semibold hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                            >
                                <XCircle size={18} />
                                Cancel Processing
                            </button>
                        </div>
                    )}
                </div>

                {/* Per-file list */}
                {selectedUploadFiles.length > 0 && (
                    <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 scrollbar-hide py-2">
                        {selectedUploadFiles.map((file) => (
                            <div
                                key={file.id}
                                className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex items-center gap-4 transition-all group"
                            >
                                <div className="p-2 bg-white rounded-md shadow-sm">
                                    {file.status === 'completed' ? (
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                    ) : file.status === 'error' ? (
                                        <XCircle size={16} className="text-red-500" />
                                    ) : (
                                        <Loader2 size={16} className="text-sky-500 animate-spin" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-sm font-semibold text-slate-900 truncate tracking-tight">
                                            {file.name || file.file?.name}
                                        </h4>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider flex-shrink-0 ml-2 ${file.status === 'completed'
                                            ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                                            : file.status === 'error'
                                                ? 'text-red-700 bg-red-50 border-red-100'
                                                : 'text-sky-600 bg-sky-50 border-sky-100'
                                            }`}>
                                            {getStatusLabel(file)}
                                        </span>
                                    </div>

                                    <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                                        <div
                                            className="bg-sky-500 h-full rounded-full transition-all duration-700 ease-in-out"
                                            style={{ width: `${file.progress ?? 40}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                <span className="w-2 h-2 bg-sky-500 rounded-full shrink-0 animate-pulse" />
                Processing is active — The wizard will auto-advance when done
            </p>

            {/* ── Cancel Confirmation Modal ──────────────────────────────────── */}
            {showCancelDialog && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)' }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200 relative">
                        {/* Warning icon */}
                        <div className="mx-auto mb-5 w-16 h-16 flex items-center justify-center rounded-full bg-red-50">
                            <AlertTriangle size={32} className="text-red-500" />
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
                            Cancel Processing?
                        </h3>

                        <p className="text-slate-500 text-center text-sm mb-1">
                            This will{' '}
                            <span className="font-semibold text-slate-700">
                                stop all in-progress AI analysis
                            </span>{' '}
                            and revert the report to its state before processing started.
                        </p>
                        <p className="text-slate-500 text-center text-sm mb-7">
                            Your uploaded files will remain attached so you can try again later.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleConfirmCancel}
                                disabled={isCancelling}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-md shadow-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isCancelling ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Cancelling...
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={18} />
                                        Yes, Cancel Processing
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setShowCancelDialog(false)}
                                disabled={isCancelling}
                                className="w-full px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Keep Processing
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
