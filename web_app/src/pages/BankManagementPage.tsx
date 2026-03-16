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
            <div className="min-h-screen bg-transparent p-8">
                <div className="container mx-auto max-w-6xl space-y-8 animate-in fade-in duration-700">
                    <div className="flex justify-between items-end mb-10">
                        <div>
                            <Skeleton height={40} width={300} className="mb-2" />
                            <Skeleton height={20} width={400} />
                        </div>
                        <Skeleton height={48} width={150} borderRadius={12} />
                    </div>
                    <div className="bg-white rounded-xl shadow-xl border border-sky-100 overflow-hidden">
                        <div className="p-6 border-b border-secondary-200">
                            <Skeleton height={48} width={400} borderRadius={12} />
                        </div>
                        <div className="p-8 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Skeleton key={i} height={60} className="w-full" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent p-6 relative overflow-hidden">
            {/* Ultra-Premium Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-400/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />
            <div className="container mx-auto max-w-6xl">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6 fade-in">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600 shadow-sm border border-brand-200">
                                <Building2 size={20} />
                            </div>
                            <span className="text-xs font-black text-brand-600 uppercase tracking-[0.3em]">Institutions</span>
                        </div>
                        <h1 className="text-4xl font-black text-secondary-900 tracking-tighter leading-none">
                            Bank <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-brand-700">Management</span>
                        </h1>
                        <p className="text-base text-secondary-500 font-medium max-w-lg">
                            Orchestrate your banking network for seamless report generation.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="group relative flex items-center gap-3 px-6 py-3 bg-gradient-to-br from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white rounded-2xl font-black text-base shadow-glow-lg hover:shadow-glow transition-all duration-300 transform hover:-translate-y-1 active:scale-95 overflow-hidden border-none"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span>Add New Bank</span>
                    </button>
                </div>

                {/* Main Content Card */}
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card-lg border border-white/50 overflow-hidden fade-in animate-slide-up relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-brand-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="p-6 border-b border-secondary-100 bg-white/40 relative z-10">
                        <div className="relative max-w-xl group">
                            <div className="absolute inset-0 bg-brand-500/5 rounded-2xl blur-xl group-focus-within:bg-brand-500/10 transition-all" />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-400 group-focus-within:text-brand-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Locate entity by keyword..."
                                className="w-full pl-12 pr-4 py-3 border border-secondary-200/60 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500/50 transition-all shadow-inner-sm bg-white/80 text-base font-bold placeholder:text-secondary-300"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto custom-scrollbar relative z-10">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-secondary-50/40 text-secondary-500 border-b border-secondary-100">
                                    <th className="px-6 py-3 uppercase tracking-[0.25em] font-black text-[10px]">Entity Identity</th>
                                    <th className="px-6 py-3 w-48 text-right uppercase tracking-[0.25em] font-black text-[10px]">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-50">
                                {filteredBanks.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                                                <div className="w-20 h-20 bg-brand-50 rounded-3xl flex items-center justify-center mb-4 shadow-soft relative overflow-hidden group">
                                                    <div className="absolute inset-0 bg-brand-500/10 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-full" />
                                                    <Building2 className="h-10 w-10 text-brand-400 group-hover:text-brand-600 transition-colors" />
                                                </div>
                                                <h3 className="text-xl font-black text-secondary-900 mb-2">Vault is Empty</h3>
                                                <p className="text-secondary-400 text-base font-bold max-w-xs mx-auto">
                                                    No banking entities registered.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBanks.map((bank, index) => (
                                        <tr
                                            key={bank.id}
                                            className="hover:bg-brand-50/30 transition-all duration-300 group cursor-default border-b border-secondary-50 last:border-0"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white shadow-medium transition-all duration-500 group-hover:scale-110 group-hover:shadow-glow-lg group-hover:rotate-3">
                                                        <Building2 size={24} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-lg font-black text-secondary-900 group-hover:text-brand-600 transition-colors uppercase tracking-tight">
                                                            {bank.name}
                                                        </span>
                                                        <span className="text-xs font-bold text-secondary-400 uppercase tracking-widest mt-0.5">Institution</span>
                                                    </div>
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
                                                        className="p-2.5 text-secondary-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all duration-300 hover:shadow-soft border border-secondary-100"
                                                        title="Refine"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBank(bank);
                                                            setIsDeleteModalOpen(true);
                                                        }}
                                                        className="p-2.5 text-secondary-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 hover:shadow-soft border border-secondary-100"
                                                        title="Remove"
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

                <div className="mt-4 flex justify-center items-center gap-2 text-secondary-300 text-[10px] font-black uppercase tracking-[0.4em] fade-in py-8">
                    <span className="w-12 h-[1px] bg-secondary-100" />
                    <span>Secure Infrastructure Layer</span>
                    <span className="w-12 h-[1px] bg-secondary-100" />
                </div>

                {/* Modals */}
                <Modal
                    isOpen={isAddModalOpen}
                    onClose={closeModals}
                    title="Register Entity"
                    size="sm"
                    footer={
                        <div className="flex gap-3 w-full justify-end">
                            <Button variant="outline" onClick={closeModals} className="px-6 rounded-xl font-bold">Cancel</Button>
                            <Button onClick={handleAdd} isLoading={createBankMutation.isPending} className="px-8 rounded-xl bg-brand-600 hover:bg-brand-700 shadow-glow font-black border-none">Commit</Button>
                        </div>
                    }
                >
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-secondary-400 mb-2 uppercase tracking-[0.3em]">Entity Name</label>
                            <input
                                type="text"
                                value={bankName}
                                autoFocus
                                onChange={(e) => setBankName(e.target.value)}
                                placeholder="e.g. FEDERAL RESERVE"
                                className="w-full px-5 py-4 border border-secondary-200 shadow-inner-sm rounded-2xl focus:border-brand-500 outline-none transition-all bg-white font-black text-secondary-900"
                            />
                        </div>
                    </div>
                </Modal>

                <Modal
                    isOpen={isEditModalOpen}
                    onClose={closeModals}
                    title="Update Entity"
                    size="sm"
                    footer={
                        <div className="flex gap-3 w-full justify-end">
                            <Button variant="outline" onClick={closeModals} className="px-6 rounded-xl font-bold">Cancel</Button>
                            <Button onClick={handleUpdate} isLoading={updateBankMutation.isPending} className="px-8 rounded-xl bg-brand-600 hover:bg-brand-700 shadow-glow font-black border-none">Save Changes</Button>
                        </div>
                    }
                >
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-secondary-400 mb-2 uppercase tracking-[0.3em]">Entity Name</label>
                            <input
                                type="text"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                placeholder="e.g. FEDERAL RESERVE"
                                className="w-full px-5 py-4 border border-secondary-200 shadow-inner-sm rounded-2xl focus:border-brand-500 outline-none transition-all bg-white font-black text-secondary-900"
                            />
                        </div>
                    </div>
                </Modal>

                <Modal
                    isOpen={isDeleteModalOpen}
                    onClose={closeModals}
                    title="Confirm Termination"
                    size="sm"
                    footer={
                        <div className="flex gap-3 w-full justify-end">
                            <Button variant="outline" onClick={closeModals} className="px-6 rounded-xl font-bold">Hold</Button>
                            <Button variant="danger" onClick={handleDelete} isLoading={deleteBankMutation.isPending} className="px-8 rounded-xl font-black">Terminate</Button>
                        </div>
                    }
                >
                    <div className="py-4">
                        <p className="text-secondary-600 text-center text-lg font-medium">
                            Proceed with record termination for:
                            <span className="font-black text-secondary-900 block mt-2 text-2xl tracking-tighter uppercase">{selectedBank?.name}</span>
                        </p>
                    </div>
                </Modal>
            </div>
        </div>
    );
}

