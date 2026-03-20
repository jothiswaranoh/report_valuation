import {
    FileText,
    Download,
    Eye,
    Trash2,
    FileSpreadsheet,
    File,
    Folder,
    MoreVertical,
    Image,
    Copy,
    Pencil,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiFile } from '../../../apis/files.api';

export interface FileListProps {
    /** Folder names to display first (clickable — navigates into folder) */
    folderNames: string[];
    /** Files from API */
    files: ApiFile[];
    viewMode: 'grid' | 'list';
    onFolderClick: (folderName: string) => void;
    onPreview: (file: ApiFile) => void;
    onDownload: (file: ApiFile) => void;
    onCopy: (file: ApiFile) => void;
    onRename: (file: ApiFile) => void;
    onDelete: (file: ApiFile) => void;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function getFileIcon(fileName: string) {
    const name = fileName?.toLowerCase() ?? '';
    if (name.endsWith('.pdf'))
        return { Icon: FileText, bg: 'bg-red-50', color: 'text-red-500', selectedBg: 'bg-red-100' };
    if (/\.(jpg|jpeg|png|gif|webp)$/.test(name))
        return { Icon: Image, bg: 'bg-purple-50', color: 'text-purple-500', selectedBg: 'bg-purple-100' };
    if (/\.(xlsx|xls|csv)$/.test(name))
        return { Icon: FileSpreadsheet, bg: 'bg-green-50', color: 'text-green-500', selectedBg: 'bg-green-100' };
    return { Icon: File, bg: 'bg-slate-50', color: 'text-slate-400', selectedBg: 'bg-slate-100' };
}

// ─── Shared Kebab Dropdown ────────────────────────────────────────────────────

type MenuAction = { label: string; icon?: React.ElementType; onClick: () => void; isDestructive?: boolean };

function KebabMenu({
    isOpen,
    onToggle,
    actions,
}: {
    isOpen: boolean;
    onToggle: (e: React.MouseEvent) => void;
    actions: MenuAction[];
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
                    className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg text-sm z-50 py-1 overflow-hidden"
                >
                    {actions.map((action, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                action.onClick();
                                onToggle({ stopPropagation: () => { } } as React.MouseEvent);
                            }}
                            className={`flex items-center gap-2 w-full text-left px-3 py-2 transition-colors ${action.isDestructive
                                ? 'hover:bg-red-50 text-red-500'
                                : 'hover:bg-slate-100 text-slate-700'
                                }`}
                        >
                            {action.icon && <action.icon size={14} />}
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Context Menu (right-click) ───────────────────────────────────────────────

function ContextMenu({
    x,
    y,
    actions,
    onClose,
}: {
    x: number;
    y: number;
    actions: MenuAction[];
    onClose: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = () => onClose();
        window.addEventListener('click', handleClick, { once: true });
        return () => window.removeEventListener('click', handleClick);
    }, [onClose]);

    const safeX = Math.min(x, window.innerWidth - 160);
    const safeY = Math.min(y, window.innerHeight - actions.length * 36 - 16);

    return (
        <div
            ref={ref}
            style={{ top: safeY, left: safeX }}
            className="fixed z-[100] w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-sm overflow-hidden"
            onContextMenu={(e) => e.preventDefault()}
        >
            {actions.map((action, i) => (
                <button
                    key={i}
                    onClick={(e) => {
                        e.stopPropagation();
                        action.onClick();
                        onClose();
                    }}
                    className={`flex items-center gap-2.5 w-full text-left px-3 py-2 transition-colors ${action.isDestructive
                        ? 'hover:bg-red-50 text-red-500'
                        : 'hover:bg-slate-100 text-slate-700'
                        }`}
                >
                    {action.icon && <action.icon size={14} className="flex-shrink-0" />}
                    {action.label}
                </button>
            ))}
        </div>
    );
}

// ─── Folder Grid Icon (Desktop-style) ────────────────────────────────────────

function FolderGridIcon({
    name,
    isSelected,
    onSingleClick,
    onDoubleClick,
}: {
    name: string;
    isSelected: boolean;
    onSingleClick: () => void;
    onDoubleClick: () => void;
}) {
    return (
        <button
            onClick={onSingleClick}
            onDoubleClick={onDoubleClick}
            className={`
                group flex flex-col items-center gap-2 p-3 rounded-xl transition-all select-none
                focus:outline-none focus:ring-2 focus:ring-amber-400 w-full
                ${isSelected
                    ? 'bg-amber-100 ring-2 ring-amber-400'
                    : 'hover:bg-amber-50'
                }
            `}
        >
            <div className="flex items-center justify-center">
                <img
                    src="/icons/folder.svg"
                    alt="folder"
                    className={`w-12 h-10 transition-all ${isSelected ? 'opacity-90 scale-110 drop-shadow-sm' : 'group-hover:scale-105'}`}
                />
            </div>
            <span
                className={`text-xs font-medium text-center leading-tight line-clamp-2 w-full px-1 ${isSelected ? 'text-amber-900' : 'text-slate-700'}`}
                title={name}
            >
                {name}
            </span>
        </button>
    );
}

// ─── File Grid Icon (Desktop-style) ──────────────────────────────────────────

function FileGridIcon({
    file,
    isSelected,
    onSingleClick,
    onDoubleClick,
    onContextMenu,
}: {
    file: ApiFile;
    isSelected: boolean;
    onSingleClick: () => void;
    onDoubleClick: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
}) {
    const { Icon, bg, color, selectedBg } = getFileIcon(file.file_name);

    return (
        <button
            onClick={onSingleClick}
            onDoubleClick={onDoubleClick}
            onContextMenu={onContextMenu}
            className={`
                group flex flex-col items-center gap-2 p-3 rounded-xl transition-all select-none
                focus:outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer active:scale-95 w-full
                ${isSelected
                    ? 'bg-brand-100 ring-2 ring-brand-400'
                    : 'hover:bg-slate-100'
                }
            `}
        >
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center transition-all ${isSelected ? selectedBg + ' scale-105' : bg + ' group-hover:scale-105'}`}>
                <Icon size={36} className={color} />
            </div>
            <span
                className={`text-xs font-medium text-center leading-tight line-clamp-2 w-full px-1 ${isSelected ? 'text-brand-900' : 'text-slate-700'}`}
                title={file.file_name}
            >
                {file.file_name}
            </span>
        </button>
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
    folderNames,
    files,
    viewMode,
    onFolderClick,
    onPreview,
    onDownload,
    onCopy,
    onRename,
    onDelete,
}: FileListProps) {
    const hasContent = folderNames.length > 0 || files.length > 0;
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; actions: MenuAction[] } | null>(null);

    // Close menus / deselect on outside click
    useEffect(() => {
        const handleBodyClick = () => {
            setActiveMenu(null);
            setSelectedId(null);
        };
        window.addEventListener('click', handleBodyClick);
        return () => window.removeEventListener('click', handleBodyClick);
    }, []);

    const handleSelect = useCallback((id: string) => {
        setSelectedId(id);
    }, []);

    const openContextMenu = useCallback((e: React.MouseEvent, actions: MenuAction[]) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, actions });
    }, []);

    if (!hasContent) return <EmptyState />;

    // ── Grid view ───────────────────────────────────────────────────

    if (viewMode === 'grid') {
        return (
            <div onClick={() => setSelectedId(null)}>
                {contextMenu && (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        actions={contextMenu.actions}
                        onClose={() => setContextMenu(null)}
                    />
                )}

                {folderNames.length > 0 && (
                    <>
                        <SectionLabel label="Folders" />
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 mb-6">
                            {folderNames.map((name) => (
                                <FolderGridIcon
                                    key={name}
                                    name={name}
                                    isSelected={selectedId === `folder-${name}`}
                                    onSingleClick={() => handleSelect(`folder-${name}`)}
                                    onDoubleClick={() => onFolderClick(name)}
                                />
                            ))}
                        </div>
                    </>
                )}

                {files.length > 0 && (
                    <>
                        <SectionLabel label="Files" />
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                            {files.map((file) => {
                                const fileActions: MenuAction[] = [
                                    { label: 'Preview', icon: Eye, onClick: () => onPreview(file) },
                                    { label: 'Download', icon: Download, onClick: () => onDownload(file) },
                                    { label: 'Rename', icon: Pencil, onClick: () => onRename(file) },
                                    { label: 'Copy', icon: Copy, onClick: () => onCopy(file) },
                                    { label: 'Delete', icon: Trash2, onClick: () => onDelete(file), isDestructive: true },
                                ];
                                return (
                                    <FileGridIcon
                                        key={file.id}
                                        file={file}
                                        isSelected={selectedId === file.id}
                                        onSingleClick={() => handleSelect(file.id)}
                                        onDoubleClick={() => onPreview(file)}
                                        onContextMenu={(e) => { e.stopPropagation(); handleSelect(file.id); openContextMenu(e, fileActions); }}
                                    />
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        );
    }

    // ── List view ────────────────────────────────────────────────────

    return (
        <div
            className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            onClick={() => setSelectedId(null)}
        >
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    actions={contextMenu.actions}
                    onClose={() => setContextMenu(null)}
                />
            )}
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Folder rows */}
                    {folderNames.map((name) => {
                        const isSelected = selectedId === `folder-${name}`;
                        return (
                            <tr
                                key={`folder-${name}`}
                                onClick={(e) => { e.stopPropagation(); handleSelect(`folder-${name}`); }}
                                onDoubleClick={(e) => { e.stopPropagation(); onFolderClick(name); }}
                                className={`group transition-colors cursor-pointer border-b border-slate-100 ${isSelected
                                    ? 'bg-amber-50 border-l-2 border-l-amber-400'
                                    : 'bg-white hover:bg-amber-50/50'
                                    }`}
                            >
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <img
                                            src="/icons/folder.svg"
                                            alt="folder"
                                            className={`w-7 h-6 flex-shrink-0 transition-all ${isSelected ? 'opacity-90 scale-110' : ''}`}
                                        />
                                        <span
                                            className={`text-sm font-semibold truncate max-w-[220px] transition-colors ${isSelected ? 'text-amber-800' : 'text-slate-800 group-hover:text-amber-700'}`}
                                            title={name}
                                        >
                                            {name}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">Folder</td>
                                <td className="px-4 py-3"></td>
                            </tr>
                        );
                    })}
                    {/* File rows */}
                    {files.map((file) => {
                        const isSelected = selectedId === file.id;
                        const { Icon, bg, color, selectedBg } = getFileIcon(file.file_name);
                        const fileActions: MenuAction[] = [
                            { label: 'Preview', icon: Eye, onClick: () => onPreview(file) },
                            { label: 'Download', icon: Download, onClick: () => onDownload(file) },
                            { label: 'Rename', icon: Pencil, onClick: () => onRename(file) },
                            { label: 'Copy', icon: Copy, onClick: () => onCopy(file) },
                            { label: 'Delete', icon: Trash2, onClick: () => onDelete(file), isDestructive: true },
                        ];
                        return (
                            <tr
                                key={file.id}
                                onClick={(e) => { e.stopPropagation(); handleSelect(file.id); }}
                                onDoubleClick={(e) => { e.stopPropagation(); onPreview(file); }}
                                onContextMenu={(e) => { e.preventDefault(); handleSelect(file.id); openContextMenu(e, fileActions); }}
                                className={`group transition-colors cursor-pointer border-b border-slate-100 ${isSelected
                                    ? 'bg-brand-50 border-l-2 border-l-brand-400'
                                    : 'bg-white hover:bg-slate-50'
                                    }`}
                            >
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? selectedBg : bg}`}>
                                            <Icon size={16} className={color} />
                                        </div>
                                        <span className={`text-sm font-medium truncate max-w-[220px] ${isSelected ? 'text-brand-800' : 'text-slate-800'}`} title={file.file_name}>
                                            {file.file_name}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">File</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1 justify-end relative">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onPreview(file); }}
                                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                            title="Preview"
                                        ><Eye size={16} /></button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDownload(file); }}
                                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                            title="Download"
                                        ><Download size={16} /></button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDelete(file); }}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        ><Trash2 size={16} /></button>
                                        <div className="ml-1 pl-1 border-l border-slate-200">
                                            <KebabMenu
                                                isOpen={activeMenu === file.id}
                                                onToggle={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenu(activeMenu === file.id ? null : file.id);
                                                }}
                                                actions={fileActions}
                                            />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
