import { FileText, Clock, CheckCircle, AlertCircle, Upload, FolderOpen } from 'lucide-react';
import { DashboardStats, ValuationReport } from '../types';
import { formatDate } from '../utils/formatDate';
import { mockReports, mockDashboardStats } from '../data/mockData';
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
    // Using mock data directly - in production, this would come from a hook/API
    const stats: DashboardStats = mockDashboardStats;
    const recentReports: ValuationReport[] = mockReports;
    const navigate = useNavigate();
    const statCards = [
        { label: 'Total Reports', value: stats.totalReports, icon: <FileText size={24} />, color: 'bg-brand-500' },
        { label: 'Draft', value: stats.draftReports, icon: <Clock size={24} />, color: 'bg-amber-500' },
        { label: 'Under Review', value: stats.reviewReports, icon: <AlertCircle size={24} />, color: 'bg-orange-500' },
        { label: 'Approved', value: stats.approvedReports, icon: <CheckCircle size={24} />, color: 'bg-green-500' },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-amber-100 text-amber-800';
            case 'review':
                return 'bg-orange-100 text-orange-800';
            case 'approved':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-secondary-100 text-secondary-800';
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-secondary-900">Dashboard</h1>
                <p className="text-secondary-600 mt-2">Overview of valuation reports and system activity</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((card) => (
                    <div key={card.label} className="bg-white rounded-lg border border-secondary-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`${card.color} text-white p-3 rounded-lg`}>{card.icon}</div>
                            <div className="text-3xl font-bold text-secondary-900">{card.value}</div>
                        </div>
                        <p className="text-sm font-medium text-secondary-600">{card.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <button
                    onClick={() => navigate('upload')}
                    className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg p-6 flex items-center gap-4 transition-colors"
                >
                    <Upload size={32} />
                    <div className="text-left">
                        <p className="font-semibold text-lg">Upload New PDF</p>
                        <p className="text-brand-100 text-sm">Start a new valuation report</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate('files')}
                    className="bg-white hover:bg-secondary-50 border-2 border-secondary-200 rounded-lg p-6 flex items-center gap-4 transition-colors"
                >
                    <FolderOpen size={32} className="text-secondary-700" />
                    <div className="text-left">
                        <p className="font-semibold text-lg text-secondary-900">View Files</p>
                        <p className="text-secondary-600 text-sm">Browse organized reports</p>
                    </div>
                </button>

                <div className="bg-white border border-secondary-200 rounded-lg p-6">
                    <div className="text-center">
                        <p className="text-4xl font-bold text-brand-600">{stats.recentUploads}</p>
                        <p className="text-sm text-secondary-600 mt-2">Recent Uploads (7 days)</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-secondary-200">
                <div className="px-6 py-4 border-b border-secondary-200">
                    <h2 className="text-lg font-semibold text-secondary-900">Recent Reports</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-secondary-50 border-b border-secondary-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Bank
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Property Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Updated
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-secondary-200">
                            {recentReports.map((report) => (
                                <tr
                                    key={report.id}
                                    className="hover:bg-secondary-50 cursor-pointer transition-colors"
                                    onClick={() => navigate(`/reports/${report.id}/edit`)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-secondary-900">{report.customerName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-secondary-600">{report.bankName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-secondary-600">{report.propertyType}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-secondary-600">{report.location}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                                report.status
                                            )}`}
                                        >
                                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                                        {formatDate(report.updatedAt, 'short')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
