import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiUsers, FiArrowRight } from 'react-icons/fi';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner, SkeletonRow } from '../../components/common/LoadingSpinner';
import { adminService } from '../../services/adminService';
import { formatLocalDateTime } from '../../utils/dateUtils';
import { getCleanStudentName, isTestStudent } from '../../utils/userUtils';
import type { Student } from '../../types/user';

export default function StudentsList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminService.getStudents().then(data => {
      setStudents((data || []).filter(s => !isTestStudent(s)));
      setLoading(false);
    });
  }, []);

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const nameMatch = (s.name || '').toLowerCase().includes(q);
    const emailMatch = (s.email || '').toLowerCase().includes(q);
    const idMatch = (s.studentId || '').includes(q);
    return !q || nameMatch || emailMatch || idMatch;
  });

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FiUsers size={22} className="text-cyan-600 dark:text-cyan-400" /> Students
          </h2>
          <p className="text-slate-600 dark:text-slate-500 text-sm mt-1">{students.length} registered students</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <FiSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, ID, or email…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 transition-all shadow-xs"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-xl overflow-hidden transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Student ID</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Last Login</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Last Sync</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6">
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <SkeletonRow key={i} cols={6} />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">
                    No students found.
                  </td>
                </tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group">
                    <td className="px-6 py-4">
                      <code className="text-xs text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-500/20 font-bold">{s.studentId}</code>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{getCleanStudentName(s.name, s.studentId)}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={s.status || 'active'} />
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-xs text-slate-600 dark:text-slate-400">
                      {formatLocalDateTime(s.lastLogin, 'MMM d, h:mm a')}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-xs text-slate-600 dark:text-slate-400">
                      {formatLocalDateTime(s.lastSync, 'MMM d, h:mm a')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/students/${s.studentId}`}
                        className="inline-flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-bold transition-colors"
                      >
                        View <FiArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
