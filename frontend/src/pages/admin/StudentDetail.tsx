import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  FiArrowLeft, FiRefreshCw, FiUser, FiMail, FiHash,
  FiCalendar, FiBook, FiAlertCircle, FiCheckCircle,
} from 'react-icons/fi';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { adminService } from '../../services/adminService';
import { mockAssignments } from '../../data/mockData';
import type { Student } from '../../types/user';
import type { Assignment } from '../../types/assignment';
import { CountdownChip } from '../../components/common/CountdownChip';

export default function StudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!studentId) return;
    adminService.getStudentById(studentId).then(data => {
      if (!data) setNotFound(true);
      else setStudent(data);
      setLoading(false);
    });
  }, [studentId]);

  const handleSync = async () => {
    if (!studentId) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await adminService.triggerStudentSync(studentId);
      setSyncMsg({ success: true, text: res.message });
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

  // Use global mock assignments as "student's assignments" for demo
  const assignments: Assignment[] = mockAssignments.slice(0, 8);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
        <FiArrowLeft size={16} /> Back to students
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-slate-700 flex items-center justify-center text-2xl font-bold text-white shadow-xl shrink-0">
            {student.name?.[0] ?? student.studentId?.[0] ?? 'S'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{student.name ?? student.studentId}</h2>
            <p className="text-slate-400 text-sm">{student.email ?? '—'}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge status={student.status || 'active'} />
              <code className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">{student.studentId}</code>
            </div>
          </div>
        </div>
        <Button icon={<FiRefreshCw size={15} />} loading={syncing} onClick={handleSync}
          className="!from-cyan-600 !to-slate-700 !shadow-cyan-500/30 shrink-0"
        >
          Sync Now
        </Button>
      </div>

      {syncMsg && (
        <div className={`flex items-start gap-2.5 p-3.5 rounded-xl text-sm ${syncMsg.success ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {syncMsg.success ? <FiCheckCircle size={17} /> : <FiAlertCircle size={17} />}
          {syncMsg.text}
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: <FiHash size={15} />, label: 'Student ID', value: student.studentId },
          { icon: <FiBook size={15} />, label: 'Branch', value: `${student.branch ?? 'N/A'} · Yr ${student.year ?? 'N/A'}` },
          { icon: <FiCalendar size={15} />, label: 'Last Login', value: student.lastLogin ? format(new Date(student.lastLogin), 'MMM d, h:mm a') : 'Never' },
          { icon: <FiRefreshCw size={15} />, label: 'Last Sync', value: student.lastSync ? format(new Date(student.lastSync), 'MMM d, h:mm a') : 'Never' },
        ].map(({ icon, label, value }) => (
          <Card key={label} className="!p-4">
            <div className="text-slate-400 mb-2">{icon}</div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
            <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
          </Card>
        ))}
      </div>

      {/* Assignment history */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Assignment History</h3>
        <div className="divide-y divide-white/5">
          {assignments.map(a => (
            <div key={a.id} className="flex flex-col sm:flex-row sm:items-center gap-2 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{a.title || a.name}</p>
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
