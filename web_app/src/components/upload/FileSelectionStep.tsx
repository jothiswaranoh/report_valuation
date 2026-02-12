import { useRef, useState } from 'react';
import { Plus, Trash2, FileText, ChevronUp, ChevronDown, X, BarChart3, ArrowRight, Download } from 'lucide-react';
import { UploadedFile } from './types';

interface FileSelectionStepProps {
    files: UploadedFile[];
    selectedFiles: string[];
    setSelectedFiles: (ids: string[]) => void;
    onFilesChange: (files: UploadedFile[]) => void;
    onBack: () => void;
    onNext: () => void;
    onUpload: (files: File[]) => void;
    onDownload: (file: UploadedFile) => void;
}

export default function FileSelectionStep({
    files,
    selectedFiles,
    setSelectedFiles,
    onFilesChange,
    onBack,
    onNext,
    onUpload,
    onDownload
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
                .filter(file =>
                    file.type === 'application/pdf' ||
                    file.type.startsWith('image/')
                );
            onUpload(newFiles);
            e.target.value = '';
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-secondary-100 p-6 overflow-hidden relative">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-50 rounded-full blur-3xl -translate-y-24 translate-x-24 pointer-events-none" />

                <div className="flex items-center justify-between mb-10 relative z-10">
                    <div>
                        <h2 className="text-3xl font-bold text-secondary-900 leading-tight">Select Files</h2>
                        <p className="text-sm text-secondary-600 mt-2 font-semibold">Choose which documents to analyze</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="text-secondary-600 hover:text-brand-600 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:bg-secondary-50 border border-secondary-200 shadow-sm"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white border border-brand-200 hover:border-brand-500 hover:text-brand-600 text-brand-700 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
                        >
                            <Plus size={18} />
                            Add More
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,image/*"
                            onChange={handleAddMore}
                            className="hidden"
                            multiple
                        />
                    </div>
                </div>

                <div className="mb-8 p-6 bg-brand-50 border border-brand-100 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={selectedFiles.length === files.length && files.length > 0}
                                onChange={selectAllFiles}
                                className="rounded border-secondary-300 text-brand-600 focus:ring-brand-500 w-6 h-6 transition-all group-hover:scale-105"
                            />
                            <span className="font-bold text-secondary-900 text-base uppercase tracking-tight">Select All</span>
                        </label>
                        <span className="text-sm text-secondary-500 font-bold opacity-60">
                            ({selectedFiles.length} of {files.length} selected)
                        </span>
                    </div>
                    <button
                        onClick={clearAllFiles}
                        className="text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-[0.2em] flex items-center gap-2 bg-red-50 hover:bg-red-100 px-5 py-2.5 rounded-xl transition-colors border border-red-100"
                    >
                        <Trash2 size={16} />
                        Clear Selection
                    </button>
                </div>

                <div className="space-y-2 mb-6 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                    {files.map((file) => (
                        <div
                            key={file.id}
                            className={`p-3 border rounded-xl transition-all cursor-pointer group ${selectedFiles.includes(file.id)
                                ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                                : 'border-secondary-100 hover:border-brand-200 hover:bg-secondary-50'
                                }`}
                            onClick={() => toggleFileSelection(file.id)}
                        >
                            <div className="flex items-center gap-4">
                                <input
                                    type="checkbox"
                                    checked={selectedFiles.includes(file.id)}
                                    onChange={() => { }}
                                    className="rounded border-secondary-300 text-brand-600 focus:ring-brand-500 w-5 h-5 transition-transform group-hover:scale-105"
                                />
                                <div className={`p-3 rounded-xl ${selectedFiles.includes(file.id) ? 'bg-brand-100' : 'bg-secondary-50'} transition-colors`}>
                                    <FileText size={24} className="text-brand-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-bold text-secondary-900 truncate tracking-tight">{file.name || file.file?.name}</p>
                                    <div className="flex items-center gap-3 text-xs text-secondary-500 font-bold uppercase tracking-widest mt-0.5">
                                        <span>{file.fileSize} • {formatDate(file.uploadDate)}</span>
                                        {file.status === 'uploading' && (
                                            <span className="text-brand-600 animate-pulse">Uploading...</span>
                                        )}
                                        {file.status === 'error' && (
                                            <span className="text-red-600">Error</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    {(file.status === 'completed' || file.serverFileId) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDownload(file);
                                            }}
                                            className="text-secondary-400 hover:text-brand-600 p-1.5"
                                            title="Download"
                                        >
                                            <Download size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedFile(expandedFile === file.id ? null : file.id);
                                        }}
                                        className="text-secondary-400 hover:text-secondary-600 p-1.5"
                                    >
                                        {expandedFile === file.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile(file.id);
                                        }}
                                        className="text-secondary-400 hover:text-red-500 p-1.5"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {expandedFile === file.id && (
                                <div className="mt-3 pt-3 border-t border-secondary-100">
                                    <div className="grid grid-cols-2 gap-4 text-[10px] uppercase font-bold tracking-wider">
                                        <div>
                                            <p className="text-secondary-400">File Name</p>
                                            <p className="text-secondary-900 truncate font-semibold">{file.name || file.file?.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-secondary-400">Size</p>
                                            <p className="text-secondary-900 font-semibold">{file.fileSize}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between pt-8 border-t border-secondary-100 relative z-10">
                    <div className="text-sm font-bold text-secondary-400 uppercase tracking-[0.2em]">
                        <span className="text-brand-600 font-bold text-lg leading-none">{selectedFiles.length}</span> files selected
                    </div>
                    <button
                        onClick={onNext}
                        disabled={selectedFiles.length === 0}
                        className="bg-gradient-to-br from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 disabled:from-secondary-200 disabled:to-secondary-200 disabled:text-secondary-400 disabled:cursor-not-allowed text-white px-10 py-4 rounded-2xl font-bold text-base flex items-center gap-3 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 uppercase tracking-widest"
                    >
                        <BarChart3 size={20} />
                        Import & Analyze
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
