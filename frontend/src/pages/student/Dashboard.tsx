import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiClock,
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiRefreshCw,
  FiFilter,
  FiSearch,
  FiBookOpen,
  FiArrowRight,
  FiChevronRight,
} from 'react-icons/fi';
import { format, isToday, isPast, addDays, parseISO } from 'date-fns';
import { StatCard } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CountdownChip } from '../../components/common/CountdownChip';
import { LoadingSpinner, SkeletonRow } from '../../components/common/LoadingSpinner';
import { assignmentService } from '../../services/assignmentService';
import { examService } from '../../services/examService';
import type { Assignment, Course, AssignmentSummary } from '../../types/assignment';
import type { Exam, ExamSummary } from '../../types/exam';
import { useStudent } from '../../context/AuthContext';
import { useSync } from '../../context/SyncContext';
import { getCleanStudentName } from '../../utils/userUtils';
import { useNavigate } from 'react-router-dom';
import { FiAward, FiExternalLink } from 'react-icons/fi';

type SectionFilter = 'all' | 'dueToday' | 'dueThisWeek' | 'upcoming' | 'overdue' | 'submitted';
type SortOption = 'nearest' | 'furthest' | 'title';

export default function StudentDashboard() {
  const student = useStudent();
  const navigate = useNavigate();
  const { syncing, triggerSync, refreshKey } = useSync();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [activeSection, setActiveSection] = useState<SectionFilter>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('nearest');

  // Load assignments, courses & exams from backend
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedAssignments, fetchedCourses, fetchedExams] = await Promise.all([
        assignmentService.getAssignments(),
        assignmentService.getCourses(),
        examService.getExams(),
      ]);
      setAssignments(fetchedAssignments);
      setCourses(fetchedCourses);
      setExams(fetchedExams);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  // Compute summary stats
  const summary: AssignmentSummary = useMemo(() => {
    return assignmentService.calculateSummary(assignments);
  }, [assignments]);

  const examSummary: ExamSummary = useMemo(() => {
    return examService.calculateSummary(exams);
  }, [exams]);

  // Filter & sort assignments
  const filteredAssignments = useMemo(() => {
    const now = new Date();
    const in7Days = addDays(now, 7);

    return assignments.filter(a => {
      // 1. Course Filter
      if (selectedCourse !== 'all' && a.courseId !== selectedCourse && a.courseName !== selectedCourse) {
        return false;
      }

      // 2. Search filter
      const title = a.title || a.name || '';
      const courseName = a.courseName || a.course?.name || '';

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = title.toLowerCase().includes(q);
        const matchCourse = courseName.toLowerCase().includes(q);
        if (!matchTitle && !matchCourse) return false;
      }

      // 3. Section / Status filter
      const normalizedStatus = (a.status || 'PENDING').toLowerCase();
      const due = a.dueDate ? (typeof a.dueDate === 'string' ? parseISO(a.dueDate) : new Date(a.dueDate)) : null;

      if (activeSection === 'submitted') {
        return normalizedStatus === 'submitted' || normalizedStatus === 'graded';
      }
      if (activeSection === 'overdue') {
        return normalizedStatus === 'overdue' || (due ? isPast(due) && normalizedStatus !== 'submitted' && normalizedStatus !== 'graded' : false);
      }
      if (activeSection === 'dueToday') {
        return due && isToday(due) && normalizedStatus !== 'submitted' && normalizedStatus !== 'graded';
      }
      if (activeSection === 'dueThisWeek') {
        return due && due > now && due <= in7Days && normalizedStatus !== 'submitted' && normalizedStatus !== 'graded';
      }
      if (activeSection === 'upcoming') {
        return (!due || due > in7Days) && normalizedStatus !== 'submitted' && normalizedStatus !== 'graded';
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'title') {
        const titleA = a.title || a.name || '';
        const titleB = b.title || b.name || '';
        return titleA.localeCompare(titleB);
      }
      const timeA = a.dueDate ? new Date(a.dueDate).getTime() : (sortBy === 'nearest' ? Infinity : -Infinity);
      const timeB = b.dueDate ? new Date(b.dueDate).getTime() : (sortBy === 'nearest' ? Infinity : -Infinity);

      return sortBy === 'nearest' ? timeA - timeB : timeB - timeA;
    });
  }, [assignments, activeSection, selectedCourse, searchTerm, sortBy]);

  // Urgent assignments for quick spotlight (due today or within 3 days, pending)
  const urgentAssignments = useMemo(() => {
    const now = new Date();
    return assignments
      .filter(a => {
        const st = (a.status || 'PENDING').toLowerCase();
        if (st === 'submitted' || st === 'graded') return false;
        if (!a.dueDate) return false;
        const due = typeof a.dueDate === 'string' ? parseISO(a.dueDate) : new Date(a.dueDate);
        return due >= now && due <= addDays(now, 3);
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 3);
  }, [assignments]);

  // Pending / upcoming E-Exams
  const pendingExams = useMemo(() => {
    return exams
      .filter(e => {
        const st = (e.status || 'PENDING').toLowerCase();
        return st === 'pending';
      })
      .sort((a, b) => {
        const timeA = a.closeDate ? new Date(a.closeDate).getTime() : Infinity;
        const timeB = b.closeDate ? new Date(b.closeDate).getTime() : Infinity;
        return timeA - timeB;
      });
  }, [exams]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const studentDisplayName = getCleanStudentName(student?.name);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Hero Header & LMS Sync Action ──────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-violet-50 via-slate-50 to-white dark:from-violet-950/60 dark:via-slate-900 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors duration-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-800 border border-violet-300 dark:bg-violet-950/80 dark:text-violet-300 dark:border-violet-500/40">
              KLU Student Portal
            </span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {greeting}, {studentDisplayName}! 👋
          </h2>
          {student?.studentId && (
            <p className="text-xs text-indigo-600 dark:text-indigo-300 font-mono font-bold mt-0.5">
              {student.studentId}
            </p>
          )}
          <p className="text-slate-600 dark:text-slate-300 text-sm font-medium mt-1">
            You have <span className="text-amber-700 dark:text-amber-300 font-bold">{summary.pending} pending</span> and{' '}
            <span className="text-red-700 dark:text-red-400 font-bold">{summary.overdue} overdue</span> assignments ·{' '}
            <span className="text-emerald-700 dark:text-emerald-300 font-bold">{examSummary.pending} pending E-Exams</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-950/30 disabled:opacity-50 transition-all cursor-pointer active:scale-95"
          >
            <FiRefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Syncing Moodle...' : 'Sync with LMS'}</span>
          </button>
        </div>
      </div>

      {/* ─── E-EXAMS SECTION ────────────────────────────────────────── */}
      <div className="rounded-3xl border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-slate-900 p-6 shadow-sm dark:shadow-xl transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center shadow-xs">
              <FiAward size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                E-Exams & Online Tests
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Live continuous assessments and quizzes from KLU Moodle LMS
              </p>
            </div>
          </div>

          <Link
            to="/exams"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all self-start sm:self-auto"
          >
            <span>View All E-Exams</span>
            <FiArrowRight size={13} />
          </Link>
        </div>

        {/* 4 Clean E-Exam Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Total E-Exams"
            value={examSummary.total}
            icon={<FiAward size={18} />}
            color="text-indigo-700 dark:text-indigo-300"
            bgColor="bg-indigo-100 dark:bg-indigo-950/80"
            onClick={() => navigate('/exams')}
          />
          <StatCard
            title="Given / Completed"
            value={examSummary.given}
            icon={<FiCheckCircle size={18} />}
            color="text-emerald-700 dark:text-emerald-300"
            bgColor="bg-emerald-100 dark:bg-emerald-950/80"
            onClick={() => navigate('/exams')}
          />
          <StatCard
            title="Pending"
            value={examSummary.pending}
            icon={<FiClock size={18} />}
            color="text-amber-700 dark:text-amber-300"
            bgColor="bg-amber-100 dark:bg-amber-950/80"
            onClick={() => navigate('/exams')}
          />
          <StatCard
            title="Overdue"
            value={examSummary.overdue}
            icon={<FiAlertTriangle size={18} />}
            color="text-red-700 dark:text-red-300"
            bgColor="bg-red-100 dark:bg-red-950/80"
            onClick={() => navigate('/exams')}
          />
        </div>

        {/* Quick Pending Exams Spotlight */}
        {pendingExams.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FiClock size={14} className="text-amber-500" />
                Active / Upcoming Tests ({pendingExams.length})
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {pendingExams.slice(0, 3).map(exam => {
                const close = exam.closeDate ? parseISO(exam.closeDate) : null;
                return (
                  <div
                    key={exam.id}
                    className="flex flex-col justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/40 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 truncate">
                          {exam.courseName}
                        </span>
                        <CountdownChip dueDate={exam.closeDate} status={exam.status} />
                      </div>
                      <Link to={`/exams/${exam.id}`}>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-1 mt-1">
                          {exam.title}
                        </h5>
                      </Link>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-850 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {close ? format(close, 'MMM d, h:mm a') : 'No deadline'}
                      </span>
                      {exam.lmsUrl ? (
                        <a
                          href={exam.lmsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <span>Attempt</span>
                          <FiExternalLink size={11} />
                        </a>
                      ) : (
                        <Link
                          to={`/exams/${exam.id}`}
                          className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          Details →
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── ASSIGNMENTS SECTION ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FiBookOpen className="text-violet-600 dark:text-violet-400" />
            Course Assignments
          </h3>
        </div>

        {/* Stats Cards (Filterable) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            title="All Assignments"
            value={summary.total}
            icon={<FiBookOpen size={18} />}
            color="text-violet-700 dark:text-violet-300"
            bgColor="bg-violet-100 dark:bg-violet-950/80"
            onClick={() => setActiveSection('all')}
            active={activeSection === 'all'}
          />
          <StatCard
            title="Due Today"
            value={summary.dueToday}
            icon={<FiClock size={18} />}
            color="text-orange-700 dark:text-orange-300"
            bgColor="bg-orange-100 dark:bg-orange-950/80"
            onClick={() => setActiveSection('dueToday')}
            active={activeSection === 'dueToday'}
          />
          <StatCard
            title="Due This Week"
            value={summary.dueThisWeek}
            icon={<FiCalendar size={18} />}
            color="text-amber-700 dark:text-amber-300"
            bgColor="bg-amber-100 dark:bg-amber-950/80"
            onClick={() => setActiveSection('dueThisWeek')}
            active={activeSection === 'dueThisWeek'}
          />
          <StatCard
            title="Upcoming"
            value={summary.upcoming}
            icon={<FiCalendar size={18} />}
            color="text-sky-700 dark:text-sky-300"
            bgColor="bg-sky-100 dark:bg-sky-950/80"
            onClick={() => setActiveSection('upcoming')}
            active={activeSection === 'upcoming'}
          />
          <StatCard
            title="Overdue"
            value={summary.overdue}
            icon={<FiAlertTriangle size={18} />}
            color="text-red-700 dark:text-red-300"
            bgColor="bg-red-100 dark:bg-red-950/80"
            onClick={() => setActiveSection('overdue')}
            active={activeSection === 'overdue'}
          />
          <StatCard
            title="Submitted"
            value={summary.submitted + summary.graded}
            icon={<FiCheckCircle size={18} />}
            color="text-emerald-700 dark:text-emerald-300"
            bgColor="bg-emerald-100 dark:bg-emerald-950/80"
            onClick={() => setActiveSection('submitted')}
            active={activeSection === 'submitted'}
          />
        </div>
      </div>

      {/* ─── Urgent Spotlight (if any) ───────────────────────────────── */}
      {urgentAssignments.length > 0 && activeSection === 'all' && (
        <div className="rounded-3xl border border-amber-300 dark:border-amber-500/30 bg-amber-50/50 dark:bg-slate-900 p-5 shadow-sm dark:shadow-xl transition-colors duration-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <FiClock size={16} className="text-amber-600 dark:text-amber-400 animate-pulse" />
              Urgent Attention Required (Next 3 Days)
            </h3>
            <span className="text-xs text-amber-800 dark:text-amber-300 font-bold">
              {urgentAssignments.length} deadlines approaching
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {urgentAssignments.map(a => (
              <Link
                key={a.id}
                to={`/assignments/${a.id}`}
                className="flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/40 hover:bg-amber-50/30 dark:hover:bg-slate-900 transition-all group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300">
                      {a.courseName}
                    </span>
                    <CountdownChip dueDate={a.dueDate} status={a.status} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors line-clamp-2 mt-1">
                    {a.title}
                  </h4>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <span>{a.dueDate ? format(new Date(a.dueDate), 'MMM d, h:mm a') : 'No due date'}</span>
                  <FiChevronRight size={14} className="text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─── Controls: Search, Course Filter & Sort ─────────────────── */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search assignments or courses..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 shadow-xs dark:shadow-md transition-all"
          />
        </div>

        {/* Course Filter */}
        <div className="relative min-w-[200px]">
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 appearance-none cursor-pointer pr-10 shadow-xs dark:shadow-md"
          >
            <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Courses ({courses.length})</option>
            {courses.map(c => (
              <option key={c.id || c.name} value={c.id || c.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {c.shortName ? `${c.shortName} - ${c.name}` : c.name}
              </option>
            ))}
          </select>
          <FiFilter size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Sort by */}
        <div className="relative min-w-[170px]">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 appearance-none cursor-pointer pr-10 shadow-xs dark:shadow-md"
          >
            <option value="nearest" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Nearest Due Date</option>
            <option value="furthest" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Furthest Due Date</option>
            <option value="title" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Title (A-Z)</option>
          </select>
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">▼</span>
        </div>
      </div>

      {/* ─── Main Assignment Feed / Table ───────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm dark:shadow-2xl transition-colors duration-200">
        {/* Section Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white capitalize">
              {activeSection === 'all' ? 'All Assignments' : activeSection.replace(/([A-Z])/g, ' $1')}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">
              {filteredAssignments.length}
            </span>
          </div>

          <Link
            to="/assignments"
            className="text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 flex items-center gap-1 font-bold transition-colors"
          >
            Full Assignment View <FiArrowRight size={13} />
          </Link>
        </div>

        {/* Content State: Loading / Error / Empty / List */}
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} cols={4} />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-3">
            <FiAlertTriangle size={36} className="text-red-500 dark:text-red-400 mx-auto" />
            <p className="text-red-600 dark:text-red-300 font-bold text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-all cursor-pointer border border-slate-300 dark:border-slate-700"
            >
              Retry
            </button>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-violet-100 dark:bg-violet-950/80 border border-violet-300 dark:border-violet-500/30 text-violet-700 dark:text-violet-300 flex items-center justify-center mx-auto shadow-sm">
              <FiBookOpen size={24} />
            </div>
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">No assignments found</h4>
            <p className="text-slate-600 dark:text-slate-300 text-xs max-w-md mx-auto">
              {searchTerm || selectedCourse !== 'all' || activeSection !== 'all'
                ? 'No assignments match your active filters. Try clearing or adjusting search parameters.'
                : 'No assignments are currently recorded. Click "Sync with LMS" above to fetch your active course assignments from KLU Moodle.'}
            </p>
            {(searchTerm || selectedCourse !== 'all' || activeSection !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCourse('all');
                  setActiveSection('all');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-all cursor-pointer border border-slate-300 dark:border-slate-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredAssignments.map(a => {
              const due = a.dueDate ? (typeof a.dueDate === 'string' ? parseISO(a.dueDate) : new Date(a.dueDate)) : null;

              return (
                <Link
                  key={a.id}
                  to={`/assignments/${a.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 hover:bg-slate-50 dark:hover:bg-slate-850 dark:hover:bg-slate-800/60 transition-all duration-200 group"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-500/30 px-2 py-0.5 rounded-lg truncate max-w-[200px]">
                        {a.courseName}
                      </span>
                      {a.moodleAssignmentId && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden md:inline">
                          ID: {a.moodleAssignmentId}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors line-clamp-1">
                      {a.title}
                    </h4>
                    {a.description && (
                      <p className="text-xs font-normal text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">
                        {a.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {due ? format(due, 'MMM d, yyyy') : 'No deadline'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {due ? format(due, 'h:mm a') : '—'}
                      </p>
                    </div>

                    <CountdownChip dueDate={a.dueDate} status={a.status} />
                    <Badge status={a.status} />
                    <FiChevronRight size={16} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
