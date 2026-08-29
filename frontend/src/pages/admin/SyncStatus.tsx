import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { FiRefreshCw, FiCheckCircle, FiAlertTriangle, FiClock, FiUsers, FiZap } from 'react-icons/fi';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { adminService } from '../../services/adminService';
import { formatStudentDisplay } from '../../utils/userUtils';
import type { GlobalSyncStatus, SyncLog } from '../../types/sync';

export default function SyncStatus() {
  const [globalStatus, setGlobalStatus] = useState<GlobalSyncStatus | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [gs, l] = await Promise.all([
        adminService.getGlobalSyncStatus(),
        adminService.getSyncLogs(),
      ]);
      setGlobalStatus(gs);
      setLogs(l);
      setLoading(false);
    })();
  }, []);

  const handleGlobalSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await adminService.triggerGlobalSync();
      setSyncMsg(res.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  const success = logs.filter(l => l.status === 'success').length;
  const failed = logs.filter(l => l.status === 'failed').length;
  const running = logs.filter(l => l.status === 'running').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sync Status</h2>
          <p className="text-slate-600 dark:text-slate-500 text-sm mt-1">LMS synchronization monitoring</p>
        </div>
        <Button
          icon={<FiZap size={16} />}
          loading={syncing}
          onClick={handleGlobalSync}
          className="!from-cyan-600 !to-slate-700"
        >
          {syncing ? 'Syncing All…' : 'Sync All Students'}
        </Button>
      </div>

      {syncMsg && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-sm">
          <FiCheckCircle size={17} /> {syncMsg}
        </div>
      )}

      {/* Global status cards */}
      {globalStatus && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="!p-4">
            <FiUsers size={18} className="text-cyan-600 dark:text-cyan-400 mb-3" />
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Synced Today</p>
            <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">{globalStatus.totalStudentsSynced}</p>
          </Card>
          <Card className="!p-4">
            <FiCheckCircle size={18} className="text-emerald-600 dark:text-emerald-400 mb-3" />
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Successful</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{success}</p>
          </Card>
          <Card className="!p-4">
            <FiAlertTriangle size={18} className="text-red-600 dark:text-red-400 mb-3" />
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Failed</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{globalStatus.failedSyncs}</p>
          </Card>
          <Card className="!p-4">
            <FiClock size={18} className="text-violet-600 dark:text-violet-400 mb-3" />
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Next Scheduled</p>
            <p className="text-sm font-bold text-violet-600 dark:text-violet-400 mt-1">
              {globalStatus.nextScheduledSync
                ? format(new Date(globalStatus.nextScheduledSync), 'MMM d, h:mm a')
                : 'Not set'}
            </p>
          </Card>
        </div>
      )}

      {/* Per-student status */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-xl overflow-hidden transition-colors duration-200">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <FiRefreshCw size={16} className="text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Per-Student Sync Status</h3>
          {running > 0 && <Badge status="running" />}
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {logs.map(log => {
            const { name, studentId } = formatStudentDisplay(log.studentName, log.studentId);
            return (
              <div key={log.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{name}</p>
                    <code className="text-[10px] text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 px-1.5 py-0.5 rounded font-bold border border-cyan-200 dark:border-transparent">{studentId}</code>
                  </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {format(new Date(log.triggeredAt), 'MMM d, yyyy h:mm a')}
                  {log.completedAt && ` → ${format(new Date(log.completedAt), 'h:mm:ss a')}`}
                </p>
                {log.errorMessage && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{log.errorMessage}</p>
                )}
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {log.status === 'success' && (
                  <div className="text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Fetched</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{log.assignmentsFetched}</p>
                  </div>
                )}
                <Badge status={log.status} />
                <span className="text-xs capitalize text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full hidden sm:inline">
                  {log.triggeredBy}
                </span>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
