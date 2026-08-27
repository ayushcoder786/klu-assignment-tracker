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
import type { Assignment, Course, AssignmentSummary } from '../../types/assignment';
import { useStudent } from '../../context/AuthContext';
import { useSync } from '../../context/SyncContext';
import { getCleanStudentName } from '../../utils/userUtils';

type SectionFilter = 'all' | 'dueToday' | 'dueThisWeek' | 'upcoming' | 'overdue' | 'submitted';
type SortOption = 'nearest' | 'furthest' | 'title';

export default function StudentDashboard() {
  const student = useStudent();
  const { syncing, triggerSync, refreshKey } = useSync();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [activeSection, setActiveSection] = useState<SectionFilter>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('nearest');

  // Load assignments & courses from backend
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedAssignments, fetchedCourses] = await Promise.all([
        assignmentService.getAssignments(),
        assignmentService.getCourses(),
      ]);
      setAssignments(fetchedAssignments);
      setCourses(fetchedCourses);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load assignments');
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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const studentDisplayName = getCleanStudentName(student?.name);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Hero Header & LMS Sync Action ──────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-slate-950 border border-white/10 shadow-2xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
              KLU Student Portal
            </span>
            <span className="text-xs text-slate-400">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {greeting}, {studentDisplayName}! 👋
          </h2>
          {student?.studentId && (
            <p className="text-xs text-indigo-300 font-mono mt-0.5">
              {student.studentId}
            </p>
          )}
          <p className="text-slate-400 text-sm mt-1">
            You have <span className="text-amber-300 font-semibold">{summary.pending} pending</span> and{' '}
            <span className="text-red-400 font-semibold">{summary.overdue} overdue</span> assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition-all cursor-pointer active:scale-95"
          >
            <FiRefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Syncing Moodle...' : 'Sync with LMS'}</span>
          </button>
        </div>
      </div>

      {/* ─── Stats Cards (Filterable) ────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="All Assignments"
          value={summary.total}
          icon={<FiBookOpen size={18} />}
          color="text-violet-400"
          bgColor="bg-violet-500/10"
          onClick={() => setActiveSection('all')}
          active={activeSection === 'all'}
        />
        <StatCard
          title="Due Today"
          value={summary.dueToday}
          icon={<FiClock size={18} />}
          color="text-orange-400"
          bgColor="bg-orange-500/10"
          onClick={() => setActiveSection('dueToday')}
          active={activeSection === 'dueToday'}
        />
        <StatCard
          title="Due This Week"
          value={summary.dueThisWeek}
          icon={<FiCalendar size={18} />}
          color="text-amber-400"
          bgColor="bg-amber-500/10"
          onClick={() => setActiveSection('dueThisWeek')}
          active={activeSection === 'dueThisWeek'}
        />
        <StatCard
          title="Upcoming"
          value={summary.upcoming}
          icon={<FiCalendar size={18} />}
          color="text-sky-400"
          bgColor="bg-sky-500/10"
          onClick={() => setActiveSection('upcoming')}
          active={activeSection === 'upcoming'}
        />
        <StatCard
          title="Overdue"
          value={summary.overdue}
          icon={<FiAlertTriangle size={18} />}
          color="text-red-400"
          bgColor="bg-red-500/10"
          onClick={() => setActiveSection('overdue')}
          active={activeSection === 'overdue'}
        />
        <StatCard
          title="Submitted"
          value={summary.submitted + summary.graded}
          icon={<FiCheckCircle size={18} />}
          color="text-emerald-400"
          bgColor="bg-emerald-500/10"
          onClick={() => setActiveSection('submitted')}
          active={activeSection === 'submitted'}
        />
      </div>

      {/* ─── Urgent Spotlight (if any) ───────────────────────────────── */}
      {urgentAssignments.length > 0 && activeSection === 'all' && (
        <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-transparent p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <FiClock size={16} className="text-amber-400 animate-pulse" />
              Urgent Attention Required (Next 3 Days)
            </h3>
            <span className="text-xs text-amber-400 font-medium">
              {urgentAssignments.length} deadlines approaching
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {urgentAssignments.map(a => (
              <Link
                key={a.id}
                to={`/assignments/${a.id}`}
                className="flex flex-col justify-between p-4 rounded-2xl bg-slate-900/60 border border-amber-500/20 hover:border-amber-400/40 hover:bg-slate-900/80 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/5 text-slate-300">
                      {a.courseName}
                    </span>
                    <CountdownChip dueDate={a.dueDate} status={a.status} />
                  </div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                    {a.title}
                  </h4>
                </div>
                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                  <span>{a.dueDate ? format(new Date(a.dueDate), 'MMM d, h:mm a') : 'No due date'}</span>
                  <FiChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
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
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-white/10 bg-slate-900/50 text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
          />
        </div>

        {/* Course Filter */}
        <div className="relative min-w-[200px]">
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl border border-white/10 bg-slate-900/50 text-sm text-white outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 appearance-none cursor-pointer pr-10"
          >
            <option value="all" className="bg-slate-900 text-white">All Courses ({courses.length})</option>
            {courses.map(c => (
              <option key={c.id || c.name} value={c.id || c.name} className="bg-slate-900 text-white">
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
            className="w-full px-4 py-2.5 rounded-2xl border border-white/10 bg-slate-900/50 text-sm text-white outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 appearance-none cursor-pointer pr-10"
          >
            <option value="nearest" className="bg-slate-900 text-white">Nearest Due Date</option>
            <option value="furthest" className="bg-slate-900 text-white">Furthest Due Date</option>
            <option value="title" className="bg-slate-900 text-white">Title (A-Z)</option>
          </select>
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">▼</span>
        </div>
      </div>

      {/* ─── Main Assignment Feed / Table ───────────────────────────── */}
      <div className="rounded-3xl border border-white/10 bg-white/4 backdrop-blur-xl overflow-hidden shadow-2xl">
        {/* Section Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white capitalize">
              {activeSection === 'all' ? 'All Assignments' : activeSection.replace(/([A-Z])/g, ' $1')}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-slate-300">
              {filteredAssignments.length}
            </span>
          </div>

          <Link
            to="/assignments"
            className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-medium transition-colors"
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
            <FiAlertTriangle size={36} className="text-red-400 mx-auto" />
            <p className="text-red-300 font-semibold text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto">
              <FiBookOpen size={24} />
            </div>
            <h4 className="text-base font-bold text-white">No assignments found</h4>
            <p className="text-slate-400 text-xs max-w-md mx-auto">
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
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredAssignments.map(a => {
              const due = a.dueDate ? (typeof a.dueDate === 'string' ? parseISO(a.dueDate) : new Date(a.dueDate)) : null;

              return (
                <Link
                  key={a.id}
                  to={`/assignments/${a.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 hover:bg-white/5 transition-all duration-200 group"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-lg truncate max-w-[200px]">
                        {a.courseName}
                      </span>
                      {a.moodleAssignmentId && (
                        <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
                          ID: {a.moodleAssignmentId}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-semibold text-white group-hover:text-violet-300 transition-colors line-clamp-1">
                      {a.title}
                    </h4>
                    {a.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {a.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-medium text-slate-200">
                        {due ? format(due, 'MMM d, yyyy') : 'No deadline'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {due ? format(due, 'h:mm a') : '—'}
                      </p>
                    </div>

                    <CountdownChip dueDate={a.dueDate} status={a.status} />
                    <Badge status={a.status} />
                    <FiChevronRight size={16} className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
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
