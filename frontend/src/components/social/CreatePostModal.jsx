import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { socialService } from '../../services/socialService';
import { useToast } from '../../hooks/useToast';

export default function CreatePostModal({ isOpen, onClose, onCreated }) {
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const onDrop = useCallback((accepted) => {
    const f = accepted[0];
    if (!f) return;
    setImageFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleSubmit = async () => {
    if (!caption.trim() && !imageFile) {
      toast.error('Cần có nội dung hoặc ảnh');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('caption', caption);
      if (imageFile) formData.append('image', imageFile);
      const res = await socialService.createPost(formData);
      if (res.success) {
        toast.success('Đã đăng bài!');
        onCreated?.(res.data);
        setCaption('');
        setImageFile(null);
        setPreview(null);
        onClose();
      }
    } catch {
      toast.error('Không thể đăng bài');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo bài viết mới">
      <div className="space-y-4">
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Chia sẻ phong cách của bạn..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
        />

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-rose-500 bg-rose-500/10' : 'border-zinc-700 hover:border-zinc-500'
          }`}
        >
          <input {...getInputProps()} />
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
          ) : (
            <div className="space-y-2">
              <Image size={24} className="mx-auto text-zinc-600" />
              <p className="text-xs text-zinc-500">Thêm ảnh (tùy chọn)</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button onClick={onClose} variant="ghost" className="flex-1">Hủy</Button>
          <Button onClick={handleSubmit} loading={loading} className="flex-1">Đăng bài</Button>
        </div>
      </div>
    </Modal>
  );
}
