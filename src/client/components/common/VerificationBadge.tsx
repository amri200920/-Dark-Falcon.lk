import React from 'react';

interface VerificationBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTooltip?: boolean;
}

const sizeMap = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  size = 'md',
  className = '',
  showTooltip = true,
}) => {
  const sizeClass = sizeMap[size] || sizeMap.md;

  return (
    <span
      className={`inline-flex items-center justify-center relative group select-none ${className}`}
      title={showTooltip ? 'Dark Falcon Verified 🦅' : undefined}
    >
      <svg
        className={`${sizeClass} filter drop-shadow-[0_0_8px_rgba(0,180,255,0.7)] transition-transform duration-300 hover:scale-110`}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Sovereign Metallic / Electric Blue Radial Gradient */}
          <radialGradient
            id="falconBadgeGlow"
            cx="50%"
            cy="30%"
            r="70%"
            fx="50%"
            fy="30%"
          >
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="45%" stopColor="#0284c7" />
            <stop offset="85%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#082f49" />
          </radialGradient>

          {/* Electric Edge Highlight */}
          <linearGradient id="falconShieldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          {/* Golden/Silver Cyber Beak & Feather Accent */}
          <linearGradient id="falconBeakGleam" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>
        </defs>

        {/* Outer 8-Pointed Sovereign Star / Shield Emblem */}
        <path
          d="M24 2
             L29.5 9.5
             L38.5 7.5
             L40.5 16.5
             L48 22
             L43.5 29.5
             L46.5 38.5
             L37.5 41.5
             L33 49
             L24 45.5
             L15 49
             L10.5 41.5
             L1.5 38.5
             L4.5 29.5
             L0 22
             L7.5 16.5
             L9.5 7.5
             L18.5 9.5
             Z"
          transform="scale(0.9) translate(2.6, 1.2)"
          fill="url(#falconBadgeGlow)"
          stroke="url(#falconShieldBorder)"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Inner Geometric Falcon Head & Wings Silhouette */}
        {/* Left Wing */}
        <path
          d="M13 25 C14 19, 18 16, 23 15 L21 19 C18 20, 16 23, 15 27 Z"
          fill="url(#falconBeakGleam)"
          opacity="0.9"
        />
        {/* Right Wing */}
        <path
          d="M35 25 C34 19, 30 16, 25 15 L27 19 C30 20, 32 23, 33 27 Z"
          fill="url(#falconBeakGleam)"
          opacity="0.9"
        />

        {/* Falcon Crest / Crown feathers */}
        <path
          d="M24 10 L26 14 L24 16 L22 14 Z"
          fill="#ffffff"
        />

        {/* Main Falcon Beak & Face Profile */}
        <path
          d="M21 16
             L27 16
             L28 20
             L25.5 24
             L24 28
             L22.5 24
             L20 20
             Z"
          fill="#f8fafc"
        />

        {/* Sharp Hooked Falcon Beak */}
        <path
          d="M24 22 L27 25 L24 29 L23 26 Z"
          fill="#f59e0b"
        />

        {/* Falcon Eye (Electric Cyan Glow) */}
        <circle cx="23" cy="19" r="1.4" fill="#00ffff" />
        <circle cx="23" cy="19" r="0.6" fill="#000000" />
      </svg>

      {/* Tooltip on hover */}
      {showTooltip && (
        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded shadow-lg border border-sky-500/30 whitespace-nowrap z-50">
          Dark Falcon Verified 🦅
        </span>
      )}
    </span>
  );
};
