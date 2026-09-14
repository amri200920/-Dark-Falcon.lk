import React, { useState, useEffect } from 'react';
import { Bookmark, Folder } from 'lucide-react';
import { SavedItem } from '../../shared/types';
import { DEFAULT_COLLECTIONS } from '../../shared/constants';
import { api } from '../services/api';
import { PostCard } from '../components/feed/PostCard';

export const SavedPage: React.FC = () => {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [activeCollection, setActiveCollection] = useState<string>(DEFAULT_COLLECTIONS[0]);

  useEffect(() => {
    async function loadSaved() {
      try {
        const res = await api.get<SavedItem[]>('/saved');
        if (res.success) setSavedItems(res.data);
      } catch (e) {
        console.warn('Saved items error', e);
      }
    }
    loadSaved();
  }, []);

  const filtered = savedItems.filter((s) => s.collectionName === activeCollection);

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-[#0c101a] border border-[#1b2438] rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-amber-400" /> Saved Collections
          </h2>
          <p className="text-[11px] text-slate-400">Your private sovereign bookmark archives</p>
        </div>
      </div>

      {/* Collection Tabs */}
      <div className="flex gap-2 overflow-x-auto text-xs pb-1">
        {DEFAULT_COLLECTIONS.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCollection(c)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
              activeCollection === c
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                : 'bg-[#0c101a] text-slate-400 border border-[#1b2438] hover:text-white'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>{c}</span>
          </button>
        ))}
      </div>

      {/* Items list */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-[#0c101a] border border-[#1b2438] rounded-2xl p-12 text-center text-xs text-slate-500">
            No saved items in this collection yet. Bookmark any post by clicking the bookmark icon on cards.
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id}>
              {item.itemType === 'post' && item.itemData && (
                <PostCard post={item.itemData} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
