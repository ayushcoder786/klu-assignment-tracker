import { forwardRef, useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, helperText, className = '', type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`
              w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900
              placeholder:text-gray-400 outline-none transition-all duration-150
              ${icon ? 'pl-11' : ''}
              ${isPassword ? 'pr-11' : ''}
              ${error
                ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
              }
              ${className}
            `}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {helperText && !error && <p className="text-xs text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
