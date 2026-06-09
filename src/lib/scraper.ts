/**
 * Aman Store Product Scraper — PayNex
 *
 * Server-side Node.js / Puppeteer scraper.
 * In production this runs as a Supabase Edge Function or cron job.
 *
 * Provides:
 * - Product list extraction with fallback selectors
 * - Price protection (never update with zero/null prices)
 * - Image URL normalization
 * - Deduplication by sourceId
 */

export interface ScrapedProduct {
  sourceId: string;
  name: string;
  nameAr: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  brand: string;
  description?: string;
  inStock: boolean;
  sourceUrl: string;
}

// Fallback selectors for Aman Store (or similar Egyptian retailer)
const FALLBACK_SELECTORS = {
  productCard: [
    '.product-item',
    '.product-card',
    '[data-product-id]',
    '.single-product',
  ],
  name: [
    '.product-title',
    'h2.product-name',
    '.product-title a',
    'h3.title',
  ],
  price: [
    '.price ins .amount',
    '.price .amount',
    '.product-price',
    '[data-price]',
    '.current-price',
  ],
  originalPrice: [
    '.price del .amount',
    '.old-price .amount',
    '.was-price',
  ],
  image: [
    '.product-image img',
    '.product-thumbnail img',
    'img.wp-post-image',
  ],
  category: [
    '.product-category',
    '.breadcrumb li:last-child',
  ],
};

/**
 * Parse a price string like "18,999 EGP" → 18999
 */
export function parsePrice(text: string): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[^0-9.,]/g, '').replace(/,/g, '');
  const val = parseFloat(cleaned);
  if (!isFinite(val) || val <= 0) return null;
  return val;
}

/**
 * Normalize image URL (handle relative paths, protocol-relative).
 */
export function normalizeImageUrl(url: string, baseUrl: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return new URL(url, baseUrl).href;
  return new URL(url, baseUrl).href;
}

/**
 * Price protection: never overwrite with invalid data.
 */
export function isValidPriceUpdate(current: number, incoming: number | null): boolean {
  if (incoming === null || incoming === undefined || incoming <= 0) return false;
  if (current > 0 && incoming > current * 3) return false; // Spike guard (>300%)
  return true;
}

/**
 * Mock scraper result for demo / development.
 * In production, replace with actual Puppeteer / fetch call.
 */
export async function scrapeAmanStoreCatalog(): Promise<ScrapedProduct[]> {
  // Simulate a 24-hour cron sync by returning cached data if < 24h.
  const cacheKey = 'paynex_aman_cache';
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const { ts, data } = JSON.parse(cached) as { ts: string; data: ScrapedProduct[] };
      const ageHours = (Date.now() - new Date(ts).getTime()) / 36e5;
      if (ageHours < 24) return data;
    } catch { /* ignore */ }
  }

  // Demo: return synthetic products mimicking Aman Store structure
  const demoProducts: ScrapedProduct[] = [
    {
      sourceId: 'aman-001',
      name: 'Samsung Galaxy A55 5G',
      nameAr: 'سامسونج جالاكسي A55 5G',
      price: 18999,
      originalPrice: 21000,
      imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&h=600&fit=crop&auto=format',
      category: 'phones',
      brand: 'Samsung',
      inStock: true,
      sourceUrl: 'https://aman.store/product/samsung-galaxy-a55',
    },
    {
      sourceId: 'aman-002',
      name: 'iPhone 15 Pro',
      nameAr: 'آيفون 15 برو',
      price: 45999,
      originalPrice: 49000,
      imageUrl: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&h=600&fit=crop&auto=format',
      category: 'phones',
      brand: 'Apple',
      inStock: true,
      sourceUrl: 'https://aman.store/product/iphone-15-pro',
    },
  ];

  localStorage.setItem(cacheKey, JSON.stringify({ ts: new Date().toISOString(), data: demoProducts }));
  return demoProducts;
}

/**
 * Diff scraped products against current DB products to find upserts.
 */
export function diffProducts(
  current: { sourceId: string; price: number; lastSyncedAt?: string }[],
  scraped: ScrapedProduct[]
): { toInsert: ScrapedProduct[]; toUpdate: ScrapedProduct[] } {
  const currentMap = new Map(current.map(c => [c.sourceId, c]));
  const toInsert: ScrapedProduct[] = [];
  const toUpdate: ScrapedProduct[] = [];

  for (const p of scraped) {
    const existing = currentMap.get(p.sourceId);
    if (!existing) {
      toInsert.push(p);
    } else if (isValidPriceUpdate(existing.price, p.price)) {
      toUpdate.push(p);
    }
  }

  return { toInsert, toUpdate };
}
