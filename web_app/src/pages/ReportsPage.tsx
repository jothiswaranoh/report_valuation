import FileManagement from '../components/report/FileManagement';
import { mockReports, buildFileTree } from '../data/mockData';

interface ReportsPageProps {
    onNavigate: (page: string, reportId?: string) => void;
}

export default function ReportsPage({ onNavigate }: ReportsPageProps) {
    const reports = mockReports;
    const fileTree = buildFileTree(reports);

    return (
        <FileManagement
            fileTree={fileTree}
            reports={reports}
            onNavigate={onNavigate}
        />
    );
}
