import React, { useState } from 'react';
import { Download } from 'lucide-react';
import Button from '../ui/Button';
import { wardrobeService } from '../../services/wardrobeService';
import { useToast } from '../../hooks/useToast';

export default function OutfitExport({ outfitId }) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await wardrobeService.exportOutfit(outfitId, { format: 'image', include_product_names: true });
      if (res.success && res.data.export_url) {
        const link = document.createElement('a');
        link.href = res.data.export_url;
        link.download = `outfit_${outfitId}.jpg`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Đã xuất outfit!');
      }
    } catch {
      toast.error('Không thể xuất outfit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleExport} loading={loading} variant="secondary" size="sm">
      <Download size={14} />
      Xuất ảnh
    </Button>
  );
}
