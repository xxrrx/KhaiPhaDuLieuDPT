import React, { useState, useEffect } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { socialService } from '../../services/socialService';
import { useToast } from '../../hooks/useToast';
import { timeAgo } from '../../utils/formatters';
import useAuthStore from '../../store/authStore';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function PostComments({ postId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuthStore();
  const toast = useToast();

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    socialService.getComments(postId, { limit: 50 })
      .then((res) => setComments(res.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await socialService.addComment(postId, text.trim());
      if (res.success) {
        setComments((prev) => [...prev, { ...res.data, user: { id: user.id, username: user.username, avatar_url: user.avatar_url } }]);
        setText('');
      }
    } catch {
      toast.error('Không thể gửi bình luận');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await socialService.deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch {
      toast.error('Không thể xóa bình luận');
    }
  };

  if (loading) return <LoadingSpinner size="sm" className="py-4" />;

  return (
    <div className="space-y-3">
      <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-2 group">
            <div className="w-6 h-6 rounded-full bg-zinc-700 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">
              {c.user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 bg-zinc-800 rounded-lg px-3 py-2">
              <span className="text-xs font-medium text-zinc-300 mr-2">{c.user?.username}</span>
              <span className="text-xs text-zinc-200">{c.content}</span>
              <p className="text-xs text-zinc-600 mt-0.5">{timeAgo(c.created_at)}</p>
            </div>
            {user?.id === c.user?.id && (
              <button
                onClick={() => handleDelete(c.id)}
                className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
        {!comments.length && <p className="text-xs text-zinc-600 text-center py-3">Chưa có bình luận nào</p>}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Viết bình luận..."
          className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500"
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="p-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 transition-colors"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
