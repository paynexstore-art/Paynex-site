import { Category } from '@/types';

export const PRODUCT_CATEGORIES: Category[] = [
  {
    id: 'mobile-phones',
    nameAr: 'هواتف محمولة',
    nameEn: 'Mobile Phones',
    icon: '📱',
    color: 'from-blue-500 to-cyan-500',
    order: 1,
  },
  {
    id: 'laptops',
    nameAr: 'أجهزة لاب توب',
    nameEn: 'Laptops',
    icon: '💻',
    color: 'from-purple-500 to-indigo-500',
    order: 2,
  },
  {
    id: 'televisions',
    nameAr: 'تلفزيونات وشاشات',
    nameEn: 'TVs & Screens',
    icon: '📺',
    color: 'from-rose-500 to-pink-500',
    order: 3,
  },
  {
    id: 'tablets',
    nameAr: 'تابلت',
    nameEn: 'Tablets',
    icon: '📲',
    color: 'from-emerald-500 to-teal-500',
    order: 4,
  },
  {
    id: 'computing',
    nameAr: 'أجهزة كمبيوتر ومستلزماتها',
    nameEn: 'Computing',
    icon: '🖥️',
    color: 'from-slate-500 to-gray-600',
    order: 5,
  },
  {
    id: 'smart-watches',
    nameAr: 'ساعات ذكية',
    nameEn: 'Smart Watches',
    icon: '⌚',
    color: 'from-orange-500 to-amber-500',
    order: 6,
  },
  {
    id: 'health-beauty',
    nameAr: 'الصحة والجمال',
    nameEn: 'Health & Beauty',
    icon: '💄',
    color: 'from-pink-500 to-rose-500',
    order: 7,
  },
  {
    id: 'baby-products',
    nameAr: 'منتجات الأطفال',
    nameEn: 'Baby Products',
    icon: '👶',
    color: 'from-yellow-400 to-orange-400',
    order: 8,
  },
  {
    id: 'other',
    nameAr: 'أخرى',
    nameEn: 'Other',
    icon: '📦',
    color: 'from-gray-400 to-gray-500',
    order: 9,
  },
];

export function getCategoryName(categoryId: string, lang: 'ar' | 'en' = 'ar'): string {
  const cat = PRODUCT_CATEGORIES.find(c => c.id === categoryId);
  return cat ? (lang === 'ar' ? cat.nameAr : cat.nameEn) : 'Unknown';
}

export function getCategoryIcon(categoryId: string): string {
  const cat = PRODUCT_CATEGORIES.find(c => c.id === categoryId);
  return cat?.icon || '📦';
}
