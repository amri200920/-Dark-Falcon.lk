import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  rightElement,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full bg-[#0c101a] text-slate-100 text-sm rounded-xl border ${
            error
              ? 'border-red-500/80 focus:ring-red-500/40'
              : 'border-[#1b2438] focus:border-falcon-blue focus:ring-1 focus:ring-falcon-blue/50'
          } py-2.5 ${icon ? 'pl-10' : 'pl-3.5'} ${
            rightElement ? 'pr-10' : 'pr-3.5'
          } placeholder:text-slate-500 transition-colors duration-150 outline-none ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 text-slate-400 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && <span className="text-[11px] text-red-400 font-medium">{error}</span>}
    </div>
  );
};
