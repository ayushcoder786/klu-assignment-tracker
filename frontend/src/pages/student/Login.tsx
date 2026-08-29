import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiUser, FiLock, FiBookOpen, FiAlertCircle, FiServer, FiArrowLeft } from 'react-icons/fi';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { PWAInstallButton } from '../../components/common/PWAInstallButton';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login, loading, authState, initializing } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ studentId: '', lmsPassword: '' });
  const [error, setError] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);

  // If already authenticated and not initializing, redirect to appropriate dashboard
  useEffect(() => {
    if (!initializing && authState.isAuthenticated) {
      if (authState.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [authState.isAuthenticated, authState.role, initializing, navigate]);

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
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950 text-slate-900 dark:text-white flex flex-col justify-between p-4 sm:p-6 transition-colors duration-300 relative overflow-x-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-violet-400/10 dark:bg-violet-600/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-400/10 dark:bg-indigo-600/10 blur-3xl" />
      </div>

      {/* Top Bar with Navigation and Theme Controls */}
      <header className="relative z-10 flex items-center justify-between w-full max-w-5xl mx-auto py-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-all cursor-pointer"
        >
          <FiArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <PWAInstallButton />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md mx-auto my-auto py-8">
        <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-slate-300/40 dark:shadow-2xl dark:shadow-black/60 transition-colors duration-200">
          {/* Logo & Title */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-4">
              <FiBookOpen size={26} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Login</h1>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1 text-center">
              Sign in with your KLU Student ID and LMS Password
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm font-medium">
              <FiAlertCircle size={17} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Cold-start informational banner */}
          {loading && loadingStep >= 2 && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs animate-pulse">
              <FiServer size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  {loadingStep === 3
                    ? 'Cloud server is waking up from idle...'
                    : 'Connecting to KLU LMS API...'}
                </p>
                <p className="text-amber-700/80 dark:text-amber-300/80 text-[11px] mt-0.5">
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
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20 cursor-pointer"
            >
              {loading ? getLoadingButtonText() : 'Login'}
            </Button>
          </form>
        </div>
      </div>

      {/* Subtle Bottom Footer */}
      <footer className="relative z-10 text-center py-2">
        <p className="text-xs text-slate-500 dark:text-slate-600">© 2026 KLU Assignment Tracker · K L University</p>
      </footer>
    </div>
  );
}
