import React, { useState } from 'react';
import Button from '../components/ui/Button';
import { authService } from '../services/authService';
import { useToast } from '../hooks/useToast';
import useAuthStore from '../store/authStore';
import { formatDateShort } from '../utils/formatters';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: user?.full_name || '', bio: user?.bio || '' });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      await authService.updateProfile(editForm);
      updateUser(editForm);
      setEditMode(false);
      toast.success('Đã cập nhật hồ sơ');
    } catch {
      toast.error('Không thể cập nhật');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
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
                {user.created_at && (
                  <p className="text-zinc-600 text-xs mt-1">Tham gia {formatDateShort(user.created_at)}</p>
                )}
              </>
            )}
          </div>
          {!editMode && (
            <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>Sửa hồ sơ</Button>
          )}
        </div>
      </div>
    </div>
  );
}
