export type AccountStatus = 'active' | 'inactive' | 'suspended';

export interface Student {
  id: string;
  studentId: string;
  name?: string | null;
  email?: string | null;
  role?: string;
  status?: AccountStatus;
  lastLogin?: string | null;
  lastSync?: string | null;
  createdAt?: string;
  section?: string;
  branch?: string;
  year?: number;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'superadmin';
  lastLogin: string | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: Student | AdminUser | null;
  role: 'student' | 'admin' | null;
}
