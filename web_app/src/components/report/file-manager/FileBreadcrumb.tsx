import { ChevronRight, HardDrive } from 'lucide-react';

interface FileBreadcrumbProps {
    /** Current path string (e.g. "2026/HDFC/Report") */
    path: string;
    /** Called when a breadcrumb segment is clicked. "" = root */
    onNavigate: (path: string) => void;
    /** Number of items in the current folder */
    fileCount: number;
}

export default function FileBreadcrumb({ path, onNavigate, fileCount }: FileBreadcrumbProps) {
    const label = fileCount === 1 ? '1 item' : `${fileCount} items`;
    const segments = path ? path.split('/').filter(Boolean) : [];

    return (
        <div className="flex items-center justify-between w-full">
            {/* Breadcrumb path */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm flex-wrap">
                {/* Root */}
                <button
                    onClick={() => onNavigate('')}
                    className={`
                        flex items-center gap-1 font-medium transition-colors
                        ${segments.length === 0
                            ? 'text-slate-800 cursor-default'
                            : 'text-slate-500 hover:text-brand-600'
                        }
                    `}
                >
                    <HardDrive size={14} className="flex-shrink-0" />
                    My Files
                </button>

                {/* Folder segments */}
                {segments.map((segment, idx) => {
                    const isLast = idx === segments.length - 1;
                    const segmentPath = segments.slice(0, idx + 1).join('/');
                    return (
                        <span key={segmentPath} className="flex items-center gap-1">
                            <ChevronRight size={13} className="text-slate-300 flex-shrink-0" />
                            {isLast ? (
                                <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                                    {segment}
                                </span>
                            ) : (
                                <button
                                    onClick={() => onNavigate(segmentPath)}
                                    className="text-slate-500 hover:text-brand-600 font-medium transition-colors truncate max-w-[180px]"
                                >
                                    {segment}
                                </button>
                            )}
                        </span>
                    );
                })}
            </nav>

            {/* Item count — right-aligned */}
            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full flex-shrink-0 ml-4">
                {label}
            </span>
        </div>
    );
}
