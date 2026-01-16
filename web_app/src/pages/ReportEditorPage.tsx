import { useState } from 'react';
import ReportEditor from '../components/report/ReportEditor';
import { mockReports } from '../data/mockData';
import { ValuationReport, ReportStatus } from '../types';

interface ReportEditorPageProps {
    onNavigate: (page: string, reportId?: string) => void;
}

export default function ReportEditorPage({ onNavigate }: ReportEditorPageProps) {
    const [reports, setReports] = useState<ValuationReport[]>(mockReports);
    const [selectedReportId] = useState<string | null>(
        mockReports.length > 0 ? mockReports[0].id : null
    );

    const selectedReport = selectedReportId
        ? reports.find((r) => r.id === selectedReportId) || null
        : null;

    const handleBack = () => {
        onNavigate('dashboard');
    };

    const handleSave = (reportId: string, content: ValuationReport['content']) => {
        setReports((prev) =>
            prev.map((report) =>
                report.id === reportId
                    ? { ...report, content, updatedAt: new Date() }
                    : report
            )
        );
    };

    const handleSendForReview = (reportId: string) => {
        setReports((prev) =>
            prev.map((report) =>
                report.id === reportId
                    ? { ...report, status: 'review' as ReportStatus, updatedAt: new Date() }
                    : report
            )
        );
        onNavigate('review');
    };

    return (
        <ReportEditor
            report={selectedReport}
            onBack={handleBack}
            onSave={handleSave}
            onSendForReview={handleSendForReview}
        />
    );
}
