import { Loader2 } from 'lucide-react';
import { UploadedFile } from './types';

interface ProcessingStepProps {
    files: UploadedFile[];
    selectedFiles: string[];
}

export default function ProcessingStep({ files, selectedFiles }: ProcessingStepProps) {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Loader2 size={48} className="text-white animate-spin" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Processing Documents</h2>
                <p className="text-gray-600 text-lg mb-8">
                    Analyzing {selectedFiles.length} files for your project
                </p>

                <div className="space-y-4">
                    {files
                        .filter((f) => selectedFiles.includes(f.id))
                        .map((file) => (
                            <div key={file.id} className="text-left">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <Loader2 size={18} className="text-blue-600 animate-spin" />
                                        <span className="font-medium text-gray-900">{file.file.name}</span>
                                    </div>
                                    <span className="text-sm text-gray-600">{file.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${file.progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}
