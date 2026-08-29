import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm dark:shadow-lg dark:shadow-black/40 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: string;
  bgColor?: string;
  description?: string;
  onClick?: () => void;
  active?: boolean;
}

export function StatCard({
  title,
  value,
  icon,
  color = 'text-slate-900 dark:text-white',
  bgColor = 'bg-slate-100 dark:bg-slate-800',
  description,
  onClick,
  active = false,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-4 transition-all duration-200 ${
        active
          ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 shadow-md shadow-violet-200 dark:shadow-violet-950/50 scale-[1.02]'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-sm dark:shadow-md dark:shadow-black/30'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">{title}</span>
        {icon && (
          <div className={`w-8 h-8 rounded-xl ${bgColor} ${color} flex items-center justify-center shrink-0`}>
            {icon}
          </div>
        )}
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      {description && <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
    </div>
  );
}

