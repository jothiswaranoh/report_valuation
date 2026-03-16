import React, { ReactNode, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  FolderTree,
  Landmark,
  Users,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Bell
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../common/Modal';
import Button from '../common/Button';

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { path: '/upload', label: 'Upload & Process', icon: <Upload size={20} /> },
  { path: '/files', label: 'File Management', icon: <FolderTree size={20} /> },
  { path: '/banks', label: 'Bank Management', icon: <Landmark size={20} /> },
  { path: '/users', label: 'Users', icon: <Users size={20} /> },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, loginLoading, isAuthenticated, isLoadingUser } = useAuth();

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.some(role => user?.roles?.includes(role));
  });

  useEffect(() => {
    if (!isLoadingUser && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoadingUser, isAuthenticated, navigate]);

  const initials = user?.first_name ? user.first_name[0].toUpperCase() : 'U';

  const performLogout = async () => {
    await logout();
    navigate('/login');
    setLogoutModalOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-sky-100 relative overflow-hidden z-0">
      {/* Global Static Background Elements */}
      <div className="fixed inset-0 pointer-events-none bg-dot-pattern bg-dot-md z-0 opacity-20" />

      {/* Top Header Bar */}
      <header className={`
        h-16 flex items-center justify-between px-6 transition-all duration-300 z-30 shrink-0
        bg-white
        border-b border-sky-100
        shadow-sm
      `}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg bg-sky-50 shadow-sm border border-sky-100"
          >
            <Menu size={20} className="text-sky-600" />
          </button>
          {/* Logo Section in Header */}
          <div className="flex items-center gap-3 overflow-hidden ml-2">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-sky-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-white font-black text-lg">V</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-800 leading-none">Valuation <span className="text-sky-500">System AI</span></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">

          <button className="p-2 text-slate-400 hover:text-sky-500 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sky-400 rounded-full border-2 border-white" />
          </button>
          <div className="h-4 w-[1px] bg-sky-100 mx-1" />
          <div className="flex items-center gap-2 pl-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {initials}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area (Sidebar + Content) */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative z-10 w-full">
        {/* Sidebar */}
        <aside
          className={`
            flex flex-col h-[calc(100vh-4rem)] z-40 transition-all duration-300 ease-in-out
            border-r border-sky-100
            bg-white
            shadow-sm
            fixed lg:static
            shrink-0
            ${sidebarOpen ? 'w-64' : 'w-20'}
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden custom-scrollbar mt-2">
            <div className={`px-3 mb-3 ${!sidebarOpen ? 'hidden' : ''}`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Menu</span>
            </div>
            {filteredNavItems.map((item) => {
              const isActive =
                (item.path === '/' && (
                  location.pathname === '/' ||
                  location.pathname.startsWith('/list') ||
                  location.pathname.startsWith('/reports')
                )) ||
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group relative
                    ${isActive
                      ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200/50 scale-[1.02]'
                      : 'text-slate-500 hover:bg-brand-50 hover:text-brand-600'
                    }
                    ${!sidebarOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <div className={`flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {React.cloneElement(item.icon as React.ReactElement, {
                      size: 20,
                      strokeWidth: isActive ? 2.5 : 2
                    })}
                  </div>
                  {sidebarOpen && <span className="text-sm font-semibold truncate">{item.label}</span>}
                  {isActive && sidebarOpen && (
                    <div className="absolute right-2 w-1.5 h-1.5 bg-white/70 rounded-full" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Footer Sidebar */}
          <div className="p-4 border-t border-sky-100 bg-sky-100/50 rounded-none">
            <div className={`flex items-center gap-3 ${!sidebarOpen ? 'flex-col' : ''}`}>
              <div className="relative group cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center font-bold text-white transition-all group-hover:shadow-md">
                  {initials}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
              </div>

              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate tracking-tight">{user?.first_name} {user?.last_name}</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">{user?.email}</p>
                </div>
              )}

              {sidebarOpen && (
                <button
                  onClick={() => setLogoutModalOpen(true)}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors bg-white rounded-lg border border-slate-100 hover:bg-red-50 hover:border-red-100"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:flex hidden absolute -right-3 top-20 w-6 h-6 bg-white border border-sky-200 rounded-full items-center justify-center shadow-md text-sky-500 hover:text-sky-600 transition-all z-50 hover:scale-110"
          >
            {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </aside>

        {/* Content Wrapper */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto relative z-10 flex flex-col"
        >
          <div className="max-w-[1600px] w-full mx-auto animate-in fade-in duration-500 p-4 md:p-6 flex-1 flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Logout Modal */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Confirm Logout"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => setLogoutModalOpen(false)}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={performLogout}
              isLoading={loginLoading}
              className="px-6 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100"
            >
              Logout
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
            <LogOut size={32} />
          </div>
          <p className="text-slate-600 font-medium">
            Are you sure you want to log out of your session?
          </p>
        </div>
      </Modal>


    </div>
  );
}
