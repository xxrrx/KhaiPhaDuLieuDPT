import React, { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import AnalysisUploader from '../components/ai-stylist/AnalysisUploader';
import SkinToneResult from '../components/ai-stylist/SkinToneResult';
import BodyShapeResult from '../components/ai-stylist/BodyShapeResult';
import ColorPalette from '../components/ai-stylist/ColorPalette';
import OutfitSuggestion from '../components/ai-stylist/OutfitSuggestion';
import Button from '../components/ui/Button';
import { aiStylistService } from '../services/aiStylistService';
import { useToast } from '../hooks/useToast';
import { OCCASION_OPTIONS } from '../utils/constants';

export default function AIStylistPage() {
  const [analysis, setAnalysis] = useState(null);
  const [occasion, setOccasion] = useState('casual');
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRec, setLoadingRec] = useState(false);
  const [palettes, setPalettes] = useState([]);
  const toast = useToast();

  const handleAnalysisResult = async (data) => {
    setAnalysis(data);
    setRecommendations(null);
    // Load color palettes
    try {
      const res = await aiStylistService.getColorPalette();
      if (res.success) setPalettes(res.data);
    } catch {}
  };

  const handleRecommend = async () => {
    if (!analysis) return;
    setLoadingRec(true);
    try {
      const res = await aiStylistService.recommend({
        color_season: analysis.skin_tone?.color_season,
        body_shape: analysis.body_shape?.shape,
        occasion,
      });
      if (res.success) {
        setRecommendations(res.data);
        toast.success('Đã tạo gợi ý outfit!');
      }
    } catch {
      toast.error('Không thể tải gợi ý');
    } finally {
      setLoadingRec(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Sparkles size={20} className="text-violet-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">AI Stylist</h1>
        </div>
        <p className="text-zinc-400">Phân tích tông da, vóc dáng và nhận gợi ý trang phục cá nhân hóa</p>
      </div>

      <div className="space-y-8">
        {/* Upload */}
        {!analysis && (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Bước 1: Upload ảnh của bạn</h2>
            <AnalysisUploader onResult={handleAnalysisResult} />
          </div>
        )}

        {/* Results */}
        {analysis && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Kết quả phân tích</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setAnalysis(null); setRecommendations(null); }}
              >
                <RefreshCw size={14} />
                Phân tích lại
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SkinToneResult skinTone={analysis.skin_tone} />
              <BodyShapeResult bodyShape={analysis.body_shape} />
            </div>

            {palettes.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Bảng màu phù hợp</h2>
                <ColorPalette palettes={palettes} />
              </div>
            )}

            {/* Occasion selector + recommend */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Bước 2: Chọn dịp mặc</h2>
              <div className="flex flex-wrap gap-2 mb-5">
                {OCCASION_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setOccasion(o.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      occasion === o.value ? 'bg-rose-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <Button onClick={handleRecommend} loading={loadingRec} className="gap-2">
                <Sparkles size={15} />
                Gợi ý outfit
              </Button>
            </div>

            {recommendations && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Gợi ý trang phục</h2>
                <OutfitSuggestion
                  outfits={recommendations.outfits}
                  products={recommendations.product_suggestions}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
