import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import toast from 'react-hot-toast';
import FileManagement from '../components/report/FileManagement';
import reportsApi, { ApiReport } from '../apis/report.api';
import { FileNode, ValuationReport, ReportStatus, PropertyType } from '../types';

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
