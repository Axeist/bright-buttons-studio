import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductOverview } from "./ProductOverview";

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string | null;
  category?: string;
  fabric?: string | null;
  technique?: string | null;
  tagline?: string | null;
  product_photos?: Array<{ image_url: string }>;
  inventory?: {
    quantity: number;
    reserved_quantity: number;
  };
}

interface ProductQuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (quantity: number, size?: string) => void;
  onWishlistToggle?: () => void;
  isWishlisted?: boolean;
  sizeOptions?: string[];
}

export const ProductQuickViewModal = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onWishlistToggle,
  isWishlisted = false,
  sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"],
}: ProductQuickViewModalProps) => {
  if (!product) return null;

  // Get product images
  const productImages = (() => {
    if (product.product_photos && product.product_photos.length > 0) {
      return product.product_photos.map(photo => photo.image_url);
    }
    return product.image_url ? [product.image_url] : [];
  })();

  const productData = {
    id: product.id,
    name: product.name,
    price: product.price,
    description: product.description || undefined,
    images: productImages,
    inStock: (() => {
      const inv = product.inventory;
      return (inv?.quantity || 0) - (inv?.reserved_quantity || 0) > 0;
    })(),
    category: product.category,
    tags: [product.fabric, product.technique].filter(Boolean) as string[],
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>
        <div className="p-6">
          <ProductOverview
            product={productData}
            onAddToCart={(qty, size) => {
              onAddToCart?.(qty, size);
              onClose();
            }}
            onWishlistToggle={onWishlistToggle}
            isWishlisted={isWishlisted}
            sizeOptions={sizeOptions}
            requireSize={sizeOptions.length > 0}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

