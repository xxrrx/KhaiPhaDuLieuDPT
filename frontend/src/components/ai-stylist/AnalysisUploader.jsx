import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Sparkles } from 'lucide-react';
import Button from '../ui/Button';
import { aiStylistService } from '../../services/aiStylistService';
import { useToast } from '../../hooks/useToast';

export default function AnalysisUploader({ onResult }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const onDrop = useCallback((accepted) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const result = await aiStylistService.analyze(file);
      if (result.success) {
        onResult(result.data);
        toast.success('Phân tích hoàn tất!');
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Phân tích thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-rose-500 bg-rose-500/10' : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900'
        }`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-60 mx-auto rounded-lg object-contain" />
        ) : (
          <div className="space-y-3">
            <Upload size={36} className="mx-auto text-zinc-500" />
            <p className="text-zinc-300 font-medium">Tải ảnh của bạn lên</p>
            <p className="text-zinc-500 text-sm">Chúng tôi sẽ phân tích tông da và vóc dáng</p>
            <p className="text-zinc-600 text-xs">JPG, PNG, WEBP — tối đa 10MB</p>
          </div>
        )}
      </div>

      {preview && (
        <div className="flex gap-3">
          <Button onClick={() => { setPreview(null); setFile(null); }} variant="ghost" className="flex-1">Chọn lại</Button>
          <Button onClick={handleAnalyze} loading={loading} className="flex-1">
            <Sparkles size={15} />
            Phân tích AI
          </Button>
        </div>
      )}
    </div>
  );
}
