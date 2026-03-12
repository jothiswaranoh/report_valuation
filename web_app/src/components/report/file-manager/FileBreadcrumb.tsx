import { ChevronRight, HardDrive } from 'lucide-react';
import { FileNode } from '../../../types';

interface FileBreadcrumbProps {
    /** Ordered array of folder nodes from root down to the current folder */
    folderPath: FileNode[];
    /** Called when a breadcrumb segment is clicked. null = go to root */
    onNavigate: (node: FileNode | null) => void;
    /** Number of files in the current folder */
    fileCount: number;
}

export default function FileBreadcrumb({ folderPath, onNavigate, fileCount }: FileBreadcrumbProps) {
    const label = fileCount === 1 ? '1 file' : `${fileCount} files`;

    return (
        <div className="flex items-center justify-between w-full">
            {/* Breadcrumb path */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm flex-wrap">
                {/* Root */}
                <button
                    onClick={() => onNavigate(null)}
                    className={`
                        flex items-center gap-1 font-medium transition-colors
                        ${folderPath.length === 0
                            ? 'text-slate-800 cursor-default'
                            : 'text-slate-500 hover:text-brand-600'
                        }
                    `}
                >
                    <HardDrive size={14} className="flex-shrink-0" />
                    My Files
                </button>

                {/* Folder segments */}
                {folderPath.map((node, idx) => {
                    const isLast = idx === folderPath.length - 1;
                    return (
                        <span key={node.id} className="flex items-center gap-1">
                            <ChevronRight size={13} className="text-slate-300 flex-shrink-0" />
                            {isLast ? (
                                <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                                    {node.name}
                                </span>
                            ) : (
                                <button
                                    onClick={() => onNavigate(node)}
                                    className="text-slate-500 hover:text-brand-600 font-medium transition-colors truncate max-w-[180px]"
                                >
                                    {node.name}
                                </button>
                            )}
                        </span>
                    );
                })}
            </nav>

            {/* File count — right-aligned */}
            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full flex-shrink-0 ml-4">
                {label}
            </span>
        </div>
    );
}
