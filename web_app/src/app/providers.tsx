import { ReactNode, createContext, useContext, useState } from 'react';

// App state context
interface AppContextType {
    currentPage: string;
    setCurrentPage: (page: string) => void;
    selectedReportId: string | null;
    setSelectedReportId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppContext() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
}

interface AppProviderProps {
    children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

    return (
        <AppContext.Provider
            value={{
                currentPage,
                setCurrentPage,
                selectedReportId,
                setSelectedReportId,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}
