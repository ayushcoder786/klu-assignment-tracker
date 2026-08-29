import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { FiArrowLeft, FiCalendar, FiClock, FiBook, FiAlertCircle, FiInfo, FiLayers } from 'react-icons/fi';
import { Badge } from '../../components/common/Badge';
import { CountdownChip } from '../../components/common/CountdownChip';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Card } from '../../components/common/Card';
import { assignmentService } from '../../services/assignmentService';
import type { Assignment } from '../../types/assignment';

export default function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    assignmentService.getAssignmentById(id).then(data => {
      if (!data) setNotFound(true);
      else setAssignment(data);
      setLoading(false);
    }).catch(() => {
      setNotFound(true);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <LoadingSpinner fullPage />;

  if (notFound || !assignment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
          <FiAlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-white">Assignment not found</h2>
        <p className="text-slate-400 text-xs max-w-sm">
          The requested assignment could not be retrieved from your synchronized courses.
        </p>
        <Link
          to="/assignments"
          className="px-4 py-2 rounded-2xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all"
        >
          ← Back to assignments
        </Link>
      </div>
    );
  }

  const due = assignment.dueDate ? (typeof assignment.dueDate === 'string' ? parseISO(assignment.dueDate) : new Date(assignment.dueDate)) : null;
  const cutoff = assignment.cutoffDate ? (typeof assignment.cutoffDate === 'string' ? parseISO(assignment.cutoffDate) : new Date(assignment.cutoffDate)) : null;
  const firstSeenDate = assignment.firstSeen ? (typeof assignment.firstSeen === 'string' ? parseISO(assignment.firstSeen) : new Date(assignment.firstSeen)) : null;
  const lastCheckedDate = assignment.lastChecked ? (typeof assignment.lastChecked === 'string' ? parseISO(assignment.lastChecked) : new Date(assignment.lastChecked)) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back navigation */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
      >
        <FiArrowLeft size={16} /> Back to previous view
      </button>

      {/* Primary info card */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-block text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1 rounded-xl">
              {assignment.courseName}
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {assignment.title}
            </h2>
          </div>

          <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2.5 shrink-0">
            <Badge status={assignment.status} size="md" />
            <CountdownChip dueDate={assignment.dueDate} status={assignment.status} />
          </div>
        </div>
      </Card>

      {/* Date metadata grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-violet-100 dark:bg-violet-950/80 border border-violet-300 dark:border-violet-500/30 flex items-center justify-center text-violet-700 dark:text-violet-300 shrink-0 shadow-xs dark:shadow-md">
            <FiCalendar size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Due Date</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {due ? format(due, 'MMM d, yyyy') : 'No deadline'}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              {due ? format(due, 'h:mm a') : 'Unscheduled'}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0 shadow-xs dark:shadow-md">
            <FiClock size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Cutoff Date</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {cutoff ? format(cutoff, 'MMM d, yyyy') : 'Same as due date'}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              {cutoff ? format(cutoff, 'h:mm a') : 'No hard cutoff'}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 sm:col-span-2 lg:col-span-1">
          <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-700 dark:text-indigo-300 shrink-0 shadow-xs dark:shadow-md">
            <FiLayers size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Course Details</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
              {assignment.courseName}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Moodle LMS Module
            </p>
          </div>
        </Card>
      </div>

      {/* Description / Instructions card */}
      <Card className="space-y-3">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <FiInfo size={15} className="text-violet-600 dark:text-violet-400" />
          Assignment Description & Instructions
        </h3>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
          {assignment.description || 'No detailed instructions were provided for this assignment in Moodle.'}
        </div>
      </Card>

      {/* Synchronization Metadata */}
      <Card className="space-y-3 !py-4">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Sync Metadata</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex flex-col">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Moodle Assignment ID</span>
            <span className="font-mono text-slate-900 dark:text-slate-200 font-bold">{assignment.moodleAssignmentId || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 dark:text-slate-400 font-medium">First Discovered</span>
            <span className="text-slate-900 dark:text-slate-200 font-semibold">{firstSeenDate ? format(firstSeenDate, 'MMM d, yyyy h:mm a') : '—'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Last Verified</span>
            <span className="text-slate-900 dark:text-slate-200 font-semibold">{lastCheckedDate ? format(lastCheckedDate, 'MMM d, yyyy h:mm a') : '—'}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
