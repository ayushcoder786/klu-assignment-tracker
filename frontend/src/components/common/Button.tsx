type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:   'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
  secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm',
  danger:    'bg-red-500 text-white hover:bg-red-600 shadow-sm',
  ghost:     'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
  success:   'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-sm',
};

export function Button({
  variant = 'primary', size = 'md', loading = false,
  icon, fullWidth = false, children, disabled, className = '', ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        ${variantStyles[variant]} ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        inline-flex items-center justify-center gap-2 rounded-xl font-semibold
        transition-all duration-150 active:scale-[0.98] cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
        </svg>
      ) : icon}
      {children}
    </button>
  );
}
