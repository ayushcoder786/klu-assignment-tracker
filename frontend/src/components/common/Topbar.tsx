import React from 'react';
import { FiMenu, FiRefreshCw } from 'react-icons/fi';
import { formatLocalTime } from '../../utils/dateUtils';

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
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-[#090d1a]">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 lg:hidden transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <FiMenu size={20} />
        </button>

        <div className="min-w-0">
          <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">KLU Assignment Tracker</p>
          <h1 className="text-base font-extrabold text-white truncate leading-tight">{title}</h1>
          {subtitle && (
            typeof subtitle === 'string' ? (
              <p className="text-xs text-slate-300 font-medium truncate mt-0.5">{subtitle}</p>
            ) : (
              <div className="mt-0.5">{subtitle}</div>
            )
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {formattedSyncTime && (
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            <span>Synced {formattedSyncTime}</span>
          </div>
        )}

        {onSync && (
          <button
            onClick={onSync}
            disabled={syncing}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-950/50 disabled:opacity-50 transition-all cursor-pointer"
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
