import React, { useState, useRef } from 'react';
import { Image, Type, Palette } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Story } from '../../../shared/types';
import { api } from '../../services/api';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: (story: Story) => void;
}

const BG_COLORS = ['#0c101a', '#00477a', '#0072b8', '#3b0764', '#1e1b4b', '#14532d', '#701a75'];

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  onStoryCreated,
}) => {
  const [type, setType] = useState<'image' | 'text'>('text');
  const [text, setText] = useState('');
  const [bgColor, setBgColor] = useState(BG_COLORS[1]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setMediaFile(f);
      setMediaPreview(URL.createObjectURL(f));
      setType('image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let mediaUrl = '';
      if (mediaFile) {
        const uploadRes = await api.upload(mediaFile);
        if (uploadRes.success) mediaUrl = uploadRes.data.url;
      }

      const res = await api.post<Story>('/stories', {
        mediaType: type,
        mediaUrl,
        textContent: text,
        backgroundColor: bgColor,
      });

      if (res.success && res.data) {
        onStoryCreated(res.data);
        setText('');
        setMediaFile(null);
        setMediaPreview(null);
        onClose();
      }
    } catch (e: any) {
      alert(e.message || 'Failed to publish story');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add to Your 24-Hour Story" maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle */}
        <div className="flex rounded-xl bg-[#090d15] p-1 border border-[#1b2438]">
          <button
            type="button"
            onClick={() => setType('text')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 ${
              type === 'text' ? 'bg-falcon-blue text-white' : 'text-slate-400'
            }`}
          >
            <Type className="w-3.5 h-3.5" /> Text Story
          </button>
          <button
            type="button"
            onClick={() => {
              setType('image');
              fileRef.current?.click();
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 ${
              type === 'image' ? 'bg-falcon-blue text-white' : 'text-slate-400'
            }`}
          >
            <Image className="w-3.5 h-3.5" /> Photo / Video
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleMediaSelect}
          className="hidden"
        />

        {/* Text Story Preview / Editor */}
        {type === 'text' && (
          <div>
            <div
              className="w-full h-52 rounded-2xl flex items-center justify-center p-4 shadow-inner mb-3"
              style={{ backgroundColor: bgColor }}
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your story status..."
                className="w-full bg-transparent text-center text-white font-bold text-lg placeholder:text-white/60 focus:outline-none resize-none"
                rows={3}
              />
            </div>

            {/* Color Palette */}
            <div className="flex items-center gap-2 justify-center py-1">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              {BG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setBgColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    bgColor === c ? 'scale-110 border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Image Story Preview */}
        {type === 'image' && (
          <div className="relative w-full h-52 rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-[#1b2438]">
            {mediaPreview ? (
              <img src={mediaPreview} alt="Story preview" className="w-full h-full object-cover" />
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs text-falcon-blue hover:underline"
              >
                Click to choose image or video
              </button>
            )}
          </div>
        )}

        <Button
          type="submit"
          variant="glow"
          className="w-full"
          isLoading={isSubmitting}
          disabled={type === 'text' ? !text.trim() : !mediaFile}
        >
          Share to 24h Story
        </Button>
      </form>
    </Modal>
  );
};
