import { useRef, useState } from 'react';
import { Upload as UploadIcon, CheckCircle, ArrowRight, FileText, X } from 'lucide-react';
import { UploadedFile } from './types';

interface UploadStepProps {
    projectName: string;
    files: UploadedFile[];
    onFilesChange: (files: UploadedFile[]) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function UploadStep({
    projectName,
    files,
    onFilesChange,
    onNext,
    onBack
}: UploadStepProps) {
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

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
            .filter((file) => file.type === 'application/pdf')
            .map((file) => ({
                id: Math.random().toString(36).substr(2, 9),
                file,
                status: 'pending' as const,
                progress: 0,
                uploadDate: new Date(),
                fileSize: formatFileSize(file.size)
            }));

        if (newFiles.length > 0) {
            onFilesChange([...files, ...newFiles]);
            // Note: Auto-navigation logic (if needed) should be handled by parent or here if we want immediate transition
            if (files.length + newFiles.length > 0) {
                // Could call onNext() but typically we let user decide when to continue unless it's the very first upload
                setTimeout(() => onNext(), 500); // Small delay for UX
            }
        }
    };

    const removeFile = (id: string) => {
        onFilesChange(files.filter((file) => file.id !== id));
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Upload Documents</h2>
                        <p className="text-gray-600 mt-1">
                            Project: <span className="font-semibold">{projectName}</span>
                        </p>
                    </div>
                    <button onClick={onBack} className="text-sm text-gray-600 hover:text-gray-900">
                        Change Project Name
                    </button>
                </div>

                <div
                    className={`border-3 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${dragActive
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
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
                        accept=".pdf"
                        onChange={handleFileInput}
                        className="hidden"
                        multiple
                    />
                    <div className="p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full inline-flex items-center justify-center mb-6">
                        <UploadIcon size={40} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">Drop PDF Files Here</h3>
                    <p className="text-gray-600 mb-6 text-lg">or click to browse from your computer</p>
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={18} className="text-green-500" />
                            <span>Multiple PDFs</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={18} className="text-green-500" />
                            <span>Max 50MB each</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={18} className="text-green-500" />
                            <span>Tamil supported</span>
                        </div>
                    </div>
                </div>
            </div>

            {files.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Uploaded Files ({files.length})</h3>
                        <button
                            onClick={onNext}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
                        >
                            Continue
                            <ArrowRight size={18} />
                        </button>
                    </div>
                    <div className="space-y-2">
                        {files.map((file) => (
                            <div
                                key={file.id}
                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText size={20} className="text-blue-600" />
                                    <div>
                                        <p className="font-medium text-gray-900">{file.file.name}</p>
                                        <p className="text-sm text-gray-600">{file.fileSize}</p>
                                    </div>
                                </div>
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
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
