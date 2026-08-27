interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullPage?: boolean;
}

const sizeMap = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-10 w-10' };

export function LoadingSpinner({ size = 'md', text, fullPage = false }: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <svg
        className={`animate-spin ${sizeMap[size]} text-indigo-600`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {spinner}
      </div>
    );
  }
  return spinner;
}

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 rounded-lg bg-gray-100 animate-pulse" style={{ width: `${60 + (i % 3) * 15}%` }} />
        </td>
      ))}
    </tr>
  );
}
