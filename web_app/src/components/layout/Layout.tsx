import React, { ReactNode, useState, useEffect, useRef } from 'react';
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
  History,
  X
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
  { path: '/history', label: 'Report History', icon: <History size={20} /> },
  { path: '/users', label: 'Users', icon: <Users size={20} />, roles: ['admin'] },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const initials = user?.first_name ? user.first_name[0].toUpperCase() : 'U';
  const primaryRole = user?.roles?.[0] ? user.roles[0] : 'user';

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

          
          <div className="h-4 w-[1px] bg-sky-100 mx-1" />
          <div className="relative flex items-center gap-2 pl-2" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-sm hover:shadow-md transition-all"
              aria-label="Open profile menu"
            >
              {initials}
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 top-12 w-72 bg-white border border-sky-100 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 bg-sky-50/70 border-b border-sky-100">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                  <span className="inline-flex mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                    {primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1)}
                  </span>
                </div>

                <div className="p-2">
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setLogoutModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
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
        size="sm"
        showCloseButton={false}
      >
        <div className="relative pt-6 pb-2 px-2 text-center">
          
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">Are you sure?</h2>
          <p className="text-slate-500 font-medium mb-8 px-2 leading-relaxed">
            Are you sure you want to log out of your session? You will need to sign in again.
          </p>
          
          <div className="flex items-center gap-4 w-full">
            <button
              onClick={() => setLogoutModalOpen(false)}
              className="flex-1 py-3 text-[15px] font-bold border-2 border-slate-700 text-slate-800 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={performLogout}
              disabled={loginLoading}
              className="flex-1 py-3 text-[15px] font-bold bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              {loginLoading ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </Modal>


    </div>
  );
}
