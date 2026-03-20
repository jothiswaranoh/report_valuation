import { Search, LayoutGrid, LayoutList, X, ClipboardPaste } from 'lucide-react';

interface FileManagerHeaderProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    viewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
    activeTab: 'files' | 'recents';
    onTabChange: (tab: 'files' | 'recents') => void;
    clipboard?: { fileId: string; fileName: string } | null;
    onPaste?: () => void;
}

export default function FileManagerHeader({
    searchQuery,
    onSearchChange,
    viewMode,
    onViewModeChange,
    activeTab,
    onTabChange,
    clipboard,
    onPaste,
}: FileManagerHeaderProps) {
    return (
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4 flex-shrink-0">
            {/* Title */}
            <h1 className="text-xl font-bold text-slate-800 flex-shrink-0 mr-2">
                File Manager
            </h1>

            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
                <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search files and folders…"
                    className="w-full pl-9 pr-8 py-2 text-sm bg-slate-100 border border-transparent rounded-xl focus:outline-none focus:border-brand-400 focus:bg-white transition-all placeholder-slate-400 text-slate-800"
                />
                {searchQuery && (
                    <button
                        onClick={() => onSearchChange('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label="Clear search"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Paste button (shown when clipboard has content) */}
            {clipboard && onPaste && (
                <button
                    onClick={onPaste}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-brand-50 text-brand-700 border border-brand-200 rounded-lg hover:bg-brand-100 transition-colors flex-shrink-0"
                    title={`Paste "${clipboard.fileName}"`}
                >
                    <ClipboardPaste size={14} />
                    Paste
                </button>
            )}

            {/* Tabs */}
            <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-shrink-0">
                {(['files', 'recents'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => onTabChange(tab)}
                        className={`
                            px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize
                            ${activeTab === tab
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }
                        `}
                    >
                        {tab === 'recents' ? 'Recents' : 'Files'}
                    </button>
                ))}
            </nav>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-shrink-0">
                <button
                    onClick={() => onViewModeChange('grid')}
                    title="Grid view"
                    className={`
                        p-1.5 rounded-lg transition-all
                        ${viewMode === 'grid'
                            ? 'bg-white text-brand-600 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                        }
                    `}
                >
                    <LayoutGrid size={18} />
                </button>
                <button
                    onClick={() => onViewModeChange('list')}
                    title="List view"
                    className={`
                        p-1.5 rounded-lg transition-all
                        ${viewMode === 'list'
                            ? 'bg-white text-brand-600 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                        }
                    `}
                >
                    <LayoutList size={18} />
                </button>
            </div>
        </div>
    );
}

