import { useRef, useState } from 'react';
import { Plus, Trash2, FileText, ChevronUp, ChevronDown, X, BarChart3, ArrowRight } from 'lucide-react';
import { UploadedFile } from './types';

interface FileSelectionStepProps {
    files: UploadedFile[];
    selectedFiles: string[];
    setSelectedFiles: (ids: string[]) => void;
    onFilesChange: (files: UploadedFile[]) => void; // needed for Add More
    onBack: () => void;
    onNext: () => void;
}

export default function FileSelectionStep({
    files,
    selectedFiles,
    setSelectedFiles,
    onFilesChange,
    onBack,
    onNext
}: FileSelectionStepProps) {
    const [expandedFile, setExpandedFile] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const toggleFileSelection = (id: string) => {
        setSelectedFiles(
            selectedFiles.includes(id)
                ? selectedFiles.filter((fileId) => fileId !== id)
                : [...selectedFiles, id]
        );
    };

    const selectAllFiles = () => {
        setSelectedFiles(selectedFiles.length === files.length ? [] : files.map((file) => file.id));
    };

    const removeFile = (id: string) => {
        const newFiles = files.filter(f => f.id !== id);
        onFilesChange(newFiles);
        // Also remove from selection if present
        if (selectedFiles.includes(id)) {
            setSelectedFiles(selectedFiles.filter(fid => fid !== id));
        }
    };

    const clearAllFiles = () => {
        setSelectedFiles([]);
    };

    const handleAddMore = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files)
                .filter(file => file.type === 'application/pdf')
                .map(file => ({
                    id: Math.random().toString(36).substr(2, 9),
                    file,
                    status: 'pending' as const,
                    progress: 0,
                    uploadDate: new Date(),
                    fileSize: formatFileSize(file.size)
                }));

            onFilesChange([...files, ...newFiles]);
            // Auto select new files
            setSelectedFiles([...selectedFiles, ...newFiles.map(f => f.id)]);
            e.target.value = '';
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Select Files to Process</h2>
                        <p className="text-gray-600 mt-1">Choose which documents to analyze</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg font-medium"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Add More
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleAddMore}
                            className="hidden"
                            multiple
                        />
                    </div>
                </div>

                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedFiles.length === files.length && files.length > 0}
                                onChange={selectAllFiles}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
                            />
                            <span className="font-medium text-gray-900">Select All Files</span>
                        </label>
                        <span className="text-sm text-gray-600">
                            ({selectedFiles.length} of {files.length} selected)
                        </span>
                    </div>
                    <button
                        onClick={clearAllFiles}
                        className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                        <Trash2 size={16} />
                        Clear Selection
                    </button>
                </div>

                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                    {files.map((file) => (
                        <div
                            key={file.id}
                            className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${selectedFiles.includes(file.id)
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                            onClick={() => toggleFileSelection(file.id)}
                        >
                            <div className="flex items-center gap-4">
                                <input
                                    type="checkbox"
                                    checked={selectedFiles.includes(file.id)}
                                    onChange={() => { }}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
                                />
                                <FileText size={24} className="text-blue-600" />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{file.file.name}</p>
                                    <p className="text-sm text-gray-600">
                                        {file.fileSize} • {formatDate(file.uploadDate)}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedFile(expandedFile === file.id ? null : file.id);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 p-2"
                                >
                                    {expandedFile === file.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(file.id);
                                    }}
                                    className="text-gray-400 hover:text-red-500 p-2"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {expandedFile === file.id && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500 font-medium">File Name</p>
                                            <p className="text-gray-900">{file.file.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 font-medium">Size</p>
                                            <p className="text-gray-900">{file.fileSize}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 font-medium">Upload Date</p>
                                            <p className="text-gray-900">{formatDate(file.uploadDate)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 font-medium">Type</p>
                                            <p className="text-gray-900">PDF Document</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">{selectedFiles.length}</span> files
                        selected for processing
                    </div>
                    <button
                        onClick={onNext}
                        disabled={selectedFiles.length === 0}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center gap-2 transition-all shadow-lg"
                    >
                        <BarChart3 size={20} />
                        Import & Analyze Files
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
