import React, { useState } from 'react';
import { Sparkles, Send, Copy, Check, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { api } from '../../services/api';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const DarkFalconAIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: '🦅 **Greetings, Aviator.** I am **Dark Falcon AI**, your sovereign neural co-pilot powered by Gemini. How may I assist your mission today? Ask questions, generate viral captions, compose hashtags, or rewrite communications.',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);

  const quickPrompts = [
    'Generate 3 viral captions for Dark Falcon launch 🦅⚡',
    'Generate trending hashtags for WebRTC and cyber security',
    'Rewrite in Cyberpunk style: "Join the meeting right now."',
    'Summarize sovereign communication benefits',
  ];

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputPrompt;
    if (!textToSend.trim() || isLoading) return;

    setInputPrompt('');
    const newHistory: ChatMessage[] = [...messages, { role: 'user', text: textToSend }];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        prompt: textToSend,
        history: messages.slice(1), // omit greeting
      });

      if (res.success && res.data) {
        setMessages((prev) => [...prev, { role: 'model', text: res.data.text }]);
        setIsConfigured(res.data.isConfigured !== false);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'API connection unavailable';
      const isAuthError = err?.status === 401 || err?.code === 'AUTH_REQUIRED' || err?.code === 'USER_NOT_FOUND';
      const detail = isAuthError
        ? `${errorMsg} Please sign in to authenticate your neural session.`
        : errorMsg;

      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: `⚠️ **Falcon Neural Link Notice**: ${detail}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const clearHistory = () => {
    setMessages([
      {
        role: 'model',
        text: '🦅 Neural log purged. Standing by for your instructions.',
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto bg-[#0c101a] border border-[#1b2438] rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-[#1b2438] bg-[#070a10] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo variant="emblem" glow className="w-8 h-8" />
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Dark Falcon AI <span className="text-falcon-blue text-xs font-mono">v1.5 PRO</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Server-Side Google Gemini Intelligence • Connect. Create. Communicate.
            </p>
          </div>
        </div>

        <button
          onClick={clearHistory}
          className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-[#121826] transition-colors"
          title="Clear AI conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 text-sm ${
              m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {m.role === 'model' ? (
              <BrandLogo variant="emblem" className="w-8 h-8 shrink-0 mt-1" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 font-bold flex items-center justify-center shrink-0 mt-1">
                You
              </div>
            )}

            <div
              className={`relative max-w-[85%] rounded-2xl p-4 leading-relaxed ${
                m.role === 'user'
                  ? 'bg-falcon-blue text-white rounded-tr-none'
                  : 'bg-[#121826] text-slate-200 rounded-tl-none border border-[#1b2438]'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{m.text}</div>

              {m.role === 'model' && (
                <button
                  onClick={() => copyToClipboard(m.text, idx)}
                  className="mt-2 text-slate-400 hover:text-white text-xs flex items-center gap-1"
                >
                  {copiedIdx === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 text-sm text-falcon-blue">
            <BrandLogo variant="emblem" className="w-8 h-8 animate-pulse-subtle" />
            <div className="flex items-center gap-1 text-xs">
              <span>Dark Falcon AI is synthesizing neural response</span>
              <span className="animate-bounce">...</span>
            </div>
          </div>
        )}
      </div>

      {/* Prompt Suggestions Chips */}
      <div className="px-4 py-2 bg-[#070a10] border-t border-[#1b2438] flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSend(qp)}
            disabled={isLoading}
            className="px-3 py-1 rounded-full bg-[#121826] hover:bg-falcon-blue/15 hover:border-falcon-blue/40 border border-[#1b2438] text-slate-300 hover:text-falcon-blue shrink-0 transition-colors"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-[#070a10] border-t border-[#1b2438]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask Dark Falcon AI anything, request captions, or rewrite..."
            disabled={isLoading}
            className="flex-1 bg-[#0c101a] border border-[#1b2438] rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-falcon-blue"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="p-2.5 rounded-2xl bg-falcon-blue hover:bg-falcon-blue-dark text-white disabled:opacity-40 shadow-neon-blue transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
