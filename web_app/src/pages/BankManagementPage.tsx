import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { banksApi, Bank } from '../apis/bank.api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Building2, Search } from 'lucide-react';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';

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
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-5xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bank Management</h1>
                    <p className="text-gray-600 mt-1">Manage the list of banks available for reports</p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)} icon={<Plus size={18} />}>
                    Add Bank
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search banks..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 font-medium text-sm">
                                <th className="px-6 py-4">Bank Name</th>
                                <th className="px-6 py-4 w-40 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredBanks.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="px-6 py-12 text-center text-gray-500">
                                        <Building2 className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                        <p>No banks found. Add one specifically.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredBanks.map((bank) => (
                                    <tr key={bank.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                    <Building2 size={20} />
                                                </div>
                                                <span className="font-medium text-gray-900">{bank.name}</span>
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
                                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedBank(bank);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
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

            {/* Add Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={closeModals}
                title="Add New Bank"
                size="sm"
                footer={
                    <>
                        <Button variant="outline" onClick={closeModals}>Cancel</Button>
                        <Button onClick={handleAdd} isLoading={createBankMutation.isPending}>Add Bank</Button>
                    </>
                }
            >
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                    <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. HDFC Bank"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={closeModals}
                title="Edit Bank"
                size="sm"
                footer={
                    <>
                        <Button variant="outline" onClick={closeModals}>Cancel</Button>
                        <Button onClick={handleUpdate} isLoading={updateBankMutation.isPending}>Save Changes</Button>
                    </>
                }
            >
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                    <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. HDFC Bank"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={closeModals}
                title="Delete Bank"
                size="sm"
                footer={
                    <>
                        <Button variant="outline" onClick={closeModals}>Cancel</Button>
                        <Button variant="danger" onClick={handleDelete} isLoading={deleteBankMutation.isPending}>Delete</Button>
                    </>
                }
            >
                <p className="text-gray-600">
                    Are you sure you want to delete <span className="font-semibold">{selectedBank?.name}</span>?
                    This action cannot be undone.
                </p>
            </Modal>
        </div>
    );
}
