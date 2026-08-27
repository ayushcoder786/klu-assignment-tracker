export type AssignmentStatus =
  | 'pending'
  | 'submitted'
  | 'overdue'
  | 'upcoming'
  | 'graded'
  | 'draft'
  | 'PENDING'
  | 'SUBMITTED'
  | 'OVERDUE'
  | 'GRADED';

export interface Course {
  id: string;
  code?: string;
  name: string;
  shortName?: string;
  credits?: number;
  userId?: string;
  moodleCourseId?: string;
}

export interface Assignment {
  id: string;
  userId?: string;
  moodleAssignmentId?: string;
  courseId?: string;
  courseName?: string;
  course?: Course;
  title?: string;
  name?: string;
  description?: string;
  dueDate?: string | null;
  cutoffDate?: string | null;
  status: AssignmentStatus;
  firstSeen?: string;
  lastChecked?: string;
  maxGrade?: number;
  obtainedGrade?: number;
  submittedAt?: string;
  lmsId?: string;
}

export interface AssignmentSummary {
  total: number;
  pending: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  upcoming: number;
  submitted: number;
  graded: number;
}
