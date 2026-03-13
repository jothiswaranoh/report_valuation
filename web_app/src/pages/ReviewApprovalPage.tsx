import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  Clock,
  ChevronLeft,
  History,
} from 'lucide-react';

import { ValuationReport, ReportStatus } from '../types';
import { formatDate } from '../utils/formatDate';
import { useReport, useUpdateReport } from '../hooks/useReports';
import { mapApiReportToValuation } from '../utils/reportMapper';
import Loader from '../components/common/Loader';
import Skeleton from 'react-loading-skeleton';

export default function ReviewApprovalPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [showAuditTrail, setShowAuditTrail] = useState(false);

  const { data: apiData, isLoading, error } = useReport(id);
  const updateReportMutation = useUpdateReport();

  const report = apiData ? mapApiReportToValuation(apiData) : null;

  const handleBack = () => {
    navigate('/');
  };

  const handleStatusChange = async (reportId: string, status: ReportStatus) => {
    try {
      await updateReportMutation.mutateAsync({
        reportId,
        data: { report_status: status }
      });
    } catch (e) {
      console.error("Failed to update status", e);
      alert("Failed to update report status.");
    }
  };

  const handleExport = (reportId: string, format: 'pdf' | 'docx') => {
    if (report) {
      alert(`Exporting ${report.customerName}'s report as ${format.toUpperCase()}`);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-sky-50/30">
        <div className="bg-white border-b border-sky-100 px-10 py-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <Skeleton height={24} width={150} />
            <div className="flex gap-4">
              <Skeleton height={48} width={140} borderRadius={16} />
              <Skeleton height={48} width={140} borderRadius={16} />
              <Skeleton height={48} width={140} borderRadius={16} />
            </div>
          </div>
          <Skeleton height={40} width={300} className="mb-4" />
          <Skeleton height={16} width={400} />
        </div>
        <div className="flex-1 overflow-auto p-8">
          <div className="bg-white border border-sky-100 rounded-xl p-6 shadow-md">
            <Skeleton height={28} width={200} className="mb-6" />
            <div className="flex justify-between items-center mb-8 gap-3">
              <Skeleton height={50} width="100%" borderRadius={12} />
              <div className="w-10 h-0.5 bg-sky-100 mx-3 rounded-full" />
              <Skeleton height={50} width="100%" borderRadius={12} />
              <div className="w-10 h-0.5 bg-sky-100 mx-3 rounded-full" />
              <Skeleton height={50} width="100%" borderRadius={12} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8">
        <div className="bg-white border border-sky-100 rounded-xl p-12 text-center">
          <p className="text-slate-500 font-medium">Report not found</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'review':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const statusWorkflow: { status: ReportStatus; label: string; icon: JSX.Element }[] = [
    { status: 'draft', label: 'Draft', icon: <Clock size={16} /> },
    { status: 'review', label: 'Under Review', icon: <FileText size={16} /> },
    { status: 'approved', label: 'Approved', icon: <CheckCircle size={16} /> },
  ];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-sky-100 px-10 py-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-3 text-slate-500 hover:text-sky-600 font-bold transition-all hover:-translate-x-1"
          >
            <ChevronLeft size={28} />
            <span className="text-lg">Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAuditTrail(!showAuditTrail)}
              className="flex items-center gap-3 px-6 py-3 border-2 border-sky-100 rounded-xl hover:bg-sky-50 transition-all font-bold text-slate-600 shadow-sm hover:shadow hover:border-sky-200"
            >
              <History size={22} />
              Audit Trail
            </button>

            <button
              onClick={() => handleExport(report.id, 'pdf')}
              className="px-6 py-3 bg-sky-50 text-sky-700 border-2 border-sky-100 rounded-xl hover:bg-sky-100 transition-all font-bold shadow-sm hover:shadow"
            >
              Export PDF
            </button>
            <button
              onClick={() => handleExport(report.id, 'docx')}
              className="px-6 py-3 bg-sky-50 text-sky-700 border-2 border-sky-100 rounded-xl hover:bg-sky-100 transition-all font-bold shadow-sm hover:shadow"
            >
              Export DOCX
            </button>
          </div>
        </div>

        <h1 className="text-4xl font-black text-slate-900 tracking-tight">{report.customerName}</h1>
        <div className="flex items-center gap-5 mt-3 text-sm font-bold text-slate-500">
          <span className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div>
            {report.bankName}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-200"></span>
          <span>{report.propertyType}</span>
          <span className="w-1 h-1 rounded-full bg-slate-200"></span>
          <span>{report.location}</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto bg-sky-50/30 p-8">
          <div className="bg-white border border-sky-100 rounded-xl p-6 mb-8 shadow-md">
            <h2 className="text-xl font-black text-slate-900 mb-6 border-b border-sky-50 pb-3">Report Status</h2>

            <div className="flex justify-between items-center mb-8 gap-3">
              {statusWorkflow.map((item, index) => (
                <div key={item.status} className="flex items-center flex-1 last:flex-none">
                  <button
                    onClick={() => handleStatusChange(report.id, item.status)}
                    className={`flex items-center gap-2 px-6 py-3 border-2 rounded-lg transition-all font-black text-sm shadow-sm
                      ${report.status === item.status
                        ? getStatusColor(item.status) + ' shadow-md'
                        : 'border-sky-100 text-slate-400 hover:bg-sky-50 hover:border-sky-200'
                      }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                  {index < statusWorkflow.length - 1 && (
                    <div className="flex-1 h-0.5 bg-sky-100 mx-3 rounded-full" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500 font-bold bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100 inline-flex">
              <Clock size={16} />
              <span>Last Updated:</span>
              <span className="text-slate-900">{formatDate(report.updatedAt, 'long')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
