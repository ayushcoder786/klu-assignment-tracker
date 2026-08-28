import { differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays, isPast, parseISO } from 'date-fns';

interface CountdownChipProps {
  dueDate?: string | null;
  status: string;
}

export function CountdownChip({ dueDate, status }: CountdownChipProps) {
  const normalized = (status || '').toLowerCase();

  if (normalized === 'submitted' || normalized === 'graded') {
    return (
      <span className="inline-flex items-center text-xs font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
        Completed
      </span>
    );
  }

  if (!dueDate) {
    return (
      <span className="inline-flex items-center text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full">
        No deadline
      </span>
    );
  }

  const due = typeof dueDate === 'string' ? parseISO(dueDate) : new Date(dueDate);
  const now = new Date();

  if (isPast(due) || normalized === 'overdue') {
    const days = Math.abs(differenceInDays(now, due));
    const label = days === 0 ? 'Due today' : `${days}d overdue`;
    return (
      <span className="inline-flex items-center text-xs font-semibold text-red-300 bg-red-950/70 border border-red-500/40 px-2.5 py-0.5 rounded-full">
        {label}
      </span>
    );
  }

  const totalSeconds = differenceInSeconds(due, now);
  const days = differenceInDays(due, now);
  const hours = differenceInHours(due, now) % 24;
  const mins = differenceInMinutes(due, now) % 60;

  let label = '';
  let colorClass = '';

  if (totalSeconds < 3600) {
    label = `${mins}m left`;
    colorClass = 'text-red-300 bg-red-950/80 border-red-500/50 font-bold animate-pulse';
  } else if (totalSeconds < 86400) {
    label = `${hours}h ${mins}m left`;
    colorClass = 'text-amber-300 bg-amber-950/70 border-amber-500/40 font-semibold';
  } else if (days <= 3) {
    label = `${days}d ${hours}h left`;
    colorClass = 'text-amber-300 bg-amber-950/70 border-amber-500/40 font-semibold';
  } else {
    label = `${days}d left`;
    colorClass = 'text-emerald-300 bg-emerald-950/70 border-emerald-500/40 font-semibold';
  }

  return (
    <span className={`inline-flex items-center text-xs ${colorClass} border px-2.5 py-0.5 rounded-full`}>
      {label}
    </span>
  );
}
