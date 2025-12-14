import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, ZoomOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductImageZoomProps {
  src: string;
  alt: string;
  className?: string;
  zoomLevel?: number;
}

export const ProductImageZoom = ({
  src,
  alt,
  className,
  zoomLevel = 2,
}: ProductImageZoomProps) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  return (
    <div
      className={cn("relative overflow-hidden group", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setIsZoomed(false)}
    >
      <div className="relative">
        <img
          src={src}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-transform duration-300",
            isZoomed && "cursor-zoom-out"
          )}
          style={
            isZoomed
              ? {
                  transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                  transform: `scale(${zoomLevel})`,
                }
              : undefined
          }
        />
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full",
            isZoomed && "opacity-100"
          )}
          onClick={() => setIsZoomed(!isZoomed)}
          aria-label={isZoomed ? "Zoom out" : "Zoom in"}
        >
          {isZoomed ? (
            <ZoomOut className="w-4 h-4" />
          ) : (
            <ZoomIn className="w-4 h-4" />
          )}
        </Button>
      </div>
      {isZoomed && (
        <div className="absolute inset-0 pointer-events-none border-2 border-primary/50" />
      )}
    </div>
  );
};

