import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLock, FiBookOpen, FiAlertCircle, FiServer } from 'react-icons/fi';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ studentId: '', lmsPassword: '' });
  const [error, setError] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);

  // Progressive loading status timer
  useEffect(() => {
    let timer1: ReturnType<typeof setTimeout>;
    let timer2: ReturnType<typeof setTimeout>;
    if (loading) {
      setLoadingStep(1); // 0-3s: Authenticating
      timer1 = setTimeout(() => {
        setLoadingStep(2); // 3-8s: Verifying with KLU LMS
      }, 3000);
      timer2 = setTimeout(() => {
        setLoadingStep(3); // 8s+: Server waking up (Render cold start)
      }, 8000);
    } else {
      setLoadingStep(0);
    }
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.studentId.trim() || !form.lmsPassword) {
      setError('Please enter your Student ID and LMS Password.');
      return;
    }
    try {
      await login(form.studentId.trim(), form.lmsPassword);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Invalid Student ID or password.');
    }
  };

  const getLoadingButtonText = () => {
    if (loadingStep === 1) return 'Logging In...';
    if (loadingStep === 2) return 'Verifying with LMS...';
    if (loadingStep === 3) return 'Waking up server...';
    return 'Login';
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
            <h1 className="text-2xl font-bold text-white">Login</h1>
            <p className="text-sm text-slate-400 mt-1 text-center">
              Sign in with your KLU Student ID and LMS Password
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <FiAlertCircle size={17} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Cold-start informational banner */}
          {loading && loadingStep >= 2 && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs animate-pulse">
              <FiServer size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">
                  {loadingStep === 3
                    ? 'Cloud server is waking up from idle...'
                    : 'Connecting to KLU LMS API...'}
                </p>
                <p className="text-amber-300/80 text-[11px] mt-0.5">
                  {loadingStep === 3
                    ? 'Render free instances spin down after inactivity. Please hold on a few seconds.'
                    : 'Authenticating your credentials with KLU Moodle.'}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              id="student-id"
              label="Student ID / KLU ID"
              placeholder="e.g. 2500032102"
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
              {loading ? getLoadingButtonText() : 'Login'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
