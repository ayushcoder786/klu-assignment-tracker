import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiBookOpen, FiRefreshCw, FiBell, FiShield, FiArrowRight, FiCheckCircle,
} from 'react-icons/fi';
import { PWAInstallButton } from '../components/common/PWAInstallButton';
import { ThemeToggle } from '../components/common/ThemeToggle';

const features = [
  {
    icon: <FiRefreshCw size={22} />,
    title: 'Auto-Sync from KLU LMS',
    desc: 'Assignments and e-exams automatically synced from the university portal on a daily schedule.',
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-100 dark:bg-violet-500/10',
  },
  {
    icon: <FiBell size={22} />,
    title: 'Smart Deadline Alerts',
    desc: 'Get notified before due dates so you never miss a submission or quiz again.',
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-100 dark:bg-cyan-500/10',
  },
  {
    icon: <FiCheckCircle size={22} />,
    title: 'Real-time Status Tracking',
    desc: 'Track pending, submitted, overdue, and graded assignments and tests in one place.',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-500/10',
  },
  {
    icon: <FiShield size={22} />,
    title: 'Secure & Private',
    desc: 'Your credentials are handled securely. Zero data shared with third parties.',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-500/10',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950 text-slate-900 dark:text-white transition-colors duration-300 overflow-x-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-400/10 dark:bg-violet-600/8 blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-indigo-400/10 dark:bg-indigo-600/8 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] rounded-full bg-cyan-400/10 dark:bg-cyan-600/6 blur-3xl" />
      </div>

      {/* Navbar */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 lg:px-16 py-5 border-b border-slate-200/80 dark:border-white/5 bg-white/70 dark:bg-slate-950/40 backdrop-blur-md transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <FiBookOpen size={18} className="text-white" />
          </div>
          <span className="text-base font-bold text-slate-900 dark:text-white">KLU Assignment Tracker</span>
        </div>
        <div className="flex items-center gap-3">
          <PWAInstallButton />
          <ThemeToggle />
          <Link
            to="/login"
            className="px-5 py-2 text-sm font-semibold text-slate-800 hover:text-slate-950 dark:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-white/10 dark:hover:bg-white/15 border border-slate-300 dark:border-white/15 rounded-xl shadow-xs transition-all duration-200"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-violet-700 bg-violet-100 border border-violet-200 dark:text-violet-300 dark:bg-violet-500/10 dark:border-violet-500/20 mb-8 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 dark:bg-violet-400 animate-pulse" />
          KLU University — Spring 2026
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight tracking-tight max-w-4xl">
          <span className="text-slate-900 dark:text-white">Never Miss an</span>
          <br />
          <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 dark:from-violet-400 dark:via-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent">
            Assignment Again
          </span>
        </h1>

        <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          KLU Assignment Tracker automatically syncs all your assignments and e-exams from the KLU LMS
          portal and keeps you on top of every deadline — all in one beautiful dashboard.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-base shadow-xl shadow-indigo-500/25 hover:from-violet-500 hover:to-indigo-500 transition-all duration-200 hover:scale-[1.02] active:scale-95"
          >
            Login
            <FiArrowRight size={18} />
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 text-center">
          {[
            { val: '2,000+', label: 'Students Enrolled' },
            { val: '15,000+', label: 'Assignments Tracked' },
            { val: '99.9%', label: 'Sync Reliability' },
          ].map(({ val, label }) => (
            <div key={label} className="min-w-[120px]">
              <p className="text-3xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-cyan-400 bg-clip-text text-transparent">{val}</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 sm:px-10 lg:px-16 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center text-slate-900 dark:text-white mb-3">Everything You Need</h2>
          <p className="text-center text-slate-600 dark:text-slate-400 mb-12">Designed for KLU students who want to stay ahead.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map(({ icon, title, desc, color, bg }) => (
              <div
                key={title}
                className="p-6 rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-white/4 backdrop-blur-sm hover:bg-white dark:hover:bg-white/8 hover:border-slate-300 dark:hover:border-white/15 hover:shadow-lg dark:hover:shadow-none transition-all duration-300 hover:scale-[1.01]"
              >
                <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center mb-4 ${color}`}>
                  {icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 pb-24 text-center">
        <div className="max-w-2xl mx-auto p-10 rounded-3xl border border-violet-200 dark:border-violet-500/20 bg-gradient-to-br from-violet-100/70 via-indigo-50/50 to-white dark:from-violet-500/8 dark:to-indigo-500/8 backdrop-blur-sm shadow-xl shadow-violet-500/5 dark:shadow-none">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">Ready to Get Started?</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">Join thousands of KLU students tracking their assignments effortlessly.</p>
          <div className="flex justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/25 hover:from-violet-500 hover:to-indigo-500 transition-all duration-200 active:scale-95 hover:scale-[1.02]"
            >
              Login <FiArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-white/5 py-6 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-600">© 2026 KLU Assignment Tracker · K L University · All rights reserved.</p>
      </footer>
    </div>
  );
}
