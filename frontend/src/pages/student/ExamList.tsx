import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiAward,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiFilter,
  FiSearch,
  FiExternalLink,
  FiChevronRight,
  FiRefreshCw,
  FiCalendar,
  FiZap,
} from 'react-icons/fi';
import { format, isPast, parseISO } from 'date-fns';
import { StatCard } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CountdownChip } from '../../components/common/CountdownChip';
import { LoadingSpinner, SkeletonRow } from '../../components/common/LoadingSpinner';
import { examService } from '../../services/examService';
import { assignmentService } from '../../services/assignmentService';
import type { Exam, ExamSummary } from '../../types/exam';
import type { Course } from '../../types/assignment';
import { useSync } from '../../context/SyncContext';

type ExamSectionFilter = 'all' | 'given' | 'pending' | 'overdue';
type SortOption = 'nearest' | 'furthest' | 'title';

export default function ExamList() {
  const { syncing, triggerSync, refreshKey } = useSync();

  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [activeSection, setActiveSection] = useState<ExamSectionFilter>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('nearest');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedExams, fetchedCourses] = await Promise.all([
        examService.getExams(),
        assignmentService.getCourses(),
      ]);
      setExams(fetchedExams);
      setCourses(fetchedCourses);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load E-Exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  // Compute summary stats
  const summary: ExamSummary = useMemo(() => {
    return examService.calculateSummary(exams);
  }, [exams]);

  // Filter & sort exams
  const filteredExams = useMemo(() => {
    return exams
      .filter(exam => {
        // 1. Course Filter
        if (selectedCourse !== 'all' && exam.courseId !== selectedCourse && exam.courseName !== selectedCourse) {
          return false;
        }

        // 2. Search filter
        const title = exam.title || '';
        const courseName = exam.courseName || '';
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = title.toLowerCase().includes(q);
          const matchCourse = courseName.toLowerCase().includes(q);
          if (!matchTitle && !matchCourse) return false;
        }

        // 3. Status filter
        const normalizedStatus = (exam.status || 'PENDING').toLowerCase();
        const close = exam.closeDate ? (typeof exam.closeDate === 'string' ? parseISO(exam.closeDate) : new Date(exam.closeDate)) : null;

        if (activeSection === 'given') {
          return normalizedStatus === 'given' || normalizedStatus === 'completed';
        }
        if (activeSection === 'overdue') {
          return (normalizedStatus === 'overdue' || (close ? isPast(close) : false)) && normalizedStatus !== 'given' && normalizedStatus !== 'completed';
        }
        if (activeSection === 'pending') {
          return (normalizedStatus === 'pending' || normalizedStatus === 'upcoming') && (!close || !isPast(close));
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        const timeA = a.closeDate ? new Date(a.closeDate).getTime() : a.openDate ? new Date(a.openDate).getTime() : (sortBy === 'nearest' ? Infinity : -Infinity);
        const timeB = b.closeDate ? new Date(b.closeDate).getTime() : b.openDate ? new Date(b.openDate).getTime() : (sortBy === 'nearest' ? Infinity : -Infinity);

        return sortBy === 'nearest' ? timeA - timeB : timeB - timeA;
      });
  }, [exams, activeSection, selectedCourse, searchTerm, sortBy]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Hero Header & Sync ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-50 via-slate-50 to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors duration-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-500/40">
              KLU E-Exam Portal
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FiAward className="text-emerald-600 dark:text-emerald-400" />
            E-Exams & Online Tests
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm font-medium mt-1">
            Track your quizzes, continuous assessments, and lab exams synced from KLU Moodle LMS.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/30 disabled:opacity-50 transition-all cursor-pointer active:scale-95"
          >
            <FiRefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Syncing Moodle...' : 'Sync with LMS'}</span>
          </button>
        </div>
      </div>

      {/* ─── Stats Cards (Filterable) ────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total E-Exams"
          value={summary.total}
          icon={<FiAward size={18} />}
          color="text-indigo-700 dark:text-indigo-300"
          bgColor="bg-indigo-100 dark:bg-indigo-950/80"
          onClick={() => setActiveSection('all')}
          active={activeSection === 'all'}
        />
        <StatCard
          title="Given / Completed"
          value={summary.given}
          icon={<FiCheckCircle size={18} />}
          color="text-emerald-700 dark:text-emerald-300"
          bgColor="bg-emerald-100 dark:bg-emerald-950/80"
          onClick={() => setActiveSection('given')}
          active={activeSection === 'given'}
        />
        <StatCard
          title="Pending"
          value={summary.pending}
          icon={<FiClock size={18} />}
          color="text-amber-700 dark:text-amber-300"
          bgColor="bg-amber-100 dark:bg-amber-950/80"
          onClick={() => setActiveSection('pending')}
          active={activeSection === 'pending'}
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
      </div>

      {/* ─── Controls: Search, Course Filter & Sort ─────────────────── */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search E-Exams or courses..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs dark:shadow-md transition-all"
          />
        </div>

        {/* Course Filter */}
        <div className="relative min-w-[200px]">
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer pr-10 shadow-xs dark:shadow-md"
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
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer pr-10 shadow-xs dark:shadow-md"
          >
            <option value="nearest" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Nearest Deadline</option>
            <option value="furthest" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Furthest Deadline</option>
            <option value="title" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Title (A-Z)</option>
          </select>
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">▼</span>
        </div>
      </div>

      {/* ─── Main E-Exam Feed / List ─────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm dark:shadow-2xl transition-colors duration-200">
        {/* Section Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white capitalize">
              {activeSection === 'all' ? 'All E-Exams & Tests' : `${activeSection} E-Exams`}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">
              {filteredExams.length}
            </span>
          </div>
        </div>

        {/* Content State */}
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
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
        ) : filteredExams.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-sm">
              <FiAward size={24} />
            </div>
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">No E-Exams found</h4>
            <p className="text-slate-600 dark:text-slate-300 text-xs max-w-md mx-auto">
              {searchTerm || selectedCourse !== 'all' || activeSection !== 'all'
                ? 'No E-Exams match your active filters. Try adjusting your search or course selection.'
                : 'No E-Exams recorded yet. Click "Sync with LMS" above to fetch your active exams and quizzes from KLU Moodle.'}
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
            {filteredExams.map(exam => {
              const open = exam.openDate ? (typeof exam.openDate === 'string' ? parseISO(exam.openDate) : new Date(exam.openDate)) : null;
              const close = exam.closeDate ? (typeof exam.closeDate === 'string' ? parseISO(exam.closeDate) : new Date(exam.closeDate)) : null;
              const isGiven = (exam.status || '').toLowerCase() === 'given' || (exam.status || '').toLowerCase() === 'completed';

              return (
                <div
                  key={exam.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200 group"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded-lg truncate max-w-[200px]">
                        {exam.courseName}
                      </span>
                      {exam.timeLimit && exam.timeLimit > 0 && (
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                          <FiClock size={11} /> {Math.round(exam.timeLimit / 60)} mins
                        </span>
                      )}
                      {exam.attemptsCount != null && exam.attemptsCount > 0 && (
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                          {exam.attemptsCount} attempt{exam.attemptsCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {isGiven && exam.obtainedGrade != null && (
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/90 border border-emerald-300 dark:border-emerald-500/40 px-2 py-0.5 rounded-md">
                          Score: {exam.obtainedGrade} {exam.maxGrade ? `/ ${exam.maxGrade}` : ''}
                        </span>
                      )}
                    </div>

                    <Link to={`/exams/${exam.id}`}>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {exam.title}
                      </h4>
                    </Link>

                    {exam.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">
                        {exam.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {close ? `Close: ${format(close, 'MMM d, yyyy')}` : open ? `Open: ${format(open, 'MMM d, yyyy')}` : 'No deadline'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {close ? format(close, 'h:mm a') : open ? format(open, 'h:mm a') : '—'}
                      </p>
                    </div>

                    <CountdownChip dueDate={exam.closeDate} status={exam.status} />
                    <Badge status={exam.status} />

                    {exam.lmsUrl ? (
                      <a
                        href={exam.lmsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer"
                        title="Open directly on KLU Moodle"
                      >
                        <span>{isGiven ? 'Review on LMS' : 'Take Exam'}</span>
                        <FiExternalLink size={12} />
                      </a>
                    ) : (
                      <Link
                        to={`/exams/${exam.id}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        <FiChevronRight size={18} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
