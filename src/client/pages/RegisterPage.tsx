import React, { useState } from 'react';
import { Mail, User as UserIcon, Lock, Sparkles, Check, X } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuth } from '../contexts/AuthContext';

interface RegisterPageProps {
  onGoToLogin: () => void;
  onGoToLanding: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onGoToLogin, onGoToLanding }) => {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password strength logic
  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = calculateStrength(password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-amber-500', 'bg-sky-500', 'bg-emerald-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await register(email.trim(), username.trim(), displayName.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Try a different username or email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080d] flex flex-col items-center justify-center p-4 relative select-none">
      {/* Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-falcon-blue/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Official Dark Falcon Logo */}
      <div className="mb-5 flex flex-col items-center cursor-pointer" onClick={onGoToLanding}>
        <BrandLogo variant="emblem" glow className="w-14 h-14 mb-2" />
        <h1 className="text-xl font-extrabold text-white tracking-wider flex items-center gap-1.5">
          DARK FALCON <span className="text-falcon-blue text-sm">🦅</span>
        </h1>
        <p className="text-xs text-slate-400">Connect. Create. Communicate.</p>
      </div>

      {/* Register Card */}
      <div className="w-full max-w-md bg-[#0c101a] border border-[#1b2438] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-fade-in">
        <h2 className="text-xl font-bold text-white mb-1">Create Account</h2>
        <p className="text-xs text-slate-400 mb-5">Claim your unique sovereign username</p>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="pilot@darkfalcon.io"
            icon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Unique Username (3–30 characters)"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
            placeholder="e.g. cyber_falcon"
            icon={<UserIcon className="w-4 h-4" />}
          />

          <Input
            label="Display Name"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Falcon Aviator"
            icon={<Sparkles className="w-4 h-4" />}
          />

          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            icon={<Lock className="w-4 h-4" />}
          />

          {/* Password strength meter */}
          {password && (
            <div className="space-y-1">
              <div className="flex gap-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                {[0, 1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`flex-1 transition-all duration-300 ${
                      strength > step ? strengthColors[strength - 1] : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-slate-400 text-right font-medium">
                Strength: {strengthLabels[strength - 1] || 'Too short'}
              </p>
            </div>
          )}

          <Input
            label="Confirm Password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            icon={<Lock className="w-4 h-4" />}
          />

          <Button type="submit" variant="glow" className="w-full mt-2" isLoading={isLoading}>
            Join Dark Falcon 🦅
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <button onClick={onGoToLogin} className="text-falcon-blue font-semibold hover:underline">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};
