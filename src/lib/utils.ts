import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the primary or first product image URL
 * @param product - Product object with product_photos and image_url
 * @returns The image URL to display, or null if no image available
 */
export function getProductImageUrl(product: {
  product_photos?: Array<{ image_url: string; display_order: number; is_primary: boolean }>;
  image_url?: string | null;
}): string | null {
  // First, try to get primary photo from product_photos
  if (product.product_photos && product.product_photos.length > 0) {
    const primaryPhoto = product.product_photos.find(photo => photo.is_primary);
    if (primaryPhoto) {
      return primaryPhoto.image_url;
    }
    
    // If no primary, get the first photo sorted by display_order
    const sortedPhotos = [...product.product_photos].sort((a, b) => a.display_order - b.display_order);
    if (sortedPhotos[0]) {
      return sortedPhotos[0].image_url;
    }
  }
  
  // Fallback to main image_url
  return product.image_url || null;
}