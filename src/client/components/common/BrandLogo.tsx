import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'compact' | 'emblem' | 'mobile';
  className?: string;
  glow?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  className = '',
  glow = false,
}) => {
  const logoSrc = '/assets/brand/dark-falcon-logo.png';
  const emblemSrc = '/assets/brand/dark-falcon-emblem.png';

  if (variant === 'emblem') {
    return (
      <div
        className={`relative inline-flex items-center justify-center overflow-hidden rounded-2xl p-0.5 transition-transform duration-300 hover:scale-105 ${glow ? 'shadow-neon-blue' : ''} ${className}`}
      >
        <img
          src={emblemSrc}
          alt="Dark Falcon Emblem"
          className="h-10 w-10 object-cover rounded-xl object-center"
          loading="eager"
        />
      </div>
    );
  }

  // Optimized responsive compact mobile header branding
  if (variant === 'compact' || variant === 'mobile') {
    return (
      <div className={`flex items-center gap-2 select-none ${className}`}>
        <div className="relative h-7 w-7 sm:h-8 sm:w-8 overflow-hidden rounded-lg bg-slate-900 border border-falcon-blue/40 shadow-sm flex items-center justify-center shrink-0">
          <img
            src={emblemSrc}
            alt="Dark Falcon Logo"
            className="h-full w-full object-cover object-top"
          />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold tracking-wide text-xs sm:text-sm text-white flex items-center gap-1 leading-none">
            DARK FALCON <span className="text-falcon-blue text-[10px]">🦅</span>
          </span>
          <span className="text-[9px] text-slate-400 tracking-tight leading-none mt-0.5 hidden xs:inline">
            Connect. Create. Communicate.
          </span>
        </div>
      </div>
    );
  }

  // Full Logo Variant
  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div className="relative group">
        <img
          src={logoSrc}
          alt="Dark Falcon logo — Connect. Create. Communicate."
          className={`h-auto max-h-56 w-auto max-w-full object-contain rounded-2xl transition-all duration-500 ${
            glow ? 'drop-shadow-[0_0_25px_rgba(0,166,255,0.45)]' : ''
          }`}
          loading="eager"
        />
      </div>
    </div>
  );
};
