import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center max-w-md mx-auto ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
          {icon}
        </div>
      )}
      <h4 className="text-sm sm:text-base font-bold text-slate-800">{title}</h4>
      {description && (
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
