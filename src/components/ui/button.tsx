import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      isLoading = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-all select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

    const variants: Record<string, string> = {
      default: 'bg-slate-900 text-amber-300 hover:bg-slate-800 shadow-2xs',
      accent: 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-2xs font-black',
      outline: 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-2xs',
      secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200/60',
      ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-2xs',
    };

    const sizes: Record<string, string> = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-xs sm:text-sm px-4 py-2.5 gap-2 h-10',
      lg: 'text-sm sm:text-base px-6 py-3 gap-2.5 h-12',
      icon: 'p-2.5 h-10 w-10 shrink-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin mr-1.5" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
