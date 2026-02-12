import { useRef, useState } from 'react';
import { Upload as UploadIcon, CheckCircle, ArrowRight, FileText, X, Download } from 'lucide-react';
import { UploadedFile } from './types';

interface UploadStepProps {
    projectName: string;
    files: UploadedFile[];
    onFilesChange: (files: UploadedFile[]) => void;
    onUpload: (files: File[]) => void;
    onNext: () => void;
    onBack: () => void;
    onDownload: (file: UploadedFile) => void;
}

export default function UploadStep({
    projectName,
    files,
    onFilesChange,
    onUpload,
    onNext,
    onBack,
    onDownload
}: UploadStepProps) {
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);



    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
            e.target.value = '';
        }
    };

    const processFiles = (fileList: FileList) => {
        const newFiles = Array.from(fileList)
            .filter((file) =>
                file.type === 'application/pdf' ||
                file.type.startsWith('image/')
            );

        if (newFiles.length > 0) {
            onUpload(newFiles);

            // Auto-advance logic if needed, but safer to let user see upload progress first
            if (files.length + newFiles.length > 0) {
                // setTimeout(() => onNext(), 1500); 
            }
        }
    };

    const removeFile = (id: string) => {
        onFilesChange(files.filter((file) => file.id !== id));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-secondary-100 p-6 overflow-hidden relative">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-50 rounded-full blur-3xl -translate-y-24 translate-x-24 pointer-events-none" />

                <div className="flex items-center justify-between mb-10 relative z-10">
                    <div>
                        <h2 className="text-3xl font-bold text-secondary-900 leading-tight">Upload Documents</h2>
                        <p className="text-sm text-secondary-600 mt-2 font-semibold">
                            Project: <span className="font-bold text-brand-600 underline decoration-brand-200 decoration-2 underline-offset-4">{projectName}</span>
                        </p>
                    </div>
                    <button onClick={onBack} className="text-sm font-bold text-brand-600 hover:text-brand-800 transition-all bg-brand-50 hover:bg-brand-100 px-6 py-2.5 rounded-xl border border-brand-100 uppercase tracking-widest shadow-sm">
                        Change Project
                    </button>
                </div>

                <div
                    className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer shadow-inner ${dragActive
                        ? 'border-brand-500 bg-brand-50/50 scale-[1.01]'
                        : 'border-secondary-200 bg-gray-50/30 hover:bg-white hover:border-brand-400'
                        }`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,image/*"
                        onChange={handleFileInput}
                        className="hidden"
                        multiple
                    />
                    <div className="p-8 bg-gradient-to-br from-brand-600 to-brand-700 rounded-3xl inline-flex items-center justify-center mb-8 shadow-xl shadow-brand-100/50">
                        <UploadIcon size={48} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-secondary-900 mb-2 tracking-tight uppercase">Drop Files Here</h3>
                    <p className="text-secondary-600 mb-8 text-base font-semibold opacity-80">PDFs and Images supported</p>
                    <div className="flex items-center justify-center gap-8 text-xs text-secondary-500 font-bold uppercase tracking-[0.2em]">
                        <div className="flex items-center gap-3">
                            <CheckCircle size={20} className="text-brand-500" />
                            <span>Multiple PDFs</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle size={20} className="text-brand-500" />
                            <span>Max 50MB</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle size={20} className="text-brand-500" />
                            <span>Tamil OCR</span>
                        </div>
                    </div>
                </div>
            </div>

            {files.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl border border-secondary-100 p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-secondary-900 flex items-center gap-3 uppercase tracking-tight">
                            <span className="bg-brand-600 text-white px-3 py-1 rounded-xl text-sm shadow-lg">
                                {files.length}
                            </span>
                            Uploaded Files
                        </h3>
                        <button
                            onClick={onNext}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 uppercase tracking-wider"
                        >
                            Continue
                            <ArrowRight size={20} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {files.map((file) => (
                            <div
                                key={file.id}
                                className="flex items-center justify-between p-5 border border-secondary-100 rounded-2xl hover:bg-gray-50 hover:border-brand-200 hover:shadow-md transition-all duration-300"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <FileText size={20} className="text-brand-600" />
                                    <div className="flex-1">
                                        <p className="text-base font-bold text-secondary-900 tracking-tight">{file.name || file.file?.name}</p>
                                        <div className="flex items-center gap-4 mt-1">
                                            <p className="text-xs text-secondary-500 font-bold bg-secondary-50 px-3 py-1 rounded-lg border border-secondary-100 uppercase tracking-wide">{file.fileSize}</p>
                                            {file.status === 'uploading' && (
                                                <span className="text-xs text-brand-600 font-bold bg-brand-50 px-3 py-1 rounded-full flex items-center gap-2 border border-brand-100 uppercase tracking-wide">
                                                    <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                                                    Uploading... {file.progress}%
                                                </span>
                                            )}
                                            {file.status === 'completed' && (
                                                <span className="text-xs text-green-700 font-bold bg-green-50 px-3 py-1 rounded-full flex items-center gap-2 border border-green-100 uppercase tracking-wide">
                                                    <CheckCircle size={14} className="text-green-600" /> Uploaded
                                                </span>
                                            )}
                                            {file.status === 'error' && (
                                                <span className="text-xs text-red-700 font-bold bg-red-50 px-3 py-1 rounded-full border border-red-100 uppercase tracking-wide">Upload Failed</span>
                                            )}
                                        </div>
                                        {file.status === 'uploading' && (
                                            <div className="w-full h-1 bg-secondary-100 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className="h-full bg-brand-600 transition-all duration-300"
                                                    style={{ width: `${file.progress}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {(file.status === 'completed' || file.serverFileId) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDownload(file);
                                            }}
                                            className="text-secondary-400 hover:text-brand-600 p-2"
                                            title="Download"
                                        >
                                            <Download size={20} />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile(file.id);
                                        }}
                                        className="text-gray-400 hover:text-red-500 p-2"
                                        title="Remove"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
