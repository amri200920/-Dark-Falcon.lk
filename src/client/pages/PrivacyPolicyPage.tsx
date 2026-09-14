import React from 'react';
import { Shield, ArrowLeft, Lock, FileText, CheckCircle2 } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';

export const PrivacyPolicyPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 text-slate-300 text-xs sm:text-sm leading-relaxed select-none">
      {/* Top Header */}
      <div className="p-6 rounded-3xl bg-[#090d16] border border-[#1b2438] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo variant="emblem" glow className="w-8 h-8" />
          <div>
            <h1 className="text-lg font-bold text-white">Dark Falcon Privacy Policy</h1>
            <p className="text-xs text-slate-400">Effective Date: January 1, 2026 • Version 2.0</p>
          </div>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#121826] border border-[#1b2438] text-xs text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        )}
      </div>

      <div className="p-6 rounded-3xl bg-[#090d16] border border-[#1b2438] space-y-6">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-falcon-blue" />
            1. Core Privacy Philosophy
          </h2>
          <p>
            Dark Falcon 🦅 is engineered around the principle of user sovereignty. We believe your communications, social connections, and data belong strictly to you. We do not sell your personal data to third parties or advertising brokers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            2. End-to-End Encryption (E2EE)
          </h2>
          <p>
            Direct private messages in Dark Falcon use client-side End-to-End Encryption powered by Elliptic Curve Diffie-Hellman (ECDH) over NIST curve P-256 and AES-GCM-256. Cryptographic keys are generated and stored exclusively on your device. Dark Falcon servers act solely as blind transmission relays and cannot read, decrypt, or index your private conversations.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            3. Dark Falcon AI and Privacy
          </h2>
          <p>
            Dark Falcon AI features (including conversation summaries, writing assistance, and smart co-pilots) operate only when explicitly activated by you. Private E2EE conversations are never automatically scanned, ingested, or routed to neural models.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            4. Data Retention & Permanent Account Deletion
          </h2>
          <p>
            In full compliance with Google Play Store Developer Guidelines, GDPR, and global data privacy standards:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li>Users can export their complete account data in JSON format at any time via Settings.</li>
            <li>
              Users can request immediate and permanent account deletion directly within the application (Settings → Data Control → Delete Account) or by contacting our Data Protection Officer.
            </li>
            <li>Upon deletion, all user credentials, sessions, profile records, and notifications are permanently erased from our production databases.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">5. Permissions Used</h2>
          <p>The Android, Desktop, and Web applications may request the following permissions only when actively needed:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li><strong>Camera & Microphone:</strong> For WebRTC video calls, voice messages, and story recording.</li>
            <li><strong>Storage / Media:</strong> To allow you to upload images, videos, or attachments.</li>
            <li><strong>Notifications:</strong> To deliver real-time incoming call alerts and direct message notifications.</li>
          </ul>
        </section>

        <section className="space-y-2 pt-4 border-t border-[#1b2438]">
          <h2 className="text-base font-bold text-white">6. Contact & Support</h2>
          <p>
            For privacy inquiries, data deletion requests, or security audit reports, contact the Dark Falcon Security & Compliance Team at{' '}
            <span className="text-falcon-blue font-mono">support@darkfalcon.io</span>.
          </p>
        </section>
      </div>
    </div>
  );
};
