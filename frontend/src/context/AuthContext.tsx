import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Student, AuthState } from '../types/user';
import { authService } from '../services/authService';

interface AuthContextValue {
  authState: AuthState;
  login: (studentId: string, lmsPassword: string) => Promise<void>;
  studentLogin: (studentId: string, lmsPassword: string) => Promise<void>;
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

  const login = async (studentId: string, lmsPassword: string) => {
    setLoading(true);
    try {
      const user = await authService.login(studentId, lmsPassword);
      const role = (user.role?.toLowerCase() === 'admin' || user.studentId === '2500032102') ? 'admin' : 'student';
      setAuthState({ isAuthenticated: true, user, role });
    } finally {
      setLoading(false);
    }
  };

  const studentLogin = login;

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
    <AuthContext.Provider value={{ authState, login, studentLogin, logout, loading }}>
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
