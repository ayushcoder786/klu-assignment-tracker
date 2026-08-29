import React, { useEffect, useState } from 'react';
import { FiSearch, FiFileText, FiAlertCircle } from 'react-icons/fi';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner, SkeletonRow } from '../../components/common/LoadingSpinner';
import { adminService } from '../../services/adminService';
import { formatLocalDateTime, formatLocalTime } from '../../utils/dateUtils';
import { formatStudentDisplay } from '../../utils/userUtils';
import type { SyncLog, SyncStatusType } from '../../types/sync';

type FilterStatus = 'all' | SyncStatusType;

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'success', label: 'Success' },
  { key: 'failed', label: 'Failed' },
  { key: 'running', label: 'Running' },
];

export default function SyncLogs() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    adminService.getSyncLogs().then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  const filtered = logs.filter(l => {
    const matchFilter = filter === 'all' || l.status === filter;
    const q = search.toLowerCase().trim();
    const { name, studentId } = formatStudentDisplay(l.studentName, l.studentId);
    const matchSearch = !q || name.toLowerCase().includes(q) || studentId.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const counts = FILTERS.reduce<Record<FilterStatus, number>>((acc, f) => {
    acc[f.key] = f.key === 'all' ? logs.length : logs.filter(l => l.status === f.key).length;
    return acc;
  }, {} as Record<FilterStatus, number>);

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FiFileText size={22} className="text-cyan-600 dark:text-cyan-400" /> Sync Logs
        </h2>
        <p className="text-slate-600 dark:text-slate-500 text-sm mt-1">All synchronization events across all students</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <FiSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by student name or ID…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 transition-all shadow-xs"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-none flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer
                ${filter === f.key
                  ? 'bg-gradient-to-r from-cyan-600 to-slate-700 text-white shadow-md border border-cyan-500/30'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                }`}
            >
              {f.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filter === f.key ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-xl overflow-hidden transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Student</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Triggered At</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Completed At</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Assignments</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider hidden xl:table-cell">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6">
                    <div className="space-y-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonRow key={i} cols={6} />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">
                    No sync logs found.
                  </td>
                </tr>
              ) : (
                filtered.map(log => {
                  const { name, studentId } = formatStudentDisplay(log.studentName, log.studentId);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{name}</p>
                        <code className="text-[10px] text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 px-1.5 py-0.5 rounded font-bold border border-cyan-200 dark:border-cyan-500/20">{studentId}</code>
                      </td>
                    <td className="px-6 py-4 hidden sm:table-cell text-xs text-slate-600 dark:text-slate-400">
                      {formatLocalDateTime(log.triggeredAt, 'MMM d, yyyy h:mm:ss a')}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-xs text-slate-600 dark:text-slate-400">
                      {log.completedAt
                        ? formatLocalTime(log.completedAt)
                        : <span className="text-slate-400 dark:text-slate-500 italic">In progress</span>
                      }
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={log.status} />
                      {log.errorMessage && (
                        <div className="flex items-start gap-1 mt-1">
                          <FiAlertCircle size={11} className="text-red-500 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-red-600 dark:text-red-400 line-clamp-2">{log.errorMessage}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {log.status === 'failed' ? (
                        <span className="text-xs text-slate-400 dark:text-slate-600">—</span>
                      ) : (
                        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                          <p><span className="text-slate-900 dark:text-white font-semibold">{log.assignmentsFetched}</span> fetched</p>
                          <p><span className="text-emerald-700 dark:text-emerald-400 font-semibold">{log.assignmentsUpdated}</span> updated</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden xl:table-cell">
                      <span className="text-xs capitalize text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{log.triggeredBy}</span>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
