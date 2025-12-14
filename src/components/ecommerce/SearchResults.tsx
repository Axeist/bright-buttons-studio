import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductGrid } from "./ProductGrid";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  category?: string;
}

interface SearchResultsProps {
  query: string;
  results: Product[];
  totalResults?: number;
  onQueryChange?: (query: string) => void;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onWishlistToggle?: (product: Product) => void;
  wishlistedIds?: Set<string>;
  className?: string;
}

export const SearchResults = ({
  query,
  results,
  totalResults,
  onQueryChange,
  onProductClick,
  onAddToCart,
  onWishlistToggle,
  wishlistedIds,
  className,
}: SearchResultsProps) => {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Search Header */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            value={query}
            onChange={(e) => onQueryChange?.(e.target.value)}
            className="pl-10 pr-10 rounded-full"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => onQueryChange?.("")}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Results Count */}
        {query && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {totalResults !== undefined
                ? `Found ${totalResults} result${totalResults !== 1 ? "s" : ""} for "${query}"`
                : `Found ${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"`}
            </p>
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 ? (
        <ProductGrid
          products={results}
          onProductClick={onProductClick}
          onAddToCart={onAddToCart}
          onWishlistToggle={onWishlistToggle}
          wishlistedIds={wishlistedIds}
          columns={4}
        />
      ) : query ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">
            No products found
          </p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search terms or browse our categories
          </p>
        </div>
      ) : null}
    </div>
  );
};

