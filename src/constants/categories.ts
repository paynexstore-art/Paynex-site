import { Category } from '@/types';

export const PRODUCT_CATEGORIES: Category[] = [
  {
    id: 'phones',
    nameAr: 'موبايلات',
    nameEn: 'Phones',
    icon: '📱',
    color: 'from-blue-500 to-cyan-500',
    order: 1,
  },
  {
    id: 'laptops',
    nameAr: 'لابتوبات',
    nameEn: 'Laptops',
    icon: '💻',
    color: 'from-purple-500 to-indigo-500',
    order: 2,
  },
  {
    id: 'tvs',
    nameAr: 'شاشات وتليفزيونات',
    nameEn: 'TVs & Screens',
    icon: '📺',
    color: 'from-rose-500 to-pink-500',
    order: 3,
  },
  {
    id: 'appliances',
    nameAr: 'أجهزة منزلية',
    nameEn: 'Home Appliances',
    icon: '🏠',
    color: 'from-emerald-500 to-teal-500',
    order: 4,
  },
  {
    id: 'gaming',
    nameAr: 'ألعاب وأجهزة',
    nameEn: 'Gaming',
    icon: '🎮',
    color: 'from-orange-500 to-amber-500',
    order: 5,
  },
  {
    id: 'audio',
    nameAr: 'أجهزة صوت',
    nameEn: 'Audio Equipment',
    icon: '🔊',
    color: 'from-indigo-500 to-purple-500',
    order: 6,
  },
  {
    id: 'cameras',
    nameAr: 'كاميرات',
    nameEn: 'Cameras',
    icon: '📷',
    color: 'from-pink-500 to-rose-500',
    order: 7,
  },
  {
    id: 'accessories',
    nameAr: 'اكسسوارات',
    nameEn: 'Accessories',
    icon: '⌚',
    color: 'from-yellow-500 to-orange-500',
    order: 8,
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
