// src/lib/image.ts
// Utility for handling product images from Supabase or external URLs

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kgkijgyzargmfyeyztgy.supabase.co';

export function getProductImageUrl(image: string | null | undefined, fallback: string = 'https://placehold.co/400x400/eee/999?text=No+Image'): string {
  if (!image) return fallback;

  // If already a full URL, return it
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }

  // If it's a Supabase storage path (common pattern)
  if (image.includes('/') || image.includes('.')) {
    // Assume it's in a 'products' bucket or public. Adjust bucket name if different.
    const bucket = 'products'; // Change if your images are in a different bucket
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${image.replace(/^\//, '')}`;
  }

  // Fallback for filenames only
  return `${SUPABASE_URL}/storage/v1/object/public/products/${image}`;
}

export function getProductImages(images: any, fallback: string = 'https://placehold.co/400x400/eee/999?text=No+Image'): string[] {
  if (!images) return [fallback];
  
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

  return arr.length > 0 
    ? arr.map(img => getProductImageUrl(img, fallback))
    : [fallback];
}
