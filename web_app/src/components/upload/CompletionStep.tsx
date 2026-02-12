import { CheckCircle, Plus, FileText, Download, Copy, Check } from 'lucide-react';
import { UploadedFile } from './types';
import { useState } from 'react';

interface CompletionStepProps {
    files: UploadedFile[];
    selectedFiles: string[];
    analysisResult: string | null;
    onSave: () => void;
    onRestart: () => void;
}

export default function CompletionStep({
    files,
    selectedFiles,
    analysisResult,
    onSave,
    onRestart
}: CompletionStepProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (analysisResult) {
            navigator.clipboard.writeText(analysisResult);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Convert markdown to HTML
    const formatMarkdown = (text: string): string => {
        let html = text;

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-gray-900 mt-6 mb-3">$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 mt-8 mb-4">$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h1>');

        // Bold
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');

        // Italic
        html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');

        // Lists - Unordered
        html = html.replace(/^\* (.+)$/gim, '<li class="ml-6 mb-2">$1</li>');
        html = html.replace(/^- (.+)$/gim, '<li class="ml-6 mb-2">$1</li>');

        // Lists - Ordered
        html = html.replace(/^\d+\. (.+)$/gim, '<li class="ml-6 mb-2">$1</li>');

        // Wrap consecutive list items
        html = html.replace(/(<li class="ml-6 mb-2">.*<\/li>\n?)+/g, (match) => {
            if (match.includes('1.')) {
                return '<ol class="list-decimal list-inside mb-4 space-y-1">' + match + '</ol>';
            }
            return '<ul class="list-disc list-inside mb-4 space-y-1">' + match + '</ul>';
        });

        // Code blocks
        html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>');

        // Inline code
        html = html.replace(/`(.+?)`/g, '<code class="bg-gray-200 text-gray-800 px-2 py-1 rounded text-sm font-mono">$1</code>');

        // Links
        html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>');

        // Paragraphs
        html = html.replace(/^(?!<[h|u|o|l|p|d])(.+)$/gim, '<p class="mb-4 text-gray-700 leading-relaxed">$1</p>');

        // Line breaks
        html = html.replace(/\n\n/g, '<br/><br/>');

        return html;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-4 pb-6">
            {/* Success Header */}
            {/* Success Header */}
            <div className="bg-white rounded-2xl shadow-xl border border-secondary-100 p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-500 to-emerald-500" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none" />

                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg transform hover:scale-105 transition-transform duration-300 border-2 border-white">
                    <CheckCircle size={28} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-secondary-900 mb-2 tracking-tight uppercase">Analysis Complete!</h2>
                <p className="text-secondary-600 text-sm max-w-2xl mx-auto font-semibold leading-relaxed">
                    Successfully processed and analyzed <span className="font-bold text-brand-700 underline decoration-brand-200 decoration-4 underline-offset-4">{selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'}</span>. Your comprehensive report is ready below.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl border border-secondary-100 text-center transition-all duration-300 transform hover:-translate-y-1 border-b-4 border-b-brand-500">
                    <div className="text-3xl font-extrabold bg-gradient-to-br from-brand-600 to-brand-800 bg-clip-text text-transparent mb-1 tracking-tighter">
                        {selectedFiles.length}
                    </div>
                    <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-[0.2em]">Files Analyzed</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl border border-secondary-100 text-center transition-all duration-300 transform hover:-translate-y-1 border-b-4 border-b-emerald-500">
                    <div className="text-3xl font-extrabold bg-gradient-to-br from-emerald-600 to-emerald-800 bg-clip-text text-transparent mb-1 tracking-tighter">
                        {files
                            .filter((f) => selectedFiles.includes(f.id) && f.pages)
                            .reduce((acc, f) => acc + (f.pages || 0), 0)}
                    </div>
                    <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-[0.2em]">Total Pages</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl border border-secondary-100 text-center transition-all duration-300 transform hover:-translate-y-1 border-b-4 border-b-indigo-500">
                    <div className="text-3xl font-extrabold bg-gradient-to-br from-indigo-600 to-indigo-800 bg-clip-text text-transparent mb-1 tracking-tighter">
                        100%
                    </div>
                    <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-[0.2em]">Accuracy</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
                <button
                    onClick={onSave}
                    className="w-full sm:w-auto bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 uppercase tracking-wider"
                >
                    <Download size={20} />
                    Save Report
                </button>
                <button
                    onClick={onRestart}
                    className="w-full sm:w-auto bg-gradient-to-br from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white px-8 py-3 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 uppercase tracking-wider"
                >
                    <Plus size={20} />
                    Start New Analysis
                </button>
            </div>

            {/* Analysis Result Section */}
            {analysisResult && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-500 hover:shadow-2xl">
                    <div className="bg-gradient-to-r from-brand-600 to-brand-700 p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur border border-white/10">
                                    <FileText className="text-white" size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Analysis Report</h3>
                            </div>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-3 bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-xl transition-colors backdrop-blur border border-white/10"
                            >
                                {copied ? (
                                    <>
                                        <Check size={18} />
                                        <span className="text-sm font-bold uppercase tracking-wider">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={18} />
                                        <span className="text-sm font-bold uppercase tracking-wider">Copy</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="p-8">
                        <div
                            className="prose prose-md prose-brand max-w-none
                                [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-secondary-900 [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:uppercase [&_h1]:tracking-tight
                                [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-secondary-900 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:tracking-tight
                                [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-secondary-900 [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:tracking-tight
                                [&_p]:text-secondary-600 [&_p]:leading-relaxed [&_p]:mb-4 [&_p]:text-lg [&_p]:font-medium
                                [&_ul]:list-disc [&_ul]:list-inside [&_ul]:mb-4 [&_ul]:space-y-2 [&_ul]:text-secondary-600 [&_ul]:text-lg
                                [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:mb-4 [&_ol]:space-y-2 [&_ol]:text-secondary-600 [&_ol]:text-lg
                                [&_li]:text-secondary-600 [&_li]:ml-6
                                [&_strong]:font-bold [&_strong]:text-secondary-900
                                [&_code]:bg-secondary-50 [&_code]:text-brand-700 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono border-brand-100
                                [&_pre]:bg-secondary-900 [&_pre]:text-white [&_pre]:p-6 [&_pre]:rounded-2xl [&_pre]:overflow-x-auto [&_pre]:my-6 [&_pre]:shadow-inner
                                [&_a]:text-brand-600 [&_a]:hover:text-brand-700 [&_a]:underline font-bold"
                            dangerouslySetInnerHTML={{
                                __html: formatMarkdown(analysisResult)
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Processed Files List */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-secondary-900 uppercase tracking-widest">Processed Files</h3>
                </div>
                <div className="p-4">
                    <div className="space-y-2">
                        {files
                            .filter((f) => selectedFiles.includes(f.id))
                            .map((file, index) => (
                                <div
                                    key={file.id}
                                    className="flex items-center justify-between p-3 border border-secondary-100 rounded-xl hover:border-brand-400 hover:bg-brand-50/30 transition-all shadow-sm group"
                                    style={{
                                        animationDelay: `${index * 50}ms`,
                                        animation: 'fadeInUp 0.3s ease-out forwards'
                                    }}
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="p-3 bg-brand-50 rounded-xl group-hover:scale-110 transition-transform">
                                            <CheckCircle size={28} className="text-brand-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-bold text-secondary-900 truncate uppercase tracking-tight">
                                                {file.name || file.file?.name}
                                            </p>
                                            <p className="text-xs text-secondary-500 font-bold uppercase tracking-widest mt-1">
                                                {file.pages} {file.pages === 1 ? 'page' : 'pages'}
                                                {file.language && ` • ${file.language}`}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-5 py-2 bg-brand-50 text-brand-700 rounded-xl text-xs font-bold uppercase tracking-widest border border-brand-100 shadow-sm">
                                        ✓ Verified
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}