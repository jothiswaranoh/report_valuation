import Layout from '../components/layout/Layout';
import DashboardPage from '../pages/DashboardPage';
import UploadPage from '../pages/UploadPage';
import UsersPage from '../pages/UsersPage';
import ReportsPage from '../pages/ReportsPage';
import ReportEditorPage from '../pages/ReportEditorPage';
import ReviewApprovalPage from '../pages/ReviewApprovalPage';

export type RoutePath =
    | 'dashboard'
    | 'upload'
    | 'files'
    | 'editor'
    | 'review'
    | 'users';

interface RouterProps {
    currentPage: string;
    onNavigate: (page: string, reportId?: string) => void;
}

export function Router({ currentPage, onNavigate }: RouterProps) {
    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <DashboardPage onNavigate={onNavigate} />;
            case 'upload':
                return <UploadPage />;
            case 'files':
                return <ReportsPage onNavigate={onNavigate} />;
            case 'editor':
                return <ReportEditorPage onNavigate={onNavigate} />;
            case 'review':
                return <ReviewApprovalPage onNavigate={onNavigate} />;
            case 'users':
                return <UsersPage />;
            default:
                return <DashboardPage onNavigate={onNavigate} />;
        }
    };

    return (
        <Layout currentPage={currentPage} onNavigate={onNavigate}>
            {renderPage()}
        </Layout>
    );
}

export default Router;
