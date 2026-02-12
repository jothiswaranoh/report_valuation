import { useState } from 'react';
import {
    Folder,
    FolderOpen,
    ChevronRight,
    FileText,
    Download,
    Eye,
    Grid,
    List as ListIcon,
    Trash2,
    ChevronDown,
    Search,
    Filter,
    Upload,
    X
} from 'lucide-react';
import { FileNode, ValuationReport, ReportFile } from '../../types';
import { formatDate } from '../../utils/formatDate';
import { Modal } from '../common/Modal';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

interface UploadFile {
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
}

interface FileManagementProps {
    fileTree: FileNode[];
    reports: ValuationReport[];
    onNavigate: (page: string, reportId?: string) => void;
}

export default function FileManagement({ fileTree, reports, onNavigate }: FileManagementProps) {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [previewFile, setPreviewFile] = useState<ReportFile | null>(null);

    const toggleNode = (nodeId: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId);
        } else {
            newExpanded.add(nodeId);
        }
        setExpandedNodes(newExpanded);
    };

    const selectNode = (node: FileNode) => {
        setSelectedNode(node);
    };

    const getFileTypeLabel = (type: string) => {
        switch (type) {
            case 'original':
                return 'Original';
            case 'extracted':
                return 'Extracted';
            case 'draft':
                return 'Draft';
            case 'final':
                return 'Final';
            default:
                return 'File';
        }
    };

    const getFileTypeColor = (type: string) => {
        switch (type) {
            case 'original':
                return 'bg-blue-100 text-blue-700';
            case 'extracted':
                return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'draft':
                return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'final':
                return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const confirmDelete = async () => {
        if (!deleteItem || !onDelete) return;
        setIsDeleting(true);
        try {
            await onDelete(deleteItem);
            setDeleteItem(null);
        } catch (error) {
            console.error('Delete failed:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const confirmDeleteReport = async () => {
        if (!deleteReportId || !onDeleteReport) return;
        setIsDeleting(true);
        try {
            await onDeleteReport(deleteReportId);
            setDeleteReportId(null);
            if (selectedNode?.id === deleteReportId) {
                setSelectedNode(null);
            }
        } catch (error) {
            console.error('Delete report failed:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const renderTreeNode = (node: FileNode, level: number = 0) => {
        const isExpanded = expandedNodes.has(node.id);
        const isSelected = selectedNode?.id === node.id;

        return (
            <div key={node.id} className="mb-0.5 group">
                <div
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                    style={{ paddingLeft: `${level * 16 + 16}px` }}
                    onClick={() => {
                        if (node.type === 'folder') toggleNode(node.id);
                        selectNode(node);
                    }}
                >
                    {node.type === 'folder' && (
                        <span className="text-gray-400">
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                    )}

                    {node.type === 'folder' ? (
                        isExpanded ? (
                            <FolderOpen size={18} className="text-blue-500" />
                        ) : (
                            <Folder size={18} className="text-blue-500" />
                        )
                    ) : (
                        <FileText size={18} className="text-gray-400" />
                    )}
                    <span className="text-sm font-medium truncate">{node.name}</span>
                </div>
                {node.type === 'folder' && isExpanded && node.children && (
                    <div className="mt-0.5">
                        {node.children.map((child) => renderTreeNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    const getSelectedFiles = () => {
        if (!selectedNode) return [];

        if (selectedNode.type === 'file' && selectedNode.reportId) {
            const report = reports.find((r) => r.id === selectedNode.reportId);
            return report ? [report.files.find((f) => f.id === selectedNode.id)].filter(Boolean) : [];
        }

        if (selectedNode.type === 'folder' && selectedNode.children) {
            const files = selectedNode.children
                .filter((child) => child.type === 'file' && child.reportId)
                .map((child) => {
                    const report = reports.find((r) => r.id === child.reportId);
                    return report?.files.find((f) => f.id === child.id);
                })
                .filter(Boolean);
            return files;
        }

        return [];
    };

    const selectedFiles = getSelectedFiles();

    const handleDownload = (file: ReportFile) => {
        if (onDownload) {
            onDownload(file);
            return;
        }

        if (file.url && file.url !== '#') {
            const link = document.createElement('a');
            link.href = file.url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert(`Downloading ${file.name} is not available in demo mode (simulated)`);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length > 0) addFilesToUpload(files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) addFilesToUpload(files);
    };

    const addFilesToUpload = (files: File[]) => {
        const newUploadFiles: UploadFile[] = files.map(file => ({
            file,
            progress: 0,
            status: 'pending' as const,
        }));
        setUploadFiles(prev => [...prev, ...newUploadFiles]);
        setShowUploadModal(true);
    };

    const removeUploadFile = (index: number) => {
        setUploadFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        const reportId = selectedNode?.reportId || (selectedNode?.type === 'folder' ? selectedNode.id : null);
        if (!reportId || !onUpload) {
            alert('Please select a report folder to upload files to');
            return;
        }

        const filesToUpload = uploadFiles.filter(f => f.status === 'pending').map(f => f.file);
        if (filesToUpload.length === 0) return;

        try {
            setUploadFiles(prev =>
                prev.map(f =>
                    f.status === 'pending' ? { ...f, status: 'uploading' as const, progress: 50 } : f
                )
            );

            await onUpload(reportId, filesToUpload);

            setUploadFiles(prev =>
                prev.map(f =>
                    f.status === 'uploading' ? { ...f, status: 'success' as const, progress: 100 } : f
                )
            );

            setTimeout(() => {
                setShowUploadModal(false);
                setUploadFiles([]);
            }, 1500);
        } catch (error) {
            setUploadFiles(prev =>
                prev.map(f =>
                    f.status === 'uploading'
                        ? { ...f, status: 'error' as const, error: 'Upload failed' }
                        : f
                )
            );
        }
    };

    return (
        <div className="h-screen flex flex-col">
            <div className="p-8 border-b border-gray-200 bg-white">
                <h1 className="text-3xl font-bold text-gray-900">File Management</h1>
                <p className="text-gray-600 mt-2">Browse and manage valuation reports</p>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-80 bg-white border-r border-gray-200 overflow-auto">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-sm font-semibold text-gray-700 mb-3">Folder Structure</h2>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search reports..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="p-2 overflow-y-auto flex-1 custom-scrollbar">
                        {fileTree.map((node) => renderTreeNode(node))}
                    </div>
                </div>

                <div className="flex-1 bg-gray-50 overflow-auto">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {selectedNode ? selectedNode.name : 'Select a folder or file'}
                                </h2>
                                {selectedNode && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        {selectedNode.type === 'folder' ? 'Folder' : 'File'} • {selectedFiles.length} items
                                    </p>
                                )}
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors">
                                <Filter size={16} />
                                <span className="text-sm font-medium">Filter</span>
                            </button>
                        </div>
                    </div>

                        {selectedFiles.length === 0 ? (
                            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                                <Folder size={48} className="mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600">Select a folder to view files</p>
                            </div>
                        ) : (
                            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
                                {selectedFiles.map((file) => {
                                    if (!file) return null;
                                    return (
                                        <div
                                            key={file.id}
                                            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                        <FileText size={24} className="text-blue-600" />
                                                    </div>

                                                    {/* Background logic decoration */}
                                                    <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-brand-50 rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-700" />

                                                    <div className="flex items-center gap-3 pt-5 border-t border-gray-50 dark:border-slate-800">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handlePreview(file);
                                                            }}
                                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 rounded-xl transition-all border border-transparent shadow-sm"
                                                        >
                                                            <Eye size={18} /> Preview
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDownload(file);
                                                            }}
                                                            className="p-2.5 text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all border border-transparent hover:shadow-sm"
                                                            title="Download"
                                                        >
                                                            <Download size={20} />
                                                        </button>
                                                        {onDelete && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeleteItem(file);
                                                                }}
                                                                className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:shadow-sm"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={20} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="group bg-white border border-gray-200 rounded-2xl p-4 hover:border-brand-400 hover:shadow-lg transition-all duration-300 flex items-center justify-between">
                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                        <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand-100 transition-colors shadow-inner">
                                                            <FileText className="text-brand-600" size={24} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-base font-bold text-secondary-900 truncate" title={file.name}>{file.name}</h4>
                                                            <p className="text-xs text-secondary-500 font-medium">{file.size} • {formatDate(file.uploadedAt, 'short')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-4">
                                                        <button onClick={() => handlePreview(file)} className="p-2.5 hover:bg-brand-50 rounded-xl text-brand-600 transition-all shadow-sm hover:shadow" title="Preview">
                                                            <Eye size={20} />
                                                        </button>
                                                        <button onClick={() => handleDownload(file)} className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-600 transition-all shadow-sm hover:shadow" title="Download">
                                                            <Download size={20} />
                                                        </button>
                                                        {onDelete && (
                                                            <button onClick={() => setDeleteItem(file)} className="p-2.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all shadow-sm hover:shadow" title="Delete">
                                                                <Trash2 size={20} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {isRefreshing && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl transition-all duration-300">
                            <div className="flex flex-col items-center gap-3 bg-white px-6 py-4 rounded-xl shadow-lg border border-secondary-100 animate-in fade-in zoom-in duration-200">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                                <p className="text-sm font-medium text-secondary-600">Updating files...</p>
                            </div>
                        </div>
                    )}
                </div>

            <Modal
                isOpen={!!previewFile}
                onClose={handleClosePreview}
                title={previewFile?.name || 'File Preview'}
                size="full"
            >
                <div className="h-[80vh] flex flex-col">
                    {previewFile && (
                        <div className="flex-1 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                            {/* Since we don't have a real backend to serve the files, we'll show a placeholder or iframe if URL is present and not # */}
                            {previewFile.url && previewFile.url !== '#' ? (
                                <iframe
                                    src={`${previewBlobUrl}#view=FitH`}
                                    className="w-full h-full"
                                    title={previewFile.name}
                                />
                            ) : (
                                <div className="text-center p-8">
                                    <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">{previewFile.name}</h3>
                                    <p className="text-gray-500 mb-4">
                                        This file was uploaded on {formatDate(previewFile.uploadedAt, 'long')}.
                                    </p>
                                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg inline-block text-sm">
                                        Preview not available in demo mode
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
