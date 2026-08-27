import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiLock, FiBookOpen, FiAlertCircle } from 'react-icons/fi';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export default function StudentLogin() {
  const { studentLogin, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ studentId: '', lmsPassword: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.studentId.trim() || !form.lmsPassword) {
      setError('Please enter your Student ID and LMS Password.');
      return;
    }
    try {
      await studentLogin(form.studentId.trim(), form.lmsPassword);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Invalid Student ID or password.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/40 mb-4">
              <FiBookOpen size={26} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Student Login</h1>
            <p className="text-sm text-slate-500 mt-1">Sign in with your KLU Student ID and LMS Password</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <FiAlertCircle size={17} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              id="student-id"
              label="Student ID"
              placeholder="e.g. 2200030001"
              icon={<FiUser size={16} />}
              value={form.studentId}
              onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
              autoComplete="username"
              disabled={loading}
            />
            <Input
              id="lms-password"
              label="LMS Password"
              type="password"
              placeholder="Your KLU LMS password"
              icon={<FiLock size={16} />}
              value={form.lmsPassword}
              onChange={e => setForm(f => ({ ...f, lmsPassword: e.target.value }))}
              autoComplete="current-password"
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
            >
              Sign In
            </Button>
          </form>
        </div>

        {/* Admin link */}
        <p className="mt-4 text-center text-xs text-slate-600">
          Are you an admin?{' '}
          <Link to="/admin/login" className="text-slate-400 hover:text-slate-200 transition-colors">
            Admin Login →
          </Link>
        </p>
      </div>
    </div>
  );
}
