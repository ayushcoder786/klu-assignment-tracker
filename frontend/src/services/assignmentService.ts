import type { Assignment, Course, AssignmentSummary } from '../types/assignment';
import { authService } from './authService';
import { isToday, isPast, addDays, isThisWeek, parseISO } from 'date-fns';
import { API_BASE } from './apiConfig';

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 25000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const assignmentService = {
  /**
   * Fetch all assignments for the currently authenticated student.
   * GET /api/assignments
   */
  async getAssignments(): Promise<Assignment[]> {
    const response = await fetchWithTimeout(`${API_BASE}/assignments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.authHeaders(),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(`Failed to fetch assignments (HTTP ${response.status})`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  /**
   * Fetch all courses for the currently authenticated student.
   * GET /api/courses
   */
  async getCourses(): Promise<Course[]> {
    const response = await fetchWithTimeout(`${API_BASE}/courses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.authHeaders(),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(`Failed to fetch courses (HTTP ${response.status})`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  /**
   * Fetch a single assignment by its database ID.
   * GET /api/assignments/:id
   */
  async getAssignmentById(id: string): Promise<Assignment | null> {
    const response = await fetchWithTimeout(`${API_BASE}/assignments/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.authHeaders(),
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to load assignment (HTTP ${response.status})`);
    }

    return await response.json();
  },

  /**
   * Trigger a manual synchronization with KLU Moodle.
   * POST /api/sync
   */
  async triggerSync(): Promise<{ success: boolean; message: string; syncLog?: any }> {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.authHeaders(),
        },
      }, 45000); // 45s for live Moodle sync

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please log in again.');
        }
        if (response.status === 503 || response.status === 500 || response.status === 502 || response.status === 504) {
          return {
            success: false,
            message: 'LMS is temporarily unavailable. Please try syncing again later.',
          };
        }
        throw new Error(`Sync failed (HTTP ${response.status})`);
      }

      const data = await response.json();
      const rawMessage = data.message || 'Synchronization completed.';
      const isFailed = (data.syncLog && data.syncLog.status === 'FAILED')
        || rawMessage.toLowerCase().includes('unavailable')
        || rawMessage.toLowerCase().includes('failed');

      return {
        success: !isFailed,
        message: isFailed ? 'LMS is temporarily unavailable. Please try syncing again later.' : rawMessage,
        syncLog: data.syncLog,
      };
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        return {
          success: false,
          message: 'LMS is temporarily unavailable (request timed out). Please try syncing again later.',
        };
      }
      throw err;
    }
  },

  /**
   * Compute assignment summary statistics from a list of assignments.
   */
  calculateSummary(assignments: Assignment[]): AssignmentSummary {
    const now = new Date();
    const in7Days = addDays(now, 7);

    const totals: AssignmentSummary = {
      total: assignments.length,
      pending: 0,
      overdue: 0,
      dueToday: 0,
      dueThisWeek: 0,
      upcoming: 0,
      submitted: 0,
      graded: 0,
    };

    for (const a of assignments) {
      const normalizedStatus = (a.status || 'PENDING').toLowerCase();

      if (normalizedStatus === 'submitted') {
        totals.submitted++;
        continue;
      }
      if (normalizedStatus === 'graded') {
        totals.graded++;
        continue;
      }

      if (!a.dueDate) {
        totals.pending++;
        totals.upcoming++;
        continue;
      }

      const due = typeof a.dueDate === 'string' ? parseISO(a.dueDate) : new Date(a.dueDate);

      if (normalizedStatus === 'overdue' || isPast(due)) {
        totals.overdue++;
      } else {
        totals.pending++;
        if (isToday(due)) {
          totals.dueToday++;
        }
        if (due > now && due <= in7Days) {
          totals.dueThisWeek++;
        }
        if (due > in7Days) {
          totals.upcoming++;
        }
      }
    }

    return totals;
  },
};
