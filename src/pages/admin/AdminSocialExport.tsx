import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Share2, Facebook, Instagram, Twitter, Send, Copy, Check, Calendar, Image, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/types';
import { supabase } from '@/lib/supabase';

type Platform = 'facebook' | 'instagram' | 'twitter' | 'tiktok';

interface SocialPost {
  id: string;
  productId?: string;
  platform: Platform;
  content: string;
  imageUrl?: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduledAt?: string;
  createdAt: string;
}

const PLATFORM_CONFIG: Record<Platform, { icon: typeof Facebook; label: string; labelEn: string; color: string }> = {
  facebook: { icon: Facebook, label: 'فيسبوك', labelEn: 'Facebook', color: '#1877F2' },
  instagram: { icon: Instagram, label: 'إنستغرام', labelEn: 'Instagram', color: '#E4405F' },
  twitter: { icon: Twitter, label: 'تويتر', labelEn: 'Twitter', color: '#1DA1F2' },
  tiktok: { icon: Send, label: 'تيك توك', labelEn: 'TikTok', color: '#000000' },
};

export default function AdminSocialExport() {
  const { isAdmin } = useAuth();
  const { t } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [platform, setPlatform] = useState<Platform>('facebook');
  const [content, setContent] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(50);
      if (data) setProducts(data.map((p: Record<string, unknown>) => ({
        id: p.id as string,
        name: p.name as string,
        nameAr: p.name_ar as string,
        nameEn: p.name_en as string,
        price: p.price as number,
        images: p.image_url ? [p.image_url as string] : [],
        category: p.category as string,
        isActive: p.is_active as boolean,
      } as Product)));
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      const price = selectedProduct.price?.toLocaleString('ar-EG') || '';
      const name = selectedProduct.nameAr || selectedProduct.name;
      const autoContent = `🛍️ ${name}\n\n💰 السعر: ${price} ج.م\n📦 تقسيط يبدأ من 0 مقدم و 0% فائدة!\n\n🌟 قسطلي - Qastly\nأفضل حلول التقسيط في مصر\n\n#قسطلي #Qastly #تقسيط #${selectedProduct.category}`;
      setContent(autoContent);
    }
  }, [selectedProduct]);

  const generatePost = async () => {
    if (!content.trim()) { toast.error('المحتوى فارغ'); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    const newPost: SocialPost = {
      id: `post-${Date.now()}`,
      productId: selectedProduct?.id,
      platform,
      content,
      imageUrl: selectedProduct?.images?.[0],
      status: scheduledAt ? 'scheduled' : 'draft',
      scheduledAt: scheduledAt || undefined,
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) => [newPost, ...prev]);
    toast.success(scheduledAt ? 'تم جدولة المنشور' : 'تم إنشاء المسودة');
    setLoading(false);
  };

  const copyPost = (post: SocialPost) => {
    navigator.clipboard.writeText(post.content);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('تم نسخ المحتوى');
  };

  const shareNow = (post: SocialPost) => {
    const shareUrls: Record<Platform, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(post.content)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.content)}`,
      instagram: '',
      tiktok: '',
    };
    if (shareUrls[post.platform]) window.open(shareUrls[post.platform], '_blank');
    else toast.info('انسخ المحتوى والصورة وانشرها يدوياً');
  };

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center bg-[#0a1628] text-white text-xl">🚫 Access Denied</div>;

  return (
    <div className="min-h-screen bg-[#0a1628] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Share2 className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">تصدير السوشيال ميديا</h1>
            <p className="text-gray-400 text-sm">إنشاء ونشر محتوى تسويقي على منصات التواصل الاجتماعي</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#0f1d32] border border-gray-700 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">إنشاء منشور جديد</h2>

            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">اختر المنتج (اختياري)</label>
              <select
                value={selectedProduct?.id || ''}
                onChange={(e) => setSelectedProduct(products.find((p) => p.id === e.target.value) || null)}
                className="w-full bg-[#0a1628] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">بدون منتج</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nameAr || p.name} - {p.price?.toLocaleString('ar-EG')} ج.م
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">وسيلة النشر</label>
              <div className="flex gap-2">
                {(Object.keys(PLATFORM_CONFIG) as Platform[]).map((p) => {
                  const { icon: Icon, label, color } = PLATFORM_CONFIG[p];
                  return (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        platform === p ? 'text-white' : 'bg-[#0a1628] text-gray-400 border border-gray-700 hover:text-white'
                      }`}
                      style={platform === p ? { backgroundColor: color } : {}}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">محتوى المنشور</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full bg-[#0a1628] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none resize-none"
              />
              <p className="text-gray-500 text-xs mt-1">{content.length} حرف</p>
            </div>

            {selectedProduct?.images?.[0] && (
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">صورة المنتج</label>
                <div className="relative rounded-lg overflow-hidden border border-gray-700 w-48 h-48">
                  <img src={selectedProduct.images[0]} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                جدولة النشر (اختياري)
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full bg-[#0a1628] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              onClick={generatePost}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {loading ? 'جاري الإنشاء...' : scheduledAt ? 'جدولة المنشور' : 'إنشاء المسودة'}
            </button>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-4">المنشورات ({posts.length})</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {posts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد منشورات بعد</p>
                </div>
              )}
              {posts.map((post) => {
                const { icon: Icon, label, color } = PLATFORM_CONFIG[post.platform];
                return (
                  <div key={post.id} className="bg-[#0f1d32] border border-gray-700 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4" style={{ color }} />
                      <span className="text-white font-medium text-sm">{label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        post.status === 'published' ? 'bg-green-600/20 text-green-400' :
                        post.status === 'scheduled' ? 'bg-amber-600/20 text-amber-400' :
                        'bg-gray-600/20 text-gray-400'
                      }`}>
                        {post.status === 'draft' ? 'مسودة' : post.status === 'scheduled' ? 'مجدول' : 'منشور'}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap mb-3">{post.content}</p>
                    {post.scheduledAt && (
                      <p className="text-gray-500 text-xs mb-2">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {new Date(post.scheduledAt).toLocaleString('ar-EG')}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => copyPost(post)} className="flex-1 bg-[#0a1628] border border-gray-600 hover:border-blue-500 text-white py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1">
                        {copiedId === post.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        {copiedId === post.id ? 'تم النسخ' : 'نسخ'}
                      </button>
                      <button onClick={() => shareNow(post)} className="flex-1 bg-[#0a1628] border border-gray-600 hover:border-green-500 text-white py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1">
                        <Share2 className="w-3 h-3" />
                        نشر
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
