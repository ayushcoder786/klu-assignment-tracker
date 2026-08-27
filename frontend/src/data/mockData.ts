import type { Student, AdminUser } from '../types/user';
import type { Assignment, Course } from '../types/assignment';
import type { SyncLog, GlobalSyncStatus } from '../types/sync';

// ─── Courses ─────────────────────────────────────────────────────────────────
export const mockCourses: Course[] = [
  { id: 'c1', code: 'CSE3001', name: 'Data Structures & Algorithms', credits: 4 },
  { id: 'c2', code: 'CSE3002', name: 'Operating Systems', credits: 4 },
  { id: 'c3', code: 'CSE3003', name: 'Database Management Systems', credits: 3 },
  { id: 'c4', code: 'CSE3004', name: 'Computer Networks', credits: 3 },
  { id: 'c5', code: 'CSE3005', name: 'Software Engineering', credits: 3 },
  { id: 'c6', code: 'MAT2001', name: 'Probability & Statistics', credits: 4 },
];

// ─── Students ─────────────────────────────────────────────────────────────────
export const mockStudents: Student[] = [
  {
    id: 's1', studentId: '2200030001', name: 'Rahul Sharma',
    email: '2200030001@kluniversity.in', status: 'active',
    lastLogin: '2026-08-08T07:30:00Z', lastSync: '2026-08-08T07:45:00Z',
    createdAt: '2022-07-01T00:00:00Z', section: 'CSE-A', branch: 'CSE', year: 3,
  },
  {
    id: 's2', studentId: '2200030002', name: 'Priya Patel',
    email: '2200030002@kluniversity.in', status: 'active',
    lastLogin: '2026-08-07T18:15:00Z', lastSync: '2026-08-07T18:30:00Z',
    createdAt: '2022-07-01T00:00:00Z', section: 'CSE-A', branch: 'CSE', year: 3,
  },
  {
    id: 's3', studentId: '2200030003', name: 'Aditya Kumar',
    email: '2200030003@kluniversity.in', status: 'active',
    lastLogin: '2026-08-06T14:00:00Z', lastSync: '2026-08-08T06:00:00Z',
    createdAt: '2022-07-01T00:00:00Z', section: 'CSE-B', branch: 'CSE', year: 3,
  },
  {
    id: 's4', studentId: '2200030004', name: 'Sneha Reddy',
    email: '2200030004@kluniversity.in', status: 'inactive',
    lastLogin: '2026-07-20T10:00:00Z', lastSync: '2026-07-20T10:15:00Z',
    createdAt: '2022-07-01T00:00:00Z', section: 'CSE-B', branch: 'CSE', year: 3,
  },
  {
    id: 's5', studentId: '2200030005', name: 'Vikram Singh',
    email: '2200030005@kluniversity.in', status: 'suspended',
    lastLogin: null, lastSync: null,
    createdAt: '2022-07-01T00:00:00Z', section: 'CSE-A', branch: 'CSE', year: 3,
  },
];

// Logged-in student (simulating session)
export const mockCurrentStudent: Student = mockStudents[0];

// ─── Admin ────────────────────────────────────────────────────────────────────
export const mockAdminUser: AdminUser = {
  id: 'a1', username: 'admin',
  name: 'Dr. Venkata Rao', email: 'admin@kluniversity.in',
  role: 'superadmin', lastLogin: '2026-08-08T08:00:00Z',
};

// ─── Assignments ──────────────────────────────────────────────────────────────
const now = new Date('2026-08-08T08:00:00Z');

const addDays = (base: Date, days: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

export const mockAssignments: Assignment[] = [
  {
    id: 'a1', courseId: 'c1', course: mockCourses[0],
    name: 'Implement AVL Tree with Rotations',
    description: 'Implement a fully functional AVL tree in Java that supports insert, delete, and search operations. Include all four rotation types (LL, RR, LR, RL). Submit a zip file containing your source code and a report explaining your approach.',
    dueDate: addDays(now, 0), cutoffDate: addDays(now, 1),
    status: 'pending', maxGrade: 100, lmsId: 'lms-a1',
  },
  {
    id: 'a2', courseId: 'c2', course: mockCourses[1],
    name: 'Process Scheduling Simulation',
    description: 'Write a simulation program for CPU scheduling algorithms: FCFS, SJF, Round Robin, and Priority Scheduling. Compare their performance using Gantt charts and turnaround time analysis.',
    dueDate: addDays(now, 2), cutoffDate: addDays(now, 3),
    status: 'pending', maxGrade: 100, lmsId: 'lms-a2',
  },
  {
    id: 'a3', courseId: 'c3', course: mockCourses[2],
    name: 'ER Diagram & Normalization Exercise',
    description: 'Design an ER diagram for a hospital management system. Normalize the relations up to BCNF and write SQL DDL statements to create the tables. Include sample DML queries for common operations.',
    dueDate: addDays(now, 1), cutoffDate: addDays(now, 2),
    status: 'pending', maxGrade: 50, lmsId: 'lms-a3',
  },
  {
    id: 'a4', courseId: 'c4', course: mockCourses[3],
    name: 'Socket Programming — Chat Application',
    description: 'Build a multi-client TCP chat application using Java sockets. The server should handle at least 10 concurrent clients. Implement private messaging, group rooms, and file transfer capabilities.',
    dueDate: addDays(now, 5), cutoffDate: addDays(now, 6),
    status: 'upcoming', maxGrade: 100, lmsId: 'lms-a4',
  },
  {
    id: 'a5', courseId: 'c5', course: mockCourses[4],
    name: 'UML Design Document',
    description: 'Create comprehensive UML diagrams (Use Case, Class, Sequence, Activity, State) for an e-commerce system. Write a 10-page design document explaining your design decisions.',
    dueDate: addDays(now, -3), cutoffDate: addDays(now, -2),
    status: 'overdue', maxGrade: 100, lmsId: 'lms-a5',
  },
  {
    id: 'a6', courseId: 'c6', course: mockCourses[5],
    name: 'Probability Distributions Lab',
    description: 'Conduct statistical analysis on a given dataset. Plot probability distributions (Normal, Poisson, Binomial) and compute mean, variance, and confidence intervals. Use Python with matplotlib/scipy.',
    dueDate: addDays(now, -1), cutoffDate: addDays(now, 0),
    status: 'overdue', maxGrade: 75, lmsId: 'lms-a6',
  },
  {
    id: 'a7', courseId: 'c1', course: mockCourses[0],
    name: 'Graph Algorithms — Shortest Path',
    description: 'Implement Dijkstra\'s and Bellman-Ford algorithms. Test on a weighted graph of your design. Compare time complexity and discuss trade-offs.',
    dueDate: addDays(now, -7), cutoffDate: addDays(now, -6),
    status: 'submitted', maxGrade: 100, submittedAt: addDays(now, -8), lmsId: 'lms-a7',
  },
  {
    id: 'a8', courseId: 'c2', course: mockCourses[1],
    name: 'Memory Management Quiz',
    description: 'Online quiz on paging, segmentation, virtual memory, and page replacement algorithms.',
    dueDate: addDays(now, -14), cutoffDate: addDays(now, -14),
    status: 'graded', maxGrade: 50, obtainedGrade: 44, submittedAt: addDays(now, -15), lmsId: 'lms-a8',
  },
  {
    id: 'a9', courseId: 'c3', course: mockCourses[2],
    name: 'SQL Query Assignment',
    description: 'Write 20 SQL queries covering SELECT, JOIN, subqueries, aggregations, and window functions on the provided university database schema.',
    dueDate: addDays(now, -21), cutoffDate: addDays(now, -20),
    status: 'graded', maxGrade: 100, obtainedGrade: 87, submittedAt: addDays(now, -22), lmsId: 'lms-a9',
  },
  {
    id: 'a10', courseId: 'c4', course: mockCourses[3],
    name: 'Wireshark Network Analysis',
    description: 'Capture network traffic using Wireshark and analyze the packets. Identify protocols, examine HTTP/HTTPS headers, and write a detailed analysis report.',
    dueDate: addDays(now, 10), cutoffDate: addDays(now, 11),
    status: 'upcoming', maxGrade: 100, lmsId: 'lms-a10',
  },
  {
    id: 'a11', courseId: 'c5', course: mockCourses[4],
    name: 'Agile Sprint Planning Exercise',
    description: 'Plan 3 agile sprints for a library management system. Create user stories, define acceptance criteria, estimate story points, and set up a Kanban board.',
    dueDate: addDays(now, 14), cutoffDate: addDays(now, 15),
    status: 'upcoming', maxGrade: 50, lmsId: 'lms-a11',
  },
  {
    id: 'a12', courseId: 'c6', course: mockCourses[5],
    name: 'Hypothesis Testing Report',
    description: 'Perform t-test, ANOVA, and chi-square tests on provided datasets. Interpret results and write a statistical report with conclusions.',
    dueDate: addDays(now, 7), cutoffDate: addDays(now, 8),
    status: 'upcoming', maxGrade: 75, lmsId: 'lms-a12',
  },
];

// ─── Sync Logs ────────────────────────────────────────────────────────────────
export const mockSyncLogs: SyncLog[] = [
  {
    id: 'sl1', studentId: '2200030001', studentName: 'Rahul Sharma',
    triggeredAt: '2026-08-08T07:45:00Z', completedAt: '2026-08-08T07:45:42Z',
    status: 'success', assignmentsFetched: 12, assignmentsUpdated: 3,
    triggeredBy: 'scheduled',
  },
  {
    id: 'sl2', studentId: '2200030002', studentName: 'Priya Patel',
    triggeredAt: '2026-08-08T07:45:00Z', completedAt: '2026-08-08T07:45:51Z',
    status: 'success', assignmentsFetched: 12, assignmentsUpdated: 1,
    triggeredBy: 'scheduled',
  },
  {
    id: 'sl3', studentId: '2200030003', studentName: 'Aditya Kumar',
    triggeredAt: '2026-08-08T06:00:00Z', completedAt: '2026-08-08T06:00:38Z',
    status: 'success', assignmentsFetched: 12, assignmentsUpdated: 2,
    triggeredBy: 'manual',
  },
  {
    id: 'sl4', studentId: '2200030004', studentName: 'Sneha Reddy',
    triggeredAt: '2026-07-20T10:15:00Z', completedAt: null,
    status: 'failed', assignmentsFetched: 0, assignmentsUpdated: 0,
    errorMessage: 'LMS authentication failed: invalid credentials',
    triggeredBy: 'scheduled',
  },
  {
    id: 'sl5', studentId: '2200030001', studentName: 'Rahul Sharma',
    triggeredAt: '2026-08-07T07:45:00Z', completedAt: '2026-08-07T07:45:29Z',
    status: 'success', assignmentsFetched: 12, assignmentsUpdated: 0,
    triggeredBy: 'scheduled',
  },
  {
    id: 'sl6', studentId: '2200030003', studentName: 'Aditya Kumar',
    triggeredAt: '2026-08-07T12:00:00Z', completedAt: null,
    status: 'failed', assignmentsFetched: 0, assignmentsUpdated: 0,
    errorMessage: 'Connection timeout: LMS server did not respond within 30s',
    triggeredBy: 'scheduled',
  },
  {
    id: 'sl7', studentId: '2200030002', studentName: 'Priya Patel',
    triggeredAt: '2026-08-08T08:20:00Z', completedAt: null,
    status: 'running', assignmentsFetched: 0, assignmentsUpdated: 0,
    triggeredBy: 'manual',
  },
];

export const mockGlobalSyncStatus: GlobalSyncStatus = {
  lastGlobalSync: '2026-08-08T07:45:51Z',
  nextScheduledSync: '2026-08-09T07:45:00Z',
  totalStudentsSynced: 3,
  failedSyncs: 2,
  isRunning: false,
};
