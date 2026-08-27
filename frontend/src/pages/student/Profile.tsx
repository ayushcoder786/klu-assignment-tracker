import React from 'react';
import { format, parseISO } from 'date-fns';
import { FiUser, FiMail, FiHash, FiCalendar, FiBook } from 'react-icons/fi';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { useStudent } from '../../context/AuthContext';

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | undefined;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-white/5 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">{label}</p>
        <p className="text-sm text-white font-medium mt-0.5 truncate">{value ?? '—'}</p>
      </div>
    </div>
  );
}

function safeFormatDate(dateStr?: string | null, formatStr: string = 'MMM d, yyyy h:mm a'): string {
  if (!dateStr) return 'Never';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return format(d, formatStr);
  } catch {
    return '—';
  }
}

export default function Profile() {
  const student = useStudent();

  const initialLetter = student?.name
    ? student.name[0]
    : student?.studentId
    ? student.studentId[0]
    : 'S';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-white">My Profile</h2>
        <p className="text-slate-400 text-sm mt-1">Your KLU account and LMS synchronization details</p>
      </div>

      {/* Avatar card */}
      <Card className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-3xl font-extrabold text-white shadow-xl shadow-indigo-500/30 shrink-0">
          {initialLetter}
        </div>
        <div className="flex-1 text-center sm:text-left space-y-1">
          <h3 className="text-xl font-bold text-white">{student?.name || student?.studentId || 'KLU Student'}</h3>
          <p className="text-slate-400 text-xs font-mono">{student?.studentId}</p>
          <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
            <Badge status={student?.status || 'active'} size="md" />
            <span className="text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-mono">
              Role: {student?.role || 'STUDENT'}
            </span>
          </div>
        </div>
      </Card>

      {/* Info card */}
      <Card>
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Account Details</h3>
        <InfoRow icon={<FiHash size={15} />} label="Student ID" value={student?.studentId} />
        <InfoRow icon={<FiUser size={15} />} label="Full Name" value={student?.name || 'Synced from LMS'} />
        {student?.email && <InfoRow icon={<FiMail size={15} />} label="Email" value={student.email} />}
        <InfoRow
          icon={<FiCalendar size={15} />}
          label="Account Registered"
          value={safeFormatDate(student?.createdAt, 'MMMM d, yyyy')}
        />
        <InfoRow
          icon={<FiCalendar size={15} />}
          label="Last Login"
          value={safeFormatDate(student?.lastLogin)}
        />
        <InfoRow
          icon={<FiCalendar size={15} />}
          label="Last LMS Sync"
          value={safeFormatDate(student?.lastSync)}
        />
      </Card>

      <p className="text-xs text-slate-500 text-center">
        Profile name and enrolled courses are automatically kept in sync with KLU Moodle LMS.
      </p>
    </div>
  );
}
