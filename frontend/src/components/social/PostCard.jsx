import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { socialService } from '../../services/socialService';
import { useToast } from '../../hooks/useToast';
import { timeAgo } from '../../utils/formatters';
import useAuthStore from '../../store/authStore';

export default function PostCard({ post, onDelete, onComment }) {
  const [liked, setLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const { user } = useAuthStore();
  const toast = useToast();

  const handleLike = async () => {
    try {
      if (liked) {
        await socialService.unlikePost(post.id);
        setLiked(false);
        setLikesCount((n) => Math.max(0, n - 1));
      } else {
        await socialService.likePost(post.id);
        setLiked(true);
        setLikesCount((n) => n + 1);
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Xóa bài viết này?')) return;
    try {
      await socialService.deletePost(post.id);
      onDelete?.(post.id);
      toast.success('Đã xóa');
    } catch {
      toast.error('Không thể xóa');
    }
  };

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link to={`/social/users/${post.user?.id}`} className="flex items-center gap-2.5">
          {post.user?.avatar_url ? (
            <img src={post.user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white text-sm font-bold">
              {post.user?.username?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-white">{post.user?.full_name || post.user?.username}</p>
            <p className="text-xs text-zinc-500">{timeAgo(post.created_at)}</p>
          </div>
        </Link>
        {user?.id === post.user?.id && (
          <button onClick={handleDelete} className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="aspect-square bg-zinc-800">
          <img src={post.image_url} alt="Post" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Caption */}
      {post.caption && (
        <div className="px-4 py-2">
          <p className="text-sm text-zinc-200">{post.caption}</p>
        </div>
      )}

      {/* Product link */}
      {post.product && (
        <div className="px-4 pb-2">
          <Link to={`/products/${post.product.id}`} className="text-xs text-rose-400 hover:underline">
            🛍 {post.product.name}
          </Link>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-4 border-t border-zinc-800">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-rose-400' : 'text-zinc-500 hover:text-rose-400'}`}
        >
          <Heart size={17} fill={liked ? 'currentColor' : 'none'} />
          {likesCount}
        </button>
        <button
          onClick={() => { setShowComments(!showComments); onComment?.(post.id); }}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors"
        >
          <MessageCircle size={17} />
          {post.comments_count}
        </button>
      </div>
    </div>
  );
}
