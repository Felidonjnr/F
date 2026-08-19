import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'outline'
    | 'stable'
    | 'optimal'
    | 'high'
    | 'critical'
    | 'accent'
    | 'low'
    | 'medium';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const variants: Record<string, string> = {
    default: 'bg-slate-900 text-slate-100 border-transparent',
    secondary: 'bg-slate-100 text-slate-700 border-slate-200',
    outline: 'bg-transparent text-slate-700 border-slate-300',
    accent: 'bg-amber-100 text-amber-900 border-amber-200 font-bold',
    stable: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    optimal: 'bg-sky-50 text-sky-700 border-sky-200',
    high: 'bg-amber-50 text-amber-800 border-amber-200',
    critical: 'bg-rose-50 text-rose-700 border-rose-200',
    low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-50 text-amber-800 border-amber-200',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-bold tracking-tight',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${variants[variant]} ${sizes[size]} shrink-0 transition-colors ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
