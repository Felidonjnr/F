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
    secondary: 'bg-slate-100 text-slate-800 border-slate-200',
    outline: 'bg-transparent text-slate-800 border-slate-300',
    accent: 'bg-amber-100 text-amber-950 border-amber-300 font-bold',
    stable: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',
    optimal: 'bg-sky-50 text-sky-800 border-sky-200 font-semibold',
    high: 'bg-amber-50 text-amber-900 border-amber-300 font-semibold',
    critical: 'bg-rose-50 text-rose-800 border-rose-200 font-semibold',
    low: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',
    medium: 'bg-amber-50 text-amber-900 border-amber-300 font-semibold',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-0.5 font-bold tracking-tight',
    md: 'text-xs px-3 py-1 font-semibold',
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
