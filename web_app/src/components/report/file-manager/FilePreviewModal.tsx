import { FileText, Download } from 'lucide-react';
import { ReportFile } from '../../../types';
import { formatDate } from '../../../utils/formatDate';
import { Modal } from '../../common/Modal';

// react-pdf-viewer
// @react-pdf-viewer/core@3.x requires pdfjs-dist@3.11.174
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const WORKER_URL = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

interface FilePreviewModalProps {
    file: ReportFile | null;
    isOpen: boolean;
    onClose: () => void;
    onDownload: (file: ReportFile) => void;
}

export default function FilePreviewModal({
    file,
    isOpen,
    onClose,
    onDownload
}: FilePreviewModalProps) {
    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    const isPdf = file?.name?.toLowerCase().endsWith('.pdf');
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file?.name || '');

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={file?.name || 'File Preview'}
            size="full"
        >
            {/* Total container fills the modal body */}
            <div className="flex flex-col lg:flex-row gap-4" style={{ height: '80vh' }}>
                {file && (
                    <>
                        {/* Preview Area — fills remaining space */}
                        <div className="flex-1 min-w-0 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex flex-col shadow-inner">
                            {file.url && file.url !== '#' ? (
                                <>
                                    {isPdf ? (
                                        // Worker + Viewer must sit inside a fixed-height container
                                        <div className="flex-1 min-h-0" style={{ overflow: 'hidden' }}>
                                            <Worker workerUrl={WORKER_URL}>
                                                <div style={{ height: '100%' }}>
                                                    <Viewer
                                                        fileUrl={file.url}
                                                        plugins={[defaultLayoutPluginInstance]}
                                                        defaultScale={SpecialZoomLevel.PageWidth}
                                                    />
                                                </div>
                                            </Worker>
                                        </div>
                                    ) : isImage ? (
                                        <div className="flex-1 overflow-auto flex items-start justify-center p-4">
                                            <img
                                                src={file.url}
                                                alt={file.name}
                                                className="max-w-full object-contain shadow-lg"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                                            <FileText size={64} className="mb-4 text-gray-300" />
                                            <p className="font-medium">Preview not available for this file type</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                                    <FileText size={64} className="mb-4 text-gray-300" />
                                    <p className="font-medium">Preview unavailable</p>
                                </div>
                            )}
                        </div>

                        {/* Metadata Sidebar — fixed width */}
                        <div className="w-full lg:w-72 bg-white rounded-xl border border-gray-200 overflow-y-auto shadow-sm flex flex-col flex-shrink-0">
                            <div className="p-5 space-y-4 flex-1">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 mb-0.5">File Details</h3>
                                    <p className="text-xs text-gray-500">Metadata and information</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">File Name</label>
                                        <p className="text-sm font-medium text-gray-900 break-all">{file.name}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Size</label>
                                            <p className="text-sm font-medium text-gray-900">{file.size}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Type</label>
                                            <p className="text-sm font-medium text-gray-900">{file.type ? file.type.toUpperCase() : 'UNKNOWN'}</p>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Uploaded</label>
                                        <p className="text-sm font-medium text-gray-900">{formatDate(file.uploadedAt, 'long')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 border-t border-gray-100">
                                <button
                                    onClick={() => onDownload(file)}
                                    className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-brand-200"
                                >
                                    <Download size={16} /> Download File
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
