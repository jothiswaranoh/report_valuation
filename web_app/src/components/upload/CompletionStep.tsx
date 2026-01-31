import { CheckCircle, FolderOpen, Plus } from 'lucide-react';
import { UploadedFile } from './types';

interface CompletionStepProps {
    files: UploadedFile[];
    selectedFiles: string[];
    onSave: () => void;
    onRestart: () => void;
}

export default function CompletionStep({
    files,
    selectedFiles,
    onSave,
    onRestart
}: CompletionStepProps) {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center mb-6">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={48} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Processing Complete!</h2>
                <p className="text-gray-600 text-lg mb-8">
                    All {selectedFiles.length} files have been successfully analyzed
                </p>

                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="p-6 bg-blue-50 rounded-xl">
                        <p className="text-3xl font-bold text-blue-600 mb-2">{selectedFiles.length}</p>
                        <p className="text-sm text-gray-600">Files Processed</p>
                    </div>
                    <div className="p-6 bg-green-50 rounded-xl">
                        <p className="text-3xl font-bold text-green-600 mb-2">
                            {files
                                .filter((f) => selectedFiles.includes(f.id) && f.pages)
                                .reduce((acc, f) => acc + (f.pages || 0), 0)}
                        </p>
                        <p className="text-sm text-gray-600">Total Pages</p>
                    </div>
                    <div className="p-6 bg-purple-50 rounded-xl">
                        <p className="text-3xl font-bold text-purple-600 mb-2">100%</p>
                        <p className="text-sm text-gray-600">Success Rate</p>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={onSave}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center gap-2 transition-all shadow-lg"
                    >
                        <FolderOpen size={20} />
                        Save Project
                    </button>
                    <button
                        onClick={onRestart}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center gap-2 transition-all shadow-lg"
                    >
                        <Plus size={20} />
                        Start New Project
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Processed Files</h3>
                <div className="space-y-3">
                    {files
                        .filter((f) => selectedFiles.includes(f.id))
                        .map((file) => (
                            <div
                                key={file.id}
                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <CheckCircle size={20} className="text-green-500" />
                                    <div>
                                        <p className="font-medium text-gray-900">{file.file.name}</p>
                                        {/* Assuming pages and language are updated in the file object before rendering this view */}
                                        <p className="text-sm text-gray-600">
                                            {file.pages} pages • {file.language}
                                        </p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                    Completed
                                </span>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}
