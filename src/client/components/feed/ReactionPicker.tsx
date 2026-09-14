import React from 'react';
import { REACTION_ICONS } from '../../../shared/constants';
import { ReactionType } from '../../../shared/types';

interface ReactionPickerProps {
  onSelect: (type: ReactionType) => void;
  className?: string;
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect, className = '' }) => {
  return (
    <div
      className={`absolute bottom-full mb-2 left-0 bg-[#0c101a] border border-falcon-blue/30 rounded-full px-3 py-1.5 shadow-neon-blue flex items-center gap-2 z-30 animate-fade-in ${className}`}
    >
      {Object.entries(REACTION_ICONS).map(([key, info]) => (
        <button
          key={key}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(key as ReactionType);
          }}
          className="hover:scale-125 transition-transform duration-150 p-1 text-lg leading-none focus:outline-none"
          title={info.label}
        >
          {info.emoji}
        </button>
      ))}
    </div>
  );
};
