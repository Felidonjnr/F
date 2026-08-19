import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'muted' | 'outline' | 'interactive';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', className = '', ...props }, ref) => {
    const variants = {
      default: 'bg-white border border-slate-200/90 shadow-2xs',
      muted: 'bg-slate-50 border border-slate-200/70',
      outline: 'bg-transparent border border-slate-200',
      interactive:
        'bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer',
    };

    return (
      <div
        ref={ref}
        className={`rounded-2xl ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-5 pb-3 sm:p-6 sm:pb-4 border-b border-slate-100 ${className}`} {...props}>
    {children}
  </div>
);

export const CardContent = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-5 sm:p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`p-5 pt-3 sm:p-6 sm:pt-4 border-t border-slate-100 flex items-center justify-between ${className}`}
    {...props}
  >
    {children}
  </div>
);
