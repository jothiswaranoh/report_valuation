import {
    Folder,
    FolderOpen,
    ChevronRight,
    ChevronDown,
    Search,
    FileText,
    X,
    MoreVertical
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FileNode } from '../../../types';

interface FileSidebarProps {
    fileTree: FileNode[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    expandedNodes: Set<string>;
    onToggleNode: (nodeId: string) => void;
    selectedNode: FileNode | null;
    onSelectNode: (node: FileNode) => void;
    /** Called when a file is dropped onto a folder node */
    onDropFile?: (fileId: string, targetFolderNode: FileNode) => void;
}

/**
 * Recursively filter a tree of FileNodes.
 * A node is kept if:
 *  - Its own name matches the query, OR
 *  - Any of its descendants match (and only matching descendants are included)
 */
function filterTree(nodes: FileNode[], query: string): FileNode[] {
    if (!query.trim()) return nodes;
    const q = query.toLowerCase();

    function filterNode(node: FileNode): FileNode | null {
        const nameMatches = node.name.toLowerCase().includes(q);

        if (node.children && node.children.length > 0) {
            const filteredChildren = node.children
                .map(filterNode)
                .filter((n): n is FileNode => n !== null);

            if (nameMatches || filteredChildren.length > 0) {
                return { ...node, children: filteredChildren };
            }
            return null;
        }

        return nameMatches ? node : null;
    }

    return nodes.map(filterNode).filter((n): n is FileNode => n !== null);
}

export default function FileSidebar({
    fileTree,
    searchQuery,
    onSearchChange,
    expandedNodes,
    onToggleNode,
    selectedNode,
    onSelectNode,
    onDropFile
}: FileSidebarProps) {
    const isSearching = searchQuery.trim().length > 0;
    const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
    // ID of the node whose kebab menu is currently open
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    // Close menu on any outside click
    useEffect(() => {
        const closeMenu = () => setActiveMenu(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    // ── Kebab action placeholders ────────────────────────────────────────────
    const handleCopy = (node: FileNode) => {
        console.log('Copy', node.name);
        setActiveMenu(null);
    };
    const handleRename = (node: FileNode) => {
        console.log('Rename', node.name);
        setActiveMenu(null);
    };
    const handleDelete = (node: FileNode) => {
        console.log('Delete', node.name);
        setActiveMenu(null);
    };

    // Filtered tree based on search query
    const filteredTree = useMemo(
        () => filterTree(fileTree, searchQuery),
        [fileTree, searchQuery]
    );

    /**
     * Render a single tree node.
     * @param forceExpand - when true (during search), always show children
     */
    const renderTreeNode = (node: FileNode, level: number = 0, forceExpand: boolean = false) => {
        const isExpanded = forceExpand || expandedNodes.has(node.id);
        const isSelected = selectedNode?.id === node.id;
        const isDragOver = dragOverNodeId === node.id;
        const displayName = node.name || `Report ${node.id.substring(0, 6)}`;
        const isDropTarget = node.type === 'folder';

        const handleDragOver = (e: React.DragEvent) => {
            if (!isDropTarget) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setDragOverNodeId(node.id);
        };

        const handleDragLeave = () => {
            setDragOverNodeId(null);
        };

        const handleDrop = (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverNodeId(null);
            if (!isDropTarget) return;
            const fileId = e.dataTransfer.getData('fileId');
            if (fileId && onDropFile) {
                onDropFile(fileId, node);
                // Auto-expand the target folder so user can see the moved file
                if (!expandedNodes.has(node.id)) {
                    onToggleNode(node.id);
                }
                // Select the target folder
                onSelectNode(node);
            }
        };

        const isMenuOpen = activeMenu === node.id;

        return (
            <div key={node.id} className="mb-0.5">
                <div
                    className={`
                        group relative flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg transition-all
                        ${isSelected
                            ? 'bg-brand-50 text-brand-700'
                            : 'text-slate-700 hover:bg-slate-100'
                        }
                        ${isDragOver && isDropTarget
                            ? 'bg-brand-100 border-2 border-brand-400 border-dashed text-brand-700 scale-[1.02]'
                            : 'border-2 border-transparent'
                        }
                    `}
                    style={{ paddingLeft: `${level * 16 + 16}px` }}
                    onClick={() => {
                        if (node.type === 'folder') onToggleNode(node.id);
                        onSelectNode(node);
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {node.type === 'folder' && (
                        <span className="text-slate-400 flex-shrink-0">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                    )}

                    <span className="flex-shrink-0">
                        {node.type === 'folder' ? (
                            isDragOver ? (
                                <FolderOpen size={16} className="text-blue-500 animate-pulse" />
                            ) : isExpanded ? (
                                <FolderOpen size={16} className="text-blue-500" />
                            ) : (
                                <Folder size={16} className="text-blue-500" />
                            )
                        ) : (
                            <FileText size={16} className="text-slate-400" />
                        )}
                    </span>

                    <span className="text-sm font-medium truncate flex-1">{displayName}</span>

                    {/* Drop indicator label */}
                    {isDragOver && isDropTarget && (
                        <span className="text-xs font-semibold text-blue-500 flex-shrink-0 bg-blue-50 px-1.5 py-0.5 rounded">
                            Drop here
                        </span>
                    )}

                    {/* Kebab button + dropdown */}
                    {!isDragOver && (
                        <div className="relative flex-shrink-0">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenu(isMenuOpen ? null : node.id);
                                }}
                                className={`
                                    p-0.5 rounded transition-all
                                    opacity-0 group-hover:opacity-100
                                    ${isMenuOpen ? 'opacity-100 bg-slate-200 text-slate-700' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-600'}
                                `}
                                title="More options"
                                aria-label="More options"
                            >
                                <MoreVertical size={15} />
                            </button>

                            {isMenuOpen && (
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-md text-sm z-50 py-1 overflow-hidden"
                                >
                                    <button
                                        onClick={() => handleCopy(node)}
                                        className="flex items-center w-full text-left px-3 py-2 hover:bg-slate-100 text-slate-700 transition-colors"
                                    >
                                        Copy
                                    </button>
                                    <button
                                        onClick={() => handleRename(node)}
                                        className="flex items-center w-full text-left px-3 py-2 hover:bg-slate-100 text-slate-700 transition-colors"
                                    >
                                        Rename
                                    </button>
                                    <div className="my-1 border-t border-slate-100" />
                                    <button
                                        onClick={() => handleDelete(node)}
                                        className="flex items-center w-full text-left px-3 py-2 hover:bg-red-50 text-red-500 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {node.type === 'folder' && isExpanded && node.children && node.children.length > 0 && (
                    <div>
                        {node.children.map((child) =>
                            renderTreeNode(child, level + 1, forceExpand)
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-80 bg-white border-r border-slate-200 overflow-auto flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Folder Structure</h2>
                <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search reports or files..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    />
                    {isSearching && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded"
                            title="Clear search"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                {isSearching && (
                    <p className="text-xs text-slate-500 mt-2">
                        {filteredTree.length > 0
                            ? `Showing results for "${searchQuery}"`
                            : `No results for "${searchQuery}"`}
                    </p>
                )}
            </div>

            {/* Drag hint banner — visible when any file is being dragged */}
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-600 font-medium hidden drag-hint-banner">
                📂 Drag files and drop onto a folder to move them
            </div>

            <div className="p-2 overflow-y-auto flex-1 custom-scrollbar">
                {filteredTree.length === 0 && isSearching ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 px-4">
                        <Search size={32} className="mb-3 opacity-40" />
                        <p className="text-sm font-medium text-slate-600">No results found</p>
                        <p className="text-xs mt-1 text-slate-400">
                            Nothing matches "{searchQuery}"
                        </p>
                        <button
                            onClick={() => onSearchChange('')}
                            className="mt-4 text-xs text-blue-500 hover:text-blue-700 underline underline-offset-2"
                        >
                            Clear search
                        </button>
                    </div>
                ) : (
                    /* When searching: force all nodes to expand (forceExpand=true) */
                    filteredTree.map((node) => renderTreeNode(node, 0, isSearching))
                )}
            </div>
        </div>
    );
}
