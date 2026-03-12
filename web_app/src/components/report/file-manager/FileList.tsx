import {
    FileText,
    Download,
    Eye,
    Trash2,
    GripVertical,
    FileImage,
    FileSpreadsheet,
    File,
    Folder,
    ChevronRight,
    MoreVertical
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { FileNode, ReportFile } from '../../../types';
import { formatDate } from '../../../utils/formatDate';

export interface FileListProps {
    /** Folder nodes to display first (clickable — navigates into folder) */
    folderNodes: FileNode[];
    /** Resolved files to display after folders */
    files: ReportFile[];
    viewMode: 'grid' | 'list';
    onFolderClick: (node: FileNode) => void;
    onPreview: (file: ReportFile) => void;
    onDownload: (file: ReportFile) => void;
    onCopy: (node: FileNode | ReportFile) => void;
    onRename: (node: FileNode | ReportFile) => void;
    onDelete: (node: FileNode | ReportFile) => void;
    /** Called when a drag starts — pass the file being dragged up to parent */
    onDragStart?: (file: ReportFile) => void;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function getFileIcon(file: ReportFile) {
    const name = file.name?.toLowerCase() ?? '';
    if (name.endsWith('.pdf'))
        return { Icon: FileText, bg: 'bg-red-50', color: 'text-red-500' };
    if (/\.(jpg|jpeg|png|gif|webp)$/.test(name))
        return { Icon: FileImage, bg: 'bg-purple-50', color: 'text-purple-500' };
    if (/\.(xlsx|xls|csv)$/.test(name))
        return { Icon: FileSpreadsheet, bg: 'bg-green-50', color: 'text-green-500' };
    if (file.type === 'final' || file.type === 'draft')
        return { Icon: FileText, bg: 'bg-blue-50', color: 'text-blue-500' };
    return { Icon: File, bg: 'bg-slate-50', color: 'text-slate-400' };
}

function TypeBadge({ type }: { type: string }) {
    const map: Record<string, string> = {
        original: 'bg-blue-50 text-blue-600',
        extracted: 'bg-amber-50 text-amber-600',
        draft: 'bg-slate-100 text-slate-500',
        final: 'bg-green-50 text-green-600',
    };
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[type] ?? 'bg-gray-100 text-gray-500'}`}>
            {type?.toUpperCase() ?? 'FILE'}
        </span>
    );
}

// ─── Shared Kebab Dropdown ──────────────────────────────────────────────────

function KebabMenu({
    isOpen,
    onToggle,
    actions,
}: {
    isOpen: boolean;
    onToggle: (e: React.MouseEvent) => void;
    actions: { label: string; onClick: () => void; isDestructive?: boolean }[];
}) {
    return (
        <div className="relative flex-shrink-0 ml-2">
            <button
                onClick={onToggle}
                className={`
                    p-1 rounded-lg transition-all
                    opacity-0 group-hover:opacity-100 focus:opacity-100
                    ${isOpen ? 'opacity-100 bg-slate-200 text-slate-700' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-600'}
                `}
                title="More options"
                aria-label="More options"
            >
                <MoreVertical size={16} />
            </button>

            {isOpen && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-md text-sm z-50 py-1 overflow-hidden"
                >
                    {actions.map((action, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                action.onClick();
                                onToggle({ stopPropagation: () => { } } as React.MouseEvent); // Close menu
                            }}
                            className={`flex items-center w-full text-left px-3 py-2 transition-colors ${action.isDestructive
                                ? 'hover:bg-red-50 text-red-500'
                                : 'hover:bg-slate-100 text-slate-700'
                                }`}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Folder Grid Card ─────────────────────────────────────────────────────────

function FolderGridCard({
    node,
    onClick,
    activeMenu,
    setActiveMenu
}: {
    node: FileNode;
    onClick: () => void;
    activeMenu: string | null;
    setActiveMenu: (id: string | null) => void;
}) {
    const childCount = node.children?.length ?? 0;
    const isMenuOpen = activeMenu === node.id;

    return (
        <button
            onClick={onClick}
            className="group w-full relative text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-amber-300 hover:shadow-md transition-all flex flex-col gap-3 select-none focus:outline-none focus:ring-2 focus:ring-amber-300"
        >
            <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 group-hover:bg-amber-100 transition-colors">
                    <Folder size={26} className="text-amber-500" />
                </div>
                <div className="flex items-center">
                    <ChevronRight size={16} className={`text-slate-300 transition-colors ${isMenuOpen ? 'opacity-0' : 'group-hover:text-amber-400'}`} />
                    <KebabMenu
                        isOpen={isMenuOpen}
                        onToggle={(e) => {
                            e.stopPropagation();
                            setActiveMenu(isMenuOpen ? null : node.id);
                        }}
                        actions={[
                            { label: 'Rename', onClick: () => console.log('Rename folder', node.name) },
                            { label: 'Copy', onClick: () => console.log('Copy folder', node.name) },
                            { label: 'Move', onClick: () => console.log('Move folder', node.name) },
                            { label: 'Delete', onClick: () => console.log('Delete folder', node.name), isDestructive: true },
                        ]}
                    />
                </div>
            </div>
            <div className="min-w-0">
                <h3
                    className="font-semibold text-slate-900 truncate text-sm leading-snug mb-0.5"
                    title={node.name}
                >
                    {node.name}
                </h3>
                <p className="text-xs text-slate-400">
                    {childCount} {childCount === 1 ? 'item' : 'items'}
                </p>
            </div>
        </button>
    );
}

// ─── Folder List Row ──────────────────────────────────────────────────────────

function FolderListRow({
    node,
    isLast,
    onClick,
    onCopy,
    onRename,
    onDelete,
    activeMenu,
    setActiveMenu
}: {
    node: FileNode;
    isLast: boolean;
    onClick: () => void;
    onCopy: (node: FileNode | ReportFile) => void;
    onRename: (node: FileNode | ReportFile) => void;
    onDelete: (node: FileNode | ReportFile) => void;
    activeMenu: string | null;
    setActiveMenu: (id: string | null) => void;
}) {
    const childCount = node.children?.length ?? 0;
    const isMenuOpen = activeMenu === node.id;

    return (
        <tr
            onClick={onClick}
            className={`group bg-white hover:bg-amber-50/60 transition-colors cursor-pointer ${!isLast ? 'border-b border-slate-100' : ''}`}
        >
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-50">
                        <Folder size={17} className="text-amber-500" />
                    </div>
                    <span
                        className="text-sm font-semibold text-slate-800 truncate max-w-[220px] group-hover:text-amber-700 transition-colors"
                        title={node.name}
                    >
                        {node.name}
                    </span>
                </div>
            </td>
            <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">Folder</td>
            <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                {childCount} {childCount === 1 ? 'item' : 'items'}
            </td>
            <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">—</td>
            <td className="px-4 py-3">
                <div className="flex items-center justify-end">
                    <ChevronRight size={16} className={`text-slate-300 transition-colors ${isMenuOpen ? 'opacity-0' : 'group-hover:text-amber-400'}`} />
                    <KebabMenu
                        isOpen={isMenuOpen}
                        onToggle={(e) => {
                            e.stopPropagation();
                            setActiveMenu(isMenuOpen ? null : node.id);
                        }}
                        actions={[
                            { label: 'Rename', onClick: () => onRename(node) },
                            { label: 'Copy', onClick: () => onCopy(node) },
                            { label: 'Move', onClick: () => console.log('Move folder', node.name) },
                            { label: 'Delete', onClick: () => onDelete(node), isDestructive: true },
                        ]}
                    />
                </div>
            </td>
        </tr>
    );
}

// ─── File Grid Card ───────────────────────────────────────────────────────────

function FileGridCard({
    file,
    onPreview,
    onDownload,
    onCopy,
    onRename,
    onDelete,
    onDragStart: onDragStartProp,
    activeMenu,
    setActiveMenu
}: Omit<FileListProps, 'folderNodes' | 'files' | 'viewMode' | 'onFolderClick'> & {
    file: ReportFile;
    activeMenu: string | null;
    setActiveMenu: (id: string | null) => void;
}) {
    const { Icon, bg, color } = getFileIcon(file);
    const isMenuOpen = activeMenu === file.id;

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('fileId', file.id);
        e.dataTransfer.setData('fileName', file.name);
        onDragStartProp?.(file);
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className="group relative bg-white border border-slate-200 rounded-2xl p-5 hover:border-brand-300 hover:shadow-md transition-all cursor-grab active:cursor-grabbing active:opacity-60 active:scale-95 active:shadow-lg active:ring-2 active:ring-brand-400 flex flex-col gap-4 select-none"
        >
            {/* Context menu positioning context wrapped around the kebab to fix z-index issues */}
            <div className="absolute top-3 right-3 flex gap-1 z-10">
                <div className={`opacity-0 group-hover:opacity-30 transition-opacity ${isMenuOpen ? 'opacity-0' : ''}`}>
                    <GripVertical size={16} className="text-slate-400" />
                </div>
                <KebabMenu
                    isOpen={isMenuOpen}
                    onToggle={(e) => {
                        e.stopPropagation();
                        setActiveMenu(isMenuOpen ? null : file.id);
                    }}
                    actions={[
                        { label: 'Preview', onClick: () => onPreview(file) },
                        { label: 'Download', onClick: () => onDownload(file) },
                        { label: 'Rename', onClick: () => onRename(file) },
                        { label: 'Copy', onClick: () => onCopy(file) },
                        { label: 'Move', onClick: () => console.log('Move file', file.name) },
                        { label: 'Delete', onClick: () => onDelete(file), isDestructive: true }
                    ]}
                />
            </div>

            {/* Icon + badge */}
            <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} transition-transform group-hover:scale-105`}>
                    <Icon size={24} className={color} />
                </div>
                <TypeBadge type={file.type} />
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate text-sm leading-snug mb-0.5" title={file.name}>
                    {file.name}
                </h3>
                <p className="text-xs text-slate-400">
                    {file.size} · {formatDate(file.uploadedAt, 'short')}
                </p>
            </div>

            {/* Action row */}
            <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100">
                <button
                    onClick={(e) => { e.stopPropagation(); onPreview(file); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
                >
                    <Eye size={14} /> Preview
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDownload(file); }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Download"
                >
                    <Download size={16} />
                </button>
                {onDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(file); }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── File List Row ────────────────────────────────────────────────────────────

function FileListRow({
    file,
    isLast,
    onPreview,
    onDownload,
    onCopy,
    onRename,
    onDelete,
    onDragStart: onDragStartProp,
    activeMenu,
    setActiveMenu
}: Omit<FileListProps, 'folderNodes' | 'files' | 'viewMode' | 'onFolderClick'> & {
    file: ReportFile;
    isLast: boolean;
    activeMenu: string | null;
    setActiveMenu: (id: string | null) => void;
}) {
    const { Icon, bg, color } = getFileIcon(file);
    const isMenuOpen = activeMenu === file.id;

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('fileId', file.id);
        e.dataTransfer.setData('fileName', file.name);
        onDragStartProp?.(file);
    };

    return (
        <tr
            draggable
            onDragStart={handleDragStart}
            className={`group bg-white hover:bg-slate-50 transition-colors cursor-grab active:cursor-grabbing active:bg-brand-50 relative ${!isLast ? 'border-b border-slate-100' : ''}`}
        >
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <GripVertical
                        size={14}
                        className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    />
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
                        <Icon size={16} className={color} />
                    </div>
                    <span className="text-sm font-medium text-slate-800 truncate max-w-[220px]" title={file.name}>
                        {file.name}
                    </span>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
                <TypeBadge type={file.type} />
            </td>
            <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{file.size}</td>
            <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                {formatDate(file.uploadedAt, 'short')}
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-1 justify-end relative">
                    <button
                        onClick={() => onPreview(file)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Preview"
                    ><Eye size={16} /></button>
                    <button
                        onClick={() => onDownload(file)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Download"
                    ><Download size={16} /></button>
                    {onDelete && (
                        <button
                            onClick={() => onDelete(file)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                        ><Trash2 size={16} /></button>
                    )}

                    <div className="ml-1 pl-1 border-l border-slate-200">
                        <KebabMenu
                            isOpen={isMenuOpen}
                            onToggle={(e) => {
                                e.stopPropagation();
                                setActiveMenu(isMenuOpen ? null : file.id);
                            }}
                            actions={[
                                { label: 'Preview', onClick: () => onPreview(file) },
                                { label: 'Download', onClick: () => onDownload(file) },
                                { label: 'Rename', onClick: () => onRename(file) },
                                { label: 'Copy', onClick: () => onCopy(file) },
                                { label: 'Move', onClick: () => console.log('Move file', file.name) },
                                { label: 'Delete', onClick: () => onDelete(file), isDestructive: true }
                            ]}
                        />
                    </div>
                </div>
            </td>
        </tr>
    );
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
    return (
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 mt-6 first:mt-0">
            {label}
        </p>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <Folder size={32} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-600 mb-1">This folder is empty</p>
            <p className="text-xs text-slate-400">Upload files to get started</p>
        </div>
    );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function FileList({
    folderNodes,
    files,
    viewMode,
    onFolderClick,
    onPreview,
    onDownload,
    onCopy,
    onRename,
    onDelete,
    onDragStart,
}: FileListProps) {
    const hasContent = folderNodes.length > 0 || files.length > 0;
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    // Close menu on outside click
    useEffect(() => {
        const handleBodyClick = () => setActiveMenu(null);
        window.addEventListener('click', handleBodyClick);
        return () => window.removeEventListener('click', handleBodyClick);
    }, []);

    if (!hasContent) return <EmptyState />;

    // ── Grid view ──────────────────────────────────────────────────

    if (viewMode === 'grid') {
        return (
            <div>
                {folderNodes.length > 0 && (
                    <>
                        <SectionLabel label="Folders" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                            {folderNodes.map((node) => (
                                <FolderGridCard
                                    key={node.id}
                                    node={node}
                                    onClick={() => onFolderClick(node)}
                                    activeMenu={activeMenu}
                                    setActiveMenu={setActiveMenu}
                                />
                            ))}
                        </div>
                    </>
                )}

                {files.length > 0 && (
                    <>
                        <SectionLabel label="Files" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {files.map((file) =>
                                file ? (
                                    <FileGridCard
                                        key={file.id}
                                        file={file}
                                        onPreview={onPreview}
                                        onDownload={onDownload}
                                        onCopy={onCopy}
                                        onRename={onRename}
                                        onDelete={onDelete}
                                        onDragStart={onDragStart}
                                        activeMenu={activeMenu}
                                        setActiveMenu={setActiveMenu}
                                    />
                                ) : null
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    }

    // ── List (table) view ──────────────────────────────────────────

    const totalRows = folderNodes.length + files.length;
    let rowIndex = 0;

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Size</th>
                        <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Uploaded</th>
                        <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {folderNodes.map((node) => {
                        const isLast = rowIndex === totalRows - 1;
                        rowIndex++;
                        return (
                            <FolderListRow
                                key={node.id}
                                node={node}
                                isLast={isLast}
                                onClick={() => onFolderClick(node)}
                                onCopy={onCopy}
                                onRename={onRename}
                                onDelete={onDelete}
                                activeMenu={activeMenu}
                                setActiveMenu={setActiveMenu}
                            />
                        );
                    })}
                    {files.map((file) => {
                        if (!file) return null;
                        const isLast = rowIndex === totalRows - 1;
                        rowIndex++;
                        return (
                            <FileListRow
                                key={file.id}
                                file={file}
                                isLast={isLast}
                                onPreview={onPreview}
                                onDownload={onDownload}
                                onCopy={onCopy}
                                onRename={onRename}
                                onDelete={onDelete}
                                onDragStart={onDragStart}
                                activeMenu={activeMenu}
                                setActiveMenu={setActiveMenu}
                            />
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
