import { useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { FileNode, ValuationReport, ReportFile } from '../../types';
import FileList from './file-manager/FileList';
import InlinePdfViewer from './file-manager/InlinePdfViewer';
import FileManagerHeader from './file-manager/FileManagerHeader';
import FileBreadcrumb from './file-manager/FileBreadcrumb';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import reportsApi from '../../apis/report.api';

/**
 * Traverse the file tree and return an ordered array of FOLDER nodes
 * from the root down to the given targetId.
 * If targetId belongs to a file, the path stops at its parent folder.
 */
function getNodePath(
    nodes: FileNode[],
    targetId: string,
    currentPath: FileNode[] = []
): FileNode[] | null {
    for (const node of nodes) {
        if (node.id === targetId) {
            return node.type === 'folder' ? [...currentPath, node] : currentPath;
        }
        if (node.children && node.children.length > 0) {
            const nextPath = node.type === 'folder' ? [...currentPath, node] : currentPath;
            const result = getNodePath(node.children, targetId, nextPath);
            if (result !== null) return result;
        }
    }
    return null;
}

// ── Recursive State Mutators for Rename, Copy, Delete ─────────────────────────

function copyNodeDeep(node: FileNode, newId: string, copyName: string): FileNode {
    return {
        ...node,
        id: newId,
        name: copyName,
        children: node.children ? node.children.map(child => copyNodeDeep(child, crypto.randomUUID(), child.name)) : undefined,
    };
}

function copyNode(tree: FileNode[], targetId: string): FileNode[] {
    return tree.flatMap((node) => {
        if (node.id === targetId) {
            // Found it. Duplicate it with " copy" appended
            const baseName = node.name.replace(/\.[^/.]+$/, '');
            const ext = node.name.includes('.') ? node.name.slice(node.name.lastIndexOf('.')) : '';
            const copyName = `${baseName} copy${ext}`;
            const copiedNode = copyNodeDeep(node, crypto.randomUUID(), copyName);

            // Return original plus copy in the exact same directory
            return [node, copiedNode];
        }
        if (node.children) {
            return [{ ...node, children: copyNode(node.children, targetId) }];
        }
        return [node];
    });
}

function renameNode(tree: FileNode[], targetId: string, newName: string): FileNode[] {
    return tree.map((node) => {
        if (node.id === targetId) {
            return { ...node, name: newName };
        }
        if (node.children) {
            return { ...node, children: renameNode(node.children, targetId, newName) };
        }
        return node;
    });
}

function deleteNode(tree: FileNode[], targetId: string): FileNode[] {
    return tree.filter(node => node.id !== targetId).map(node => {
        if (node.children) {
            return { ...node, children: deleteNode(node.children, targetId) };
        }
        return node;
    });
}

interface FileManagementProps {
    fileTree: FileNode[];
    reports: ValuationReport[];
    onDownload?: (file: ReportFile) => void;
    onDelete?: (file: ReportFile) => Promise<void>;
    onMoveFile?: (fileId: string, targetNode: FileNode) => Promise<void>;
}

interface Toast {
    id: number;
    type: 'success' | 'error';
    message: string;
}

export default function FileManagement({
    fileTree: propFileTree,
    reports,
    onDownload,
    onDelete,
    onMoveFile,
}: FileManagementProps) {
    // ── Navigation state ──────────────────────────────────────────────────────
    /** The folder the user has navigated into. null = root ("My Files"). */
    const [currentFolderNode, setCurrentFolderNode] = useState<FileNode | null>(null);

    // ── Other UI state ────────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [previewFile, setPreviewFile] = useState<ReportFile | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [activeTab, setActiveTab] = useState<'files' | 'recents'>('files');
    const [deleteItem, setDeleteItem] = useState<ReportFile | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [draggedFile, setDraggedFile] = useState<ReportFile | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);

    // Local file tree — mutated optimistically on drag & drop
    const [localFileTree, setLocalFileTree] = useState<FileNode[]>(propFileTree);
    const [prevPropFileTree, setPrevPropFileTree] = useState<FileNode[]>(propFileTree);
    if (propFileTree !== prevPropFileTree) {
        setPrevPropFileTree(propFileTree);
        setLocalFileTree(propFileTree);
    }

    // ── Toast helpers ─────────────────────────────────────────────────────────
    const showToast = (type: 'success' | 'error', message: string) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
    };

    // ── Preview ───────────────────────────────────────────────────────────────
    const handlePreview = async (file: ReportFile) => {
        if (file.url && file.url.includes('/api/')) {
            try {
                const blob = await reportsApi.downloadFile(file.id);
                const blobUrl = URL.createObjectURL(blob);
                setPreviewFile({ ...file, url: blobUrl });
            } catch (error) {
                console.error('Error fetching preview:', error);
                setPreviewFile(file);
            }
        } else {
            setPreviewFile(file);
        }
    };

    const handleClosePreview = () => {
        if (previewFile?.url && previewFile.url.startsWith('blob:')) {
            URL.revokeObjectURL(previewFile.url);
        }
        setPreviewFile(null);
    };

    // ── Delete ────────────────────────────────────────────────────────────────
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

    // ── Drag & drop (move file in tree) ───────────────────────────────────────
    const moveFileInTree = useCallback(
        (tree: FileNode[], fileId: string, targetFolderId: string): { tree: FileNode[]; movedNode: FileNode | null } => {
            let movedNode: FileNode | null = null;

            const removeFile = (nodes: FileNode[]): FileNode[] =>
                nodes.reduce<FileNode[]>((acc, node) => {
                    if (node.type === 'file' && node.id === fileId) { movedNode = node; return acc; }
                    if (node.children) return [...acc, { ...node, children: removeFile(node.children) }];
                    return [...acc, node];
                }, []);

            const addFile = (nodes: FileNode[], fileNode: FileNode): FileNode[] =>
                nodes.map((node) => {
                    if (node.id === targetFolderId && node.type === 'folder')
                        return { ...node, children: [...(node.children || []), fileNode] };
                    if (node.children) return { ...node, children: addFile(node.children, fileNode) };
                    return node;
                });

            const treeWithoutFile = removeFile(tree);
            if (!movedNode) return { tree, movedNode: null };
            return { tree: addFile(treeWithoutFile, movedNode), movedNode };
        },
        []
    );

    // ── Local Kebab Actions (Copy, Rename, Delete) ────────────────────────────

    const handleCopy = (node: FileNode | ReportFile) => {
        setLocalFileTree(prev => copyNode(prev, node.id));
        showToast('success', `Copied "${node.name}" successfully`);
    };

    const handleRename = (node: FileNode | ReportFile) => {
        const newName = window.prompt(`Rename "${node.name}" to:`, node.name);
        if (newName && newName.trim() !== '' && newName !== node.name) {
            setLocalFileTree(prev => renameNode(prev, node.id, newName.trim()));
            showToast('success', `Renamed to "${newName.trim()}"`);
        }
    };

    const handleDeleteLocal = (node: FileNode | ReportFile) => {
        // As per prompt: "Delete should remove a file or folder from the tree... The UI should update immediately"
        // We will directly apply local state deletion.
        setLocalFileTree(prev => deleteNode(prev, node.id));
        showToast('success', `Deleted "${node.name}"`);
    };

    // ── Download ──────────────────────────────────────────────────────────────
    const handleDownload = (file: ReportFile) => {
        if (onDownload) { onDownload(file); return; }
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

    // ── Derived display data ──────────────────────────────────────────────────

    /**
     * Children of the current folder (or root nodes when at root).
     * Filtered by searchQuery if present.
     */
    const currentChildren = useMemo<FileNode[]>(() => {
        const children = currentFolderNode?.children ?? localFileTree;
        if (!searchQuery.trim()) return children;
        const q = searchQuery.toLowerCase();
        return children.filter((n) => n.name.toLowerCase().includes(q));
    }, [currentFolderNode, localFileTree, searchQuery]);

    const displayFolderNodes = useMemo(
        () => currentChildren.filter((n) => n.type === 'folder'),
        [currentChildren]
    );

    const displayFiles = useMemo<ReportFile[]>(
        () =>
            currentChildren
                .filter((n) => n.type === 'file' && n.reportId)
                .map((n) => {
                    const report = reports.find((r) => r.id === n.reportId);
                    return report?.files.find((f) => f.id === n.id);
                })
                .filter(Boolean) as ReportFile[],
        [currentChildren, reports]
    );

    /** All files across all reports sorted by most recent — for Recents tab */
    const allRecentFiles = useMemo<ReportFile[]>(() => {
        const all = reports.flatMap((r) => r.files ?? []);
        const filtered = searchQuery.trim()
            ? all.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
            : all;
        return [...filtered].sort(
            (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
    }, [reports, searchQuery]);

    /** Breadcrumb folder path for the current folder */
    const folderPath = useMemo<FileNode[]>(() => {
        if (!currentFolderNode) return [];
        return getNodePath(localFileTree, currentFolderNode.id) ?? [];
    }, [localFileTree, currentFolderNode]);

    /** Total item count shown in breadcrumb */
    const itemCount = activeTab === 'recents'
        ? allRecentFiles.length
        : displayFolderNodes.length + displayFiles.length;

    // ── Folder navigation ─────────────────────────────────────────────────────
    const navigateToFolder = (node: FileNode) => {
        setCurrentFolderNode(node);
        setSearchQuery('');
    };

    const navigateBreadcrumb = (node: FileNode | null) => {
        setCurrentFolderNode(node);
        setSearchQuery('');
    };

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-brand-100 shadow-lg overflow-hidden">

                {previewFile ? (
                    /* ── Inline PDF / file viewer — replaces the file list ── */
                    <InlinePdfViewer
                        file={previewFile}
                        onClose={handleClosePreview}
                        onDownload={handleDownload}
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
                                    setCurrentFolderNode(null);
                                    setSearchQuery('');
                                }
                            }}
                        />

                        {/* ── Main content area ── */}
                        <div className="flex-1 bg-slate-50 overflow-auto">
                            {draggedFile && (
                                <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-600 font-medium">
                                    📂 Dragging <strong>"{draggedFile.name}"</strong> — drop onto a folder to move it
                                </div>
                            )}

                            <div className="p-6">
                                <div className="mb-6">
                                    {activeTab === 'files' ? (
                                        <FileBreadcrumb
                                            folderPath={folderPath}
                                            onNavigate={navigateBreadcrumb}
                                            fileCount={itemCount}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-800">Recent Files</span>
                                            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                                                {allRecentFiles.length} {allRecentFiles.length === 1 ? 'file' : 'files'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {activeTab === 'recents' ? (
                                    <FileList
                                        folderNodes={[]}
                                        files={allRecentFiles}
                                        viewMode={viewMode}
                                        reports={reports}
                                        onFolderClick={() => { }}
                                        onPreview={handlePreview}
                                        onDownload={handleDownload}
                                        onCopy={handleCopy}
                                        onRename={handleRename}
                                        onDelete={handleDeleteLocal}
                                        onDragStart={setDraggedFile}
                                    />
                                ) : (
                                    <FileList
                                        folderNodes={displayFolderNodes}
                                        files={displayFiles}
                                        viewMode={viewMode}
                                        reports={reports}
                                        onFolderClick={navigateToFolder}
                                        onPreview={handlePreview}
                                        onDownload={handleDownload}
                                        onCopy={handleCopy}
                                        onRename={handleRename}
                                        onDelete={handleDeleteLocal}
                                        onDragStart={setDraggedFile}
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
                        itemName={deleteItem.name}
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
