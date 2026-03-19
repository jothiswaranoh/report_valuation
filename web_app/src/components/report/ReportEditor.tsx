import { useState, useEffect, useRef } from 'react';
import { Save, Check, Sparkles, MessageSquare, ChevronLeft, Edit2, Eye, Upload, X, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ValuationReport } from '../../types';
import { formatDate } from '../../utils/formatDate';
import { reportsApi } from '../../apis/report.api';
import RichTextEditor from './RichTextEditor';

interface ReportEditorProps {
    report: ValuationReport | null;
    reportId?: string;
    onBack: () => void;
    onSave: (reportId: string, content: ValuationReport['content']) => void;
    onApprove?: () => void;
}

export default function ReportEditor({ report, reportId, onBack, onSave, onApprove }: ReportEditorProps) {
    const [content, setContent] = useState(report?.content || {
        summary: '',
        propertyDetails: '',
        valuationMethod: '',
        finalValuation: '',
    });
    const [activeSection, setActiveSection] = useState<keyof typeof content>('summary');
    const [editMode, setEditMode] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showMoreFiles, setShowMoreFiles] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        const valid = Array.from(e.dataTransfer.files).filter(
            (f) => f.type === 'application/pdf' || f.type.startsWith('image/')
        );
        if (valid.length) setPendingFiles((prev) => [...prev, ...valid]);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            const valid = Array.from(e.target.files).filter(
                (f) => f.type === 'application/pdf' || f.type.startsWith('image/')
            );
            setPendingFiles((prev) => [...prev, ...valid]);
            e.target.value = '';
        }
    };

    const handleUploadFiles = async () => {
        const rid = reportId || report?.id;
        if (!rid || !pendingFiles.length) return;
        setIsUploading(true);
        try {
            await reportsApi.uploadFiles(rid, pendingFiles);
            showToast(`${pendingFiles.length} file(s) uploaded successfully.`);
            setPendingFiles([]);
            setShowMoreFiles(false);
        } catch {
            showToast('Failed to upload files. Please try again.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleReanalyze = async () => {
        const rid = reportId || report?.id;
        if (!rid) return;
        setIsAnalyzing(true);
        try {
            await reportsApi.analyzeReport(rid);
            showToast('Re-analysis complete!');
        } catch {
            showToast('Re-analysis failed. Please try again.', 'error');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Sync content when report data is loaded asynchronously
    useEffect(() => {
        if (report?.content) {
            setContent(report.content);
        }
    }, [report?.id, report?.content?.summary]);


    if (!report) {
        return (
            <div className="p-8">
                <div className="bg-white border border-secondary-200 rounded-lg p-12 text-center">
                    <p className="text-secondary-600">Select a report to edit</p>
                </div>
            </div>
        );
    }

    const sections = [
        { key: 'summary' as const, label: 'Summary', icon: <Sparkles size={16} /> },
        { key: 'propertyDetails' as const, label: 'Property Details', icon: <Sparkles size={16} /> },
        { key: 'valuationMethod' as const, label: 'Valuation Method', icon: <Sparkles size={16} /> },
        { key: 'finalValuation' as const, label: 'Final Valuation', icon: <Sparkles size={16} /> },
    ];

    const handleSectionUpdate = (section: keyof typeof content, value: string) => {
        setContent((prev) => ({ ...prev, [section]: value }));
    };

    const handleSectionSelect = (key: keyof typeof content) => {
        setActiveSection(key);
        setEditMode(false);
    };

    const handleSave = () => {
        onSave(report.id, content);
    };



    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-amber-100 text-amber-800';
            case 'review':
                return 'bg-orange-100 text-orange-800';
            case 'approved':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-secondary-100 text-secondary-800';
        }
    };

    return (
        <div className="h-full flex flex-col rounded-lg overflow-hidden bg-white">
            <div className="bg-white border-b border-secondary-200 px-8 py-4">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span className="font-medium">Back</span>
                    </button>
                    <div className="flex items-center gap-3">
                        {/* More Files */}
                        <button
                            onClick={() => setShowMoreFiles((v) => !v)}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-medium transition-colors shadow-sm ${showMoreFiles
                                ? 'bg-brand-50 border-brand-300 text-brand-700'
                                : 'border-secondary-300 text-secondary-700 hover:bg-secondary-50'
                                }`}
                        >
                            <Upload size={16} />
                            More Files
                        </button>
                        {/* Re-analyze */}
                        <button
                            onClick={handleReanalyze}
                            disabled={isAnalyzing}
                            className="flex items-center gap-2 px-4 py-2 border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50 font-medium transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {!isAnalyzing && <Sparkles size={16} />}
                            {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
                        </button>
                        {report.status === 'approved' ? (
                            <button
                                disabled
                                className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg font-medium cursor-not-allowed shadow-sm"
                            >
                                <Check size={18} />
                                <span className="font-medium">Approved</span>
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => setShowComments(!showComments)}
                                    className="flex items-center gap-2 px-4 py-2 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
                                >
                                    <MessageSquare size={18} />
                                    <span className="font-medium">Comments ({report.comments.length})</span>
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-4 py-2 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
                                >
                                    <Save size={18} />
                                    <span className="font-medium">Save Draft</span>
                                </button>
                                <button
                                    id="approve-btn"
                                    onClick={onApprove}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm active:scale-[0.98]"
                                >
                                    <Check size={18} />
                                    <span className="font-medium">Approve</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold text-secondary-900">{report.customerName}</h1>
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(report.status)}`}>
                                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                            </span>
                            <div className="flex items-center gap-1.5 bg-brand-50 border border-brand-200 rounded-full px-3 py-1 shadow-sm" title="This report was generated by AI. Review and edit as needed for accuracy.">
                                <Sparkles size={14} className="text-brand-600" />
                                <span className="text-xs font-medium text-brand-900">
                                    AI-Generated
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-secondary-600">
                            <span>{report.bankName}</span>
                            <span>•</span>
                            <span>{report.propertyType}</span>
                            <span>•</span>
                            <span>{report.location}</span>
                            <span>•</span>
                            <span>Updated {formatDate(report.updatedAt, 'short')}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-secondary-100 p-1 rounded-lg">
                        {sections.map((section) => (
                            <button
                                key={section.key}
                                onClick={() => handleSectionSelect(section.key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${activeSection === section.key
                                    ? 'bg-white text-secondary-900 shadow-sm'
                                    : 'text-secondary-600 hover:text-secondary-900'
                                    }`}
                            >
                                {section.icon}
                                {section.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* More Files Inline Panel */}
            {showMoreFiles && (
                <div className="bg-brand-50 border-b border-brand-200 px-8 py-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-brand-900">Files</h3>
                        <button
                            onClick={() => { setShowMoreFiles(false); setPendingFiles([]); }}
                            className="text-secondary-500 hover:text-secondary-900"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Existing Files */}
                    {report.files && report.files.length > 0 && (
                        <div className="mb-5">
                            <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wide mb-2">Current Files ({report.files.length})</p>
                            <div className="space-y-2">
                                {report.files.map((file) => (
                                    <div key={file.id} className="flex items-center gap-3 bg-white border border-secondary-200 rounded-lg px-3 py-2">
                                        <FileText size={16} className="text-brand-600 shrink-0" />
                                        <span className="text-sm text-secondary-900 truncate flex-1">{file.name}</span>
                                        <span className="text-xs text-secondary-500">{file.size}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wide mb-2">Add New Files</p>
                    <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragActive
                            ? 'border-brand-500 bg-brand-100'
                            : 'border-brand-300 hover:border-brand-400 hover:bg-brand-100/50'
                            }`}
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,image/*"
                            multiple
                            onChange={handleFileInput}
                            className="hidden"
                        />
                        <Upload size={24} className="text-brand-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-brand-900">Drop files here or click to browse</p>
                        <p className="text-xs text-brand-700 mt-1">PDF and image files supported</p>
                    </div>
                    {pendingFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {pendingFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-white border border-secondary-200 rounded-lg px-3 py-2">
                                    <FileText size={16} className="text-brand-600 shrink-0" />
                                    <span className="text-sm text-secondary-900 truncate flex-1">{file.name}</span>
                                    <span className="text-xs text-secondary-500">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                                    <button
                                        onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== idx))}
                                        className="text-secondary-400 hover:text-red-600 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={handleUploadFiles}
                                disabled={isUploading}
                                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isUploading ? (
                                    <>Uploading...</>
                                ) : (
                                    <><Upload size={16} /> Upload {pendingFiles.length} File{pendingFiles.length !== 1 ? 's' : ''}</>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`mx-8 mt-4 px-4 py-2 rounded-lg text-sm font-medium border ${toast.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                    {toast.msg}
                </div>
            )}

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-auto bg-secondary-50">
                    <div className="w-full mx-auto p-8 pt-6">
                        <div className="bg-white border border-secondary-200 rounded-lg p-6 min-h-[500px] flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-secondary-900">
                                    {sections.find((s) => s.key === activeSection)?.label}
                                </h2>
                                <div className="flex items-center bg-secondary-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${editMode ? 'bg-white text-secondary-900 shadow-sm' : 'text-secondary-600 hover:text-secondary-900'
                                            }`}
                                    >
                                        <Edit2 size={16} />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setEditMode(false)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${!editMode ? 'bg-white text-secondary-900 shadow-sm' : 'text-secondary-600 hover:text-secondary-900'
                                            }`}
                                    >
                                        <Eye size={16} />
                                        Preview
                                    </button>
                                </div>
                            </div>

                            {activeSection === 'summary' ? (
                                <RichTextEditor
                                    initialContent={content[activeSection]}
                                    onChange={(val) => handleSectionUpdate(activeSection, val)}
                                    readOnly={!editMode}
                                />
                            ) : editMode ? (
                                <textarea
                                    value={content[activeSection]}
                                    onChange={(e) => handleSectionUpdate(activeSection, e.target.value)}
                                    className="flex-1 w-full p-4 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none font-mono text-sm"
                                    placeholder={`Enter ${sections.find((s) => s.key === activeSection)?.label.toLowerCase()}...`}
                                />
                            ) : (
                                <div className="flex-1 w-full p-4 border border-secondary-300 bg-secondary-50 prose prose-secondary max-w-none overflow-auto rounded-lg prose-headings:font-semibold prose-sm sm:prose-base prose-p:my-2 prose-headings:my-4 prose-hr:my-6 prose-ul:my-2 text-secondary-900 prose-headings:text-secondary-900">
                                    {content[activeSection] ? (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {content[activeSection]}
                                        </ReactMarkdown>
                                    ) : (
                                        <p className="text-secondary-400 italic font-sans">No content yet. Switch to Edit mode to add some.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {showComments && (
                    <div className="w-80 bg-white border-l border-secondary-200 overflow-auto">
                        <div className="p-4 border-b border-secondary-200">
                            <h3 className="font-semibold text-secondary-900">Comments</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            {report.comments.length === 0 ? (
                                <p className="text-sm text-secondary-600 text-center py-8">No comments yet</p>
                            ) : (
                                report.comments.map((comment) => (
                                    <div key={comment.id} className="bg-secondary-50 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-sm text-secondary-900">{comment.user}</span>
                                            {comment.resolved && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Resolved</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-secondary-700">{comment.text}</p>
                                        <p className="text-xs text-secondary-500 mt-2">
                                            {formatDate(comment.timestamp, 'datetime')}
                                        </p>
                                    </div>
                                ))
                            )}
                            <div className="pt-4 border-t border-secondary-200">
                                <textarea
                                    placeholder="Add a comment..."
                                    className="w-full p-3 border border-secondary-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
                                    rows={3}
                                />
                                <button className="w-full mt-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium">
                                    Post Comment
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
