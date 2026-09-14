import React, { useState } from 'react';
import { Mail, Lock, Phone, ArrowRight, Chrome, ShieldCheck, Check, ExternalLink, Sparkles } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface LoginPageProps {
  onGoToRegister: () => void;
  onGoToLanding: () => void;
  onDemoLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onGoToRegister,
  onGoToLanding,
  onDemoLogin,
}) => {
const { login, googleLogin, phoneOtpRequest, sendFirebasePasswordReset } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'password' | 'phone'>('password');
  // Google sign-in modal state
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleModalReason, setGoogleModalReason] = useState<'config' | 'popup' | 'domain' | 'custom'>('config');
  // Phone auth state
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNotice, setPhoneNotice] = useState<string | null>(null);

  // Account recovery state
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);
  const [recIdentifier, setRecIdentifier] = useState('');
  const [recCode, setRecCode] = useState('');
  const [recNewPassword, setRecNewPassword] = useState('');
  const [recConfirmPassword, setRecConfirmPassword] = useState('');
  const [recMaskedEmail, setRecMaskedEmail] = useState('');
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState('');
  const [recSuccess, setRecSuccess] = useState('');

  const handleOpenRecovery = () => {
    setRecIdentifier(identifier || '');
    setRecoveryStep(1);
    setRecError('');
    setRecSuccess('');
    setIsRecoveryOpen(true);
  };

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recIdentifier.trim()) {
      setRecError('Please enter your username or email address.');
      return;
    }
    setRecLoading(true);
    setRecError('');
    try {
      const res = await api.post('/auth/recovery/request', { identifier: recIdentifier.trim() });
      if (res.success && res.data) {
        setRecMaskedEmail(res.data.maskedEmail);
        // recoveryCode is NOT returned in production for security reasons.
        // User must obtain the code via admin or use their Master Recovery Key.
        setRecCode('');
        setRecoveryStep(2);
      }
    } catch (err: any) {
      setRecError(err.message || 'Failed to request account recovery.');
    } finally {
      setRecLoading(false);
    }
  };

  const handleSendFirebaseReset = async () => {
    if (!recIdentifier.trim() || !recIdentifier.includes('@')) {
      setRecError('Please enter a valid email address to send a Firebase reset link.');
      return;
    }
    setRecLoading(true);
    setRecError('');
    setRecSuccess('');
    try {
      await sendFirebasePasswordReset(recIdentifier.trim());
      setRecSuccess(`Official Firebase password reset email sent to ${recIdentifier.trim()}. Please check your inbox.`);
    } catch (err: any) {
      setRecError(err.message || 'Failed to send Firebase password reset email.');
    } finally {
      setRecLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recCode.trim()) {
      setRecError('Please enter the 6-digit verification code.');
      return;
    }
    if (recNewPassword.length < 8) {
      setRecError('New password must be at least 8 characters long.');
      return;
    }
    if (recNewPassword !== recConfirmPassword) {
      setRecError('Passwords do not match. Please re-enter.');
      return;
    }

    setRecLoading(true);
    setRecError('');
    try {
      const isKey = recCode.trim().length >= 12;
      const res = await api.post('/auth/recovery/verify-and-reset', {
        identifier: recIdentifier.trim(),
        code: isKey ? undefined : recCode.trim(),
        recoveryKey: isKey ? recCode.trim() : undefined,
        newPassword: recNewPassword,
      });

      if (res.success) {
        setRecSuccess('Password successfully reset! Logging you in...');
        if (res.data?.token) {
          localStorage.setItem('falcon_token', res.data.token);
          // Auto login by reloading or triggering login
          setTimeout(() => {
            window.location.reload();
          }, 800);
        } else {
          setTimeout(() => {
            setIsRecoveryOpen(false);
          }, 1200);
        }
      }
    } catch (err: any) {
      setRecError(err.message || 'Failed to verify recovery code.');
    } finally {
      setRecLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(identifier.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Invalid username/password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setIsLoading(true);
    try {
      await googleLogin();
    } catch (err: any) {
      console.warn('Google sign-in exception:', err);
      if (
        err.code === 'auth/configuration-not-found' ||
        err.message?.includes('CONFIGURATION_NOT_FOUND') ||
        err.code === 'auth/operation-not-allowed'
      ) {
        setGoogleModalReason('config');
        setIsGoogleModalOpen(true);
      } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setGoogleModalReason('popup');
        setIsGoogleModalOpen(true);
      } else if (err.code === 'auth/unauthorized-domain') {
        setGoogleModalReason('domain');
        setIsGoogleModalOpen(true);
      } else {
        setError(err.message || 'Google sign-in failed. Please check network and popups.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setIsLoading(true);
    setPhoneNotice(null);
    try {
      await phoneOtpRequest(phone, countryCode);
    } catch (err: any) {
      if (err.code === 'SMS_CONFIG_REQUIRED' || err.status === 503) {
        setPhoneNotice('âš ï¸ Phone OTP requires Twilio or Firebase SMS provider configuration in the server .env file.');
      } else {
        setError(err.message || 'Failed to request OTP');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080d] flex flex-col items-center justify-center p-4 relative select-none">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-falcon-blue/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Official Dark Falcon Logo above authentication card */}
      <div className="mb-6 flex flex-col items-center cursor-pointer" onClick={onGoToLanding}>
        <BrandLogo variant="emblem" glow className="w-14 h-14 mb-2" />
        <h1 className="text-xl font-extrabold text-white tracking-wider flex items-center gap-1.5">
          DARK FALCON <span className="text-falcon-blue text-sm">ðŸ¦…</span>
        </h1>
        <p className="text-xs text-slate-400">Connect. Create. Communicate.</p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-[#0c101a] border border-[#1b2438] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-fade-in">
        <h2 className="text-xl font-bold text-white mb-1">Welcome Back</h2>
        <p className="text-xs text-slate-400 mb-6">Enter your sovereign credentials to proceed</p>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-[#090d15] p-1 border border-[#1b2438] mb-5 text-xs">
          <button
            type="button"
            onClick={() => setAuthMode('password')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
              authMode === 'password' ? 'bg-falcon-blue text-white' : 'text-slate-400'
            }`}
          >
            Email / Username
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('phone')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
              authMode === 'phone' ? 'bg-falcon-blue text-white' : 'text-slate-400'
            }`}
          >
            Phone Number
          </button>
        </div>

        {authMode === 'password' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username or Email"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. cyber_falcon or pilot@darkfalcon.io"
              icon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              icon={<Lock className="w-4 h-4" />}
            />

            <div className="flex justify-end -mt-2">
              <button
                type="button"
                onClick={handleOpenRecovery}
                className="text-[11px] text-falcon-blue hover:text-falcon-blueGlow font-medium hover:underline transition-colors"
              >
                Forgot Password / Account Recovery?
              </button>
            </div>

            <Button type="submit" variant="glow" className="w-full" isLoading={isLoading}>
              Sign In to Dark Falcon
            </Button>
          </form>
        ) : (
          <form onSubmit={handlePhoneRequest} className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-20 bg-[#0c101a] text-slate-100 text-sm rounded-xl border border-[#1b2438] p-2.5 text-center focus:outline-none focus:border-falcon-blue"
              />
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Mobile number..."
                icon={<Phone className="w-4 h-4" />}
              />
            </div>

            {phoneNotice && (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-300">
                {phoneNotice}
              </div>
            )}

            <Button type="submit" variant="glow" className="w-full" isLoading={isLoading}>
              Send Verification Code
            </Button>
          </form>
        )}

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#1b2438]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0c101a] px-2 text-slate-500">Or Continue With</span>
          </div>
        </div>

        {/* Quick OAuth & Demo Buttons */}
        <div className="space-y-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            icon={<Chrome className="w-4 h-4 text-white" />}
            onClick={handleGoogleAuth}
          >
            Sign in with Google
          </Button>

          <div className="text-center pt-0.5">
            <button
              type="button"
              onClick={() => {
                setGoogleModalReason('custom');
                setIsGoogleModalOpen(true);
              }}
              className="text-[11px] text-slate-400 hover:text-falcon-blue transition-colors inline-flex items-center gap-1 font-medium"
            >
              <Sparkles className="w-3 h-3 text-falcon-blue" />
              Having popup issues? Use Google Fast-Pass âš¡
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full text-xs"
            onClick={onDemoLogin}
          >
            âš¡ Quick Launch: Demo Aviator Account
          </Button>
        </div>

        {/* Bottom Link */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Don't have a sovereign account?{' '}
          <button
            onClick={onGoToRegister}
            className="text-falcon-blue font-semibold hover:underline"
          >
            Create Account
          </button>
        </p>
      </div>

      {/* Account Recovery Modal */}
      <Modal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        title="Account Recovery & Password Reset"
      >
        <div className="space-y-4 text-xs">
          {recError && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400">
              {recError}
            </div>
          )}

          {recSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              {recSuccess}
            </div>
          )}

          {recoveryStep === 1 ? (
            <form onSubmit={handleRequestRecovery} className="space-y-4">
              <p className="text-slate-400 leading-relaxed">
                Enter your Dark Falcon username or registered email address. We will verify your account and provide a 6-digit recovery verification code.
              </p>

              <Input
                label="Username or Email Address"
                type="text"
                required
                value={recIdentifier}
                onChange={(e) => setRecIdentifier(e.target.value)}
                placeholder="e.g. darkfalcon_admin or pilot@darkfalcon.io"
                icon={<Mail className="w-4 h-4" />}
              />

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setIsRecoveryOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="glow"
                  className="flex-1"
                  isLoading={recLoading}
                >
                  Request Recovery Code
                </Button>
              </div>

              {recIdentifier.includes('@') && (
                <div className="pt-2 border-t border-[#1b2438] text-center">
                  <button
                    type="button"
                    onClick={handleSendFirebaseReset}
                    className="text-xs text-falcon-blue hover:text-white underline transition-colors"
                  >
                    Or send official password reset email via Firebase âœ‰ï¸
                  </button>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleVerifyAndReset} className="space-y-4">
              <div className="p-3 bg-[#090d15] rounded-xl border border-[#1b2438] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Account Identified:</span>
                  <span className="font-bold text-white text-xs">@{recIdentifier}</span>
                </div>
                {recMaskedEmail && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Associated Email:</span>
                    <span className="font-mono text-falcon-blue text-[11px]">{recMaskedEmail}</span>
                  </div>
                )}
              </div>


              {/* Secure Recovery Instructions */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>How to obtain your recovery code</span>
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1 pl-1">
                  <li>â€¢ Contact your platform administrator to retrieve the 6-digit code for your account.</li>
                  <li>â€¢ Alternatively, enter your <span className="text-falcon-blue font-semibold">Master Recovery Key</span> (the long key shown during registration).</li>
                </ul>
              </div>

              <Input
                label="6-Digit Code or Master Recovery Key"
                type="text"
                required
                value={recCode}
                onChange={(e) => setRecCode(e.target.value)}
                placeholder="123456  or  your-master-recovery-key"
                icon={<ShieldCheck className="w-4 h-4" />}
              />


              <Input
                label="New Password"
                type="password"
                required
                value={recNewPassword}
                onChange={(e) => setRecNewPassword(e.target.value)}
                placeholder="At least 8 characters..."
                icon={<Lock className="w-4 h-4" />}
              />

              <Input
                label="Confirm New Password"
                type="password"
                required
                value={recConfirmPassword}
                onChange={(e) => setRecConfirmPassword(e.target.value)}
                placeholder="Repeat new password..."
                icon={<Lock className="w-4 h-4" />}
              />

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setRecoveryStep(1)}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="glow"
                  className="flex-1"
                  isLoading={recLoading}
                >
                  Reset Password & Sign In
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Google Authentication & Fast-Pass Modal */}
      <Modal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        title="Google Authentication Options ðŸ¦…"
      >
        <div className="space-y-4 text-xs text-slate-300">
          {googleModalReason === 'config' && (
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Firebase Project Configuration Required</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Firebase returned <span className="font-mono text-amber-300">CONFIGURATION_NOT_FOUND</span>. This occurs when the <span className="text-white font-bold">Google</span> sign-in provider has not yet been toggled ON in the Firebase Console for project <span className="font-mono text-white">dark-falcon-966bc</span>.
              </p>
              <div className="pt-1">
                <a
                  href="https://console.firebase.google.com/project/dark-falcon-966bc/authentication/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-falcon-blue hover:text-white bg-falcon-blue/20 hover:bg-falcon-blue/40 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open Firebase Console to Enable Google â†—
                </a>
              </div>
            </div>
          )}

          {googleModalReason === 'popup' && (
            <div className="p-3.5 rounded-2xl bg-blue-500/15 border border-blue-500/30 space-y-1">
              <p className="font-bold text-blue-400">Google Popup Blocked or Closed</p>
              <p className="text-[11px] text-slate-300">
                The Google OAuth popup was closed or blocked by your browser. You can allow popups, or log in immediately using Google Fast-Pass below.
              </p>
            </div>
          )}

          {googleModalReason === 'domain' && (
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 space-y-1">
              <p className="font-bold text-amber-400">Authorized Domain Notice</p>
              <p className="text-[11px] text-slate-300">
                Please ensure this domain is added to Authorized Domains in your Firebase Console authentication settings.
              </p>
            </div>
          )}

          {/* Instant Google Fast-Pass Form */}
          <div className="p-4 rounded-2xl bg-[#090d15] border border-[#1b2438] space-y-3">
            <div className="flex items-center gap-2">
              <Chrome className="w-4 h-4 text-falcon-blue" />
              <h4 className="font-bold text-white text-xs">Instant Google Fast-Pass</h4>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Log in with your Google account email. Dark Falcon will automatically create your sovereign aviator account, sync Google credentials, and establish your authenticated session.
            </p>

          </div>
        </div>
      </Modal>
    </div>
  );
};


