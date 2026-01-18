import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';

import {
  useUsers,
  useDeleteUser,
  useRoles,
  useCreateUser,
  useUpdateUser,
} from '../hooks/useUsers';

import { UserHeader } from '../components/users/UserHeader';
import { UserActionBar } from '../components/users/UserActionBar';
import { UserTable } from '../components/users/UserTable';
import { UserModal } from '../components/users/UserModal';
import { User } from '../types/User';

export default function UsersPage() {
  // Queries
  const { data: users = [], isLoading, refetch } = useUsers();
  const { data: roles = [] } = useRoles();

  // Mutations
  const deleteUser = useDeleteUser();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  // Local State
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Derived Data
  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      `${user.first_name} ${user.last_name} ${user.email}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const stats = useMemo(() => ({
    total: users.length,
    rolesCount: roles.length,
    admins: users.filter(u => u.roles.includes('admin')).length
  }), [users, roles]);

  // Handlers
  const handleAddClick = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSubmit = async (formData: any) => {
    try {
      if (selectedUser) {
        // Edit Mode
        const updatePayload = {
          userId: selectedUser.id,
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            role: formData.role,
            ...(formData.password ? { password: formData.password } : {})
          }
        };
        await updateUser.mutateAsync(updatePayload);
        toast.success('User updated successfully');
      } else {
        // Create Mode
        await createUser.mutateAsync(formData);
        toast.success('User created successfully');
      }
      handleCloseModal();
      refetch();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(selectedUser ? 'Failed to update user' : 'Failed to create user');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      await deleteUser.mutateAsync(id);
      toast.success('User deleted successfully');
      refetch();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        <UserHeader
          totalUsers={stats.total}
          rolesCount={stats.rolesCount}
          adminsCount={stats.admins}
        />

        <UserActionBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddClick={handleAddClick}
        />

        <UserTable
          users={filteredUsers}
          isLoading={isLoading}
          searchTerm={searchTerm}
          onEdit={handleEditClick}
          onDelete={handleDelete}
          onAddClick={handleAddClick}
        />

        <UserModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          user={selectedUser}
          roles={roles}
          isLoading={createUser.isPending || updateUser.isPending}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}