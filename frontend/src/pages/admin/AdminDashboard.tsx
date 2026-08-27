import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FiUsers, FiUserCheck, FiAlertTriangle, FiBookOpen, FiRefreshCw, FiArrowRight, FiClock } from 'react-icons/fi';
import { StatCard } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { adminService } from '../../services/adminService';
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
        <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
        <p className="text-slate-500 text-sm mt-1">
          Overview of KLU Assignment Tracker system
          {stats?.lastSync && ` · Last sync ${format(new Date(stats.lastSync), 'MMM d, h:mm a')}`}
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Students" value={stats.totalStudents}
            icon={<FiUsers size={20} />}
            color="text-cyan-400" bgColor="bg-cyan-500/10"
          />
          <StatCard
            title="Active Students" value={stats.activeStudents}
            icon={<FiUserCheck size={20} />}
            color="text-emerald-400" bgColor="bg-emerald-500/10"
          />
          <StatCard
            title="Failed Syncs" value={stats.failedSyncs}
            icon={<FiAlertTriangle size={20} />}
            color="text-red-400" bgColor="bg-red-500/10"
          />
          <StatCard
            title="Assignments" value={stats.totalAssignments}
            icon={<FiBookOpen size={20} />}
            color="text-violet-400" bgColor="bg-violet-500/10"
          />
          <StatCard
            title="Last Sync"
            value={stats.lastSync ? format(new Date(stats.lastSync), 'h:mm a') : 'Never'}
            icon={<FiRefreshCw size={20} />}
            color="text-amber-400" bgColor="bg-amber-500/10"
            description={stats.lastSync ? format(new Date(stats.lastSync), 'MMM d') : undefined}
          />
        </div>
      )}

      {/* Recent sync activity */}
      <div className="rounded-2xl border border-white/10 bg-white/4 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <FiClock size={16} className="text-cyan-400" /> Recent Sync Activity
          </h3>
          <Link to="/admin/sync-logs" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
            View all <FiArrowRight size={13} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Student</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Triggered</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Fetched</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentLogs.map(log => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-3.5">
                    <p className="text-sm font-medium text-white">{log.studentName}</p>
                    <p className="text-xs text-slate-500">{log.studentId}</p>
                  </td>
                  <td className="px-6 py-3.5 hidden sm:table-cell text-xs text-slate-400">
                    {format(new Date(log.triggeredAt), 'MMM d, h:mm a')}
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge status={log.status} />
                    {log.errorMessage && (
                      <p className="text-xs text-red-400 mt-1 line-clamp-1">{log.errorMessage}</p>
                    )}
                  </td>
                  <td className="px-6 py-3.5 hidden md:table-cell text-xs text-slate-400">
                    {log.status === 'failed' ? '—' : `${log.assignmentsFetched} fetched · ${log.assignmentsUpdated} updated`}
                  </td>
                  <td className="px-6 py-3.5 hidden lg:table-cell">
                    <span className="text-xs capitalize text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{log.triggeredBy}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
