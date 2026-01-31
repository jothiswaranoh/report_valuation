import { useNavigate } from 'react-router-dom';
import FileManagement from '../components/report/FileManagement';
import { buildFileTree } from '../data/mockData';
import { useAppStore } from '../store/useAppStore';

export default function ReportsPage() {
    const { reports } = useAppStore();
    const fileTree = buildFileTree(reports);
    const navigate = useNavigate();

    return (
        <FileManagement
            fileTree={fileTree}
            reports={reports}
            onNavigate={(page, id) => {
                // Determine path based on page and id
                // Example: page='review' -> /reports/{id}/review
                if (id) {
                    navigate(`/reports/${id}/${page}`);
                } else {
                    navigate(`/${page}`);
                }
            }}
        />
    );
}
