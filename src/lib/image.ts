// src/lib/image.ts
import { supabase } from './supabase';

// Fallback images based on category to ensure the site always looks professional
const CATEGORY_FALLBACKS: Record<string, string> = {
  phones: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=600&fit=crop&auto=format',
  laptops: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop&auto=format',
  tvs: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=600&fit=crop&auto=format',
  appliances: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&h=600&fit=crop&auto=format',
  gaming: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=600&h=600&fit=crop&auto=format',
  default: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=600&fit=crop&auto=format',
};

/**
 * Generates a public URL for a product image.
 * Handles multiple formats: Full URLs, bucket/path, or just path.
 */
export function getProductImageUrl(image: string | null | undefined, category?: string, fallback?: string): string {
  if (!image || typeof image !== 'string') {
    return getFallbackImage(category, fallback);
  }

  // 1. If it's already a full URL, return it directly
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }

  // 2. Handle paths that might include the bucket name (e.g., "products/image.jpg")
  // Supabase storage paths can be "bucket/path/to/file.jpg" or just "path/to/file.jpg"
  let bucket = 'products'; // Default bucket
  let path = image;

  // Try to detect if the image string contains a bucket name
  // We check if the first part of the path matches common bucket names
  const commonBuckets = ['products', 'product-images', 'public', 'images'];
  const parts = image.split('/');
  
  if (parts.length > 1 && commonBuckets.includes(parts[0])) {
    bucket = parts[0];
    path = parts.slice(1).join('/');
  }

  // 3. Use Supabase Client to get the official public URL
  // This is more reliable than manual string concatenation
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  
  if (data?.publicUrl) {
    return data.publicUrl;
  }

  // Final fallback if Supabase client fails
  return getFallbackImage(category, fallback);
}

/**
 * Helper to provide category-specific fallback images
 */
function getFallbackImage(category?: string, fallback?: string): string {
  if (fallback) return fallback;
  
  const cat = (category || '').toLowerCase();
  if (cat.includes('phone') || cat.includes('موبايل')) return CATEGORY_FALLBACKS.phones;
  if (cat.includes('laptop') || cat.includes('لابتوب')) return CATEGORY_FALLBACKS.laptops;
  if (cat.includes('tv') || cat.includes('تلفزيون') || cat.includes('شاشة')) return CATEGORY_FALLBACKS.tvs;
  if (cat.includes('wash') || cat.includes('غسالة') || cat.includes('appliance') || cat.includes('منزلي')) return CATEGORY_FALLBACKS.appliances;
  if (cat.includes('game') || cat.includes('بلاي') || cat.includes('gaming')) return CATEGORY_FALLBACKS.gaming;

  return CATEGORY_FALLBACKS.default;
}

/**
 * Safely converts image data (JSON/Array/String) into a list of valid URLs
 */
export function getProductImages(images: any, category?: string, fallback?: string): string[] {
  if (!images) {
    return [getProductImageUrl(null, category, fallback)];
  }
  
  let arr: string[] = [];
  if (Array.isArray(images)) {
    arr = images;
  } else if (typeof images === 'string') {
    try {
      // Try parsing as JSON array first
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) {
        arr = parsed;
      } else {
        arr = [images];
      }
    } catch {
      // Not JSON, treat as a single image path
      arr = [images];
    }
  } else if (typeof images === 'object') {
    // If it's an object, try to find a URL or path inside it
    const possibleUrl = images.url || images.path || images.src;
    arr = possibleUrl ? [possibleUrl] : [];
  }

  if (arr.length > 0) {
    return arr.map(img => getProductImageUrl(img, category, fallback));
  }
  
  return [getProductImageUrl(null, category, fallback)];
}

