import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Lock,
  UserX,
  FileText,
  AlertTriangle,
  HelpCircle,
  Download,
  Key,
  MessageSquare,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQ_DATABASE: FAQItem[] = [
  {
    id: 'e2ee-1',
    category: 'Privacy & Security',
    question: 'How does End-to-End Encryption (E2EE) work in Dark Falcon?',
    answer:
      'Dark Falcon uses established industry-standard cryptography: Elliptic Curve Diffie-Hellman (ECDH) over NIST curve P-256 for key agreement and AES-GCM-256 for symmetric payload encryption. Keys are generated client-side in your browser/device. The server only acts as a blind transit courier and never sees your plaintext messages or attachments.',
  },
  {
    id: 'e2ee-2',
    category: 'Privacy & Security',
    question: 'Can Dark Falcon AI read my encrypted private messages?',
    answer:
      'No. Under our Zero-Knowledge architecture, private E2EE messages are never automatically sent to Dark Falcon AI or any third-party provider. AI features only process content when you explicitly invoke them via the AI Assistant panel or composer action.',
  },
  {
    id: 'account-1',
    category: 'Account Management',
    question: 'How do I recover my account if I lose my password?',
    answer:
      'You can recover your account using either: (1) Your Master Recovery Key shown during registration, (2) An administrator-verified 6-digit recovery code protected with brute-force lockout, or (3) Official Firebase password reset email delivered to your registered inbox.',
  },
  {
    id: 'account-2',
    category: 'Account Management',
    question: 'How do I permanently delete my account and data?',
    answer:
      'In compliance with Google Play and global privacy standards, you can delete your account at any time by going to Settings → Data Control → Deactivate / Delete Account. Confirming deletion immediately wipes your profile, sessions, credentials, and notification history from our database.',
  },
  {
    id: 'data-1',
    category: 'Data Control',
    question: 'How can I export my personal data?',
    answer:
      'Navigate to Settings → Data Control and select "Export Account Data". A full JSON export of your profile, post summaries, and configuration will be generated and downloaded to your device.',
  },
  {
    id: 'calling-1',
    category: 'Voice & Video Calls',
    question: 'Are calls secure and peer-to-peer?',
    answer:
      'Yes. Dark Falcon uses WebRTC peer connections with standard STUN/TURN relays. Audio and video streams travel directly between call participants using DTLS-SRTP encryption.',
  },
  {
    id: 'safety-1',
    category: 'Safety & Reporting',
    question: 'How do I report inappropriate content or harassment?',
    answer:
      'Click the options menu (three dots) on any post, comment, message, or user profile and select "Report". Our moderation team reviews reports under our zero-tolerance safety policies.',
  },
];

export const HelpCenterPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'Privacy & Security', 'Account Management', 'Data Control', 'Voice & Video Calls', 'Safety & Reporting'];

  const filteredFAQs = FAQ_DATABASE.filter((faq) => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 select-none">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#0c1220] via-[#090d16] to-[#05070c] border border-[#1b2438] rounded-3xl p-8 shadow-xl text-center space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-falcon-blue/10 rounded-full blur-3xl pointer-events-none" />

        <BrandLogo variant="emblem" glow className="w-12 h-12 mx-auto" />
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
          Dark Falcon <span className="text-falcon-blue">Help & Safety Center</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Clear documentation, privacy standards, security policies, and user safety guides for the Dark Falcon ecosystem.
        </p>

        {/* Search Bar */}
        <div className="max-w-md mx-auto relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides, E2EE, account deletion, recovery..."
            className="w-full bg-[#070a10] border border-[#1b2438] rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-falcon-blue shadow-inner"
          />
        </div>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize shrink-0 transition-colors ${
              selectedCategory === cat
                ? 'bg-falcon-blue text-white shadow-neon-blue'
                : 'bg-[#0c101a] border border-[#1b2438] text-slate-400 hover:text-white'
            }`}
          >
            {cat === 'all' ? 'All Topics' : cat}
          </button>
        ))}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#090d16] border border-[#1b2438] space-y-2">
          <div className="p-2.5 rounded-xl bg-falcon-blue/15 text-falcon-blue w-fit">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Cryptographic Audit</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Review technical documentation on our ECDH P-256 and AES-GCM-256 E2EE implementation.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#090d16] border border-[#1b2438] space-y-2">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 w-fit">
            <Download className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Data Portability</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Download an offline JSON archive of your personal profile, contacts, and settings at any time.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#090d16] border border-[#1b2438] space-y-2">
          <div className="p-2.5 rounded-xl bg-red-500/15 text-red-400 w-fit">
            <UserX className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Account Deletion</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Permanent account de-registration policy compliant with Google Play Data Safety requirements.
          </p>
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="bg-[#090d16] border border-[#1b2438] rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <HelpCircle className="w-4 h-4 text-falcon-blue" />
          Frequently Answered Questions ({filteredFAQs.length})
        </h2>

        {filteredFAQs.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500">
            No matching help articles found for "{searchQuery}". Try a different search keyword.
          </div>
        ) : (
          filteredFAQs.map((faq) => (
            <div
              key={faq.id}
              className="p-4 rounded-2xl bg-[#06080e] border border-[#141d30] space-y-2 hover:border-falcon-blue/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-falcon-blue font-mono">
                  {faq.category}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white">{faq.question}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{faq.answer}</p>
            </div>
          ))
        )}
      </div>

      {/* Legal & Policy Links */}
      <div className="p-4 rounded-2xl bg-[#06080e] border border-[#1b2438] flex items-center justify-between text-xs text-slate-400">
        <span>Dark Falcon Platform Compliance • Version 1.0.0</span>
        <div className="flex items-center gap-4">
          <a href="#privacy-policy" className="hover:text-falcon-blue underline">
            Privacy Policy
          </a>
          <a href="#terms" className="hover:text-falcon-blue underline">
            Terms of Service
          </a>
        </div>
      </div>
    </div>
  );
};
