import React, { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { wardrobeService } from '../../services/wardrobeService';
import { useToast } from '../../hooks/useToast';
import { OCCASION_OPTIONS } from '../../utils/constants';

export default function OutfitBuilder({ wardrobeItems = [], onCreated }) {
  const [name, setName] = useState('');
  const [occasion, setOccasion] = useState('casual');
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const toggle = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Nhập tên outfit'); return; }
    if (selectedIds.length === 0) { toast.error('Chọn ít nhất một trang phục'); return; }
    setLoading(true);
    try {
      const res = await wardrobeService.createOutfit({
        name: name.trim(),
        occasion,
        product_ids: wardrobeItems
          .filter((i) => selectedIds.includes(i.id))
          .map((i) => i.product.id),
      });
      if (res.success) {
        toast.success('Đã tạo outfit!');
        setName('');
        setSelectedIds([]);
        onCreated?.();
      }
    } catch {
      toast.error('Không thể tạo outfit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4">
      <h3 className="font-semibold text-white">Tạo outfit mới</h3>

      <Input
        label="Tên outfit"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ví dụ: Đi làm mùa đông"
      />

      <div>
        <label className="text-sm font-medium text-zinc-300 block mb-1">Dịp mặc</label>
        <select
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          {OCCASION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-300 mb-2">Chọn trang phục ({selectedIds.length} đã chọn)</p>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
          {wardrobeItems.map((item) => {
            const selected = selectedIds.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selected ? 'border-rose-500' : 'border-transparent'}`}
              >
                {item.product?.image_url ? (
                  <img src={item.product.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-lg">👗</div>
                )}
                {selected && (
                  <div className="absolute inset-0 bg-rose-500/30 flex items-center justify-center">
                    <Check size={16} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Button onClick={handleCreate} loading={loading} className="w-full">
        <Plus size={16} />
        Tạo outfit
      </Button>
    </div>
  );
}
