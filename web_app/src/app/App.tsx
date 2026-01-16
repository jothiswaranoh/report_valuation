import { AppProvider } from './providers';
import Router from './router';
import { useAppStore } from '../store/useAppStore';

function AppContent() {
    const {
        currentPage,
        setCurrentPage,
        setSelectedReportId
    } = useAppStore();

    const handleNavigate = (page: string, reportId?: string) => {
        setCurrentPage(page);
        if (reportId) {
            setSelectedReportId(reportId);
        }
    };

    return (
        <Router currentPage={currentPage} onNavigate={handleNavigate} />
    );
}

function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}

export default App;
