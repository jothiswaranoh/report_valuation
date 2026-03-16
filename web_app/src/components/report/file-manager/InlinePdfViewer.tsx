import { ArrowLeft, Download, FileText } from 'lucide-react';
import { ReportFile } from '../../../types';
import { formatDate } from '../../../utils/formatDate';
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const WORKER_URL = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

interface InlinePdfViewerProps {
    file: ReportFile;
    onClose: () => void;
    onDownload: (file: ReportFile) => void;
}

export default function InlinePdfViewer({ file, onClose, onDownload }: InlinePdfViewerProps) {
    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    const isPdf = file.name?.toLowerCase().endsWith('.pdf');
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name || '');

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden h-full">
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-100 bg-white flex-shrink-0">
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-800 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Files
                </button>

                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 truncate max-w-xs">{file.name}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{file.size}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase">{file.type}</span>
                    <span className="text-xs text-gray-400">{formatDate(file.uploadedAt, 'long')}</span>
                    <button
                        onClick={() => onDownload(file)}
                        className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm"
                    >
                        <Download size={13} />
                        Download
                    </button>
                </div>
            </div>

            {/* Content — flex-1 + overflow-hidden so only the viewer's internal scroll fires */}
            <div className="flex-1 min-h-0 overflow-hidden bg-slate-50 relative">
                {file.url && file.url !== '#' ? (
                    isPdf ? (
                        <div className="absolute inset-0">
                            <Worker workerUrl={WORKER_URL}>
                                <Viewer
                                    fileUrl={file.url}
                                    plugins={[defaultLayoutPluginInstance]}
                                    defaultScale={SpecialZoomLevel.PageWidth}
                                />
                            </Worker>
                        </div>
                    ) : isImage ? (
                        <div className="flex items-center justify-center h-full p-8">
                            <img
                                src={file.url}
                                alt={file.name}
                                className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <FileText size={64} className="mb-4 text-gray-300" />
                            <p className="font-medium">Preview not available for this file type</p>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <FileText size={64} className="mb-4 text-gray-300" />
                        <p className="font-medium">Preview unavailable</p>
                    </div>
                )}
            </div>
        </div>
    );
}
