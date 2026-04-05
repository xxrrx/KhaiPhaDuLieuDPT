import React, { useEffect, useState } from 'react';
import { Trash2, Clock, Camera } from 'lucide-react';
import { tryonService } from '../../services/tryonService';
import { useToast } from '../../hooks/useToast';
import { timeAgo } from '../../utils/formatters';
import LoadingSpinner from '../ui/LoadingSpinner';
import Pagination from '../ui/Pagination';

export default function TryOnHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const toast = useToast();

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const res = await tryonService.getHistory({ page: p, limit: 12 });
      if (res.success) {
        setHistory(res.data.items);
        setTotalPages(res.data.pagination.total_pages);
      }
    } catch {
      toast.error('Không thể tải lịch sử');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(page); }, [page]);

  const handleDelete = async (id) => {
    if (!confirm('Xóa lịch sử này?')) return;
    try {
      await tryonService.deleteHistory(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
      toast.success('Đã xóa');
    } catch {
      toast.error('Không thể xóa');
    }
  };

  if (loading) return <LoadingSpinner className="py-10" />;
  if (!history.length) return (
    <div className="text-center py-12 text-zinc-500">
      <Clock size={32} className="mx-auto mb-3 opacity-50" />
      <p>Chưa có lịch sử thử đồ</p>
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {history.map((item) => (
          <div key={item.id} className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 group">
            <div className="relative aspect-[3/4] bg-zinc-800">
              <img
                src={item.result_url}
                alt="Try-on result"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                item.method === 'webcam' ? 'bg-blue-500/80 text-white' : 'bg-rose-500/80 text-white'
              }`}>
                {item.method === 'webcam' ? 'AR' : 'Upload'}
              </span>
            </div>
            <div className="p-2">
              <p className="text-xs text-white truncate">{item.product?.name}</p>
              <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                <Clock size={10} />
                {timeAgo(item.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
