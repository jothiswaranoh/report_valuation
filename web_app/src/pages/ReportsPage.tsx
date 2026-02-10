import { useNavigate, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import FileManagement from '../components/report/FileManagement';
import { useAuth } from '../hooks/useAuth';
import reportsApi from '../apis/report.api';
import { FileNode, ValuationReport, ReportFile } from '../types';

export default function ReportsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <FileManagement
            fileTree={fileTree}
            reports={valuationReports}
            onNavigate={(page, id) => {
                if (id) {
                    navigate(`/reports/${id}/${page}`);
                } else {
                    navigate(`/${page}`);
                }
            }}
        />
    );
}
