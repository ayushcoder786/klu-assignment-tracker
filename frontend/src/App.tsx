import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StudentLayout } from './layouts/StudentLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/student/Login';
import StudentDashboard from './pages/student/Dashboard';
import AssignmentList from './pages/student/AssignmentList';
import AssignmentDetail from './pages/student/AssignmentDetail';
import ExamList from './pages/student/ExamList';
import ExamDetail from './pages/student/ExamDetail';
import Profile from './pages/student/Profile';
import Settings from './pages/student/Settings';

import AdminDashboard from './pages/admin/AdminDashboard';
import StudentsList from './pages/admin/StudentsList';
import StudentDetail from './pages/admin/StudentDetail';
import SyncStatus from './pages/admin/SyncStatus';
import SyncLogs from './pages/admin/SyncLogs';

// ─── Guards ───────────────────────────────────────────────────────────────────

function StudentGuard({ children }: { children: React.ReactNode }) {
  const { authState } = useAuth();
  if (!authState.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { authState } = useAuth();
  if (!authState.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  const isSuperAdmin = authState.role === 'admin' || (authState.user as any)?.studentId === '2500032102';
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

// ─── App ──────────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />

      {/* Student protected routes */}
      <Route
        element={
          <StudentGuard>
            <StudentLayout />
          </StudentGuard>
        }
      >
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/assignments" element={<AssignmentList />} />
        <Route path="/assignments/:id" element={<AssignmentDetail />} />
        <Route path="/exams" element={<ExamList />} />
        <Route path="/exams/:id" element={<ExamDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Admin protected routes */}
      <Route
        element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/students" element={<StudentsList />} />
        <Route path="/admin/students/:studentId" element={<StudentDetail />} />
        <Route path="/admin/sync-status" element={<SyncStatus />} />
        <Route path="/admin/sync-logs" element={<SyncLogs />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
