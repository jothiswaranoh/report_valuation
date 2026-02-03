import { CheckCircle, FolderOpen, Plus, FileText, Download, Copy, Check } from 'lucide-react';
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
        <div className="max-w-5xl mx-auto space-y-6 pb-8">
            {/* Success Header */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg border border-green-200 p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <CheckCircle size={40} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Analysis Complete!</h2>
                <p className="text-gray-600 text-lg">
                    Successfully processed and analyzed {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 text-center hover:shadow-lg transition-shadow">
                    <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2">
                        {selectedFiles.length}
                    </div>
                    <p className="text-sm font-medium text-gray-600">Files Analyzed</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 text-center hover:shadow-lg transition-shadow">
                    <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-2">
                        {files
                            .filter((f) => selectedFiles.includes(f.id) && f.pages)
                            .reduce((acc, f) => acc + (f.pages || 0), 0)}
                    </div>
                    <p className="text-sm font-medium text-gray-600">Total Pages</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 text-center hover:shadow-lg transition-shadow">
                    <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-2">
                        100%
                    </div>
                    <p className="text-sm font-medium text-gray-600">Completion</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                    onClick={onSave}
                    className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                    <Download size={20} />
                    Save Report
                </button>
                <button
                    onClick={onRestart}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                    <Plus size={20} />
                    Start New Analysis
                </button>
            </div>

            {/* Analysis Result Section */}
            {analysisResult && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
                                    <FileText className="text-white" size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white">Analysis Report</h3>
                            </div>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors backdrop-blur"
                            >
                                {copied ? (
                                    <>
                                        <Check size={18} />
                                        <span className="text-sm font-medium">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={18} />
                                        <span className="text-sm font-medium">Copy</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="p-8">
                        <div
                            className="prose prose-lg prose-indigo max-w-none
                                [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-8 [&_h1]:mb-4
                                [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_h2]:mb-3
                                [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-4 [&_h3]:mb-2
                                [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:mb-4
                                [&_ul]:list-disc [&_ul]:list-inside [&_ul]:mb-4 [&_ul]:space-y-2
                                [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:mb-4 [&_ol]:space-y-2
                                [&_li]:text-gray-700 [&_li]:ml-4
                                [&_strong]:font-semibold [&_strong]:text-gray-900
                                [&_code]:bg-gray-200 [&_code]:text-gray-800 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
                                [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4
                                [&_a]:text-blue-600 [&_a]:hover:text-blue-800 [&_a]:underline"
                            dangerouslySetInnerHTML={{
                                __html: formatMarkdown(analysisResult)
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Processed Files List */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Processed Files</h3>
                </div>
                <div className="p-6">
                    <div className="space-y-3">
                        {files
                            .filter((f) => selectedFiles.includes(f.id))
                            .map((file, index) => (
                                <div
                                    key={file.id}
                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50/30 transition-all"
                                    style={{
                                        animationDelay: `${index * 50}ms`,
                                        animation: 'fadeInUp 0.3s ease-out forwards'
                                    }}
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="flex-shrink-0">
                                            <CheckCircle size={24} className="text-green-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">
                                                {file.file.name}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {file.pages} {file.pages === 1 ? 'page' : 'pages'}
                                                {file.language && ` • ${file.language}`}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-4 py-1.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold whitespace-nowrap">
                                        ✓ Completed
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