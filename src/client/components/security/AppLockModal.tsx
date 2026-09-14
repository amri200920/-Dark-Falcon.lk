import React, { useState } from 'react';
import { Lock, Delete } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { BrandLogo } from '../common/BrandLogo';

export const AppLockModal: React.FC = () => {
  const { isAppLocked, unlockApp } = useAuth();
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isAppLocked) return null;

  const handleDigitClick = async (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');

      if (nextPin.length === 4) {
        setIsLoading(true);
        const success = await unlockApp(nextPin);
        setIsLoading(false);
        if (!success) {
          setError('Incorrect PIN. Please try again.');
          setPin('');
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06080d]/95 backdrop-blur-xl select-none">
      <div className="w-full max-w-sm bg-[#0c101a] border border-falcon-blue/40 rounded-3xl p-6 text-center shadow-neon-blue-lg flex flex-col items-center animate-fade-in">
        <BrandLogo variant="emblem" glow className="mb-4" />
        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
          <Lock className="w-5 h-5 text-falcon-blue" />
          Dark Falcon App Lock
        </h2>
        <p className="text-xs text-slate-400 mb-6">Enter your 4-digit security PIN to proceed</p>

        {/* PIN Dots Indicator */}
        <div className="flex gap-4 mb-8">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                idx < pin.length
                  ? 'bg-falcon-blue border-falcon-blue shadow-neon-blue'
                  : 'border-[#1b2438] bg-[#121826]'
              }`}
            />
          ))}
        </div>

        {error && <p className="text-xs text-red-400 font-medium mb-4">{error}</p>}

        {/* Numerical Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigitClick(digit)}
              disabled={isLoading}
              className="h-14 rounded-2xl bg-[#121826] hover:bg-[#1b2438] text-xl font-bold text-slate-100 border border-[#1b2438] active:scale-95 transition-all focus:outline-none"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigitClick('0')}
            disabled={isLoading}
            className="h-14 rounded-2xl bg-[#121826] hover:bg-[#1b2438] text-xl font-bold text-slate-100 border border-[#1b2438] active:scale-95 transition-all focus:outline-none"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="h-14 rounded-2xl bg-[#121826] hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-[#1b2438] flex items-center justify-center active:scale-95 transition-all focus:outline-none"
            title="Delete digit"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
