import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiHome, FiList, FiUser, FiSettings, FiLogOut, FiBookOpen,
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

interface StudentSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function StudentSidebar({ open, onClose }: StudentSidebarProps) {
  const { authState, logout } = useAuth();
  const navigate = useNavigate();
  const student = authState.user as { name?: string; studentId?: string } | null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* ─── Mobile Bottom Navigation Bar (PWA Style) ──────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 lg:hidden">
        <div className="flex items-center justify-around h-16 px-2 safe-area-bottom">
          {bottomNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={label}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 min-w-[64px] py-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-violet-400 font-semibold scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-lg ${isActive ? 'bg-violet-500/20 text-violet-300' : ''}`}>
                    <Icon size={20} />
                  </div>
                  <span className="text-[10px] tracking-tight">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ─── Desktop Sidebar & Mobile Drawer ───────────────────────── */}
      {/* Backdrop for mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 z-50 flex flex-col
        bg-slate-950/95 backdrop-blur-2xl border-r border-white/10
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <FiBookOpen size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">KLU Tracker</p>
            <p className="text-[10px] text-slate-400 mt-1">Assignment Portal</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sidebarNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/30 to-indigo-600/30 text-white border border-violet-500/30 shadow-lg shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-violet-400' : 'text-slate-400'} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User profile & logout */}
        {student && (() => {
          const displayName = getCleanStudentName(student.name);

          return (
            <div className="p-3 border-t border-white/10">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-md shrink-0">
                  {displayName[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate leading-tight">
                    {displayName}
                  </p>
                  {student.studentId && (
                    <p className="text-[10px] text-slate-400 font-mono truncate leading-normal mt-0.5">
                      {student.studentId}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150"
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
