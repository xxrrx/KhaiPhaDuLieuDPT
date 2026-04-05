import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart2, Zap } from 'lucide-react';
import TrendChart from '../components/trends/TrendChart';
import TrendFilter from '../components/trends/TrendFilter';
import ColorTrendCard from '../components/trends/ColorTrendCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { trendsService } from '../services/trendsService';

export default function TrendsPage() {
  const [trends, setTrends] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);
  const [chartType, setChartType] = useState('line');

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [tRes, cRes, pRes] = await Promise.all([
          trendsService.getTrends({ category, limit: 20 }),
          trendsService.getChartData(),
          trendsService.getPredictions(),
        ]);
        if (tRes.success) setTrends(tRes.data.items);
        if (cRes.success) setChartData(cRes.data);
        if (pRes.success) setPredictions(pRes.data);
      } catch {}
      finally { setLoading(false); }
    };
    loadAll();
  }, [category]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp size={24} className="text-emerald-400" />
          <h1 className="text-3xl font-bold text-white">Xu hướng thời trang</h1>
        </div>
        <p className="text-zinc-400">Cập nhật xu hướng mới nhất và dự đoán tương lai</p>
      </div>

      {/* Filters */}
      <TrendFilter value={category} onChange={setCategory} />

      {loading ? <LoadingSpinner className="py-16" /> : (
        <>
          {/* Trend cards */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Xu hướng hiện tại</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {trends.map((t) => <ColorTrendCard key={t.id} trend={t} />)}
            </div>
          </div>

          {/* Chart */}
          {chartData && (
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <BarChart2 size={18} className="text-rose-400" />
                  Biểu đồ xu hướng
                </h2>
                <div className="flex gap-1">
                  {['line', 'bar'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setChartType(t)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${chartType === t ? 'bg-rose-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                    >
                      {t === 'line' ? 'Line' : 'Bar'}
                    </button>
                  ))}
                </div>
              </div>
              <TrendChart type={chartType} data={chartData} height={280} />
            </div>
          )}

          {/* Predictions */}
          {predictions.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap size={18} className="text-amber-400" />
                Dự đoán xu hướng
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {predictions.map((p, i) => (
                  <div key={i} className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-white">{p.trend_vn || p.trend}</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">{p.timeline}</p>
                        <p className="text-sm text-zinc-400 mt-2">{p.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-bold text-emerald-400">{Math.round(p.probability * 100)}%</div>
                        <div className="text-xs text-zinc-500">xác suất</div>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 bg-zinc-800 rounded-full">
                      <div
                        className="h-1.5 bg-emerald-400 rounded-full transition-all"
                        style={{ width: `${p.probability * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
