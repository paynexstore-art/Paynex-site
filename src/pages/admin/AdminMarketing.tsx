import { useState } from 'react';
import { Sparkles, Image, Video, Share2, Download, Copy } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getProducts } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

type ContentType = 'poster' | 'video' | 'post';

const POSTER_TEMPLATES = [
  { id: 'offer', labelAr: 'عرض خاص', color: 'from-[#0f2460] to-[#d4a339]' },
  { id: 'product', labelAr: 'بروفايل منتج', color: 'from-[#1a368e] to-[#0f2460]' },
  { id: 'promo', labelAr: 'دعايه وإعلان', color: 'from-[#d4a339] to-[#eabe5a]' },
];

export default function AdminMarketing() {
  const { t, lang } = useApp();
  const [tab, setTab] = useState<ContentType>('poster');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [prompt, setPrompt] = useState('');
  const [template, setTemplate] = useState('offer');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);
  const [postText, setPostText] = useState('');
  const products = getProducts().filter(p => p.isActive);

  async function handleGenerate() {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 2500));
    // Mock generated content
    const product = products.find(p => p.id === selectedProduct);
    if (tab === 'post') {
      const mockPost = product
        ? `🛒 احصل على ${product.nameAr} بأقساط مريحة!\n💰 السعر: ${formatCurrency(product.price)} فقط\n✅ بدون فوائد - بدون مقدم\n📞 تواصل معنا الآن وقدم طلبك\n#باينكس #تقسيط #${product.brand}`
        : `🌟 عروض باينكس الحصرية!\n💳 اشتري الآن وادفع بعدين\n✅ تقسيط بدون فوائد على جميع المنتجات\n📱 زيارة موقعنا الآن\n#باينكس #تقسيط_ذكي`;
      setPostText(mockPost);
    } else {
      setGenerated(`https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=800&fit=crop&t=${Date.now()}`);
    }
    setGenerating(false);
    toast.success(t('تم إنشاء المحتوى بنجاح', 'Content generated successfully'));
  }

  function handleCopyPost() {
    navigator.clipboard.writeText(postText);
    toast.success(t('تم النسخ', 'Copied'));
  }

  const socialPlatforms = [
    { name: 'Facebook', color: 'bg-[#1877F2]', icon: '📘' },
    { name: 'Instagram', color: 'bg-gradient-to-br from-purple-600 to-pink-500', icon: '📸' },
    { name: 'TikTok', color: 'bg-black', icon: '🎵' },
    { name: 'Twitter/X', color: 'bg-black', icon: '𝕏' },
  ];

  return (
    <div className="space-y-5">
      {/* Tab Switch */}
      <div className="bg-white rounded-2xl shadow-card p-1.5 flex gap-1">
        {[
          { key: 'poster', icon: <Image size={16} />, label: t('بوستر', 'Poster') },
          { key: 'video', icon: <Video size={16} />, label: t('فيديو', 'Video') },
          { key: 'post', icon: <Share2 size={16} />, label: t('بوست نصي', 'Text Post') },
        ].map(item => (
          <button key={item.key} onClick={() => setTab(item.key as ContentType)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === item.key ? 'bg-[#0f2460] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-card p-6 space-y-4">
          <h3 className="font-bold text-[#0f2460] flex items-center gap-2">
            <Sparkles size={18} className="text-[#d4a339]" />
            {t('إنشاء بالذكاء الاصطناعي', 'AI Content Generator')}
          </h3>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">{t('اختر المنتج (اختياري)', 'Select Product (optional)')}</label>
            <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="input-field text-sm">
              <option value="">{t('-- عام --', '-- General --')}</option>
              {products.map(p => <option key={p.id} value={p.id}>{lang === 'ar' ? p.nameAr : p.nameEn}</option>)}
            </select>
          </div>

          {tab !== 'post' && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">{t('القالب', 'Template')}</label>
              <div className="grid grid-cols-3 gap-2">
                {POSTER_TEMPLATES.map(tmpl => (
                  <button key={tmpl.id} onClick={() => setTemplate(tmpl.id)}
                    className={`p-3 rounded-xl text-xs font-medium border-2 transition-all bg-gradient-to-br ${tmpl.color} text-white ${template === tmpl.id ? 'border-[#0f2460] scale-105' : 'border-transparent'}`}>
                    {tmpl.labelAr}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">{t('وصف إضافي (اختياري)', 'Additional Description (optional)')}</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="input-field resize-none text-sm"
              rows={3}
              placeholder={t('مثال: عرض خاص بمناسبة رمضان، ألوان ذهبية...', 'e.g. Ramadan special offer, golden colors...')}
            />
          </div>

          <button onClick={handleGenerate} disabled={generating} className="btn-gold w-full flex items-center justify-center gap-2">
            {generating ? (
              <>
                <div className="w-5 h-5 border-2 border-[#0f2460]/30 border-t-[#0f2460] rounded-full animate-spin" />
                {t('جاري الإنشاء...', 'Generating...')}
              </>
            ) : (
              <>
                <Sparkles size={18} />
                {t('إنشاء المحتوى', 'Generate Content')}
              </>
            )}
          </button>

          {/* Social Export */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-medium text-slate-700 mb-3">{t('نشر على:', 'Share to:')}</p>
            <div className="grid grid-cols-2 gap-2">
              {socialPlatforms.map(p => (
                <button key={p.name} onClick={() => toast.success(t(`تم النشر على ${p.name}`, `Posted to ${p.name}`))}
                  className={`${p.color} text-white rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90`}>
                  <span>{p.icon}</span> {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="font-bold text-[#0f2460] mb-4">{t('المعاينة', 'Preview')}</h3>

          {tab === 'post' && postText ? (
            <div>
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-line mb-4 min-h-[200px]">
                {postText}
              </div>
              <div className="flex gap-3">
                <button onClick={handleCopyPost} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                  <Copy size={14} />{t('نسخ', 'Copy')}
                </button>
                <button onClick={() => { const el = document.createElement('a'); el.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(postText); el.download = 'paynex-post.txt'; el.click(); }}
                  className="btn-outline flex-1 flex items-center justify-center gap-2 text-sm">
                  <Download size={14} />{t('تحميل', 'Download')}
                </button>
              </div>
            </div>
          ) : generated ? (
            <div>
              <div className="rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-[#0f2460] to-[#d4a339] aspect-square relative">
                <img src={generated} alt="generated" className="w-full h-full object-cover opacity-70" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
                  <div className="text-3xl font-black mb-2">باينكس</div>
                  <div className="text-lg font-semibold">اشتري الآن بالتقسيط</div>
                  <div className="badge-gold mt-3">بدون فوائد</div>
                </div>
              </div>
              <div className="flex gap-3">
                <a href={generated} download className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                  <Download size={14} />{t('تحميل', 'Download')}
                </a>
                <button onClick={() => toast.success(t('تمت المشاركة', 'Shared'))} className="btn-outline flex-1 text-sm">
                  {t('مشاركة', 'Share')}
                </button>
              </div>
            </div>
          ) : (
            <div className="aspect-square bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
              <div className="text-center">
                {tab === 'video' ? <Video size={60} className="mx-auto mb-3 opacity-30" /> : tab === 'post' ? <Share2 size={60} className="mx-auto mb-3 opacity-30" /> : <Image size={60} className="mx-auto mb-3 opacity-30" />}
                <p className="text-sm">{t('اضغط "إنشاء" لرؤية المعاينة', 'Press "Generate" to see preview')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
