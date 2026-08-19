import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
  id,
}) => {
  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2.5 select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      <div className="relative">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
            checked
              ? 'bg-slate-900 border-slate-900 text-amber-300 shadow-2xs'
              : 'bg-white border-slate-300 hover:border-slate-400'
          }`}
        >
          {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
      </div>
      {label && <div className="text-xs sm:text-sm font-medium text-slate-900">{label}</div>}
    </label>
  );
};
