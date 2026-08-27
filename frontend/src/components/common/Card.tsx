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
      className={`rounded-2xl border border-white/10 bg-white/4 backdrop-blur-md p-5 shadow-xl shadow-black/20 ${
        onClick ? 'cursor-pointer hover:border-white/20 hover:bg-white/8 transition-all duration-200' : ''
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
  color = 'text-white',
  bgColor = 'bg-white/5',
  description,
  onClick,
  active = false,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-4 backdrop-blur-sm transition-all duration-200 ${
        active
          ? 'border-violet-500/50 bg-violet-500/10 shadow-lg shadow-violet-500/10'
          : 'border-white/10 bg-white/4 hover:border-white/20 hover:bg-white/8'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-400 truncate">{title}</span>
        {icon && (
          <div className={`w-8 h-8 rounded-xl ${bgColor} ${color} flex items-center justify-center shrink-0`}>
            {icon}
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {description && <p className="text-[11px] text-slate-500 mt-1">{description}</p>}
    </div>
  );
}
