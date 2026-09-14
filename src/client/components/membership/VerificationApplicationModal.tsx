import React, { useState } from 'react';
import { X, Shield, UploadCloud, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../common/Button';

interface VerificationApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const VerificationApplicationModal: React.FC<VerificationApplicationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [legalFullName, setLegalFullName] = useState('');
  const [knownAs, setKnownAs] = useState('');
  const [category, setCategory] = useState<string>('creator');
  const [documentType, setDocumentType] = useState<string>('national_id');
  const [documentUrl, setDocumentUrl] = useState('');
  const [proofUrls, setProofUrls] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalFullName.trim() || !documentUrl.trim() || !description.trim()) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const proofs = proofUrls
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean);

      const res = await api.post<any>('/memberships/verification/apply', {
        category,
        legalFullName,
        knownAs,
        documentType,
        documentUrl,
        proofUrls: proofs,
        description,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Submission failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred submitting application.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0b101b] border border-[#1d273f] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#1d273f] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-falcon-blue" />
            <h3 className="font-extrabold text-white text-base">Apply for Eagle Verification 🦅</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="p-3 bg-sky-950/30 border border-sky-800/30 rounded-2xl text-sky-300">
            Eagle Badges are reviewed by sovereign administrators. Having an active Verified or Bundle membership guarantees priority review within 24 hours.
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Legal Full Name *</label>
            <input
              type="text"
              required
              value={legalFullName}
              onChange={(e) => setLegalFullName(e.target.value)}
              placeholder="e.g. Kasun Kalhara Perera"
              className="w-full bg-[#121828] border border-[#222e4c] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-falcon-blue"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Known As / Alias (Optional)</label>
            <input
              type="text"
              value={knownAs}
              onChange={(e) => setKnownAs(e.target.value)}
              placeholder="e.g. DJ Falcon, TechSriLanka"
              className="w-full bg-[#121828] border border-[#222e4c] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-falcon-blue"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#121828] border border-[#222e4c] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-falcon-blue"
              >
                <option value="creator">Creator / Influencer</option>
                <option value="developer">Engineer / Developer</option>
                <option value="business">Business / Company</option>
                <option value="public_figure">Public Figure</option>
                <option value="community_leader">Community Leader</option>
                <option value="aviator">Dark Falcon Aviator</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Document Type *</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full bg-[#121828] border border-[#222e4c] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-falcon-blue"
              >
                <option value="national_id">National Identity Card (NIC)</option>
                <option value="passport">Passport</option>
                <option value="driving_license">Driving License</option>
                <option value="business_reg">Business Registration (BR)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Government ID / Document URL or Path *</label>
            <input
              type="text"
              required
              value={documentUrl}
              onChange={(e) => setDocumentUrl(e.target.value)}
              placeholder="e.g. /uploads/nic-scan.jpg or secure cloud link"
              className="w-full bg-[#121828] border border-[#222e4c] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-falcon-blue"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Notability Proof URLs (One per line)</label>
            <textarea
              rows={2}
              value={proofUrls}
              onChange={(e) => setProofUrls(e.target.value)}
              placeholder="https://news.lk/article-about-me&#10;https://github.com/my-profile"
              className="w-full bg-[#121828] border border-[#222e4c] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-falcon-blue"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Why should your account be verified? *</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain why verification is needed to prevent impersonation or build community trust..."
              className="w-full bg-[#121828] border border-[#222e4c] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-falcon-blue"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-3">
            <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isLoading} className="flex items-center gap-2">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Verification Application
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
