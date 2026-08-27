import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiHome, FiUsers, FiRefreshCw, FiFileText, FiLogOut, FiShield, FiBookOpen,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { getCleanStudentName } from '../../utils/userUtils';

// Bottom nav (mobile)
const bottomNavItems = [
  { to: '/dashboard',         icon: FiBookOpen,   label: 'Student' },
  { to: '/admin/dashboard',   icon: FiHome,       label: 'Dashboard' },
  { to: '/admin/students',    icon: FiUsers,      label: 'Students' },
  { to: '/admin/sync-status', icon: FiRefreshCw,  label: 'Sync' },
  { to: '/admin/sync-logs',   icon: FiFileText,   label: 'Logs' },
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
  const user = authState.user as { name?: string; studentId?: string; role?: string } | null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = getCleanStudentName(user?.name || 'Super Admin');

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
                  isActive ? 'text-indigo-600 font-semibold' : 'text-gray-400 hover:text-gray-600'
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
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center shadow-sm">
              <FiShield size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none">KLU Admin</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Control Panel</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            SUPER
          </span>
        </div>

        {/* Back to Student View Button */}
        <div className="px-3 pt-3">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors border border-violet-100"
          >
            <FiBookOpen size={16} />
            <span>← Switch to Student View</span>
          </NavLink>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 pt-1 pb-1.5 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
            Admin Management
          </p>
          {sidebarNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
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

        {user && (
          <div className="px-3 py-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-sm font-bold text-white shadow-sm shrink-0">
                {displayName[0]?.toUpperCase() || 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-900 truncate">{displayName}</p>
                <p className="text-[10px] text-gray-500 font-mono truncate">
                  {user.studentId || '2500032102'} · Super Admin
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-all duration-150"
            >
              <FiLogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
