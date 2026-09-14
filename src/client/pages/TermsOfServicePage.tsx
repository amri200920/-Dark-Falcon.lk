import React from 'react';
import { ArrowLeft, ShieldCheck, Scale } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';

export const TermsOfServicePage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 text-slate-300 text-xs sm:text-sm leading-relaxed select-none">
      <div className="p-6 rounded-3xl bg-[#090d16] border border-[#1b2438] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo variant="emblem" glow className="w-8 h-8" />
          <div>
            <h1 className="text-lg font-bold text-white">Dark Falcon Terms of Service</h1>
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
            <Scale className="w-4 h-4 text-falcon-blue" />
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using the Dark Falcon platform (Web, Android, Desktop, or TV), you agree to be bound by these Terms of Service. If you disagree with any portion of these terms, you may discontinue use and delete your account at any time.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            2. Responsible Use & Community Standards
          </h2>
          <p>
            Dark Falcon is dedicated to empowering sovereign and constructive global communication. Users agree not to engage in:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li>Unlawful harassment, defamation, threats, or abuse against any individual.</li>
            <li>Distribution of malware, unauthorized surveillance, or automated scraping.</li>
            <li>Impersonation of official platform administrators, organizations, or public figures.</li>
            <li>Violation of third-party intellectual property or privacy rights.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. User Content & Ownership</h2>
          <p>
            You retain full intellectual property rights to the content, media, and messages you create and share on Dark Falcon. By posting public content, you grant Dark Falcon a non-exclusive license solely to host and display your content to your intended audience.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">4. Account Security & Master Recovery Key</h2>
          <p>
            You are responsible for safeguarding your credentials and your Master Recovery Key. Dark Falcon cannot retrieve lost E2EE private keys because they never leave your device.
          </p>
        </section>

        <section className="space-y-2 pt-4 border-t border-[#1b2438]">
          <h2 className="text-base font-bold text-white">5. Governing Law & Inquiries</h2>
          <p>
            These terms are governed by standard international software service frameworks. For questions regarding compliance, email{' '}
            <span className="text-falcon-blue font-mono">legal@darkfalcon.io</span>.
          </p>
        </section>
      </div>
    </div>
  );
};
