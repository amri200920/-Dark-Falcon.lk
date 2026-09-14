import React from 'react';
import { Crown } from 'lucide-react';

interface PremiumBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

const sizeMap = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  size = 'md',
  className = '',
  showTooltip = true,
}) => {
  const sizeClass = sizeMap[size] || sizeMap.md;

  return (
    <span
      className={`inline-flex items-center justify-center relative group select-none ${className}`}
      title={showTooltip ? 'Dark Falcon Premium 👑' : undefined}
    >
      <span className="p-0.5 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 text-black shadow-[0_0_8px_rgba(245,158,11,0.5)]">
        <Crown className={`${sizeClass} fill-current stroke-black stroke-[1.5]`} />
      </span>
      {showTooltip && (
        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded shadow-lg border border-amber-500/30 whitespace-nowrap z-50">
          Dark Falcon Premium 👑
        </span>
      )}
    </span>
  );
};
