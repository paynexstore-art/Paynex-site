// src/lib/image.ts

// We hardcode the known Supabase URL to avoid environment variable issues in some contexts
const SUPABASE_URL = 'https://kgkijgyzargmfyeyztgy.supabase.co';

const CATEGORY_FALLBACKS: Record<string, string> = {
  phones: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=600&fit=crop&auto=format',
  laptops: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop&auto=format',
  tvs: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=600&fit=crop&auto=format',
  appliances: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&h=600&fit=crop&auto=format',
  gaming: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=600&h=600&fit=crop&auto=format',
  default: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=600&fit=crop&auto=format',
};

export function getProductImageUrl(image: any, category?: string, fallback?: string): string {
  // 1. Basic validation and handling of non-string types
  let imagePath: string | null = null;

  if (!image) {
    imagePath = null;
  } else if (typeof image === 'string') {
    imagePath = image;
  } else if (Array.isArray(image)) {
    imagePath = image[0] || null;
  } else if (typeof image === 'object') {
    imagePath = image.url || image.path || image.src || null;
  }

  if (!imagePath) {
    return getFallbackImage(category, fallback);
  }

  // 2. If it's already a full URL, return it
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // 3. Clean the path (remove leading slashes)
  const cleanPath = imagePath.replace(/^\/+/, '');

  // 4. Determine the Bucket
  // Try to detect if the path already starts with a bucket name
  const commonBuckets = ['products', 'product-images', 'public', 'images'];
  const parts = cleanPath.split('/');
  let bucket = 'products'; // Default
  let finalPath = cleanPath;

  if (parts.length > 1 && commonBuckets.includes(parts[0])) {
    bucket = parts[0];
    finalPath = parts.slice(1).join('/');
  }

  // 5. Construct the Public URL directly
  // Format: {SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${finalPath}`;
}

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

export function getProductImages(images: any, category?: string, fallback?: string): string[] {
  if (!images) return [getProductImageUrl(null, category, fallback)];
  
  let arr: any[] = [];
  if (Array.isArray(images)) {
    arr = images;
  } else if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      arr = Array.isArray(parsed) ? parsed : [images];
    } catch {
      arr = [images];
    }
  } else if (typeof images === 'object') {
    arr = [images];
  }

  if (arr.length === 0) return [getProductImageUrl(null, category, fallback)];
  
  return arr.map(img => getProductImageUrl(img, category, fallback));
}
