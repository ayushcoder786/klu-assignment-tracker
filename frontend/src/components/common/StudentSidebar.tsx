import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiHome, FiList, FiUser, FiSettings, FiLogOut, FiBookOpen,
  FiShield, FiUsers, FiRefreshCw, FiFileText,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { getCleanStudentName } from '../../utils/userUtils';

// Bottom nav items for mobile PWA
const bottomNavItems = [
  { to: '/dashboard',   icon: FiHome,     label: 'Dashboard' },
  { to: '/assignments', icon: FiList,     label: 'Assignments' },
  { to: '/profile',     icon: FiUser,     label: 'Profile' },
  { to: '/settings',    icon: FiSettings, label: 'Settings' },
];

// Sidebar nav items for desktop
const sidebarNavItems = [
  { to: '/dashboard',   icon: FiHome,     label: 'Dashboard' },
  { to: '/assignments', icon: FiList,     label: 'Assignments' },
  { to: '/profile',     icon: FiUser,     label: 'Profile' },
  { to: '/settings',    icon: FiSettings, label: 'Settings' },
];

const adminNavItems = [
  { to: '/admin/dashboard',   icon: FiShield,    label: 'Admin Overview' },
  { to: '/admin/students',    icon: FiUsers,     label: 'All Students' },
  { to: '/admin/sync-status', icon: FiRefreshCw, label: 'Sync Status' },
  { to: '/admin/sync-logs',   icon: FiFileText,  label: 'Sync Logs' },
];

interface StudentSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function StudentSidebar({ open, onClose }: StudentSidebarProps) {
  const { authState, logout } = useAuth();
  const navigate = useNavigate();
  const student = authState.user as { name?: string; studentId?: string; role?: string } | null;
  const isSuperAdmin = authState.role === 'admin' || student?.studentId === '2500032102';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* ─── Mobile Bottom Navigation Bar (PWA Style) ──────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#090d1a] border-t border-slate-800 lg:hidden shadow-2xl">
        <div className="flex items-center justify-around h-16 px-2 safe-area-bottom">
          {bottomNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={label}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 min-w-[60px] py-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-violet-300 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-200 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-lg ${isActive ? 'bg-violet-950/80 text-violet-300 border border-violet-500/30' : ''}`}>
                    <Icon size={20} />
                  </div>
                  <span className="text-[10px] tracking-tight">{label}</span>
                </>
              )}
            </NavLink>
          ))}
          {isSuperAdmin && (
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 min-w-[60px] py-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-amber-300 font-bold scale-105'
                    : 'text-slate-400 hover:text-amber-200 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-lg ${isActive ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30' : ''}`}>
                    <FiShield size={20} />
                  </div>
                  <span className="text-[10px] tracking-tight">Admin</span>
                </>
              )}
            </NavLink>
          )}
        </div>
      </nav>

      {/* ─── Desktop Sidebar & Mobile Drawer ───────────────────────── */}
      {/* Backdrop for mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 z-50 flex flex-col
        bg-[#090d1a] border-r border-slate-800 shadow-2xl
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-950/60">
            <FiBookOpen size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-white leading-none">KLU Tracker</p>
            <p className="text-xs text-slate-300 font-medium mt-1">Assignment Portal</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3.5 pt-1 pb-1.5 text-xs font-bold tracking-wider text-slate-400 uppercase">
            Student Menu
          </p>
          {sidebarNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-violet-600/25 text-violet-200 border border-violet-500/40 shadow-md shadow-violet-950/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-violet-300' : 'text-slate-400'} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Super Admin Section */}
          {isSuperAdmin && (
            <div className="pt-5 mt-2 border-t border-slate-800">
              <div className="flex items-center justify-between px-3.5 pb-2">
                <span className="text-xs font-bold tracking-wider text-amber-400 uppercase">
                  Super Admin
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-950/80 text-amber-300 border border-amber-500/40">
                  2500032102
                </span>
              </div>
              {adminNavItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/admin/dashboard'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-md shadow-amber-950/40'
                        : 'text-slate-300 hover:text-amber-200 hover:bg-amber-950/30 border border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={18} className={isActive ? 'text-amber-400' : 'text-slate-400'} />
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        {/* User profile & logout */}
        {student && (() => {
          const displayName = getCleanStudentName(student.name);

          return (
            <div className="p-3 border-t border-slate-800 bg-[#070b14]">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-sm font-black text-white shadow-md shrink-0">
                  {displayName[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {displayName}
                  </p>
                  {student.studentId && (
                    <p className="text-xs text-indigo-300 font-mono font-semibold truncate leading-normal mt-0.5">
                      {student.studentId}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-all duration-150 cursor-pointer"
              >
                <FiLogOut size={15} />
                <span>Log out</span>
              </button>
            </div>
          );
        })()}
      </aside>
    </>
  );
}
