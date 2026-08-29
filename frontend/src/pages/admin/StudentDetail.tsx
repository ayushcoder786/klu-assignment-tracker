import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  FiArrowLeft, FiRefreshCw, FiUser, FiMail, FiHash,
  FiCalendar, FiBook, FiAlertCircle, FiCheckCircle, FiAward, FiClock,
} from 'react-icons/fi';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { adminService } from '../../services/adminService';
import { mockAssignments } from '../../data/mockData';
import type { Student } from '../../types/user';
import type { Assignment } from '../../types/assignment';
import type { Exam } from '../../types/exam';
import { CountdownChip } from '../../components/common/CountdownChip';
import { getCleanStudentName } from '../../utils/userUtils';
import { formatLocalDateTime } from '../../utils/dateUtils';

export default function StudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [studentExams, setStudentExams] = useState<Exam[]>([]);
  const [examSummary, setExamSummary] = useState<{ total: number; given: number; pending: number; overdue: number }>({
    total: 0,
    given: 0,
    pending: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!studentId) return;
    (async () => {
      setLoading(true);
      const data = await adminService.getStudentById(studentId);
      if (!data) {
        setNotFound(true);
      } else {
        setStudent(data);
        const [exams, summary] = await Promise.all([
          adminService.getStudentExams(data.id || studentId),
          adminService.getStudentExamSummary(data.id || studentId),
        ]);
        setStudentExams(exams || []);
        if (summary) {
          setExamSummary(summary);
        } else if (exams && exams.length > 0) {
          let given = 0, pending = 0, overdue = 0;
          for (const e of exams) {
            const st = (e.status || '').toLowerCase();
            if (st === 'given' || st === 'completed') given++;
            else if (st === 'overdue') overdue++;
            else pending++;
          }
          setExamSummary({ total: exams.length, given, pending, overdue });
        }
      }
      setLoading(false);
    })();
  }, [studentId]);

  const handleSync = async () => {
    if (!studentId) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await adminService.triggerStudentSync(studentId);
      setSyncMsg({ success: true, text: res.message });
      // Refresh exams
      if (student?.id) {
        const [exams, summary] = await Promise.all([
          adminService.getStudentExams(student.id),
          adminService.getStudentExamSummary(student.id),
        ]);
        setStudentExams(exams || []);
        if (summary) setExamSummary(summary);
      }
    } catch (e: unknown) {
      setSyncMsg({ success: false, text: (e as Error).message });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (notFound || !student) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <FiAlertCircle size={48} className="text-red-400" />
      <p className="text-white font-semibold">Student not found</p>
      <Link to="/admin/students" className="text-cyan-400 text-sm">← Back to students</Link>
    </div>
  );

  const assignments: Assignment[] = mockAssignments.slice(0, 8);
  const displayName = getCleanStudentName(student.name, student.studentId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
        <FiArrowLeft size={16} /> Back to students
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-slate-700 flex items-center justify-center text-2xl font-bold text-white shadow-md shrink-0">
            {displayName[0]?.toUpperCase() ?? 'S'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{displayName}</h2>
            <p className="text-xs text-indigo-600 dark:text-indigo-300 font-mono mt-0.5 font-bold">{student.studentId}</p>
            {student.email && (
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{student.email}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              <Badge status={student.status || 'active'} />
            </div>
          </div>
        </div>
        <Button icon={<FiRefreshCw size={15} />} loading={syncing} onClick={handleSync}
          className="!from-cyan-600 !to-slate-700 shrink-0"
        >
          Sync Now
        </Button>
      </div>

      {syncMsg && (
        <div className={`flex items-start gap-2.5 p-3.5 rounded-xl text-sm ${syncMsg.success ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/20 text-red-800 dark:text-red-400'}`}>
          {syncMsg.success ? <FiCheckCircle size={17} /> : <FiAlertCircle size={17} />}
          {syncMsg.text}
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: <FiHash size={15} />, label: 'Student ID', value: student.studentId },
          { icon: <FiBook size={15} />, label: 'Branch', value: `${student.branch ?? 'CSE'} · Yr ${student.year ?? '4'}` },
          { icon: <FiCalendar size={15} />, label: 'Last Login', value: formatLocalDateTime(student.lastLogin, 'MMM d, h:mm a') },
          { icon: <FiRefreshCw size={15} />, label: 'Last Sync', value: formatLocalDateTime(student.lastSync, 'MMM d, h:mm a') },
        ].map(({ icon, label, value }) => (
          <Card key={label} className="!p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-slate-500 dark:text-slate-400 mb-2">{icon}</div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{label}</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{value}</p>
          </Card>
        ))}
      </div>

      {/* E-Exams Summary Banner */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-500/30 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <FiAward size={16} className="text-emerald-600 dark:text-emerald-400" />
            E-Exams & Tests Overview
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            {examSummary.total} total recorded
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30">
            <p className="text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-300">Total Exams</p>
            <p className="text-lg font-black text-indigo-900 dark:text-indigo-100 mt-0.5">{examSummary.total}</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30">
            <p className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">Given / Completed</p>
            <p className="text-lg font-black text-emerald-900 dark:text-emerald-100 mt-0.5">{examSummary.given}</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30">
            <p className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">Pending</p>
            <p className="text-lg font-black text-amber-900 dark:text-amber-100 mt-0.5">{examSummary.pending}</p>
          </div>
          <div className="p-3 rounded-2xl bg-red-50/70 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30">
            <p className="text-[10px] font-bold uppercase text-red-700 dark:text-red-300">Overdue</p>
            <p className="text-lg font-black text-red-900 dark:text-red-100 mt-0.5">{examSummary.overdue}</p>
          </div>
        </div>

        {/* E-Exam table for student */}
        {studentExams.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            {studentExams.map(exam => {
              const close = exam.closeDate ? parseISO(exam.closeDate) : null;
              return (
                <div key={exam.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{exam.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {exam.courseName} · {close ? `Deadline: ${format(close, 'MMM d, h:mm a')}` : 'No deadline'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {exam.obtainedGrade != null && (
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/30">
                        {exam.obtainedGrade} {exam.maxGrade ? `/ ${exam.maxGrade}` : ''}
                      </span>
                    )}
                    <Badge status={exam.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assignment history */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Assignment History</h3>
        <div className="divide-y divide-slate-200 dark:divide-white/5">
          {assignments.map(a => (
            <div key={a.id} className="flex flex-col sm:flex-row sm:items-center gap-2 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{a.title || a.name}</p>
                <p className="text-xs text-slate-500">{a.courseName || a.course?.name} · Due {a.dueDate ? format(new Date(a.dueDate), 'MMM d') : '—'}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <CountdownChip dueDate={a.dueDate} status={a.status} />
                <Badge status={a.status} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
