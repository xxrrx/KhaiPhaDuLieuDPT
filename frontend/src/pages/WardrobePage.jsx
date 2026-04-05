import React, { useState, useEffect } from 'react';
import { BookOpen, Layers } from 'lucide-react';
import WardrobeGrid from '../components/wardrobe/WardrobeGrid';
import OutfitCard from '../components/wardrobe/OutfitCard';
import OutfitBuilder from '../components/wardrobe/OutfitBuilder';
import Pagination from '../components/ui/Pagination';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { wardrobeService } from '../services/wardrobeService';
import { useToast } from '../hooks/useToast';

const TABS = [
  { id: 'wardrobe', label: 'Tủ đồ', icon: BookOpen },
  { id: 'outfits', label: 'Outfits', icon: Layers },
];

export default function WardrobePage() {
  const [tab, setTab] = useState('wardrobe');
  const [items, setItems] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const toast = useToast();

  const fetchWardrobe = async (p = 1) => {
    setLoading(true);
    try {
      const res = await wardrobeService.getWardrobe({ page: p, limit: 20 });
      if (res.success) {
        setItems(res.data.items);
        setTotalPages(res.data.pagination.total_pages);
      }
    } catch {
      toast.error('Không thể tải tủ đồ');
    } finally {
      setLoading(false);
    }
  };

  const fetchOutfits = async () => {
    setLoading(true);
    try {
      const res = await wardrobeService.getOutfits({ limit: 20 });
      if (res.success) setOutfits(res.data.items);
    } catch {
      toast.error('Không thể tải outfits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'wardrobe') fetchWardrobe(page);
    else fetchOutfits();
  }, [tab, page]);

  const handleRemoveItem = async (id) => {
    try {
      await wardrobeService.removeFromWardrobe(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success('Đã xóa khỏi tủ đồ');
    } catch {
      toast.error('Không thể xóa');
    }
  };

  const handleDeleteOutfit = async (id) => {
    if (!confirm('Xóa outfit này?')) return;
    try {
      await wardrobeService.deleteOutfit(id);
      setOutfits((prev) => prev.filter((o) => o.id !== id));
      toast.success('Đã xóa outfit');
    } catch {
      toast.error('Không thể xóa');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Tủ đồ của tôi</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Quản lý trang phục và tạo outfit phối hợp</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 mb-8 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-rose-500 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'wardrobe' ? (
        <>
          <WardrobeGrid items={items} loading={loading} onRemove={handleRemoveItem} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <div className="space-y-8">
          <OutfitBuilder wardrobeItems={items.length ? items : []} onCreated={fetchOutfits} />

          {loading ? (
            <LoadingSpinner className="py-10" />
          ) : outfits.length === 0 ? (
            <div className="text-center py-12 text-zinc-600">
              <Layers size={36} className="mx-auto mb-3 opacity-50" />
              <p>Chưa có outfit nào</p>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-white mb-4">Outfit đã tạo ({outfits.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {outfits.map((outfit) => (
                  <OutfitCard key={outfit.id} outfit={outfit} onDelete={handleDeleteOutfit} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
