import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { banksApi, Bank } from '../apis/bank.api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Building2, Search } from 'lucide-react';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Skeleton from 'react-loading-skeleton';

export default function BankManagementPage() {
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
    const [bankName, setBankName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: banks, isLoading } = useQuery({
        queryKey: ['banks'],
        queryFn: banksApi.getBanks,
    });

    const createBankMutation = useMutation({
        mutationFn: banksApi.createBank,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banks'] });
            toast.success('Bank added successfully');
            closeModals();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to add bank');
        },
    });

    const updateBankMutation = useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) => banksApi.updateBank(id, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banks'] });
            toast.success('Bank updated successfully');
            closeModals();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update bank');
        },
    });

    const deleteBankMutation = useMutation({
        mutationFn: banksApi.deleteBank,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banks'] });
            toast.success('Bank deleted successfully');
            closeModals();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete bank');
        },
    });

    const closeModals = () => {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setBankName('');
        setSelectedBank(null);
    };

    const handleAdd = () => {
        if (!bankName.trim()) return;
        createBankMutation.mutate(bankName);
    };

    const handleUpdate = () => {
        if (!selectedBank || !bankName.trim()) return;
        updateBankMutation.mutate({ id: selectedBank.id, name: bankName });
    };

    const handleDelete = () => {
        if (!selectedBank) return;
        deleteBankMutation.mutate(selectedBank.id);
    };

    const filteredBanks = banks?.filter(bank =>
        bank.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    if (isLoading) {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
                    <div>
                        <Skeleton height={40} width={300} className="mb-2" />
                        <Skeleton height={20} width={400} />
                    </div>
                    <Skeleton height={48} width={150} borderRadius={8} />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-brand-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <Skeleton height={44} width={300} borderRadius={8} />
                    </div>
                    <div className="p-4 space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <Skeleton key={i} height={60} className="w-full rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Bank Management</h1>
                    <p className="text-slate-600 font-semibold mt-1">Manage the available banking institutions for valuation reports</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white px-6 py-2.5 rounded-lg text-base font-bold flex items-center gap-2 shadow-sm transition-all hover:-translate-y-0.5"
                >
                    <Plus size={18} />
                    Add New Bank
                </button>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-xl border border-brand-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search banks..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium placeholder:text-slate-400 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                    Bank Name
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredBanks.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <Building2 size={40} className="mb-4 text-slate-300" />
                                            <p className="text-base font-medium text-slate-600">No banks found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredBanks.map((bank) => (
                                    <tr
                                        key={bank.id}
                                        className="hover:bg-slate-50 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <Building2 size={18} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                                                    {bank.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedBank(bank);
                                                        setBankName(bank.name);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-transparent hover:border-brand-100"
                                                    title="Edit Bank"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedBank(bank);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                    title="Delete Bank"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={closeModals}
                title="Add New Bank"
                size="sm"
                footer={
                    <div className="flex gap-3 w-full justify-end">
                        <Button variant="outline" onClick={closeModals}>Cancel</Button>
                        <Button onClick={handleAdd} isLoading={createBankMutation.isPending}>Add Bank</Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Bank Name</label>
                        <input
                            type="text"
                            value={bankName}
                            autoFocus
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="e.g. HDFC Bank"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium text-slate-900"
                        />
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isEditModalOpen}
                onClose={closeModals}
                title="Edit Bank"
                size="sm"
                footer={
                    <div className="flex gap-3 w-full justify-end">
                        <Button variant="outline" onClick={closeModals}>Cancel</Button>
                        <Button onClick={handleUpdate} isLoading={updateBankMutation.isPending}>Save Changes</Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Bank Name</label>
                        <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="e.g. HDFC Bank"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium text-slate-900"
                        />
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={closeModals}
                title="Delete Bank"
                size="sm"
                footer={
                    <div className="flex gap-3 w-full justify-end">
                        <Button variant="outline" onClick={closeModals}>Cancel</Button>
                        <Button variant="danger" onClick={handleDelete} isLoading={deleteBankMutation.isPending}>Delete</Button>
                    </div>
                }
            >
                <div className="py-2">
                    <p className="text-slate-600 font-medium">
                        Are you sure you want to delete <span className="font-bold text-slate-900">{selectedBank?.name}</span>? This action cannot be undone.
                    </p>
                </div>
            </Modal>
        </div>
    );
}
