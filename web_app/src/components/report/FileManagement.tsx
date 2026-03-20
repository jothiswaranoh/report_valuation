import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { ApiFile } from '../../apis/files.api';
import filesApi from '../../apis/files.api';
import reportsApi from '../../apis/report.api';
import FileList from './file-manager/FileList';
import InlinePdfViewer from './file-manager/InlinePdfViewer';
import FileManagerHeader from './file-manager/FileManagerHeader';
import FileBreadcrumb from './file-manager/FileBreadcrumb';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';

interface Toast {
    id: number;
    type: 'success' | 'error';
    message: string;
}

export default function FileManagement() {
    // ── URL-based navigation ──────────────────────────────────────────────────
    const [searchParams, setSearchParams] = useSearchParams();
    const currentPath = searchParams.get('path') ?? '';

    // ── API data ──────────────────────────────────────────────────────────────
    const [folders, setFolders] = useState<string[]>([]);
    const [files, setFiles] = useState<ApiFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── UI state ──────────────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [previewFile, setPreviewFile] = useState<ApiFile | null>(null);
    const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [activeTab, setActiveTab] = useState<'files' | 'recents'>('files');
    const [deleteItem, setDeleteItem] = useState<ApiFile | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);

    // ── Clipboard (for copy/paste) ────────────────────────────────────────────
    const [clipboard, setClipboard] = useState<{ fileId: string; fileName: string } | null>(null);

    // ── Fetch files from API ──────────────────────────────────────────────────
    const fetchFiles = useCallback(async (path: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await filesApi.listFiles(path);
            setFolders(data.folders);
            setFiles(data.files);
        } catch (err: any) {
            setError(err.message || 'Failed to load files');
            setFolders([]);
            setFiles([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Re-fetch whenever the path changes
    useEffect(() => {
        fetchFiles(currentPath);
    }, [currentPath, fetchFiles]);

    const refresh = useCallback(() => {
        fetchFiles(currentPath);
    }, [currentPath, fetchFiles]);

    // ── Toast helpers ─────────────────────────────────────────────────────────
    const showToast = (type: 'success' | 'error', message: string) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
    };

    // ── Navigation ────────────────────────────────────────────────────────────
    const navigateToFolder = (folderName: string) => {
        const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
        setSearchParams({ path: newPath });
        setSearchQuery('');
    };

    const navigateBreadcrumb = (path: string) => {
        if (path === '') {
            setSearchParams({});
        } else {
            setSearchParams({ path });
        }
        setSearchQuery('');
    };

    // ── Preview ───────────────────────────────────────────────────────────────
    const handlePreview = async (file: ApiFile) => {
        try {
            const blob = await reportsApi.downloadFile(file.id);
            const blobUrl = URL.createObjectURL(blob);
            setPreviewBlobUrl(blobUrl);
            setPreviewFile(file);
        } catch (err) {
            console.error('Error fetching preview:', err);
            setPreviewFile(file);
        }
    };

    const handleClosePreview = () => {
        if (previewBlobUrl) {
            URL.revokeObjectURL(previewBlobUrl);
            setPreviewBlobUrl(null);
        }
        setPreviewFile(null);
    };

    // ── Download ──────────────────────────────────────────────────────────────
    const handleDownload = async (file: ApiFile) => {
        try {
            const blob = await reportsApi.downloadFile(file.id);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.file_name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err: any) {
            showToast('error', err.message || 'Download failed');
        }
    };

    // ── Rename ────────────────────────────────────────────────────────────────
    const handleRename = async (file: ApiFile) => {
        const newName = window.prompt(`Rename "${file.file_name}" to:`, file.file_name);
        if (!newName || newName.trim() === '' || newName === file.file_name) return;
        try {
            await filesApi.renameFile(file.id, newName.trim());
            showToast('success', `Renamed to "${newName.trim()}"`);
            refresh();
        } catch (err: any) {
            showToast('error', err.message || 'Rename failed');
        }
    };

    // ── Copy (clipboard) ─────────────────────────────────────────────────────
    const handleCopy = (file: ApiFile) => {
        console.log('[Clipboard] Copy:', file.id, file.file_name);
        setClipboard({ fileId: file.id, fileName: file.file_name });
        showToast('success', `"${file.file_name}" copied to clipboard`);
    };

    // ── Paste ─────────────────────────────────────────────────────────────────
    const handlePaste = async () => {
        if (!clipboard) {
            console.log('[Clipboard] Paste called but clipboard is empty');
            return;
        }
        console.log('[Clipboard] Paste:', clipboard.fileId, 'into path:', currentPath);
        try {
            await filesApi.copyFile(clipboard.fileId, currentPath);
            showToast('success', `Pasted "${clipboard.fileName}"`);
            setClipboard(null);
            console.log('[Clipboard] Cleared after paste');
            refresh();
        } catch (err: any) {
            showToast('error', err.message || 'Paste failed');
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const confirmDelete = async () => {
        if (!deleteItem) return;
        setIsDeleting(true);
        try {
            await filesApi.deleteFile(deleteItem.id);
            showToast('success', `Deleted "${deleteItem.file_name}"`);
            setDeleteItem(null);
            refresh();
        } catch (err: any) {
            showToast('error', err.message || 'Delete failed');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteAction = (file: ApiFile) => {
        setDeleteItem(file);
    };

    // ── Filtered data ─────────────────────────────────────────────────────────
    const filteredFolders = useMemo(() => {
        if (!searchQuery.trim()) return folders;
        const q = searchQuery.toLowerCase();
        return folders.filter((f) => f.toLowerCase().includes(q));
    }, [folders, searchQuery]);

    const filteredFiles = useMemo(() => {
        if (!searchQuery.trim()) return files;
        const q = searchQuery.toLowerCase();
        return files.filter((f) => f.file_name.toLowerCase().includes(q));
    }, [files, searchQuery]);

    const itemCount = filteredFolders.length + filteredFiles.length;

    // ── Build preview file object for InlinePdfViewer ─────────────────────────
    const previewReportFile = previewFile
        ? {
            id: previewFile.id,
            name: previewFile.file_name,
            type: 'original' as const,
            size: '',
            uploadedAt: new Date(),
            url: previewBlobUrl || '',
        }
        : null;

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-brand-100 shadow-lg overflow-hidden">

                {previewReportFile ? (
                    <InlinePdfViewer
                        file={previewReportFile}
                        onClose={handleClosePreview}
                        onDownload={() => previewFile && handleDownload(previewFile)}
                    />
                ) : (
                    <>
                        {/* ── Top Header Bar ── */}
                        <FileManagerHeader
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                            activeTab={activeTab}
                            onTabChange={(tab) => {
                                setActiveTab(tab);
                                if (tab === 'recents') {
                                    setSearchQuery('');
                                }
                            }}
                            clipboard={clipboard}
                            onPaste={handlePaste}
                        />

                        {/* ── Main content area ── */}
                        <div className="flex-1 bg-slate-50 overflow-auto">
                            <div className="p-6">
                                <div className="mb-6">
                                    {activeTab === 'files' ? (
                                        <FileBreadcrumb
                                            path={currentPath}
                                            onNavigate={navigateBreadcrumb}
                                            fileCount={itemCount}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-800">Recent Files</span>
                                            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                                                {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-24 text-center">
                                        <Loader2 size={32} className="text-brand-500 animate-spin mb-4" />
                                        <p className="text-sm text-slate-500">Loading files…</p>
                                    </div>
                                ) : error ? (
                                    <div className="flex flex-col items-center justify-center py-24 text-center">
                                        <AlertCircle size={32} className="text-red-400 mb-4" />
                                        <p className="text-sm text-red-600 font-medium">{error}</p>
                                        <button
                                            onClick={refresh}
                                            className="mt-3 px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                ) : (
                                    <FileList
                                        folderNames={filteredFolders}
                                        files={filteredFiles}
                                        viewMode={viewMode}
                                        onFolderClick={navigateToFolder}
                                        onPreview={handlePreview}
                                        onDownload={handleDownload}
                                        onCopy={handleCopy}
                                        onRename={handleRename}
                                        onDelete={handleDeleteAction}
                                    />
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ── Delete Modal ── */}
                {deleteItem && (
                    <DeleteConfirmModal
                        isOpen={!!deleteItem}
                        onClose={() => setDeleteItem(null)}
                        onConfirm={confirmDelete}
                        title="Delete File"
                        message="Are you sure you want to delete this file?"
                        itemName={deleteItem.file_name}
                        isDeleting={isDeleting}
                    />
                )}

                {/* ── Toast Notifications ── */}
                <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50 pointer-events-none">
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg pointer-events-auto
                                text-sm font-medium transition-all duration-300 animate-slide-up
                                ${toast.type === 'success'
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                                    : 'bg-red-50 border border-red-200 text-red-800'
                                }
                            `}
                        >
                            {toast.type === 'success'
                                ? <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                                : <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                            }
                            {toast.message}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
