import { Leaf, Eye, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Product } from "@/types/product";
import { getWhatsAppLink } from "@/components/WhatsAppButton";

interface ProductCardProps {
  product: Product;
  onQuickView: () => void;
}

export const ProductCard = ({ product, onQuickView }: ProductCardProps) => {
  const handleWhatsAppEnquiry = () => {
    window.open(getWhatsAppLink(product.name, product.category, product.fabric), "_blank");
  };

  return (
    <div className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-primary-50 dark:from-primary-900/20 to-earth-50 dark:to-card">
        {product.image && product.image !== "/placeholder.svg" ? (
          <>
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center" style={{ display: 'none' }}>
              <div className="text-center p-6">
                <Leaf className="w-12 h-12 text-primary-400 dark:text-primary-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
                <p className="text-primary-600 dark:text-primary-400 font-medium text-sm">{product.technique}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-6">
              <Leaf className="w-12 h-12 text-primary-400 dark:text-primary-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
              <p className="text-primary-600 dark:text-primary-400 font-medium text-sm">{product.technique}</p>
            </div>
          </div>
        )}
        
        {/* Unique Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="px-3 py-1 bg-primary/90 text-primary-foreground text-xs font-medium rounded-full backdrop-blur-sm">
            One of a Kind
          </span>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 z-10" />
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
          {product.name}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {product.tagline}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
            {product.category}
          </span>
          <span className="px-2 py-1 bg-earth-100 dark:bg-earth-800/40 text-earth-800 dark:text-earth-300 text-xs rounded-full">
            {product.fabric}
          </span>
        </div>

        {/* Price */}
        {product.price && (
          <p className="text-lg font-semibold text-primary mb-4">{product.price}</p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-2 mt-auto">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 rounded-full w-full sm:w-auto min-h-[44px]"
            onClick={onQuickView}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button 
            size="sm" 
            className="flex-1 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white w-full sm:w-auto min-h-[44px]"
            onClick={handleWhatsAppEnquiry}
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Enquire
          </Button>
        </div>
      </div>
    </div>
  );
};
