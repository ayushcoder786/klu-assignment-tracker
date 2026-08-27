import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { StudentSidebar } from '../components/common/StudentSidebar';
import { Topbar } from '../components/common/Topbar';
import { useAuth } from '../context/AuthContext';
import { SyncProvider, useSync } from '../context/SyncContext';
import type { Student } from '../types/user';

function StudentLayoutContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { authState } = useAuth();
  const { syncing, triggerSync, lastSyncMessage, lastSyncError } = useSync();
  const student = authState.user as Student | null;

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 overflow-hidden text-slate-100">
      <StudentSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          title="Student Dashboard"
          subtitle={student?.name ? `${student.name} (${student.studentId})` : student?.studentId}
          onMenuClick={() => setSidebarOpen(true)}
          lastSync={student?.lastSync ?? null}
          onSync={triggerSync}
          syncing={syncing}
        />

        {/* Sync notification banners */}
        {lastSyncMessage && (
          <div className="mx-4 sm:mx-6 mt-3 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
            <span>✨ {lastSyncMessage}</span>
          </div>
        )}
        {lastSyncError && (
          <div className="mx-4 sm:mx-6 mt-3 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center justify-between">
            <span>⚠️ {lastSyncError}</span>
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
