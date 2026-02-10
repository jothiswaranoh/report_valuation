import { FileText, Clock, CheckCircle, AlertCircle, Upload, FolderOpen } from 'lucide-react';
import { DashboardStats, ValuationReport } from '../types';

interface DashboardProps {
  stats: DashboardStats;
  recentReports: ValuationReport[];
  onNavigate: (page: string, reportId?: string) => void;
}

export default function Dashboard({ stats, recentReports, onNavigate }: DashboardProps) {
  const statCards = [
    { label: 'Total Reports', value: stats.totalReports, icon: <FileText size={24} />, color: 'bg-brand-500', text: 'text-brand-50' },
    { label: 'Draft', value: stats.draftReports, icon: <Clock size={24} />, color: 'bg-amber-500', text: 'text-amber-50' },
    { label: 'Under Review', value: stats.reviewReports, icon: <AlertCircle size={24} />, color: 'bg-orange-500', text: 'text-orange-50' },
    { label: 'Approved', value: stats.approvedReports, icon: <CheckCircle size={24} />, color: 'bg-emerald-500', text: 'text-emerald-50' },
  ];



  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 tracking-tight">Dashboard</h1>
        <p className="text-secondary-500 mt-2">Overview of valuation reports and system activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-secondary-200 p-6 shadow-sm hover:shadow-soft hover:border-brand-200 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} ${card.text} p-3 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300`}>{card.icon}</div>
              <div className="text-3xl font-bold text-secondary-900">{card.value}</div>
            </div>
            <p className="text-sm font-medium text-secondary-500 group-hover:text-secondary-700 transition-colors">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => onNavigate('upload')}
          className="bg-gradient-to-br from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white rounded-xl p-8 flex items-center gap-6 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700" />

          <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-colors">
            <Upload size={32} />
          </div>
          <div className="text-left relative z-10">
            <p className="font-bold text-xl mb-1">Upload New PDF</p>
            <p className="text-brand-100 text-sm">Start a new valuation report</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('files')}
          className="bg-white hover:bg-secondary-50 border border-secondary-200 hover:border-brand-300 rounded-xl p-8 flex items-center gap-6 transition-all shadow-sm hover:shadow-soft group"
        >
          <div className="bg-secondary-100 p-4 rounded-xl group-hover:bg-brand-50 transition-colors">
            <FolderOpen size={32} className="text-secondary-600 group-hover:text-brand-600 transition-colors" />
          </div>
          <div className="text-left">
            <p className="font-bold text-xl text-secondary-900 mb-1">View Files</p>
            <p className="text-secondary-500 text-sm">Browse organized reports</p>
          </div>
        </button>

        <div className="bg-white border border-secondary-200 rounded-xl p-8 shadow-sm flex items-center justify-between relative overflow-hidden hover:shadow-soft transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50 rounded-full blur-2xl -translate-y-8 translate-x-8" />

          <div>
            <p className="text-sm font-medium text-secondary-500 mb-1">Recent Activity</p>
            <p className="text-4xl font-bold text-secondary-900">{stats.recentUploads}</p>
            <p className="text-sm text-emerald-600 font-medium mt-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Uploads this week
            </p>
          </div>
          <div className="p-4 bg-brand-50 rounded-xl">
            <Clock size={32} className="text-brand-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-secondary-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-secondary-100 flex items-center justify-between bg-secondary-50/50">
          <h2 className="text-lg font-bold text-secondary-900">Recent Reports</h2>
          <button className="text-sm text-brand-600 hover:text-brand-700 font-medium hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50/50 border-b border-secondary-100">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Customer</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Bank</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Property Type</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Location</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Status</th>
                <th className="px-8 py-4 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {recentReports.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-brand-50/30 cursor-pointer transition-colors group"
                  onClick={() => onNavigate('editor', report.id)}
                >
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-secondary-900 group-hover:text-brand-700 transition-colors">{report.customerName}</div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-600 bg-secondary-100 px-2 py-1 rounded inline-block font-medium">{report.bankName}</div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-600">{report.propertyType}</div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-600">{report.location}</div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${report.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        report.status === 'review' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                    >
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {formatDate(report.updatedAt)}
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
