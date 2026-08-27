import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Student, AdminUser, AuthState } from '../types/user';
import { authService } from '../services/authService';

interface AuthContextValue {
  authState: AuthState;
  studentLogin: (studentId: string, lmsPassword: string) => Promise<void>;
  adminLogin: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false, user: null, role: null,
  });
  const [loading, setLoading] = useState(false);

  // Restore session on mount
  useEffect(() => {
    const stored = authService.getStoredSession();
    if (stored.isAuthenticated) setAuthState(stored);
  }, []);

  const studentLogin = async (studentId: string, lmsPassword: string) => {
    setLoading(true);
    try {
      // authService calls POST /api/auth/student/login, stores JWT, returns student profile
      const student = await authService.studentLogin(studentId, lmsPassword);
      setAuthState({ isAuthenticated: true, user: student, role: 'student' });
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (username: string, password: string) => {
    setLoading(true);
    try {
      const admin = await authService.adminLogin(username, password);
      authService.persistAdminSession(admin as AdminUser);
      setAuthState({ isAuthenticated: true, user: admin as AdminUser, role: 'admin' });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setAuthState({ isAuthenticated: false, user: null, role: null });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ authState, studentLogin, adminLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export function useStudent(): Student {
  const { authState } = useAuth();
  return authState.user as Student;
}
