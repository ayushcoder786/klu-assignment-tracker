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
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-cyan-950/10 to-slate-950 overflow-hidden">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
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
