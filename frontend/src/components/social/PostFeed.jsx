import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';
import LoadingSpinner from '../ui/LoadingSpinner';
import { socialService } from '../../services/socialService';
import Button from '../ui/Button';

export default function PostFeed({ onCommentClick }) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = async (p = 1, append = false) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const res = await socialService.getFeed({ page: p, limit: 10 });
      if (res.success) {
        const items = res.data.items || [];
        if (append) setPosts((prev) => [...prev, ...items]); else setPosts(items);
        setHasMore(p < res.data.pagination.total_pages);
        setPage(p);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchPosts(1); }, []);

  const handleDelete = (id) => setPosts((prev) => prev.filter((p) => p.id !== id));

  if (loading) return <LoadingSpinner className="py-16" />;

  if (!posts.length) return (
    <div className="text-center py-16 text-zinc-500">
      <p className="text-lg">Chưa có bài viết nào</p>
      <p className="text-sm mt-1">Hãy là người đầu tiên chia sẻ!</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onDelete={handleDelete}
          onComment={onCommentClick}
        />
      ))}
      {hasMore && (
        <div className="text-center pt-2">
          <Button
            variant="secondary"
            loading={loadingMore}
            onClick={() => fetchPosts(page + 1, true)}
          >
            Tải thêm
          </Button>
        </div>
      )}
    </div>
  );
}
