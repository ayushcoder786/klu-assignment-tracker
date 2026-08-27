import React from 'react';
import { FiMenu, FiRefreshCw } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';

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
  const formattedSyncTime = lastSync
    ? (() => {
        try {
          const date = typeof lastSync === 'string' ? parseISO(lastSync) : new Date(lastSync);
          return format(date, 'h:mm a');
        } catch {
          return null;
        }
      })()
    : null;

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 lg:hidden transition-colors"
          aria-label="Open navigation menu"
        >
          <FiMenu size={20} />
        </button>

        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">KLU Assignment Tracker</p>
          <h1 className="text-base font-bold text-white truncate leading-tight">{title}</h1>
          {subtitle && (
            typeof subtitle === 'string' ? (
              <p className="text-xs text-slate-400 truncate mt-0.5">{subtitle}</p>
            ) : (
              <div className="mt-0.5">{subtitle}</div>
            )
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {formattedSyncTime && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Synced {formattedSyncTime}</span>
          </div>
        )}

        {onSync && (
          <button
            onClick={onSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
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
