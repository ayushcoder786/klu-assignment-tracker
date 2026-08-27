import type { AssignmentStatus } from '../../types/assignment';
import type { AccountStatus } from '../../types/user';
import type { SyncStatusType } from '../../types/sync';

type BadgeVariant = AssignmentStatus | AccountStatus | SyncStatusType | string;

const badgeStyles: Record<string, string> = {
  // Assignment statuses
  pending:   'bg-amber-500/10 text-amber-300 border-amber-500/20',
  submitted: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  overdue:   'bg-red-500/10 text-red-300 border-red-500/20',
  upcoming:  'bg-violet-500/10 text-violet-300 border-violet-500/20',
  graded:    'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  draft:     'bg-slate-500/10 text-slate-400 border-slate-500/20',
  // Account statuses
  active:    'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  inactive:  'bg-slate-500/10 text-slate-400 border-slate-500/20',
  suspended: 'bg-red-500/10 text-red-300 border-red-500/20',
  // Sync statuses
  success:   'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  failed:    'bg-red-500/10 text-red-300 border-red-500/20',
  running:   'bg-blue-500/10 text-blue-300 border-blue-500/20',
  skipped:   'bg-amber-500/10 text-amber-300 border-amber-500/20',
  partial:   'bg-amber-500/10 text-amber-300 border-amber-500/20',
};

const badgeDots: Record<string, string> = {
  pending: 'bg-amber-400',
  submitted: 'bg-blue-400',
  overdue: 'bg-red-400',
  upcoming: 'bg-violet-400',
  graded: 'bg-emerald-400',
  draft: 'bg-slate-400',
  active: 'bg-emerald-400',
  inactive: 'bg-slate-400',
  suspended: 'bg-red-400',
  success: 'bg-emerald-400',
  failed: 'bg-red-400',
  running: 'bg-blue-400',
  skipped: 'bg-amber-400',
  partial: 'bg-amber-400',
};

interface BadgeProps {
  status: BadgeVariant;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export function Badge({ status, showDot = true, size = 'sm' }: BadgeProps) {
  const normalized = (status || 'pending').toLowerCase();
  const styles = badgeStyles[normalized] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  const dot = badgeDots[normalized] ?? 'bg-slate-400';
  const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);

  return (
    <span className={`
      inline-flex items-center gap-1.5 font-medium border rounded-full
      ${styles}
      ${size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1'}
    `}>
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dot} ${normalized === 'running' ? 'animate-pulse' : ''}`} />
      )}
      {label}
    </span>
  );
}
