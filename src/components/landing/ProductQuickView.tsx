import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import { X, Leaf, MessageCircle, Palette, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Product } from "@/types/product";
import { getWhatsAppLink } from "@/components/WhatsAppButton";

interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductQuickView = ({ product, isOpen, onClose }: ProductQuickViewProps) => {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedSize("");
      setCurrentImageIndex(0);
    }
  }, [isOpen, product]);
  
  if (!product) return null;

  // Generate multiple images for gallery (using main image + variations)
  const productImages = [
    product.image,
    product.image?.replace('w=800', 'w=800&q=90') || product.image,
    product.image?.replace('h=1000', 'h=1200') || product.image,
  ].filter(Boolean);

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

  const handleWhatsAppEnquiry = () => {
    const sizeText = selectedSize ? ` (Size: ${selectedSize})` : "";
    window.open(getWhatsAppLink(product.name, product.category, product.fabric) + encodeURIComponent(sizeText), "_blank");
  };

  const handleCustomRequest = () => {
    window.open(
      getWhatsAppLink() + encodeURIComponent(` I'd like to request a custom design similar to ${product.name}.`),
      "_blank"
    );
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  const features = [
    "Handmade with care",
    `Technique: ${product.technique}`,
    `Fabric: ${product.fabric}`,
    "Each piece is unique",
  ];

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-3 sm:p-4 safe-top safe-bottom">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl bg-card rounded-3xl shadow-2xl overflow-hidden">
                <div className="grid md:grid-cols-2">
                  {/* Image Gallery */}
                  <div className="relative aspect-square md:aspect-auto bg-gradient-to-br from-primary-50 dark:from-primary-900/20 to-earth-50 dark:to-card overflow-hidden">
                    {productImages[currentImageIndex] && productImages[currentImageIndex] !== "/placeholder.svg" ? (
                      <>
                        <img 
                          src={productImages[currentImageIndex]} 
                          alt={`${product.name} - Image ${currentImageIndex + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center" style={{ display: 'none' }}>
                          <div className="text-center p-8">
                            <Leaf className="w-20 h-20 text-primary-400 dark:text-primary-500 mx-auto mb-4" />
                            <p className="text-primary-600 dark:text-primary-400 font-medium">{product.technique}</p>
                            <p className="text-muted-foreground text-sm mt-1">{product.fabric}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center p-8">
                          <Leaf className="w-20 h-20 text-primary-400 dark:text-primary-500 mx-auto mb-4" />
                          <p className="text-primary-600 dark:text-primary-400 font-medium">{product.technique}</p>
                          <p className="text-muted-foreground text-sm mt-1">{product.fabric}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Image Navigation - Only show if multiple images */}
                    {productImages.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors touch-target z-20"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors touch-target z-20"
                          aria-label="Next image"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        {/* Image Indicator */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                          {productImages.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                index === currentImageIndex 
                                  ? 'bg-primary w-6' 
                                  : 'bg-background/60 hover:bg-background/80'
                              }`}
                              aria-label={`Go to image ${index + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                    
                    {/* Close button - mobile */}
                    <button
                      onClick={onClose}
                      className="absolute top-3 right-3 sm:top-4 sm:right-4 md:hidden w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground touch-target z-30"
                      aria-label="Close"
                    >
                      <X className="w-6 h-6 sm:w-5 sm:h-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5 sm:p-6 md:p-8 relative">
                    {/* Close button - desktop */}
                    <button
                      onClick={onClose}
                      className="hidden md:flex absolute top-4 right-4 w-10 h-10 rounded-full bg-secondary items-center justify-center text-foreground hover:bg-accent transition-colors touch-target"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="space-y-4">
                      <div>
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                          {product.category}
                        </span>
                      </div>

                      <Dialog.Title className="text-2xl font-semibold text-foreground">
                        {product.name}
                      </Dialog.Title>

                      <p className="text-muted-foreground">
                        {product.tagline}
                      </p>

                      {product.price && (
                        <p className="text-2xl font-bold text-primary">{product.price}</p>
                      )}

                      {/* Size Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Select Size</label>
                        <div className="flex flex-wrap gap-2">
                          {sizes.map((size) => (
                            <button
                              key={size}
                              onClick={() => setSelectedSize(size)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all min-w-[44px] min-h-[44px] ${
                                selectedSize === size
                                  ? 'bg-primary text-primary-foreground shadow-md'
                                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-2 py-4 border-y border-border">
                        {features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-foreground">
                            <Check className="w-4 h-4 text-primary flex-shrink-0" />
                            {feature}
                          </div>
                        ))}
                      </div>

                      {/* Care Info */}
                      <div className="bg-earth-50 dark:bg-earth-900/30 rounded-xl p-4">
                        <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                          <Palette className="w-4 h-4 text-earth-600 dark:text-earth-400" />
                          Care Instructions
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Hand wash or cold machine wash with mild detergent, air dry in shade, 
                          and iron on reverse to preserve colors and prints.
                        </p>
                      </div>

                      {/* CTAs */}
                      <div className="flex flex-col gap-3 pt-4">
                        <Button 
                          className="w-full rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white min-h-[48px]"
                          onClick={handleWhatsAppEnquiry}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Enquire on WhatsApp
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full rounded-full min-h-[48px]"
                          onClick={handleCustomRequest}
                        >
                          Request Custom Design
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
