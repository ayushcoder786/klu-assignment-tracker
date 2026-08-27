import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShield, FiUser, FiLock, FiAlertCircle } from 'react-icons/fi';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const { adminLogin, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.password) {
      setError('Please enter username and password.');
      return;
    }
    try {
      await adminLogin(form.username, form.password);
      navigate('/admin/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950/20 to-slate-950 flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-cyan-600/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-slate-700/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-slate-700 flex items-center justify-center shadow-xl shadow-cyan-500/30 mb-4">
              <FiShield size={26} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Login</h1>
            <p className="text-sm text-slate-500 mt-1">KLU Assignment Tracker — Admin Portal</p>
          </div>

          <div className="mb-6 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300">
            <strong>Demo:</strong> Username <code className="bg-cyan-500/20 px-1 rounded">admin</code> with any password.
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <FiAlertCircle size={17} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Username"
              placeholder="admin"
              icon={<FiUser size={16} />}
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter admin password"
              icon={<FiLock size={16} />}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
            <Button type="submit" fullWidth size="lg" loading={loading}
              className="!from-cyan-600 !to-slate-700 !shadow-cyan-500/30"
            >
              Access Admin Panel
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-600">
          Student?{' '}
          <Link to="/login" className="text-slate-400 hover:text-slate-200 transition-colors">
            Student Login →
          </Link>
        </p>
      </div>
    </div>
  );
}
