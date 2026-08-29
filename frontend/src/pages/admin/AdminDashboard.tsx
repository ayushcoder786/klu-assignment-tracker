import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiUserCheck, FiAlertTriangle, FiBookOpen, FiRefreshCw, FiArrowRight, FiClock } from 'react-icons/fi';
import { StatCard } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { adminService } from '../../services/adminService';
import { formatLocalDateTime, formatLocalTime } from '../../utils/dateUtils';
import { formatStudentDisplay } from '../../utils/userUtils';
import type { SyncLog } from '../../types/sync';

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    totalStudents: number; activeStudents: number;
    failedSyncs: number; totalAssignments: number; lastSync: string | null;
  } | null>(null);
  const [recentLogs, setRecentLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, logs] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getSyncLogs(),
      ]);
      setStats(s);
      setRecentLogs(logs.slice(0, 6));
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          Overview of KLU Assignment Tracker system
          {stats?.lastSync && ` · Last sync ${formatLocalDateTime(stats.lastSync, 'MMM d, h:mm a')}`}
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Students" value={stats.totalStudents}
            icon={<FiUsers size={20} />}
            color="text-cyan-700 dark:text-cyan-400" bgColor="bg-cyan-50 dark:bg-cyan-500/10"
          />
          <StatCard
            title="Active Students" value={stats.activeStudents}
            icon={<FiUserCheck size={20} />}
            color="text-emerald-700 dark:text-emerald-400" bgColor="bg-emerald-50 dark:bg-emerald-500/10"
          />
          <StatCard
            title="Failed Syncs" value={stats.failedSyncs}
            icon={<FiAlertTriangle size={20} />}
            color="text-red-700 dark:text-red-400" bgColor="bg-red-50 dark:bg-red-500/10"
          />
          <StatCard
            title="Assignments" value={stats.totalAssignments}
            icon={<FiBookOpen size={20} />}
            color="text-violet-700 dark:text-violet-400" bgColor="bg-violet-50 dark:bg-violet-500/10"
          />
          <StatCard
            title="Last Sync"
            value={stats.lastSync ? formatLocalTime(stats.lastSync) : 'Never'}
            icon={<FiRefreshCw size={20} />}
            color="text-amber-700 dark:text-amber-400" bgColor="bg-amber-50 dark:bg-amber-500/10"
            description={stats.lastSync ? formatLocalDateTime(stats.lastSync, 'MMM d') : undefined}
          />
        </div>
      )}

      {/* Recent sync activity */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-xl overflow-hidden transition-colors duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <FiClock size={16} className="text-cyan-600 dark:text-cyan-400" /> Recent Sync Activity
          </h3>
          <Link to="/admin/sync-logs" className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-1 transition-colors font-bold">
            View all <FiArrowRight size={13} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Student</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Triggered</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Fetched</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {recentLogs.map(log => {
                const { name, studentId } = formatStudentDisplay(log.studentName, log.studentId);
                return (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                    <td className="px-6 py-3.5">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{studentId}</p>
                    </td>
                  <td className="px-6 py-3.5 hidden sm:table-cell text-xs text-slate-600 dark:text-slate-400">
                    {formatLocalDateTime(log.triggeredAt, 'MMM d, h:mm a')}
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge status={log.status} />
                    {log.errorMessage && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 line-clamp-1">{log.errorMessage}</p>
                    )}
                  </td>
                  <td className="px-6 py-3.5 hidden md:table-cell text-xs text-slate-600 dark:text-slate-400">
                    {log.status === 'failed' ? '—' : `${log.assignmentsFetched} fetched · ${log.assignmentsUpdated} updated`}
                  </td>
                  <td className="px-6 py-3.5 hidden lg:table-cell">
                    <span className="text-xs capitalize text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{log.triggeredBy}</span>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
