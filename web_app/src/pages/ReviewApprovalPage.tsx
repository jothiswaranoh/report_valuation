import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  Clock,
  ChevronLeft,
  History,
  Edit,
  Upload,
  Sparkles,
  RotateCcw,
  X,

} from 'lucide-react';

import { ReportStatus } from '../types';
import { formatDate } from '../utils/formatDate';
import { useReport, useUpdateReport } from '../hooks/useReports';
import { mapApiReportToValuation } from '../utils/reportMapper';
import { reportsApi } from '../apis/report.api';
import Skeleton from 'react-loading-skeleton';

export default function ReviewApprovalPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [showMoreFiles, setShowMoreFiles] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: apiData, isLoading, refetch } = useReport(id);
  const updateReportMutation = useUpdateReport();

  const report = apiData ? mapApiReportToValuation(apiData) : null;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleBack = () => navigate(-1);

  const handleExport = (format: 'pdf' | 'docx') => {
    if (report) {
      alert(`Exporting ${report.customerName}'s report as ${format.toUpperCase()}`);
    }
  };

  // ───────── More Files ─────────
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    if (!id || !pendingFiles.length) return;
    setIsUploading(true);
    try {
      await reportsApi.uploadFiles(id, pendingFiles);
      showToast(`${pendingFiles.length} file(s) uploaded successfully.`);
      setPendingFiles([]);
      setShowMoreFiles(false);
      refetch();
    } catch {
      showToast('Failed to upload files. Please try again.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // ───────── Re-analyze ─────────
  const handleReanalyze = async () => {
    if (!id) return;
    setIsAnalyzing(true);
    try {
      await reportsApi.analyzeReport(id);
      showToast('Re-analysis complete!');
      refetch();
    } catch {
      showToast('Re-analysis failed. Please try again.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ───────── Rollback to Review ─────────
  const handleRollbackToReview = async () => {
    if (!id) return;
    try {
      await updateReportMutation.mutateAsync({
        reportId: id,
        data: { report_status: 'review' as ReportStatus },
      });
      navigate(`/reports/${id}/review`);
    } catch {
      showToast('Failed to rollback. Please try again.', 'error');
    }
  };

  // ───────── Approve ─────────
  const handleApprove = async () => {
    if (!id) return;
    try {
      await updateReportMutation.mutateAsync({
        reportId: id,
        data: { report_status: 'approved' as ReportStatus },
      });
      showToast('Report approved!');
      refetch();
    } catch {
      showToast('Failed to approve. Please try again.', 'error');
    }
  };

  // ───────── Loading State ─────────
  if (isLoading) {
    return (
      <div className="h-full flex flex-col rounded-lg overflow-hidden bg-white">
        <div className="bg-white border-b border-secondary-200 px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <Skeleton height={24} width={150} />
            <div className="flex gap-3">
              <Skeleton height={40} width={110} borderRadius={8} />
              <Skeleton height={40} width={110} borderRadius={8} />
              <Skeleton height={40} width={130} borderRadius={8} />
            </div>
          </div>
          <Skeleton height={32} width={300} className="mb-2" />
          <Skeleton height={16} width={400} />
        </div>
        <div className="flex-1 overflow-auto bg-secondary-50 p-8">
          <div className="bg-white border border-secondary-200 rounded-lg p-6 shadow-sm">
            <Skeleton height={24} width={150} className="mb-6" />
            <Skeleton height={60} />
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8">
        <div className="bg-white border border-secondary-200 rounded-lg p-12 text-center shadow-sm">
          <p className="text-secondary-600 font-medium">Report not found</p>
        </div>
      </div>
    );
  }

  const isApproved = report.status === 'approved';

  return (
    <div className="h-full flex flex-col rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200 px-8 py-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 font-medium transition-colors"
          >
            <ChevronLeft size={20} />
            <span>Back</span>
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

            {/* Edit */}
            <button
              onClick={() => navigate(`/reports/${report.id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50 font-medium transition-colors shadow-sm"
            >
              <Edit size={16} />
              Edit
            </button>

            {/* Audit Trail */}
            <button
              onClick={() => setShowAuditTrail(!showAuditTrail)}
              className="flex items-center gap-2 px-4 py-2 border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50 font-medium transition-colors shadow-sm"
            >
              <History size={16} />
              Audit Trail
            </button>

            {/* Export */}
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 border border-brand-200 rounded-lg hover:bg-brand-100 transition-colors font-medium shadow-sm"
            >
              Export PDF
            </button>
            <button
              onClick={() => handleExport('docx')}
              className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 border border-brand-200 rounded-lg hover:bg-brand-100 transition-colors font-medium shadow-sm"
            >
              Export DOCX
            </button>

            {/* Conditional: Rollback to Review (approved) or Approve (review) */}
            {isApproved ? (
              <button
                onClick={handleRollbackToReview}
                disabled={updateReportMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg hover:bg-yellow-100 font-medium transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RotateCcw size={16} />
                {updateReportMutation.isPending ? 'Rolling back...' : 'Rollback to Review'}
              </button>
            ) : (
              <button
                onClick={handleApprove}
                disabled={updateReportMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <CheckCircle size={16} />
                {updateReportMutation.isPending ? 'Approving...' : 'Approve'}
              </button>
            )}
          </div>
        </div>

        {/* Report Title */}
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-secondary-900">{report.customerName}</h1>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${isApproved
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
              }`}>
              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-secondary-600">
            <span>{report.bankName}</span>
            <span>•</span>
            <span>{report.propertyType}</span>
            <span>•</span>
            <span>{report.location}</span>
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
          {report.files.length > 0 && (
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

          {/* Drop Zone */}
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

          {/* Pending Files */}
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

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto bg-secondary-50 p-8">

          {/* Re-analyzing overlay */}
          {isAnalyzing && (
            <div className="bg-white border border-brand-200 rounded-lg p-8 mb-6 shadow-sm">
              <Skeleton height={24} width={250} className="mb-4" />
              <Skeleton count={3} height={16} className="mb-2" />
              <div className="mt-4 flex items-center gap-3">
                <Skeleton height={32} width={32} borderRadius={16} />
                <p className="text-sm font-semibold text-secondary-600">AI is re-analyzing your report...</p>
              </div>
            </div>
          )}

          {/* Status Card */}
          <div className="bg-white border border-secondary-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-secondary-900 mb-6 border-b border-secondary-100 pb-3">Report Info</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-secondary-500 font-medium mb-1">Status</p>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${isApproved
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
                  }`}>
                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-secondary-500 font-medium mb-1">Last Updated</p>
                <div className="flex items-center gap-2 text-secondary-900 font-medium">
                  <Clock size={14} />
                  {formatDate(report.updatedAt, 'long')}
                </div>
              </div>
              <div>
                <p className="text-secondary-500 font-medium mb-1">Bank</p>
                <p className="text-secondary-900 font-medium">{report.bankName}</p>
              </div>
              <div>
                <p className="text-secondary-500 font-medium mb-1">Property Type</p>
                <p className="text-secondary-900 font-medium">{report.propertyType || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
