import { ReactNode, useState } from 'react';
import {
  LayoutDashboard,
  Upload,
  FolderTree,
  FileEdit,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'upload', label: 'Upload & Process', icon: <Upload size={20} /> },
  { id: 'files', label: 'File Management', icon: <FolderTree size={20} /> },
  { id: 'editor', label: 'Report Editor', icon: <FileEdit size={20} /> },
  { id: 'review', label: 'Review & Approval', icon: <CheckCircle size={20} /> },
  { id: 'users', label: 'Users', icon: <CheckCircle size={20} /> },

];

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex h-screen bg-secondary-50">
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md border border-gray-200"
      >
        <Menu size={20} />
      </button>

      {/* Sidebar for Desktop & Mobile */}
      <aside className={`
        ${sidebarOpen ? 'w-72' : 'w-20'} 
        bg-secondary-900 border-r border-secondary-800 flex flex-col
        fixed lg:static h-full z-40 transition-all duration-300 shadow-xl
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header with Toggle Button */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-secondary-800">
          {sidebarOpen ? (
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white tracking-tight truncate">Valuation<span className="text-brand-400">System</span></h1>
              <p className="text-xs text-secondary-400 mt-0.5 truncate uppercase tracking-wider font-semibold">AI-Powered Reports</p>
            </div>
          ) : (
            <div className="mx-auto">
              <h1 className="text-xl font-bold text-white">VS</h1>
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md hover:bg-secondary-800 text-secondary-400 hover:text-white transition-colors ml-2"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? (
              <ChevronLeft size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setMobileMenuOpen(false); // Close mobile menu on navigation
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group
                ${currentPage === item.id
                  ? 'bg-brand-600 text-white shadow-soft font-semibold'
                  : 'text-secondary-400 hover:bg-secondary-800 hover:text-white'
                }
                ${!sidebarOpen ? 'justify-center' : ''}
              `}
              title={!sidebarOpen ? item.label : ''}
            >
              <div className="flex-shrink-0">
                {item.icon}
              </div>
              {sidebarOpen && (
                <span className="truncate">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className={`
          p-4 border-t border-secondary-800
          ${!sidebarOpen ? 'flex justify-center' : ''}
        `}>
          <div className={`flex items-center gap-3 ${!sidebarOpen ? 'flex-col' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-secondary-700 flex items-center justify-center text-white font-medium flex-shrink-0 shadow-sm border border-secondary-600">
              RK
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">Kannapan</p>
                <p className="text-xs text-secondary-400 truncate">Senior Valuator</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`
        flex-1 overflow-auto transition-all duration-300 bg-secondary-50
        ${sidebarOpen ? 'lg:ml-0' : 'lg:ml-20'}
      `}>
        {/* Desktop Toggle Button when sidebar is collapsed */}
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="hidden lg:block fixed top-6 left-6 z-30 p-2 rounded-full bg-white shadow-md border border-gray-200 hover:bg-gray-50"
            title="Expand sidebar"
          >
            <ChevronRight size={18} />
          </button>
        )}

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}