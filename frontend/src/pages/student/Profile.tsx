import React from 'react';
import { FiUser, FiMail, FiHash, FiCalendar } from 'react-icons/fi';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { useStudent } from '../../context/AuthContext';
import { getCleanStudentName } from '../../utils/userUtils';
import { formatLocalDateTime } from '../../utils/dateUtils';

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | undefined;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-slate-800 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">{label}</p>
        <p className="text-sm text-white font-bold mt-0.5 truncate">{value ?? '—'}</p>
      </div>
    </div>
  );
}

export default function Profile() {
  const student = useStudent();
  const displayName = getCleanStudentName(student?.name, 'KLU Student');
  const initialLetter = displayName[0]?.toUpperCase() || 'S';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white">My Profile</h2>
        <p className="text-slate-300 text-sm font-medium mt-1">Your KLU account and LMS synchronization details</p>
      </div>

      {/* Avatar card */}
      <Card className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-indigo-950/60 shrink-0">
          {initialLetter}
        </div>
        <div className="flex-1 text-center sm:text-left space-y-1">
          <h3 className="text-xl font-black text-white leading-tight">{displayName}</h3>
          {student?.studentId && (
            <p className="text-indigo-300 text-xs font-mono font-bold">{student.studentId}</p>
          )}
          <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
            <Badge status={student?.status || 'active'} size="md" />
            <span className="text-xs text-indigo-300 bg-indigo-950/80 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
              Role: {student?.role || 'STUDENT'}
            </span>
          </div>
        </div>
      </Card>

      {/* Info card */}
      <Card>
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Account Details</h3>
        <InfoRow icon={<FiUser size={15} />} label="Full Name" value={displayName} />
        <InfoRow icon={<FiHash size={15} />} label="Student ID" value={student?.studentId} />
        {student?.email && <InfoRow icon={<FiMail size={15} />} label="Email" value={student.email} />}
        <InfoRow
          icon={<FiCalendar size={15} />}
          label="Account Registered"
          value={formatLocalDateTime(student?.createdAt, 'MMMM d, yyyy')}
        />
        <InfoRow
          icon={<FiCalendar size={15} />}
          label="Last Login"
          value={formatLocalDateTime(student?.lastLogin)}
        />
        <InfoRow
          icon={<FiCalendar size={15} />}
          label="Last LMS Sync"
          value={formatLocalDateTime(student?.lastSync)}
        />
      </Card>

      <p className="text-xs text-slate-400 font-medium text-center">
        Profile name and enrolled courses are automatically kept in sync with KLU Moodle LMS.
      </p>
    </div>
  );
}
