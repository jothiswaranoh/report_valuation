import { Loader2 } from 'lucide-react';
import { UploadedFile } from './types';

interface ProcessingStepProps {
    files: UploadedFile[];
    selectedFiles: string[];
}

export default function ProcessingStep({ files, selectedFiles }: ProcessingStepProps) {
    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse" />

                <div className="relative">
                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Loader2 size={48} className="text-blue-600 animate-spin" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Processing Documents</h2>
                    <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
                        Our AI is analyzing <span className="font-semibold text-gray-900">{selectedFiles.length} files</span>. This might take a moment.
                    </p>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                    {files
                        .filter((f) => selectedFiles.includes(f.id))
                        .map((file, index) => (
                            <div
                                key={file.id}
                                className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md hover:border-blue-200"
                                style={{
                                    animation: `slide-up 0.5s ease-out forwards ${index * 0.1}s`,
                                    opacity: 0
                                }}
                            >
                                <div className="p-3 bg-white rounded-lg shadow-sm">
                                    <Loader2 size={24} className="text-blue-600 animate-spin" />
                                </div>

                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-semibold text-gray-900 truncate">{file.file.name}</h4>
                                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                            {file.progress < 100 ? 'Processing...' : 'Completed'}
                                        </span>
                                    </div>

                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${file.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            <p className="text-center text-sm text-gray-400 animate-pulse">
                Please do not close this window
            </p>
        </div>
    );
}
