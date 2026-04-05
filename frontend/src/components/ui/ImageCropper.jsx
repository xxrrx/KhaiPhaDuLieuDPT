import React, { useRef, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, RotateCcw } from 'lucide-react';
import Button from './Button';

export default function ImageCropper({ onImageReady, maxSizeMB = 10 }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [file, setFile] = useState(null);
  const canvasRef = useRef(null);

  const onDrop = useCallback((accepted) => {
    const f = accepted[0];
    if (!f) return;
    if (f.size > maxSizeMB * 1024 * 1024) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    onImageReady?.(f, url);
  }, [maxSizeMB, onImageReady]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: maxSizeMB * 1024 * 1024,
  });

  const handleReset = () => {
    setPreviewUrl(null);
    setFile(null);
    onImageReady?.(null, null);
  };

  return (
    <div className="space-y-3">
      {!previewUrl ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-rose-500 bg-rose-500/10' : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900'
          }`}
        >
          <input {...getInputProps()} />
          <Upload size={28} className="mx-auto text-zinc-500 mb-3" />
          <p className="text-zinc-400 text-sm">
            {isDragActive ? 'Thả ảnh vào đây...' : 'Kéo thả hoặc click để chọn ảnh'}
          </p>
          <p className="text-zinc-600 text-xs mt-1">JPG, PNG, WEBP — tối đa {maxSizeMB}MB</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
            <img src={previewUrl} alt="Preview" className="max-h-72 w-full object-contain" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleReset} variant="ghost" size="sm" className="flex-1">
              <RotateCcw size={14} />
              Chọn lại
            </Button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
