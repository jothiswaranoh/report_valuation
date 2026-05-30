import { useMemo } from 'react';
import { useReports } from './useReports';
import { mockDashboardStats } from '../data/mockData';
import { DashboardStats, ValuationReport, ReportStatus, PropertyType } from '../types';
import { ApiReport } from '../apis/report.api';

export function useDashboardData() {
    // Fetch all reports for accurate stats (page_size=9999 bypasses pagination)
    const { data: reportsData, isLoading } = useReports({ refetchInterval: 5000, page_size: 9999 });

    // Stats calculation based on real data
    const stats: DashboardStats = useMemo(() => {
        if (!reportsData?.reports) return mockDashboardStats;

        const reports = reportsData.reports;
        return {
            totalReports: reportsData.total ?? reports.length,
            draftReports: reports.filter(r => (r.report_status || r.status) === 'draft').length,
            processReports: reports.filter(r => (r.report_status || r.status) === 'process').length,
            reviewReports: reports.filter(r => (r.report_status || r.status) === 'review').length,
            approvedReports: reports.filter(r => (r.report_status || r.status) === 'approved').length,
            recentUploads: reports.filter(r => {
                const diff = new Date().getTime() - new Date(r.created_at).getTime();
                return diff < 7 * 24 * 60 * 60 * 1000;
            }).length
        };
    }, [reportsData]);

    const recentReports: ValuationReport[] = useMemo(() => {
        if (!reportsData?.reports) return [];

        let mappedReports = [...reportsData.reports]
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            .slice(0, 5) // Show only latest 5
            .map((r: ApiReport) => ({
                id: r.id,
                customerName: (r as any).report_name || r.customer_name || r.name || (r as any).property_owner || r.bank_name || 'Untitled Report',
                bankName: r.bank_name || 'Unknown Bank',
                propertyType: (r.property_type as PropertyType) || 'Residential',
                location: r.location || 'Unknown Location',
                status: ((r.report_status || r.status) as ReportStatus) || 'draft',
                createdAt: new Date(r.created_at),
                updatedAt: new Date(r.updated_at),
                year: new Date(r.created_at).getFullYear().toString(),
                month: (new Date(r.created_at).getMonth() + 1).toString().padStart(2, '0'),
                files: [], // Not needed for dashboard table
                metadata: {} as any,
                content: {
                    summary: (r as any).summary || (r as any).executive_summary || 'No summary generated yet for this report.',
                } as any,
                comments: [],
                auditTrail: [],
            }));

        return mappedReports;
    }, [reportsData]);

    return { stats, recentReports, isLoading };
}
