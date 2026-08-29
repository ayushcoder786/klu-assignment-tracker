import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../components/common/AdminSidebar';
import { Topbar } from '../components/common/Topbar';
import { useAuth } from '../context/AuthContext';
import type { AdminUser } from '../types/user';

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { authState } = useAuth();
  const admin = authState.user as AdminUser | null;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-cyan-950/10 dark:to-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-transparent">
        <Topbar
          title="Admin Panel"
          subtitle={admin?.name}
          onMenuClick={() => setSidebarOpen(true)}
          accentColor="cyan"
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
