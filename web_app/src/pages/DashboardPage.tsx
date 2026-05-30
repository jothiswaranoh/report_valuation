import React from 'react';
import { useNavigate } from "react-router-dom";
import { ValuationReport } from '../types';
import { useDashboardData } from '../hooks/useDashboardData';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import StatCardsGrid from '../components/dashboard/StatCardsGrid';
import RecentActivityTable from '../components/dashboard/RecentActivityTable';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';

export default function DashboardPage() {
    const navigate = useNavigate();
    const { stats, recentReports, isLoading } = useDashboardData();

    const handleReportClick = (report: ValuationReport) => {
        switch (report.status) {
            case 'draft':
                navigate(`/upload/${report.id}?step=upload`);
                break;
            case 'process':
                navigate(`/upload/${report.id}?step=select`);
                break;
            case 'review':
                navigate(`/reports/${report.id}/edit`);
                break;
            case 'approved':
                navigate(`/reports/${report.id}/review`);
                break;
            default:
                navigate(`/upload/${report.id}`);
        }
    };

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <DashboardHeader 
                onNewAnalysis={() => navigate('/upload')} 
                onCurrentReport={() => navigate('/current-report')} 
            />

            <StatCardsGrid 
                stats={stats} 
                onNavigate={(path) => navigate(path)} 
            />

            <RecentActivityTable 
                recentReports={recentReports} 
                onReportClick={handleReportClick} 
                onViewHistory={() => navigate('/history')}
            />
        </div>
    );
}