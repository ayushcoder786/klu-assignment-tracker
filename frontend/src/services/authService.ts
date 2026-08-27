import type { Student, AuthState } from '../types/user';
import { API_BASE } from './apiConfig';
import { getCleanStudentName } from '../utils/userUtils';

const USER_SESSION_KEY = 'klu_user_session';
const AUTH_TOKEN_KEY   = 'klu_auth_token';

// ─── Auth Service ──────────────────────────────────────────────────────────────

export const authService = {

  // ── Unified Login ────────────────────────────────────────────────────────────

  /**
   * Authenticate any user (Student or Super Admin) via POST /api/auth/student/login.
   * Role is automatically determined and returned by the backend.
   */
  async login(studentId: string, lmsPassword: string): Promise<Student> {
    const controller = new AbortController();
    // 45s timeout to allow for Render cold starts if the backend was sleeping
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch(`${API_BASE}/auth/student/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: studentId.trim(), lmsPassword }),
        signal: controller.signal,
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
      authService.persistUserSession(student);
      return student;
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        throw new Error('Connection timed out. The server may be waking up from sleep. Please try again.');
      }
      if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        throw new Error('Unable to connect to the backend server. The server may be waking up or offline. Please retry in a few seconds.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  /** Alias for login for backwards compatibility */
  async studentLogin(studentId: string, lmsPassword: string): Promise<Student> {
    return authService.login(studentId, lmsPassword);
  },

  // ── Logout ───────────────────────────────────────────────────────────────────

  async logout(): Promise<void> {
    sessionStorage.removeItem(USER_SESSION_KEY);
    sessionStorage.removeItem('klu_student_session');
    sessionStorage.removeItem('klu_admin_session');
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

  persistUserSession(user: Student) {
    sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
  },

  persistStudentSession(student: Student) {
    authService.persistUserSession(student);
  },

  getStoredSession(): AuthState {
    const rawData = sessionStorage.getItem(USER_SESSION_KEY) || sessionStorage.getItem('klu_student_session');
    if (rawData) {
      try {
        const student = JSON.parse(rawData) as Student;
        if (student && student.name) {
          student.name = getCleanStudentName(student.name);
        }
        const role = (student.role?.toLowerCase() === 'admin' || student.studentId === '2500032102') ? 'admin' : 'student';
        return { isAuthenticated: true, user: student, role };
      } catch {
        // Corrupted session
        sessionStorage.removeItem(USER_SESSION_KEY);
      }
    }
    return { isAuthenticated: false, user: null, role: null };
  },
};
