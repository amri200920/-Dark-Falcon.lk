import React from 'react';
import { Shield, ShieldAlert } from 'lucide-react';
import { UserRole } from '../../../shared/types';
import { VerificationBadge } from './VerificationBadge';

interface BadgeProps {
  role?: UserRole;
  isVerified?: boolean;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({ role, isVerified, className = '', size = 'sm' }) => {
  if (role === 'super_admin') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 ${className}`}
        title="Super Administrator"
      >
        <ShieldAlert className="w-3 h-3" />
        SUPER ADMIN
      </span>
    );
  }

  if (role === 'admin') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-falcon-blue/20 text-falcon-blue border border-falcon-blue/40 ${className}`}
        title="Administrator"
      >
        <Shield className="w-3 h-3" />
        ADMIN
      </span>
    );
  }

  if (role === 'moderator') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 ${className}`}
        title="Moderator"
      >
        <Shield className="w-3 h-3" />
        MOD
      </span>
    );
  }

  if (isVerified) {
    return <VerificationBadge size={size} className={className} />;
  }

  return null;
};

