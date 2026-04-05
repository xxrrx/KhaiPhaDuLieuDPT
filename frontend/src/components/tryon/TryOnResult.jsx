import React from 'react';
import { Download, Share2, Clock } from 'lucide-react';
import Button from '../ui/Button';

export default function TryOnResult({ result }) {
  if (!result) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = result.result_url;
    a.download = 'smartfit-tryon.jpg';
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden bg-zinc-800">
        <img
          src={result.result_url}
          alt="Kết quả thử đồ"
          className="w-full max-h-[500px] object-contain mx-auto"
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
          <Clock size={12} className="text-zinc-300" />
          <span className="text-xs text-zinc-300">{result.processing_time}s</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleDownload} variant="secondary" className="flex-1">
          <Download size={15} />
          Tải xuống
        </Button>
        <Button
          onClick={() => navigator.share?.({ url: result.result_url, title: 'SmartFit Try-On' })}
          variant="outline"
          className="flex-1"
        >
          <Share2 size={15} />
          Chia sẻ
        </Button>
      </div>
    </div>
  );
}
