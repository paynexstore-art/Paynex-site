import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, Package, RefreshCw, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';

export default function AdminProducts() {
  const { t, lang } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [form, setForm] = useState({
    nameAr: '', price: 0, originalPrice: 0, imageUrl: '', categoryAr: '', brand: '', stock: 10, isActive: true
  });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (data) {
        const mapped = data.map((p: any) => ({
          id: p.id,
          nameAr: p.name || '',
          nameEn: p.name || '',
          name: p.name || '',
          descriptionAr: p.description || '',
          descriptionEn: p.description || '',
          description: p.description || '',
          price: Number(p.price || 0),
          originalPrice: p.original_price ? Number(p.original_price) : undefined,
          categoryAr: p.category_ar || 'عام',
          category: p.category_ar || 'عام',
          brand: p.brand || 'براند',
          images: p.image_url ? [p.image_url] : ['https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=400&fit=crop'],
          source: 'manual',
          isActive: p.is_active !== undefined ? p.is_active : true,
          stock: p.stock || 10
        }));
        setProducts(mapped);
      }
    } catch (e) {
      toast.error('خطأ في جلب البيانات من السيرفر');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const filtered = products.filter(p => {
    const q = search.trim();
    if (!q) return true;
    const name = (p.nameAr ?? '') as string;
    const brand = (p.brand ?? '').toLowerCase();
    return name.includes(q) || brand.includes(q.toLowerCase());
  });

  async function handleSave() {
    if (!form.nameAr || !form.price) {
      toast.error('الاسم والسعر مطلوبان');
      return;
    }
    try {
      if (editing) {
        await supabase.from('products').update({
          name: form.nameAr, price: form.price, original_price: form.originalPrice || null,
          image_url: form.imageUrl, category_ar: form.categoryAr, brand: form.brand, stock: form.stock, is_active: form.isActive
        }).eq('id', editing.id);
        toast.success('تم تعديل المنتج في السيرفر');
      } else {
        await supabase.from('products').insert([{
          name: form.nameAr, price: form.price, original_price: form.originalPrice || null,
          image_url: form.imageUrl, category_ar: form.categoryAr, brand: form.brand, stock: form.stock, is_active: form.isActive, source: 'manual'
        }]);
        toast.success('تم حقن المنتج في السيرفر');
      }
      setShowForm(false);
      reload();
    } catch (err) {
      toast.error('فشل حفظ البيانات');
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل تريد حذف المنتج نهائياً من قاعدة البيانات الحية؟')) return;
    try {
      await supabase.from('products').delete().eq('id', id);
      toast.success('تم الحذف بنجاح');
      reload();
    } catch (err) {
      toast.error('فشل الحذف');
      console.error(err);
    }
  }

  return (
    <div className="space-y-5 p-2 sm:p-4 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <h1 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
          <Package className="text-[#0f2460]" size={18} /> {t('إدارة منتجات السيرفر (Supabase)', 'Live Server Products')}
        </h1>
        <button onClick={() => {
          setEditing(null);
          setForm({ nameAr: '', price: 0, originalPrice: 0, imageUrl: '', categoryAr: 'عام', brand: 'براند', stock: 10, isActive: true });
          setShowForm(true);
        }} className="px-3 py-1.5 bg-[#0f2460] text-white rounded-lg text-xs font-medium hover:bg-opacity-90 transition-all shadow-sm">
          + {t('إضافة منتج', 'Add Product')}
        </button>
      </div>

      <div className="flex gap-2 bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <Search size={14} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder={t('بحث باسم المنتج أو الماركة...', 'Search...')} value={search} onChange={e => setSearch(e.target.value)} className="w-full p-1.5 ps-8 text-xs border rounded-lg outline-none" />
        </div>
        <button onClick={reload} className="p-1.5 border rounded-lg hover:bg-slate-50 transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin text-[#0f2460]' : 'text-slate-500'} />
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-4 rounded-xl border shadow-xl max-w-md w-full space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-xs sm:text-sm text-[#0f2460]">{editing ? t('تعديل المنتج الحركي', 'Edit Product') : t('منتج جديد بالسيرفر', 'New Product')}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded-full"><X size={14} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="col-span-2">
                <label className="block text-slate-500 mb-0.5">{t('اسم المنتج *', 'Product Name *')}</label>
                <input type="text" value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} className="w-full p-2 border rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-slate-500 mb-0.5">{t('السعر (ج.م) *', 'Price *')}</label>
                <input type="number" value={form.price || ''} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className="w-full p-2 border rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-slate-500 mb-0.5">{t('السعر الأصلي', 'Original Price')}</label>
                <input type="number" value={form.originalPrice || ''} onChange={e => setForm({ ...form, originalPrice: Number(e.target.value) })} className="w-full p-2 border rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-slate-500 mb-0.5">{t('الفئة', 'Category')}</label>
                <input type="text" value={form.categoryAr} onChange={e => setForm({ ...form, categoryAr: e.target.value })} className="w-full p-2 border rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-slate-500 mb-0.5">{t('الماركة', 'Brand')}</label>
                <input type="text" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="w-full p-2 border rounded-lg outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-slate-500 mb-0.5">{t('رابط الصورة أونلاين', 'Image URL')}</label>
                <input type="text" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className="w-full p-2 border rounded-lg outline-none" placeholder="https://example.com/image.jpg" />
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs pt-2 border-t">
              <button onClick={() => setShowForm(false)} className="px-3 py-1.5 border rounded-lg hover:bg-slate-50">{t('إلغاء', 'Cancel')}</button>
              <button onClick={handleSave} className="px-4 py-1.5 bg-[#0f2460] text-white rounded-lg hover:bg-opacity-90">{t('حفظ في السيرفر', 'Save Live')}</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-xs text-slate-400 animate-pulse flex flex-col items-center justify-center gap-2">
          <RefreshCw className="animate-spin text-[#0f2460]" size={20} />
          <span>جاري الاتصال والتحميل من قاعدة بيانات Supabase الحية...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm p-2.5 flex flex-col justify-between space-y-2">
              <div className="space-y-2">
                <div className="aspect-square bg-slate-50 rounded-lg overflow-hidden relative">
                  <img src={p.images?.[0] ?? 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=400&fit=crop'} className="w-full h-full object-cover" alt="" onError={e => { (e.target as any).src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=400&fit=crop'; }} />
                  <span className="absolute top-1.5 start-1.5 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">Live DB</span>
                </div>
                <div className="font-bold text-xs text-slate-700 truncate">{lang === 'ar' ? p.nameAr : p.nameEn}</div>
                <div className="text-xs text-slate-400">{p.brand}</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-[#0f2460]">{formatCurrency(p.price ?? 0, lang)}</span>
                  {p.originalPrice && p.originalPrice > (p.price ?? 0) && (
                    <span className="text-[10px] text-slate-400 line-through">{formatCurrency(p.originalPrice, lang)}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 text-[11px] pt-1 border-t border-slate-50">
                <button onClick={() => {
                  setEditing(p);
                  setForm({ nameAr: p.nameAr ?? '', price: p.price ?? 0, originalPrice: p.originalPrice ?? 0, imageUrl: p.images?.[0] ?? '', categoryAr: p.categoryAr ?? '', brand: p.brand ?? '', stock: p.stock ?? 10, isActive: p.isActive ?? true });
                  setShowForm(true);
                }} className="flex-1 py-1 bg-[#0f2460]/10 text-[#0f2460] font-medium rounded-md hover:bg-[#0f2460] hover:text-white transition-all flex items-center justify-center gap-1">
                  <Edit2 size={10} /> {t('تعديل', 'Edit')}
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-1 bg-red-50 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition-all">
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center text-xs text-slate-400">
              {t('لا توجد منتجات مطابقة للبحث أو قاعدة البيانات فارغة', 'No products found')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
