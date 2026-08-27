import type { Assignment, Course, AssignmentSummary } from '../types/assignment';
import { authService } from './authService';
import { isToday, isPast, addDays, isThisWeek, parseISO } from 'date-fns';
import { API_BASE } from './apiConfig';

export const assignmentService = {
  /**
   * Fetch all assignments for the currently authenticated student.
   * GET /api/assignments
   */
  async getAssignments(): Promise<Assignment[]> {
    const response = await fetch(`${API_BASE}/assignments`, {
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
    const response = await fetch(`${API_BASE}/courses`, {
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
    const response = await fetch(`${API_BASE}/assignments/${id}`, {
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
    const response = await fetch(`${API_BASE}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.authHeaders(),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(`Sync failed (HTTP ${response.status})`);
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Synchronization completed.',
      syncLog: data.syncLog,
    };
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
