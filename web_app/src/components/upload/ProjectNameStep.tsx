import { useState, useMemo } from 'react';
import { FolderOpen, ArrowRight, Building2 } from 'lucide-react';
import { ProjectReport } from './types';
import { useQuery } from '@tanstack/react-query';
import { banksApi } from '../../apis/bank.api';


interface ProjectNameStepProps {
    projectName: string;
    setProjectName: (name: string) => void;
    bankName: string;
    setBankName: (name: string) => void;
    onNext: () => void;
    recentProjects: ProjectReport[];
}

const INDIAN_BANKS = [
    "State Bank of India (SBI)",
    "HDFC Bank",
    "ICICI Bank",
    "Axis Bank",
    "Kotak Mahindra Bank",
    "Punjab National Bank (PNB)",
    "Bank of Baroda",
    "Canara Bank",
    "Union Bank of India",
    "Bank of India",
    "Indian Bank",
    "Central Bank of India",
    "Indian Overseas Bank",
    "UCO Bank",
    "Bank of Maharashtra",
    "Punjab & Sind Bank",
    "IDBI Bank",
    "Federal Bank",
    "IDFC First Bank",
    "South Indian Bank",
    "Karur Vysya Bank",
    "City Union Bank",
    "Tamilnad Mercantile Bank",
    "Karnataka Bank",
    "Dhanlaxmi Bank"
];

export default function ProjectNameStep({
    projectName,
    setProjectName,
    bankName,
    setBankName,
    onNext,
    recentProjects
}: ProjectNameStepProps) {
    const handleProjectNameSubmit = () => {
        if (projectName?.trim() && bankName?.trim()) {
            onNext();
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const suggestions = useMemo(() => {
        const normalizedInput = (bankName || '').toLowerCase();
        if (!normalizedInput && !showBankSuggestions) return [];

        const dynamicNames = banks?.map(b => b.name) || [];

        // Use a Set for case-insensitive tracking, but preserve original casing from INDIAN_BANKS first
        const seen = new Set<string>();
        const uniqueNames: string[] = [];

        // Add static banks first
        INDIAN_BANKS.forEach(name => {
            const lower = name.toLowerCase();
            if (!seen.has(lower)) {
                seen.add(lower);
                uniqueNames.push(name);
            }
        });

        // Add dynamic banks if not present
        dynamicNames.forEach(name => {
            const lower = name.toLowerCase();
            if (!seen.has(lower)) {
                seen.add(lower); // assuming dynamic name casing is acceptable if unique
                uniqueNames.push(name);
            }
        });

        return uniqueNames
            .filter(name => name.toLowerCase().includes(normalizedInput))
            .sort();
    }, [banks, bankName, showBankSuggestions]);

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 max-w-xl mx-auto overflow-hidden relative">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-full blur-3xl -translate-y-24 translate-x-24 pointer-events-none" />

            <div className="text-center mb-10 relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-brand-600 to-brand-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl transform rotate-3 hover:rotate-6 transition-transform">
                    <FolderOpen size={36} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-secondary-900 mb-2 tracking-tight uppercase">Create New Report</h2>
                <p className="text-secondary-600 text-base font-semibold opacity-80">Enter details for your document analysis report</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-secondary-700 mb-2 uppercase tracking-[0.15em] ml-1">Bank Name *</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Building2 size={20} className="text-secondary-400 group-focus-within:text-brand-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={bankName || ''}
                            onChange={(e) => {
                                setBankName(e.target.value);
                                setShowBankSuggestions(true);
                            }}
                            onFocus={() => setShowBankSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowBankSuggestions(false), 200)}
                            placeholder="e.g., HDFC Bank, SBI"
                            className="w-full pl-12 pr-4 py-3.5 border border-secondary-200 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none text-base font-bold transition-all shadow-sm hover:border-secondary-300 placeholder-secondary-300"
                            autoFocus
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-secondary-700 mb-2 uppercase tracking-[0.15em] ml-1">Report Name *</label>
                    <input
                        type="text"
                        value={projectName || ''}
                        onChange={(e) => setProjectName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleProjectNameSubmit()}
                        placeholder="e.g., Tamil Land Documents - January 2024"
                        className="w-full px-5 py-3.5 border border-secondary-200 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none text-base font-bold placeholder-secondary-300 shadow-sm transition-all hover:border-secondary-300"
                    />
                </div>

                <button
                    onClick={handleProjectNameSubmit}
                    disabled={!projectName?.trim() || !bankName?.trim()}
                    className="w-full bg-gradient-to-br from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 disabled:from-secondary-200 disabled:to-secondary-200 disabled:cursor-not-allowed text-white px-8 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mt-6 uppercase tracking-wider"
                >
                    Continue to Upload
                    <ArrowRight size={20} />
                </button>
            </div>

            {recentProjects.length > 0 && (
                <div className="mt-10 pt-8 border-t border-gray-100 relative z-10">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Recent Reports</h3>
                    <div className="space-y-3">
                        {recentProjects.slice(0, 3).map((project) => (
                            <div
                                key={project.id}
                                className="group p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/50 transition-all cursor-pointer flex items-center justify-between"
                            >
                                <div>
                                    <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{project.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatDate(project.createdAt)} • {project.fileCount} {project.fileCount === 1 ? 'file' : 'files'}
                                    </p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-white flex items-center justify-center transition-colors">
                                    <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-600" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
