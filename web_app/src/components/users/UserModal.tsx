import React, { useEffect, useState } from 'react';
import { X, UserPlus, Save } from 'lucide-react';
import { User, Role } from '../../types/User';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    roles: Role[];
    isLoading: boolean;
    onSubmit: (data: any) => Promise<void>;
}

export const UserModal: React.FC<UserModalProps> = ({
    isOpen,
    onClose,
    user,
    roles,
    isLoading,
    onSubmit,
}) => {
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: '',
    });

    useEffect(() => {
        if (user) {
            setForm({
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                password: '', // Password stays empty in edit mode unless explicitly changed
                role: user.roles?.[0] || '',
            });
        } else {
            setForm({
                first_name: '',
                last_name: '',
                email: '',
                password: '',
                role: '',
            });
        }
    }, [user, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!form.first_name || !form.last_name || !form.email || (!user && !form.password) || !form.role) {
            return; // Validation should be handled via toast or browser defaults in a real app
        }

        const submissionData = user
            ? { ...form, id: user.id }
            : { ...form };

        // Remove password from edit if empty
        if (user && !form.password) {
            delete (submissionData as any).password;
        }

        await onSubmit(submissionData);
    };

    const isEdit = !!user;

    return (
        <div className="fixed inset-0 bg-secondary-950/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-secondary-900">
                            {isEdit ? 'Edit User' : 'Create New User'}
                        </h2>
                        <p className="text-sm text-secondary-600 mt-1">
                            {isEdit ? 'Update user information and permissions' : 'Add a new user to the system'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-10 w-10 rounded-full hover:bg-secondary-100 flex items-center justify-center transition-colors text-secondary-400 hover:text-secondary-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-secondary-700">First Name *</label>
                            <input
                                required
                                placeholder="John"
                                className="w-full border border-secondary-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                                value={form.first_name}
                                onChange={e => setForm({ ...form, first_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-secondary-700">Last Name *</label>
                            <input
                                required
                                placeholder="Doe"
                                className="w-full border border-secondary-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                                value={form.last_name}
                                onChange={e => setForm({ ...form, last_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-secondary-700">Email Address *</label>
                        <input
                            required
                            type="email"
                            placeholder="john@example.com"
                            className="w-full border border-secondary-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-secondary-700">
                            {isEdit ? 'New Password' : 'Password *'}
                        </label>
                        <input
                            required={!isEdit}
                            type="password"
                            placeholder={isEdit ? 'Leave blank to keep current' : '••••••••'}
                            className="w-full border border-secondary-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                        />
                        {isEdit && (
                            <p className="text-xs text-secondary-500 italic mt-1">
                                Only fill this in if you want to change the user's password
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-secondary-700">Primary Role *</label>
                        <select
                            required
                            className="w-full border border-secondary-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition bg-white appearance-none"
                            value={form.role}
                            onChange={e => setForm({ ...form, role: e.target.value })}
                        >
                            <option value="">Select a role</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.name}>
                                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-secondary-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`px-5 py-2.5 ${isEdit ? 'bg-success-600 hover:bg-success-700' : 'bg-brand-600 hover:bg-brand-700'} text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    {isEdit ? 'Saving...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    {isEdit ? <Save size={18} /> : <UserPlus size={18} />}
                                    {isEdit ? 'Save Changes' : 'Create User'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
