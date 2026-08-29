import React from 'react';

export interface SwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  'aria-label'?: string;
}

const sizeConfig = {
  sm: {
    track: 'h-5 w-9',
    thumb: 'h-4 w-4',
    translate: 'translate-x-4',
  },
  md: {
    track: 'h-6 w-11',
    thumb: 'h-5 w-5',
    translate: 'translate-x-5',
  },
  lg: {
    track: 'h-7 w-12',
    thumb: 'h-6 w-6',
    translate: 'translate-x-5',
  },
};

export function Switch({
  id,
  checked,
  onChange,
  disabled = false,
  label,
  className = '',
  size = 'md',
  'aria-label': ariaLabel,
}: SwitchProps) {
  const config = sizeConfig[size];

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel || label}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        relative inline-flex shrink-0
        ${config.track}
        rounded-full border-2 border-transparent
        cursor-pointer transition-colors duration-200 ease-in-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2
        focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#090d1a]
        disabled:opacity-40 disabled:cursor-not-allowed
        ${
          checked
            ? 'bg-violet-600 hover:bg-violet-500 shadow-xs shadow-violet-950/30'
            : 'bg-slate-300 hover:bg-slate-400/80 dark:bg-slate-700/80 dark:hover:bg-slate-600/80'
        }
        ${className}
      `}
    >
      <span
        aria-hidden="true"
        className={`
          pointer-events-none inline-block
          ${config.thumb}
          rounded-full bg-white
          shadow-md shadow-black/25 ring-0
          transition duration-200 ease-in-out transform
          ${checked ? config.translate : 'translate-x-0'}
        `}
      />
    </button>
  );
}
