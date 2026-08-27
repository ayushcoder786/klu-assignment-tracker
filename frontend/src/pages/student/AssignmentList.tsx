import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, isPast, isToday, addDays, parseISO } from 'date-fns';
import { FiSearch, FiFilter, FiBookOpen, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { Badge } from '../../components/common/Badge';
import { CountdownChip } from '../../components/common/CountdownChip';
import { SkeletonRow } from '../../components/common/LoadingSpinner';
import { assignmentService } from '../../services/assignmentService';
import type { Assignment, Course, AssignmentStatus } from '../../types/assignment';
import { useSync } from '../../context/SyncContext';

type FilterTab = 'all' | 'pending' | 'overdue' | 'upcoming' | 'submitted' | 'graded';
type SortOption = 'nearest' | 'furthest' | 'title';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'graded', label: 'Graded' },
];

export default function AssignmentList() {
  const { syncing, triggerSync, refreshKey } = useSync();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('nearest');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [allAssignments, allCourses] = await Promise.all([
        assignmentService.getAssignments(),
        assignmentService.getCourses(),
      ]);
      setAssignments(allAssignments);
      setCourses(allCourses);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const filtered = useMemo(() => {
    const now = new Date();
    const in7Days = addDays(now, 7);

    return assignments.filter(a => {
      // Course filter
      if (selectedCourse !== 'all' && a.courseId !== selectedCourse && a.courseName !== selectedCourse) {
        return false;
      }

      // Search filter
      const title = a.title || a.name || '';
      const courseName = a.courseName || a.course?.name || '';

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = title.toLowerCase().includes(q);
        const matchCourse = courseName.toLowerCase().includes(q);
        if (!matchTitle && !matchCourse) return false;
      }

      // Tab filter
      const normalizedStatus = (a.status || 'PENDING').toLowerCase();
      const due = a.dueDate ? (typeof a.dueDate === 'string' ? parseISO(a.dueDate) : new Date(a.dueDate)) : null;

      if (activeTab === 'all') return true;
      if (activeTab === 'submitted') return normalizedStatus === 'submitted';
      if (activeTab === 'graded') return normalizedStatus === 'graded';
      if (activeTab === 'overdue') {
        return normalizedStatus === 'overdue' || (due ? isPast(due) && normalizedStatus !== 'submitted' && normalizedStatus !== 'graded' : false);
      }
      if (activeTab === 'upcoming') {
        return (!due || due > in7Days) && normalizedStatus !== 'submitted' && normalizedStatus !== 'graded';
      }
      if (activeTab === 'pending') {
        return normalizedStatus === 'pending' && (!due || !isPast(due));
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
  }, [assignments, activeTab, selectedCourse, search, sortBy]);

  const counts = useMemo(() => {
    const now = new Date();
    const in7Days = addDays(now, 7);

    const c: Record<FilterTab, number> = {
      all: assignments.length,
      pending: 0,
      overdue: 0,
      upcoming: 0,
      submitted: 0,
      graded: 0,
    };

    assignments.forEach(a => {
      const st = (a.status || 'PENDING').toLowerCase();
      const due = a.dueDate ? (typeof a.dueDate === 'string' ? parseISO(a.dueDate) : new Date(a.dueDate)) : null;

      if (st === 'submitted') c.submitted++;
      else if (st === 'graded') c.graded++;
      else if (st === 'overdue' || (due && isPast(due))) c.overdue++;
      else if (due && due > in7Days) c.upcoming++;
      else c.pending++;
    });

    return c;
  }, [assignments]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Assignments</h2>
          <p className="text-slate-400 text-sm mt-1">
            Complete list of your course assignments synced directly from KLU Moodle.
          </p>
        </div>

        <button
          onClick={triggerSync}
          disabled={syncing}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all disabled:opacity-50 cursor-pointer"
        >
          <FiRefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          <span>{syncing ? 'Syncing...' : 'Sync LMS'}</span>
        </button>
      </div>

      {/* Filters & Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="sm:col-span-6 relative">
          <FiSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search assignments or courses…"
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-white/10 bg-slate-900/50 text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
          />
        </div>

        {/* Course Filter */}
        <div className="sm:col-span-3 relative">
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl border border-white/10 bg-slate-900/50 text-sm text-white outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 appearance-none cursor-pointer pr-10"
          >
            <option value="all" className="bg-slate-900 text-white">All Courses</option>
            {courses.map(c => (
              <option key={c.id || c.name} value={c.id || c.name} className="bg-slate-900 text-white">
                {c.shortName ? `${c.shortName} - ${c.name}` : c.name}
              </option>
            ))}
          </select>
          <FiFilter size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="sm:col-span-3 relative">
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

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`
              flex-none flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer
              ${activeTab === t.key
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-white/10'
              }
            `}
          >
            <span>{t.label}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === t.key ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'}`}>
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Table / List */}
      <div className="rounded-3xl border border-white/10 bg-white/4 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/40">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Course</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Assignment</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Due Date</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Countdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-red-300">
                    <FiAlertTriangle size={32} className="mx-auto mb-2 text-red-400" />
                    {error}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                    <FiBookOpen size={36} className="mx-auto mb-2 text-violet-400/60" />
                    <p className="font-semibold text-white">No assignments match your criteria</p>
                    <p className="text-xs text-slate-500 mt-1">Try changing tabs, clearing search, or syncing with LMS.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(a => {
                  const due = a.dueDate ? (typeof a.dueDate === 'string' ? parseISO(a.dueDate) : new Date(a.dueDate)) : null;

                  return (
                    <tr key={a.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
                          {a.courseName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/assignments/${a.id}`}
                          className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors line-clamp-1"
                        >
                          {a.title}
                        </Link>
                        {a.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{a.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-xs font-medium text-slate-200">
                          {due ? format(due, 'MMM d, yyyy') : 'No due date'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {due ? format(due, 'h:mm a') : '—'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={a.status} />
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <CountdownChip dueDate={a.dueDate} status={a.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
