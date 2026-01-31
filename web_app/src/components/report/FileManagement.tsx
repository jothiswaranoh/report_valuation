import { useState } from 'react';
import {
    Folder,
    FolderOpen,
    ChevronRight,
    ChevronDown,
    FileText,
    Download,
    Eye,
    RefreshCw,
    Search,
    Filter,
} from 'lucide-react';
import { FileNode, ValuationReport, ReportFile } from '../../types';
import { formatDate } from '../../utils/formatDate';
import { Modal } from '../common/Modal';

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
                return 'Original PDF';
            case 'extracted':
                return 'Extracted Data';
            case 'draft':
                return 'Draft Report';
            case 'final':
                return 'Final Report';
            default:
                return 'Unknown';
        }
    };

    const getFileTypeColor = (type: string) => {
        switch (type) {
            case 'original':
                return 'bg-blue-100 text-blue-700';
            case 'extracted':
                return 'bg-purple-100 text-purple-700';
            case 'draft':
                return 'bg-amber-100 text-amber-700';
            case 'final':
                return 'bg-green-100 text-green-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const renderTreeNode = (node: FileNode, level: number = 0) => {
        const isExpanded = expandedNodes.has(node.id);
        const isSelected = selectedNode?.id === node.id;

        return (
            <div key={node.id}>
                <div
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                    style={{ paddingLeft: `${level * 16 + 12}px` }}
                    onClick={() => {
                        if (node.type === 'folder') {
                            toggleNode(node.id);
                        }
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
                    <div>{node.children.map((child) => renderTreeNode(child, level + 1))}</div>
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
        if (file.url && file.url !== '#') {
            const link = document.createElement('a');
            link.href = file.url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            // Fallback for demo files without a real URL
            alert(`Downloading ${file.name} is not available in demo mode (simulated)`);
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
                                placeholder="Search folders..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="p-2">{fileTree.map((node) => renderTreeNode(node))}</div>
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

                        {selectedFiles.length === 0 ? (
                            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                                <Folder size={48} className="mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600">Select a folder to view files</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
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
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">{file.name}</p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span
                                                                className={`text-xs px-2 py-1 rounded-full ${getFileTypeColor(file.type)}`}
                                                            >
                                                                {getFileTypeLabel(file.type)}
                                                            </span>
                                                            <span className="text-sm text-gray-600">{file.size}</span>
                                                            <span className="text-sm text-gray-600">
                                                                {formatDate(file.uploadedAt, 'short')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="View"
                                                        onClick={() => setPreviewFile(file)}
                                                    >
                                                        <Eye size={18} className="text-gray-600" />
                                                    </button>
                                                    <button
                                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Download"
                                                        onClick={() => handleDownload(file)}
                                                    >
                                                        <Download size={18} className="text-gray-600" />
                                                    </button>
                                                    {file.type === 'draft' && (
                                                        <button
                                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                            title="Re-generate"
                                                        >
                                                            <RefreshCw size={18} className="text-gray-600" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                title={previewFile?.name || 'File Preview'}
                size="full"
            >
                <div className="h-[80vh] flex flex-col">
                    {previewFile && (
                        <div className="flex-1 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                            {/* Since we don't have a real backend to serve the files, we'll show a placeholder or iframe if URL is present and not # */}
                            {previewFile.url && previewFile.url !== '#' ? (
                                <iframe
                                    src={previewFile.url}
                                    className="w-full h-full rounded-lg"
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
