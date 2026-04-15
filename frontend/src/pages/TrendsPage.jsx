import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart2, Zap, Palette, Shirt, Sparkles } from 'lucide-react';
import TrendChart from '../components/trends/TrendChart';
import TrendFilter from '../components/trends/TrendFilter';
import ColorTrendCard from '../components/trends/ColorTrendCard';
import StyleTrendCard from '../components/trends/StyleTrendCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { trendsService } from '../services/trendsService';

function SectionHeader({ icon: Icon, title, count, color }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: color + '22' }}>
          <Icon size={16} style={{ color }} />
        </div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
      </div>
      {count != null && (
        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
          {count} xu hướng
        </span>
      )}
    </div>
  );
}

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
          trendsService.getTrends({ category, limit: 50 }),
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

  const styleItems = trends.filter(t => t.category === 'style');
  const colorItems = trends.filter(t => t.category === 'color');
  const itemItems  = trends.filter(t => t.category === 'item');

  // Stats
  const topScore = trends.length ? Math.max(...trends.map(t => t.score || 0)) : 0;
  const avgScore = trends.length
    ? (trends.reduce((s, t) => s + (t.score || 0), 0) / trends.length).toFixed(1)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp size={24} className="text-emerald-400" />
          <h1 className="text-3xl font-bold text-white">Xu hướng thời trang</h1>
        </div>
        <p className="text-zinc-400">Dữ liệu tổng hợp từ WGSN, McKinsey, Pantone, Google Trends & trang thời trang quốc tế</p>
      </div>

      {/* Stats bar */}
      {!loading && trends.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Tổng xu hướng', value: trends.length, color: '#10b981' },
            { label: 'Score cao nhất', value: topScore.toFixed(0), color: '#f59e0b' },
            { label: 'Score trung bình', value: avgScore, color: '#6366f1' },
            { label: 'Nguồn dữ liệu', value: new Set(trends.map(t => t.data_source).filter(Boolean)).size, color: '#ec4899' },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <TrendFilter value={category} onChange={setCategory} />

      {loading ? (
        <LoadingSpinner className="py-16" />
      ) : (
        <>
          {/* ─── Phong cách ─── */}
          {styleItems.length > 0 && (
            <section>
              <SectionHeader icon={Sparkles} title="Phong cách" count={styleItems.length} color="#10b981" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {styleItems.map((t, i) => (
                  <StyleTrendCard key={t.id || i} trend={t} rank={i + 1} />
                ))}
              </div>
            </section>
          )}

          {/* ─── Màu sắc ─── */}
          {colorItems.length > 0 && (
            <section>
              <SectionHeader icon={Palette} title="Màu sắc xu hướng" count={colorItems.length} color="#f59e0b" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {colorItems.map((t, i) => (
                  <ColorTrendCard key={t.id || i} trend={t} rank={i + 1} />
                ))}
              </div>
            </section>
          )}

          {/* ─── Trang phục ─── */}
          {itemItems.length > 0 && (
            <section>
              <SectionHeader icon={Shirt} title="Trang phục & Phụ kiện" count={itemItems.length} color="#6366f1" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {itemItems.map((t, i) => (
                  <StyleTrendCard key={t.id || i} trend={t} rank={i + 1} />
                ))}
              </div>
            </section>
          )}

          {/* ─── Biểu đồ ─── */}
          {chartData && (
            <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/20">
                    <BarChart2 size={16} className="text-rose-400" />
                  </div>
                  <h2 className="text-base font-semibold text-white">Biểu đồ xu hướng (12 tháng)</h2>
                </div>
                <div className="flex gap-1">
                  {['line', 'bar'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setChartType(t)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        chartType === t
                          ? 'bg-rose-500 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {t === 'line' ? 'Line' : 'Bar'}
                    </button>
                  ))}
                </div>
              </div>
              <TrendChart type={chartType} data={chartData} height={300} />
            </section>
          )}

          {/* ─── Dự đoán ─── */}
          {predictions.length > 0 && (
            <section>
              <SectionHeader icon={Zap} title="Dự đoán xu hướng sắp tới" count={predictions.length} color="#f59e0b" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {predictions.map((p, i) => {
                  const pct = Math.round(p.probability * 100);
                  const pColor = pct >= 80 ? '#10b981' : pct >= 70 ? '#f59e0b' : '#6366f1';
                  return (
                    <div key={i} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 hover:border-zinc-700 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="font-semibold text-white">{p.trend_vn || p.trend}</h3>
                          <span className="text-xs text-zinc-500 mt-0.5 block">{p.trend}</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-bold" style={{ color: pColor }}>{pct}%</div>
                          <div className="text-xs text-zinc-500">xác suất</div>
                        </div>
                      </div>

                      <p className="text-sm text-zinc-400 mb-3">{p.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-3">
                          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-1.5 rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: pColor }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full flex-shrink-0">
                          {p.timeline}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
