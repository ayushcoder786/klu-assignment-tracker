import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  FiArrowLeft,
  FiAward,
  FiClock,
  FiCalendar,
  FiBookOpen,
  FiExternalLink,
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
} from 'react-icons/fi';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CountdownChip } from '../../components/common/CountdownChip';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { examService } from '../../services/examService';
import type { Exam } from '../../types/exam';

export default function ExamDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await examService.getExamById(id);
        if (!data) {
          setError('Exam not found');
        } else {
          setExam(data);
        }
      } catch (err: unknown) {
        setError((err as Error).message || 'Failed to load exam details');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <LoadingSpinner fullPage />;

  if (error || !exam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 max-w-lg mx-auto text-center p-6">
        <div className="w-16 h-16 rounded-3xl bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 flex items-center justify-center">
          <FiAlertTriangle size={32} />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white">Exam Not Found</h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm">{error || 'The requested E-Exam could not be located.'}</p>
        <Link
          to="/exams"
          className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md"
        >
          Back to E-Exams
        </Link>
      </div>
    );
  }

  const open = exam.openDate ? (typeof exam.openDate === 'string' ? parseISO(exam.openDate) : new Date(exam.openDate)) : null;
  const close = exam.closeDate ? (typeof exam.closeDate === 'string' ? parseISO(exam.closeDate) : new Date(exam.closeDate)) : null;
  const completed = exam.completedAt ? (typeof exam.completedAt === 'string' ? parseISO(exam.completedAt) : new Date(exam.completedAt)) : null;
  const isGiven = (exam.status || '').toLowerCase() === 'given' || (exam.status || '').toLowerCase() === 'completed';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/exams')}
        className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
      >
        <FiArrowLeft size={16} /> Back to E-Exams
      </button>

      {/* Hero Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-50 via-slate-50 to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 px-2.5 py-0.5 rounded-lg">
                {exam.courseName}
              </span>
              {exam.moodleQuizId && (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Quiz ID: {exam.moodleQuizId}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {exam.title}
            </h2>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <CountdownChip dueDate={exam.closeDate} status={exam.status} />
            <Badge status={exam.status} size="md" />
          </div>
        </div>

        {/* LMS Direct Action Button */}
        {exam.lmsUrl && (
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Official Moodle activity link for this test:
            </p>
            <a
              href={exam.lmsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/30 transition-all cursor-pointer active:scale-95"
            >
              <span>{isGiven ? 'Review on KLU LMS' : 'Attempt on KLU LMS'}</span>
              <FiExternalLink size={15} />
            </a>
          </div>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="!p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-emerald-600 dark:text-emerald-400 mb-2">
            <FiCalendar size={18} />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Open Date</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
            {open ? format(open, 'MMM d, h:mm a') : 'Anytime'}
          </p>
        </Card>

        <Card className="!p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-amber-600 dark:text-amber-400 mb-2">
            <FiClock size={18} />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Close / Deadline</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
            {close ? format(close, 'MMM d, h:mm a') : 'No deadline'}
          </p>
        </Card>

        <Card className="!p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-indigo-600 dark:text-indigo-400 mb-2">
            <FiClock size={18} />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Duration / Limit</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
            {exam.timeLimit && exam.timeLimit > 0 ? `${Math.round(exam.timeLimit / 60)} minutes` : 'Unlimited'}
          </p>
        </Card>

        <Card className="!p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-violet-600 dark:text-violet-400 mb-2">
            <FiAward size={18} />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
            {isGiven ? 'Obtained Score' : 'Maximum Score'}
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
            {isGiven && exam.obtainedGrade != null
              ? `${exam.obtainedGrade} / ${exam.maxGrade || '—'}`
              : exam.maxGrade ? `${exam.maxGrade} pts` : '—'}
          </p>
        </Card>
      </div>

      {/* Completion Details (if given) */}
      {isGiven && (
        <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <FiCheckCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                E-Exam Completed / Given
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                {completed ? `Submitted on ${format(completed, 'MMMM d, yyyy · h:mm a')}` : 'Submitted on KLU Moodle'}
                {exam.attemptsCount ? ` (${exam.attemptsCount} attempt${exam.attemptsCount > 1 ? 's' : ''})` : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions / Description */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <FiInfo size={16} className="text-emerald-600 dark:text-emerald-400" />
          Instructions & Information
        </h3>
        {exam.description ? (
          <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
            {exam.description}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No additional instructions provided for this E-Exam.</p>
        )}
      </Card>
    </div>
  );
}
