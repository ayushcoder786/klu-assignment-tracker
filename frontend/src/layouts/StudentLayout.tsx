import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { StudentSidebar } from '../components/common/StudentSidebar';
import { Topbar } from '../components/common/Topbar';
import { useAuth } from '../context/AuthContext';
import { SyncProvider, useSync } from '../context/SyncContext';
import type { Student } from '../types/user';

import { getCleanStudentName } from '../utils/userUtils';

function StudentLayoutContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { authState } = useAuth();
  const { syncing, triggerSync, lastSyncMessage, lastSyncError } = useSync();
  const student = authState.user as Student | null;
  const displayName = getCleanStudentName(student?.name);

  return (
    <div className="flex h-screen bg-[#070b14] overflow-hidden text-slate-100">
      <StudentSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#070b14]">
        <Topbar
          title="Student Dashboard"
          subtitle={
            student ? (
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-200 leading-tight">{displayName}</span>
                {student.studentId && (
                  <span className="text-xs text-indigo-300 font-mono leading-normal mt-0.5">{student.studentId}</span>
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
        {lastSyncMessage && (
          <div className="mx-4 sm:mx-6 mt-3 px-4 py-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-lg">
            <span>✨ {lastSyncMessage}</span>
          </div>
        )}
        {lastSyncError && (
          <div className="mx-4 sm:mx-6 mt-3 px-4 py-2.5 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center justify-between shadow-lg">
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
