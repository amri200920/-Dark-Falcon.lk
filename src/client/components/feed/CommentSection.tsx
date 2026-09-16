import React, { useState, useEffect } from 'react';
import { Send, CornerDownRight } from 'lucide-react';
import { Comment } from '../../../shared/types';
import { api } from '../../services/api';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../contexts/AuthContext';

interface CommentSectionProps {
  postId: string;
  onOpenProfile?: (username: string) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId, onOpenProfile }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadComments() {
      try {
        const res = await api.get<Comment[]>(`/posts/${postId}/comments`);
        if (res.success) setComments(res.data);
      } catch (e) {
        console.warn('Failed to load comments', e);
      }
    }
    loadComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await api.post<Comment>(`/posts/${postId}/comments`, {
        content: newComment.trim(),
        parentId: replyTo?.id,
      });

      if (res.success && res.data) {
        setComments((prev) => [...prev, res.data]);
        setNewComment('');
        setReplyTo(null);
      }
    } catch (err: any) {
      alert(err.message || 'Could not post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-[#1b2438] space-y-3">
      {/* Comments List */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-2">No comments yet. Be the first to share your thoughts!</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => onOpenProfile?.(c.username)}
                className={onOpenProfile ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
                title={onOpenProfile ? `View @${c.username}'s profile` : undefined}
              >
                <Avatar src={c.userAvatar} alt={c.username} size="xs" />
              </button>
              <div className="flex-1 bg-[#090d15] rounded-xl p-2.5 border border-[#1b2438]">
                <div className="flex items-center justify-between mb-1">
                  <button
                    type="button"
                    onClick={() => onOpenProfile?.(c.username)}
                    className={`font-semibold text-slate-200 ${onOpenProfile ? 'hover:text-falcon-blue transition-colors' : ''}`}
                  >
                    @{c.username}
                  </button>
                  <span className="text-[10px] text-slate-500">
                    {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-300 whitespace-pre-wrap">{c.content}</p>
                <button
                  onClick={() => setReplyTo(c)}
                  className="mt-1 text-[10px] text-falcon-blue hover:underline flex items-center gap-1"
                >
                  <CornerDownRight className="w-2.5 h-2.5" /> Reply
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply Banner */}
      {replyTo && (
        <div className="flex items-center justify-between px-3 py-1 bg-falcon-blue/10 rounded-lg text-xs text-falcon-blue">
          <span>Replying to @{replyTo.username}</span>
          <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Input Composer */}
      {user && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Avatar src={user.avatarUrl} alt={user.displayName} size="xs" />
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyTo ? `Reply to @${replyTo.username}...` : 'Write a comment...'}
            className="flex-1 bg-[#090d15] border border-[#1b2438] rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-falcon-blue"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="p-1.5 rounded-lg bg-falcon-blue hover:bg-falcon-blue-dark disabled:opacity-40 text-white transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
};
