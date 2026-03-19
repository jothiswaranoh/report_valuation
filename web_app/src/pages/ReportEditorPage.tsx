import { useNavigate, useParams } from 'react-router-dom';
import ReportEditor from '../components/report/ReportEditor';
import { useReport } from '../hooks/useReports';
import { ValuationReport } from '../types';
import { mapApiReportToValuation } from '../utils/reportMapper';
import Skeleton from 'react-loading-skeleton';

export default function ReportEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: apiData, isLoading, error } = useReport(id);

  const selectedReport = apiData ? mapApiReportToValuation(apiData) : null;

  const handleBack = () => {
    navigate(-1);
  };

  const handleSave = async (_reportId: string, content: ValuationReport['content']) => {
    // In a real app, we would send this to the backend
    console.log('Saving report content:', content);
    // updateReportMutation.mutate({ reportId, data: { content } });
  };

  const handleApprove = async () => {
    if (!id || !selectedReport) return;
    try {
      await import('../apis/report.api').then(m =>
        m.reportsApi.updateReport(id, {
          report_name: selectedReport.customerName,
          report_status: 'approved'
        })
      );
      navigate(`/reports/${id}/review`);
    } catch (err) {
      console.error('Failed to approve report:', err);
      alert('Failed to approve report');
    }
  };

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

  if (error || (!isLoading && !selectedReport)) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">Failed to load report</h2>
        <p className="text-gray-600 mt-2">The report you are looking for might not exist or you don't have permission to view it.</p>
        <button
          onClick={() => navigate('/files')}
          className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg"
        >
          Go to Reports
        </button>
      </div>
    );
  }

  return (
    <ReportEditor
      report={selectedReport}
      reportId={id}
      onBack={handleBack}
      onSave={handleSave}
      onApprove={handleApprove}
    />
  );
}
