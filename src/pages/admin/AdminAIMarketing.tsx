import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Wand2, Image, Video, Download, Share2, Sparkles, Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type AssetType = 'poster' | 'story' | 'banner' | 'video';

interface GeneratedAsset {
  id: string;
  title: string;
  type: AssetType;
  prompt: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
}

const TEMPLATES = [
  { id: 'summer', label: 'تخفيضات صيفية', labelEn: 'Summer Sale', prompt: 'Summer sale poster for electronics, bright colors, discount badges, Arabic text "تخفيضات صيفية"' },
  { id: 'installment', label: '0% تقسيط', labelEn: '0% Installment', prompt: 'Elegant installment poster, 0% interest, premium gold and navy colors, Arabic calligraphy' },
  { id: 'phone', label: 'موبايلات', labelEn: 'Phones', prompt: 'Smartphone showcase poster, modern design, multiple phones, glowing effects' },
  { id: 'gaming', label: 'ألعاب', labelEn: 'Gaming', prompt: 'Gaming setup poster, RGB lighting, PlayStation, laptop, dramatic dark background' },
];

export default function AdminAIMarketing() {
  const { isAdmin } = useAuth();
  const [assetType, setAssetType] = useState<AssetType>('poster');
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateAsset = useCallback(async () => {
    if (!title.trim() || !prompt.trim()) {
      toast.error('يرجى إدخال عنوان والوصف');
      return;
    }
    setGenerating(true);
    try {
      await new Promise((r) => setTimeout(r, 2000));
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = assetType === 'story' ? 1080 : 1200;
          canvas.height = assetType === 'story' ? 1920 : 1200;
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, '#0a1628');
          gradient.addColorStop(1, '#1a3a7e');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 72px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 40);
          ctx.fillStyle = '#c9a84c';
          ctx.font = '48px Arial';
          ctx.fillText('PayNex - باينكس', canvas.width / 2, canvas.height / 2 + 60);
          ctx.strokeStyle = '#c9a84c';
          ctx.lineWidth = 20;
          ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
        }
      }
      const newAsset: GeneratedAsset = {
        id: `asset-${Date.now()}`,
        title,
        type: assetType,
        prompt,
        imageUrl: canvas?.toDataURL('image/png'),
        createdAt: new Date().toISOString(),
      };
      setAssets((prev) => [newAsset, ...prev]);
      toast.success('تم إنشاء التصميم بنجاح!');
    } catch (err) {
      toast.error('فشل في إنشاء التصميم');
    } finally {
      setGenerating(false);
    }
  }, [assetType, prompt, title]);

  const downloadAsset = (asset: GeneratedAsset) => {
    if (!asset.imageUrl) return;
    const link = document.createElement('a');
    link.download = `paynex-${asset.type}-${asset.id}.png`;
    link.href = asset.imageUrl;
    link.click();
    toast.success('تم التحميل');
  };

  const copyPrompt = (asset: GeneratedAsset) => {
    navigator.clipboard.writeText(asset.prompt);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('تم نسخ الوصف');
  };

  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    setTitle(template.label);
    setPrompt(template.prompt);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a1628]">
        <p className="text-white text-xl">🚫 لا يمكنك الوصول إلى هذه الصفحة</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Wand2 className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI توليد محتوى الدعاية</h1>
              <p className="text-gray-400 text-sm">إنشاء بوسترات، فيديوهات، وستوريات باستخدام الذكاء الاصطناعي</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => applyTemplate(t)}
              className="bg-[#0f1d32] border border-gray-700 rounded-xl p-4 hover:border-purple-500 transition-all text-start"
            >
              <Sparkles className="w-5 h-5 text-purple-400 mb-2" />
              <p className="text-white font-semibold text-sm">{t.label}</p>
              <p className="text-gray-400 text-xs">{t.labelEn}</p>
            </button>
          ))}
        </div>

        <div className="flex gap-3 mb-6">
          {[
            { type: 'poster' as AssetType, label: 'بوستر', icon: Image },
            { type: 'story' as AssetType, label: 'ستوري', icon: Share2 },
            { type: 'banner' as AssetType, label: 'بانر', icon: Image },
            { type: 'video' as AssetType, label: 'فيديو', icon: Video },
          ].map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setAssetType(type)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                assetType === type
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#0f1d32] text-gray-400 hover:text-white border border-gray-700'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="bg-[#0f1d32] border border-gray-700 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">العنوان</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: تخفيضات الصيف 2025"
                className="w-full bg-[#0a1628] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">النوع</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as AssetType)}
                className="w-full bg-[#0a1628] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="poster">بوستر (1200×1200)</option>
                <option value="story">ستوري (1080×1920)</option>
                <option value="banner">بانر ويب (1200×400)</option>
                <option value="video">فيديو قصير</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-2">وصف التصميم (Prompt)</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="صِف التصميم المطلوب بالتفصيل..."
              rows={4}
              className="w-full bg-[#0a1628] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none resize-none"
            />
          </div>
          <button
            onClick={generateAsset}
            disabled={generating}
            className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {generating ? 'جاري الإنشاء...' : 'إنشاء التصميم'}
          </button>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {assets.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-4">التصميمات المنشأة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map((asset) => (
                <div key={asset.id} className="bg-[#0f1d32] border border-gray-700 rounded-2xl overflow-hidden">
                  {asset.imageUrl && (
                    <div className="relative aspect-square bg-[#0a1628]">
                      <img src={asset.imageUrl} alt={asset.title} className="w-full h-full object-contain" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-purple-600/20 text-purple-400 text-xs font-medium px-2 py-1 rounded">
                        {asset.type === 'poster' && 'بوستر'}
                        {asset.type === 'story' && 'ستوري'}
                        {asset.type === 'banner' && 'بانر'}
                        {asset.type === 'video' && 'فيديو'}
                      </span>
                      <span className="text-gray-400 text-xs">{new Date(asset.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <h3 className="text-white font-semibold mb-2">{asset.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">{asset.prompt}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadAsset(asset)}
                        className="flex-1 bg-[#0a1628] border border-gray-600 hover:border-green-500 text-white py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        تحميل
                      </button>
                      <button
                        onClick={() => copyPrompt(asset)}
                        className="flex-1 bg-[#0a1628] border border-gray-600 hover:border-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1"
                      >
                        {copiedId === asset.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        {copiedId === asset.id ? 'تم النسخ' : 'نسخ الوصف'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
