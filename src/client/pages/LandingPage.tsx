import React from 'react';
import { MessageSquare, Phone, Sparkles, Shield, Users, Radio } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';
import { Button } from '../components/common/Button';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
  onDemo: () => void;
  onTV?: () => void;
  onHelp?: () => void;
  onPrivacy?: () => void;
  onTerms?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLogin,
  onRegister,
  onDemo,
  onTV,
  onHelp,
  onPrivacy,
  onTerms,
}) => {
  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100 flex flex-col items-center justify-between p-6 relative overflow-hidden select-none">
      {/* Background ambient neon glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-falcon-blue/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Bar */}
      <div className="w-full max-w-6xl flex items-center justify-between z-10 py-2">
        <BrandLogo variant="compact" />
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onLogin}>
            Sign In
          </Button>
          <Button variant="glow" size="sm" onClick={onRegister}>
            Create Account
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="w-full max-w-4xl flex flex-col items-center text-center my-auto z-10 py-10">
        {/* Prominent Official Dark Falcon Logo */}
        <div className="mb-6 hover:scale-105 transition-transform duration-500">
          <BrandLogo variant="full" glow />
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
          DARK FALCON <span className="text-falcon-blue">🦅</span>
        </h1>
        <p className="text-xl sm:text-2xl font-semibold text-falcon-blue-glow tracking-wider uppercase mb-4">
          Connect. Create. Communicate.
        </p>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed mb-8">
          The sovereign all-in-one social and communication platform. Experience ultra-low latency WebRTC calls, 24h stories, short video reels, Gemini AI co-pilots, and end-user security PIN protection.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Button variant="glow" size="lg" onClick={onRegister} className="w-full sm:w-auto">
            Get Started Free
          </Button>
          <Button variant="secondary" size="lg" onClick={onDemo} className="w-full sm:w-auto">
            Launch Demo Mode ⚡
          </Button>
        </div>
      </div>

      {/* Platform Features Showcase */}
      <div className="w-full max-w-6xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 z-10 my-8">
        {[
          { icon: <MessageSquare className="w-5 h-5 text-falcon-blue" />, label: 'Live Messaging', desc: 'Real-time chat & voice notes' },
          { icon: <Phone className="w-5 h-5 text-cyan-400" />, label: 'WebRTC Calls', desc: 'Sovereign 1-to-1 audio & video' },
          { icon: <Sparkles className="w-5 h-5 text-sky-300" />, label: 'Dark Falcon AI', desc: 'Server-side Gemini intelligence' },
          { icon: <Shield className="w-5 h-5 text-indigo-400" />, label: 'App Lock PIN', desc: 'Cryptographic chat protection' },
          { icon: <Users className="w-5 h-5 text-blue-400" />, label: 'Communities', desc: 'Topic-based sovereign groups' },
          { icon: <Radio className="w-5 h-5 text-teal-400" />, label: 'Broadcasts', desc: '1-to-many announcement channels' },
        ].map((f, i) => (
          <div
            key={i}
            className="p-3.5 rounded-2xl bg-[#0c101a]/80 border border-[#1b2438] hover:border-falcon-blue/40 transition-colors text-left"
          >
            <div className="mb-2">{f.icon}</div>
            <h4 className="text-xs font-bold text-white mb-0.5">{f.label}</h4>
            <p className="text-[11px] text-slate-400 leading-tight">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="w-full max-w-6xl pt-6 border-t border-[#1b2438] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 z-10">
        <p>© 2026 Dark Falcon 🦅. Sovereign Architecture.</p>
        <div className="flex flex-wrap items-center gap-4">
          {onTV && (
            <button onClick={onTV} className="hover:text-purple-400 transition-colors flex items-center gap-1 font-semibold">
              TV Experience 📺
            </button>
          )}
          {onHelp && (
            <button onClick={onHelp} className="hover:text-falcon-blue transition-colors">
              Help & Safety
            </button>
          )}
          {onPrivacy && (
            <button onClick={onPrivacy} className="hover:text-falcon-blue transition-colors">
              Privacy Policy
            </button>
          )}
          {onTerms && (
            <button onClick={onTerms} className="hover:text-falcon-blue transition-colors">
              Terms of Service
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
