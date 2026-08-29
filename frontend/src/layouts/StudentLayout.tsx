import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { FiRefreshCw, FiX } from 'react-icons/fi';
import { StudentSidebar } from '../components/common/StudentSidebar';
import { Topbar } from '../components/common/Topbar';
import { useAuth } from '../context/AuthContext';
import { SyncProvider, useSync } from '../context/SyncContext';
import type { Student } from '../types/user';
import { getCleanStudentName } from '../utils/userUtils';

function StudentLayoutContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { authState } = useAuth();
  const { syncing, triggerSync, lastSyncMessage, lastSyncError, clearSyncMessage, clearSyncError } = useSync();
  const student = authState.user as Student | null;
  const displayName = getCleanStudentName(student?.name);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#070b14] overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <StudentSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-[#070b14]">
        <Topbar
          title="Student Dashboard"
          subtitle={
            student ? (
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{displayName}</span>
                {student.studentId && (
                  <span className="text-xs text-indigo-600 dark:text-indigo-300 font-mono leading-normal mt-0.5">{student.studentId}</span>
                )}
              </div>
            ) : undefined
          }
          onMenuClick={() => setSidebarOpen(true)}
          lastSync={student?.lastSync ?? null}
          onSync={triggerSync}
          syncing={syncing}
        />

        {/* Sync notification banners */}
        {syncing && (
          <div className="mx-4 sm:mx-6 mt-3 px-4 py-2.5 rounded-xl bg-violet-50 border border-violet-300 text-violet-800 dark:bg-violet-950/70 dark:border-violet-500/40 dark:text-violet-200 text-xs font-semibold flex items-center gap-2 shadow-sm dark:shadow-lg animate-pulse">
            <FiRefreshCw className="animate-spin shrink-0 text-violet-600 dark:text-violet-400" size={14} />
            <span>Syncing with KLU LMS...</span>
          </div>
        )}
        {!syncing && lastSyncMessage && (
          <div className="mx-4 sm:mx-6 mt-3 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 dark:bg-emerald-950/70 dark:border-emerald-500/40 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-sm dark:shadow-lg">
            <span>✨ {lastSyncMessage}</span>
            <button
              type="button"
              onClick={clearSyncMessage}
              className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-white p-0.5 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer ml-2"
              aria-label="Dismiss message"
            >
              <FiX size={14} />
            </button>
          </div>
        )}
        {!syncing && lastSyncError && (
          <div className="mx-4 sm:mx-6 mt-3 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 dark:bg-amber-950/70 dark:border-amber-500/40 dark:text-amber-200 text-xs font-semibold flex items-center justify-between shadow-sm dark:shadow-lg">
            <span>⚠️ {lastSyncError}</span>
            <button
              type="button"
              onClick={clearSyncError}
              className="text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-white p-0.5 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer ml-2"
              aria-label="Dismiss error"
            >
              <FiX size={14} />
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function StudentLayout() {
  return (
    <SyncProvider>
      <StudentLayoutContent />
    </SyncProvider>
  );
}
