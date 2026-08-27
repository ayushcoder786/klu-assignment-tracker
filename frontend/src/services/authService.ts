import type { Student, AdminUser, AuthState } from '../types/user';
import { mockAdminUser } from '../data/mockData';
import { API_BASE } from './apiConfig';
import { getCleanStudentName } from '../utils/userUtils';

const STUDENT_SESSION_KEY = 'klu_student_session';
const ADMIN_SESSION_KEY   = 'klu_admin_session';
const AUTH_TOKEN_KEY      = 'klu_auth_token';

// ─── Auth Service ──────────────────────────────────────────────────────────────

export const authService = {

  // ── Student Login ────────────────────────────────────────────────────────────

  /**
   * Authenticate a student via POST /api/auth/student/login.
   *
   * Security guarantees (enforced by the backend):
   *  - The lmsPassword is NEVER stored in MongoDB.
   *  - The lmsPassword is NEVER returned in the response.
   *  - The JWT is stored in sessionStorage (cleared when the tab closes).
   */
  async studentLogin(studentId: string, lmsPassword: string): Promise<Student> {
    const response = await fetch(`${API_BASE}/auth/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // lmsPassword is sent to the backend for one-time validation — never echoed back
      body: JSON.stringify({ studentId, lmsPassword }),
    });

    if (!response.ok) {
      let message = 'Invalid Student ID or password.';
      try {
        const json = await response.json();
        if (json?.message) message = json.message;
      } catch { /* ignore parse errors */ }
      throw new Error(message);
    }

    const data = await response.json();            // { token, type, user }
    authService.persistToken(data.token);          // store JWT for subsequent requests
    const student = data.user as Student;
    if (student && student.name) {
      student.name = getCleanStudentName(student.name);
    }
    authService.persistStudentSession(student);
    return student;
  },

  // ── Admin Login (still mocked until admin backend is wired) ─────────────────

  /**
   * Authenticate an admin.
   * TODO: Replace mock with POST /api/auth/login when admin UI is connected.
   */
  async adminLogin(username: string, _password: string) {
    await new Promise(r => setTimeout(r, 800));
    if (username === 'admin') {
      return { ...mockAdminUser, lastLogin: new Date().toISOString() };
    }
    throw new Error('Invalid admin credentials.');
  },

  // ── Logout ───────────────────────────────────────────────────────────────────

  async logout(): Promise<void> {
    sessionStorage.removeItem(STUDENT_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  },

  // ── Token helpers ────────────────────────────────────────────────────────────

  /** Store the JWT token returned from a successful login. */
  persistToken(token: string) {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  },

  /**
   * Get the JWT token for use in Authorization headers.
   * Returns null if the user is not logged in.
   */
  getToken(): string | null {
    return sessionStorage.getItem(AUTH_TOKEN_KEY);
  },

  /**
   * Build an Authorization header object for authenticated API calls.
   * Usage: fetch('/api/me', { headers: authService.authHeaders() })
   */
  authHeaders(): HeadersInit {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  // ── Session persistence ──────────────────────────────────────────────────────

  persistStudentSession(student: Student) {
    sessionStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(student));
  },

  persistAdminSession(admin: typeof mockAdminUser) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(admin));
  },

  getStoredSession(): AuthState {
    const studentData = sessionStorage.getItem(STUDENT_SESSION_KEY);
    if (studentData) {
      const student = JSON.parse(studentData) as Student;
      if (student && student.name) {
        student.name = getCleanStudentName(student.name);
      }
      return { isAuthenticated: true, user: student, role: 'student' };
    }
    const adminData = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (adminData) {
      return { isAuthenticated: true, user: JSON.parse(adminData) as AdminUser, role: 'admin' };
    }
    return { isAuthenticated: false, user: null, role: null };
  },
};
