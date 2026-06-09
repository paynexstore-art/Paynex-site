// src/lib/image.ts
// Utility for handling product images from Supabase or external URLs
// Modern fallbacks for when DB has no images (common for 4510 products)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kgkijgyzargmfyeyztgy.supabase.co';

// Category-based modern Unsplash fallbacks (high quality, relevant to product type)
const CATEGORY_FALLBACKS: Record<string, string> = {
  phones: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=600&fit=crop&auto=format',
  laptops: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop&auto=format',
  tvs: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=600&fit=crop&auto=format',
  appliances: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&h=600&fit=crop&auto=format',
  gaming: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=600&h=600&fit=crop&auto=format',
  default: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=600&fit=crop&auto=format',
};

export function getProductImageUrl(image: string | null | undefined, category?: string, fallback?: string): string {
  if (image) {
    // If already a full URL, return it
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }

    // If it's a Supabase storage path (common pattern)
    if (image.includes('/') || image.includes('.')) {
      const bucket = 'products'; // Adjust if your bucket is different (e.g. 'public' or 'images')
      return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${image.replace(/^\//, '')}`;
    }

    // Filename only - try Supabase
    return `${SUPABASE_URL}/storage/v1/object/public/products/${image}`;
  }

  // Smart fallback based on category for modern look
  const cat = (category || '').toLowerCase();
  if (cat.includes('phone') || cat.includes('موبايل')) return CATEGORY_FALLBACKS.phones;
  if (cat.includes('laptop') || cat.includes('لابتوب')) return CATEGORY_FALLBACKS.laptops;
  if (cat.includes('tv') || cat.includes('تلفزيون')) return CATEGORY_FALLBACKS.tvs;
  if (cat.includes('wash') || cat.includes('غسالة') || cat.includes('appliance')) return CATEGORY_FALLBACKS.appliances;
  if (cat.includes('game') || cat.includes('بلاي')) return CATEGORY_FALLBACKS.gaming;

  return fallback || CATEGORY_FALLBACKS.default;
}

export function getProductImages(images: any, category?: string, fallback?: string): string[] {
  if (!images) {
    return [getProductImageUrl(null, category, fallback)];
  }
  
  let arr: string[] = [];
  if (Array.isArray(images)) {
    arr = images;
  } else if (typeof images === 'string') {
    try {
      arr = JSON.parse(images);
    } catch {
      arr = [images];
    }
  }

  if (arr.length > 0) {
    return arr.map(img => getProductImageUrl(img, category, fallback));
  }
  return [getProductImageUrl(null, category, fallback)];
}

