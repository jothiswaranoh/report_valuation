import { useState } from 'react';
import { ValuationReport, ReportStatus } from '../types';
import { mockReports, mockDashboardStats } from '../data/mockData';

// Simple state management using React hooks pattern
// Can be replaced with Zustand or Redux if needed

interface AppState {
    currentPage: string;
    selectedReportId: string | null;
    reports: ValuationReport[];
    dashboardStats: typeof mockDashboardStats;
}

const initialState: AppState = {
    currentPage: 'dashboard',
    selectedReportId: null,
    reports: mockReports,
    dashboardStats: mockDashboardStats,
};

export function useAppStore() {
    const [state, setState] = useState<AppState>(initialState);

    const setCurrentPage = (page: string) => {
        setState(prev => ({ ...prev, currentPage: page }));
    };

    const setSelectedReportId = (id: string | null) => {
        setState(prev => ({ ...prev, selectedReportId: id }));
    };

    const updateReport = (reportId: string, content: ValuationReport['content']) => {
        setState(prev => ({
            ...prev,
            reports: prev.reports.map(report =>
                report.id === reportId
                    ? { ...report, content, updatedAt: new Date() }
                    : report
            ),
        }));
    };

    const updateReportStatus = (reportId: string, status: ReportStatus) => {
        setState(prev => ({
            ...prev,
            reports: prev.reports.map(report =>
                report.id === reportId
                    ? { ...report, status, updatedAt: new Date() }
                    : report
            ),
        }));
    };

    const getSelectedReport = (): ValuationReport | null => {
        if (!state.selectedReportId) return null;
        return state.reports.find(r => r.id === state.selectedReportId) || null;
    };

    return {
        // State
        currentPage: state.currentPage,
        selectedReportId: state.selectedReportId,
        reports: state.reports,
        dashboardStats: state.dashboardStats,

        // Computed
        selectedReport: getSelectedReport(),

        // Actions
        setCurrentPage,
        setSelectedReportId,
        updateReport,
        updateReportStatus,
    };
}

export type AppStore = ReturnType<typeof useAppStore>;
