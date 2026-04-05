import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, ImageIcon } from 'lucide-react';
import Button from '../ui/Button';
import { tryonService } from '../../services/tryonService';
import { useToast } from '../../hooks/useToast';
import useTryonStore from '../../store/tryonStore';

export default function TryOnUploader({ productId, onResult }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [file, setFile] = useState(null);
  const { isProcessing, setProcessing, setCurrentResult, addToHistory } = useTryonStore();
  const toast = useToast();

  const onDrop = useCallback((accepted) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleTryOn = async () => {
    if (!file || !productId) return;
    setProcessing(true);
    const toastId = toast.loading('Đang xử lý ảnh thử đồ...');
    try {
      const result = await tryonService.uploadTryOn(file, productId);
      if (result.success) {
        setCurrentResult(result.data);
        addToHistory(result.data);
        onResult && onResult(result.data);
        toast.dismiss(toastId);
        toast.success('Thử đồ thành công!');
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err?.response?.data?.detail || 'Có lỗi xảy ra');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-rose-500 bg-rose-500/10' : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900'
        }`}
      >
        <input {...getInputProps()} />
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg object-contain" />
        ) : (
          <div className="space-y-3">
            <Upload size={32} className="mx-auto text-zinc-500" />
            <p className="text-zinc-400 text-sm">
              {isDragActive ? 'Thả ảnh vào đây...' : 'Kéo thả hoặc click để chọn ảnh của bạn'}
            </p>
            <p className="text-zinc-600 text-xs">JPG, PNG, WEBP — tối đa 10MB</p>
          </div>
        )}
      </div>

      {previewUrl && (
        <div className="flex gap-3">
          <Button
            onClick={() => { setPreviewUrl(null); setFile(null); }}
            variant="ghost"
            className="flex-1"
          >
            Chọn lại
          </Button>
          <Button
            onClick={handleTryOn}
            loading={isProcessing}
            disabled={!productId}
            className="flex-1"
          >
            <ImageIcon size={16} />
            Thử đồ ngay
          </Button>
        </div>
      )}

      {!productId && (
        <p className="text-xs text-amber-400 text-center">Vui lòng chọn sản phẩm để thử đồ</p>
      )}
    </div>
  );
}
