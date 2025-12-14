import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorOption {
  id: string;
  name: string;
  value: string; // Hex color or image URL
  inStock?: boolean;
  image?: string;
}

interface ProductColorSwatchesProps {
  colors: ColorOption[];
  selectedColor?: string;
  onColorChange?: (colorId: string) => void;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export const ProductColorSwatches = ({
  colors,
  selectedColor,
  onColorChange,
  size = "md",
  showLabel = true,
  className,
}: ProductColorSwatchesProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  if (colors.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {showLabel && (
        <label className="text-sm font-medium">Color</label>
      )}
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => {
          const isSelected = selectedColor === color.id;
          const isOutOfStock = color.inStock === false;

          return (
            <button
              key={color.id}
              onClick={() => !isOutOfStock && onColorChange?.(color.id)}
              disabled={isOutOfStock}
              className={cn(
                "relative rounded-full border-2 transition-all",
                sizeClasses[size],
                isSelected
                  ? "border-primary ring-2 ring-primary ring-offset-2"
                  : "border-border hover:border-primary/50",
                isOutOfStock && "opacity-50 cursor-not-allowed"
              )}
              style={
                color.image
                  ? {
                      backgroundImage: `url(${color.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : {
                      backgroundColor: color.value,
                    }
              }
              aria-label={`Select ${color.name}${isOutOfStock ? " (Out of Stock)" : ""}`}
            >
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                </div>
              )}
              {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-destructive rotate-45" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      {selectedColor && (
        <p className="text-sm text-muted-foreground">
          Selected: {colors.find(c => c.id === selectedColor)?.name}
        </p>
      )}
    </div>
  );
};

