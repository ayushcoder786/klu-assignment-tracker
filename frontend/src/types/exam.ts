export type ExamStatus =
  | 'given'
  | 'pending'
  | 'overdue'
  | 'completed'
  | 'GIVEN'
  | 'PENDING'
  | 'OVERDUE'
  | 'COMPLETED';

export interface Exam {
  id: string;
  userId?: string;
  moodleQuizId?: string;
  courseModuleId?: string;
  courseId?: string;
  courseName?: string;
  title: string;
  description?: string;
  openDate?: string | null;
  closeDate?: string | null;
  timeLimit?: number | null; // in seconds
  attemptsAllowed?: number | null;
  attemptsCount?: number;
  maxGrade?: number | null;
  obtainedGrade?: number | null;
  lmsUrl?: string | null;
  status: ExamStatus;
  completedAt?: string | null;
  firstSeen?: string;
  lastChecked?: string;
}

export interface ExamSummary {
  total: number;
  given: number;
  pending: number;
  overdue: number;
}
