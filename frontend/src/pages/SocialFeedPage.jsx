import React, { useState } from 'react';
import { Users, Plus } from 'lucide-react';
import PostFeed from '../components/social/PostFeed';
import PostComments from '../components/social/PostComments';
import CreatePostModal from '../components/social/CreatePostModal';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

export default function SocialFeedPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [commentPostId, setCommentPostId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePostCreated = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Users size={22} className="text-rose-400" />
          <h1 className="text-2xl font-bold text-white">Cộng đồng</h1>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus size={15} />
          Đăng bài
        </Button>
      </div>

      <PostFeed
        key={refreshKey}
        onCommentClick={(id) => setCommentPostId(id)}
      />

      <CreatePostModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handlePostCreated}
      />

      <Modal
        isOpen={!!commentPostId}
        onClose={() => setCommentPostId(null)}
        title="Bình luận"
        size="sm"
      >
        {commentPostId && <PostComments postId={commentPostId} />}
      </Modal>
    </div>
  );
}
