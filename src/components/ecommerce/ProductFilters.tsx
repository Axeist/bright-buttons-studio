import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface ProductFiltersProps {
  categories?: FilterOption[];
  brands?: FilterOption[];
  priceRange?: [number, number];
  onPriceRangeChange?: (range: [number, number]) => void;
  selectedCategories?: string[];
  onCategoryChange?: (categories: string[]) => void;
  selectedBrands?: string[];
  onBrandChange?: (brands: string[]) => void;
  onClearFilters?: () => void;
  className?: string;
  isMobile?: boolean;
}

export const ProductFilters = ({
  categories = [],
  brands = [],
  priceRange = [0, 10000],
  onPriceRangeChange,
  selectedCategories = [],
  onCategoryChange,
  selectedBrands = [],
  onBrandChange,
  onClearFilters,
  className,
  isMobile = false,
}: ProductFiltersProps) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    categories: true,
    brands: true,
    price: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    if (!onCategoryChange) return;
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];
    onCategoryChange(newCategories);
  };

  const handleBrandToggle = (brandId: string) => {
    if (!onBrandChange) return;
    const newBrands = selectedBrands.includes(brandId)
      ? selectedBrands.filter((id) => id !== brandId)
      : [...selectedBrands, brandId];
    onBrandChange(newBrands);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <button
          onClick={() => toggleSection("price")}
          className="flex items-center justify-between w-full mb-4"
        >
          <h3 className="font-semibold text-lg">Price Range</h3>
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform",
              openSections.price && "rotate-180"
            )}
          />
        </button>
        <AnimatePresence>
          {openSections.price && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pb-4">
                <Slider
                  value={priceRange}
                  onValueChange={(value) =>
                    onPriceRangeChange?.([value[0], value[1]])
                  }
                  min={0}
                  max={10000}
                  step={100}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    ₹{priceRange[0].toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">
                    ₹{priceRange[1].toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <Separator />
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <button
            onClick={() => toggleSection("categories")}
            className="flex items-center justify-between w-full mb-4"
          >
            <h3 className="font-semibold text-lg">Categories</h3>
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform",
                openSections.categories && "rotate-180"
              )}
            />
          </button>
          <AnimatePresence>
            {openSections.categories && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 pb-4">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() => handleCategoryToggle(category.id)}
                      />
                      <Label
                        htmlFor={`category-${category.id}`}
                        className="flex-1 cursor-pointer text-sm font-normal"
                      >
                        {category.label}
                        {category.count !== undefined && (
                          <span className="text-muted-foreground ml-2">
                            ({category.count})
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <Separator />
        </div>
      )}

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <button
            onClick={() => toggleSection("brands")}
            className="flex items-center justify-between w-full mb-4"
          >
            <h3 className="font-semibold text-lg">Brands</h3>
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform",
                openSections.brands && "rotate-180"
              )}
            />
          </button>
          <AnimatePresence>
            {openSections.brands && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 pb-4">
                  {brands.map((brand) => (
                    <div key={brand.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`brand-${brand.id}`}
                        checked={selectedBrands.includes(brand.id)}
                        onCheckedChange={() => handleBrandToggle(brand.id)}
                      />
                      <Label
                        htmlFor={`brand-${brand.id}`}
                        className="flex-1 cursor-pointer text-sm font-normal"
                      >
                        {brand.label}
                        {brand.count !== undefined && (
                          <span className="text-muted-foreground ml-2">
                            ({brand.count})
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Clear Filters */}
      {(selectedCategories.length > 0 ||
        selectedBrands.length > 0 ||
        priceRange[0] > 0 ||
        priceRange[1] < 10000) && (
        <Button
          variant="outline"
          className="w-full rounded-full"
          onClick={onClearFilters}
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="rounded-full">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Filter Products</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Card className={cn("sticky top-4", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Filters</span>
          {(selectedCategories.length > 0 ||
            selectedBrands.length > 0 ||
            priceRange[0] > 0 ||
            priceRange[1] < 10000) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-auto p-0 text-xs"
            >
              Clear
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FilterContent />
      </CardContent>
    </Card>
  );
};

