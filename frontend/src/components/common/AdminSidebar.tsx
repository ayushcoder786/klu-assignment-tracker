import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiHome, FiUsers, FiRefreshCw, FiFileText, FiLogOut, FiShield, FiSettings,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

// Bottom nav (mobile)
const bottomNavItems = [
  { to: '/admin/dashboard',   icon: FiHome,       label: 'Dashboard' },
  { to: '/admin/students',    icon: FiUsers,      label: 'Students' },
  { to: '/admin/sync-status', icon: FiRefreshCw,  label: 'Sync' },
  { to: '/admin/sync-logs',   icon: FiSettings,   label: 'Logs' },
];

// Sidebar (desktop)
const sidebarNavItems = [
  { to: '/admin/dashboard',   icon: FiHome,       label: 'Dashboard' },
  { to: '/admin/students',    icon: FiUsers,      label: 'Students' },
  { to: '/admin/sync-status', icon: FiRefreshCw,  label: 'Sync Status' },
  { to: '/admin/sync-logs',   icon: FiFileText,   label: 'Sync Logs' },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const { authState, logout } = useAuth();
  const navigate = useNavigate();
  const admin = authState.user as { name: string; role: string } | null;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      {/* ─── Mobile Bottom Navigation ─────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 lg:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {bottomNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 min-w-[56px] py-1 rounded-xl transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ─── Desktop Sidebar ──────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside className={`
        fixed top-0 left-0 h-full w-64 z-40 flex flex-col
        bg-white border-r border-gray-100
        transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center shadow-sm">
            <FiShield size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">KLU Admin</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Control Panel</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {sidebarNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {admin && (
          <div className="px-3 py-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 mb-1">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700">
                {admin.name?.[0] ?? 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{admin.name}</p>
                <p className="text-[10px] text-gray-400 truncate capitalize">{admin.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-150"
            >
              <FiLogOut size={17} />
              Logout
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
