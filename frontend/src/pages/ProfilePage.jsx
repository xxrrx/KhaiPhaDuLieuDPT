import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users, UserCheck, Grid } from 'lucide-react';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { socialService } from '../services/socialService';
import { authService } from '../services/authService';
import { useToast } from '../hooks/useToast';
import useAuthStore from '../store/authStore';
import { formatDateShort } from '../utils/formatters';

export default function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser, isAuthenticated, updateUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const toast = useToast();

  const userId = id || currentUser?.id;
  const isOwnProfile = !id || String(id) === String(currentUser?.id);

  // Edit own profile state
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', bio: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    socialService.getUserProfile(userId)
      .then((res) => {
        if (res.success) {
          setProfile(res.data);
          setFollowing(res.data.is_following);
          setEditForm({ full_name: res.data.user.full_name || '', bio: res.data.user.bio || '' });
        }
      })
      .catch(() => toast.error('Không thể tải hồ sơ'))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      if (following) {
        await socialService.unfollow(userId);
        setFollowing(false);
        setProfile((p) => ({ ...p, stats: { ...p.stats, followers_count: p.stats.followers_count - 1 } }));
      } else {
        await socialService.follow(userId);
        setFollowing(true);
        setProfile((p) => ({ ...p, stats: { ...p.stats, followers_count: p.stats.followers_count + 1 } }));
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await authService.updateProfile(editForm);
      updateUser(editForm);
      setProfile((p) => ({ ...p, user: { ...p.user, ...editForm } }));
      setEditMode(false);
      toast.success('Đã cập nhật hồ sơ');
    } catch {
      toast.error('Không thể cập nhật');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;
  if (!profile) return <div className="text-center py-16 text-zinc-500">Không tìm thấy người dùng</div>;

  const { user, stats, recent_posts } = profile;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Profile header */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-full bg-rose-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 overflow-hidden">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              user.username?.[0]?.toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            {editMode ? (
              <div className="space-y-3">
                <input
                  value={editForm.full_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Họ và tên"
                />
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Bio"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} loading={saving}>Lưu</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditMode(false)}>Hủy</Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-bold text-white">{user.full_name || user.username}</h1>
                <p className="text-zinc-500 text-sm">@{user.username}</p>
                {user.bio && <p className="text-zinc-300 text-sm mt-2">{user.bio}</p>}
                <p className="text-zinc-600 text-xs mt-1">Tham gia {formatDateShort(user.created_at)}</p>
              </>
            )}
          </div>
          <div>
            {isOwnProfile && !editMode ? (
              <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>Sửa hồ sơ</Button>
            ) : !isOwnProfile && isAuthenticated ? (
              <Button
                size="sm"
                variant={following ? 'secondary' : 'primary'}
                onClick={handleFollow}
                loading={followLoading}
              >
                {following ? <><UserCheck size={14} /> Đang theo dõi</> : <><Users size={14} /> Theo dõi</>}
              </Button>
            ) : null}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-6 pt-5 border-t border-zinc-800">
          {[
            { label: 'Bài viết', value: stats.posts_count },
            { label: 'Người theo dõi', value: stats.followers_count },
            { label: 'Đang theo dõi', value: stats.following_count },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs text-zinc-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Posts grid */}
      {recent_posts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Grid size={16} />
            Bài đăng
          </h2>
          <div className="grid grid-cols-3 gap-1">
            {recent_posts.map((p) => (
              <div key={p.id} className="aspect-square bg-zinc-800 overflow-hidden rounded">
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs p-2 text-center">
                    {p.caption?.slice(0, 60)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
