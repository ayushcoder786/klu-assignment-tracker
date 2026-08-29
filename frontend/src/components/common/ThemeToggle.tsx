import React from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  const title = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={title}
      title={title}
      className={`
        relative flex items-center justify-center
        w-9 h-9 sm:w-10 sm:h-10 rounded-xl
        transition-all duration-300 ease-in-out cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2
        ${
          isDark
            ? 'bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 hover:text-amber-300 shadow-md shadow-black/20 focus-visible:ring-offset-[#090d1a]'
            : 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-indigo-600 hover:text-indigo-700 shadow-sm focus-visible:ring-offset-white'
        }
        ${className}
      `}
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        {/* Sun Icon for Dark Mode */}
        <FiSun
          size={18}
          className={`
            absolute transition-all duration-300 ease-out transform
            ${isDark ? 'rotate-0 scale-100 opacity-100 text-amber-400' : 'rotate-90 scale-0 opacity-0 text-amber-500'}
          `}
        />
        {/* Moon Icon for Light Mode */}
        <FiMoon
          size={18}
          className={`
            absolute transition-all duration-300 ease-out transform
            ${!isDark ? 'rotate-0 scale-100 opacity-100 text-indigo-600' : '-rotate-90 scale-0 opacity-0 text-slate-400'}
          `}
        />
      </div>
    </button>
  );
}
