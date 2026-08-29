import React from 'react';
import { FiMenu, FiRefreshCw } from 'react-icons/fi';
import { formatLocalTime } from '../../utils/dateUtils';
import { PWAInstallButton } from './PWAInstallButton';
import { ThemeToggle } from './ThemeToggle';

interface TopbarProps {
  title: string;
  subtitle?: React.ReactNode;
  onMenuClick: () => void;
  lastSync?: string | null;
  onSync?: () => void;
  syncing?: boolean;
  actions?: React.ReactNode;
  accentColor?: string;
}

export function Topbar({
  title,
  subtitle,
  onMenuClick,
  lastSync,
  onSync,
  syncing = false,
  actions,
}: TopbarProps) {
  const syncTimeStr = lastSync ? formatLocalTime(lastSync, '') : '';
  const formattedSyncTime = syncTimeStr && syncTimeStr !== 'Never' ? syncTimeStr : null;

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#090d1a] backdrop-blur-sm transition-colors duration-200">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 lg:hidden transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <FiMenu size={20} />
        </button>

        <div className="min-w-0">
          <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">KLU Assignment Tracker</p>
          <h1 className="text-base font-extrabold text-slate-900 dark:text-white truncate leading-tight">{title}</h1>
          {subtitle && (
            typeof subtitle === 'string' ? (
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">{subtitle}</p>
            ) : (
              <div className="mt-0.5">{subtitle}</div>
            )
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <PWAInstallButton />
        <ThemeToggle />

        {formattedSyncTime && (
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span>Synced {formattedSyncTime}</span>
          </div>
        )}

        {onSync && (
          <button
            onClick={onSync}
            disabled={syncing}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-950/20 disabled:opacity-50 transition-all cursor-pointer"
            title="Sync live assignments from KLU LMS"
          >
            <FiRefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            <span className="hidden xs:inline">{syncing ? 'Syncing...' : 'Sync LMS'}</span>
          </button>
        )}

        {actions}
      </div>
    </header>
  );
}


