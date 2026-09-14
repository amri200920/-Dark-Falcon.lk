import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isOnline?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Falcon User',
  size = 'md',
  isOnline,
  className = '',
}) => {
  const sizeStyles = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-28 h-28 text-2xl',
  };

  const indicatorSizes = {
    xs: 'w-1.5 h-1.5 bottom-0 right-0',
    sm: 'w-2 h-2 bottom-0 right-0',
    md: 'w-2.5 h-2.5 bottom-0.5 right-0.5',
    lg: 'w-3.5 h-3.5 bottom-1 right-1',
    xl: 'w-4 h-4 bottom-1.5 right-1.5',
    '2xl': 'w-5 h-5 bottom-2 right-2',
  };

  const fallback = alt ? alt.charAt(0).toUpperCase() : '🦅';

  return (
    <div className={`relative inline-block select-none shrink-0 ${className}`}>
      <div
        className={`${sizeStyles[size]} rounded-full overflow-hidden bg-[#121826] border border-[#1b2438] flex items-center justify-center font-bold text-slate-300 shadow-sm`}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <span>{fallback}</span>
        )}
      </div>

      {isOnline !== undefined && (
        <span
          className={`absolute rounded-full ring-2 ring-[#06080d] ${
            indicatorSizes[size]
          } ${isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};
