# Ecommerce Components - Tailwind CSS Plus UI Blocks

This directory contains a comprehensive set of ecommerce UI components inspired by Tailwind CSS Plus UI Blocks, all styled to maintain the Bright Buttons theme (eco-green primary, earth tones, blush colors).

## Components

### Core Product Components

#### `ProductOverview`
Complete product detail page component with image gallery, product information, quantity selector, and add to cart functionality.

**Features:**
- Image gallery with thumbnail navigation
- Product rating and reviews display
- Quantity selector
- Wishlist toggle
- Product tags and categories
- Feature highlights (free shipping, easy returns, secure payment)

**Usage:**
```tsx
import { ProductOverview } from "@/components/ecommerce";

<ProductOverview
  product={{
    id: "1",
    name: "Product Name",
    price: 2999,
    images: ["/image1.jpg", "/image2.jpg"],
    rating: 4.5,
    reviewCount: 24,
    inStock: true,
    description: "Product description",
    tags: ["Eco-friendly", "Handmade"]
  }}
  onAddToCart={(quantity) => console.log(quantity)}
  onWishlistToggle={() => console.log("toggle")}
  isWishlisted={false}
/>
```

#### `ProductGrid`
Responsive product grid layout with hover effects and quick actions.

**Features:**
- Responsive grid (2, 3, or 4 columns)
- Product cards with images
- Rating display
- Quick view and add to cart on hover
- Wishlist toggle
- Sale badges and stock indicators

**Usage:**
```tsx
import { ProductGrid } from "@/components/ecommerce";

<ProductGrid
  products={products}
  columns={4}
  onProductClick={(product) => navigate(`/product/${product.id}`)}
  onAddToCart={(product) => addToCart(product)}
  onWishlistToggle={(product) => toggleWishlist(product)}
  wishlistedIds={wishlistSet}
/>
```

#### `ProductFilters`
Advanced filtering sidebar with collapsible sections for categories, brands, and price range.

**Features:**
- Price range slider
- Category filters with counts
- Brand filters
- Mobile-responsive sheet view
- Clear filters functionality

**Usage:**
```tsx
import { ProductFilters } from "@/components/ecommerce";

<ProductFilters
  categories={categories}
  brands={brands}
  priceRange={[0, 10000]}
  onPriceRangeChange={(range) => setPriceRange(range)}
  selectedCategories={selectedCategories}
  onCategoryChange={setSelectedCategories}
  isMobile={isMobile}
/>
```

### Shopping Cart Components

#### `EnhancedShoppingCart`
Enhanced shopping cart drawer with animations, free shipping progress, and item management.

**Features:**
- Animated item removal
- Quantity controls
- Free shipping progress indicator
- Price breakdown
- Continue shopping option

**Usage:**
```tsx
import { EnhancedShoppingCart } from "@/components/ecommerce";

<EnhancedShoppingCart
  items={cartItems}
  isOpen={isCartOpen}
  onOpenChange={setIsCartOpen}
  onUpdateQuantity={(id, qty) => updateQuantity(id, qty)}
  onRemoveItem={(id) => removeItem(id)}
  onCheckout={() => navigate("/checkout")}
  subtotal={subtotal}
  shipping={shipping}
  tax={tax}
  total={total}
  freeShippingThreshold={500}
/>
```

### Checkout Components

#### `CheckoutSteps`
Multi-step checkout progress indicator.

**Features:**
- Visual step progress
- Completed step indicators
- Current step highlighting

**Usage:**
```tsx
import { CheckoutSteps } from "@/components/ecommerce";

<CheckoutSteps
  currentStep={2}
  steps={[
    { id: "cart", label: "Cart" },
    { id: "shipping", label: "Shipping" },
    { id: "payment", label: "Payment" },
    { id: "review", label: "Review" }
  ]}
/>
```

#### `CheckoutForm`
Complete checkout form with shipping, billing, and payment information.

**Features:**
- Contact information
- Shipping address
- Billing address (optional same as shipping)
- Payment method selection (Card, UPI, COD)
- Form validation
- Save address option

**Usage:**
```tsx
import { CheckoutForm } from "@/components/ecommerce";

<CheckoutForm
  onComplete={(data) => {
    console.log("Checkout data:", data);
    // Process checkout
  }}
/>
```

#### `OrderSummary`
Order summary card with item list, price breakdown, and coupon code input.

**Features:**
- Item list with images
- Subtotal, shipping, tax, discount
- Coupon code input
- Free shipping indicator
- Security badge

**Usage:**
```tsx
import { OrderSummary } from "@/components/ecommerce";

<OrderSummary
  items={orderItems}
  subtotal={subtotal}
  shipping={shipping}
  tax={tax}
  discount={discount}
  total={total}
  onApplyCoupon={(code) => applyCoupon(code)}
  couponCode={appliedCoupon}
/>
```

### Product Discovery Components

#### `RelatedProducts`
Display related or recommended products.

**Features:**
- Product grid layout
- View all option
- Customizable title

**Usage:**
```tsx
import { RelatedProducts } from "@/components/ecommerce";

<RelatedProducts
  products={relatedProducts}
  title="You May Also Like"
  onProductClick={(product) => navigate(`/product/${product.id}`)}
  onViewAll={() => navigate("/shop")}
/>
```

#### `SearchResults`
Search results display with query input and results count.

**Features:**
- Search input with clear button
- Results count
- Product grid display
- Empty state

**Usage:**
```tsx
import { SearchResults } from "@/components/ecommerce";

<SearchResults
  query={searchQuery}
  results={searchResults}
  totalResults={totalCount}
  onQueryChange={setSearchQuery}
  onProductClick={(product) => navigate(`/product/${product.id}`)}
/>
```

#### `ProductComparison`
Side-by-side product comparison table.

**Features:**
- Multiple product comparison
- Feature comparison
- Remove product option
- Add to cart from comparison

**Usage:**
```tsx
import { ProductComparison } from "@/components/ecommerce";

<ProductComparison
  products={comparisonProducts}
  onRemove={(id) => removeFromComparison(id)}
  onAddToCart={(id) => addToCart(id)}
/>
```

### Utility Components

#### `EmptyState`
Reusable empty state component for various scenarios.

**Usage:**
```tsx
import { EmptyState } from "@/components/ecommerce";
import { ShoppingCart } from "lucide-react";

<EmptyState
  icon={ShoppingCart}
  title="Your cart is empty"
  description="Start adding items to your cart to see them here"
  action={{
    label: "Start Shopping",
    onClick: () => navigate("/shop")
  }}
/>
```

#### `LoadingState`
Loading skeleton states for different layouts.

**Usage:**
```tsx
import { LoadingState } from "@/components/ecommerce";

<LoadingState variant="grid" count={8} />
<LoadingState variant="list" count={5} />
<LoadingState variant="detail" />
```

#### `ProductBadges`
Product status badges (New, Sale, Featured, Out of Stock).

**Usage:**
```tsx
import { ProductBadges } from "@/components/ecommerce";

<ProductBadges
  isNew={true}
  isSale={true}
  discount={20}
  inStock={true}
/>
```

#### `PriceDisplay`
Formatted price display with sale price support.

**Usage:**
```tsx
import { PriceDisplay } from "@/components/ecommerce";

<PriceDisplay
  price={2999}
  salePrice={1999}
  size="lg"
  showOriginal={true}
/>
```

## Theme Integration

All components use the Bright Buttons theme:

- **Primary Color**: Eco-green (`hsl(var(--primary))`)
- **Earth Tones**: Warm beiges and browns (`hsl(var(--earth-*))`)
- **Blush Colors**: Soft pinks (`hsl(var(--blush-*))`)
- **Border Radius**: `0.75rem` (rounded-2xl for cards)
- **Shadows**: Soft shadows with glow effects
- **Animations**: Framer Motion for smooth transitions

## Best Practices

1. **Responsive Design**: All components are mobile-first and responsive
2. **Accessibility**: Proper ARIA labels and keyboard navigation
3. **Performance**: Lazy loading images and optimized animations
4. **Theme Consistency**: Use theme colors via CSS variables
5. **Type Safety**: Full TypeScript support with proper interfaces

## Example: Complete Product Page

```tsx
import {
  ProductOverview,
  RelatedProducts,
  ProductBadges,
  PriceDisplay,
  LoadingState
} from "@/components/ecommerce";

const ProductPage = () => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  if (loading) return <LoadingState variant="detail" />;
  if (!product) return <EmptyState title="Product not found" />;

  return (
    <div className="container-custom section-padding">
      <ProductOverview
        product={product}
        onAddToCart={handleAddToCart}
        onWishlistToggle={handleWishlistToggle}
        isWishlisted={isWishlisted}
      />
      
      <RelatedProducts
        products={relatedProducts}
        onProductClick={handleProductClick}
      />
    </div>
  );
};
```

## Example: Shop Page with Filters

```tsx
import {
  ProductGrid,
  ProductFilters,
  LoadingState,
  EmptyState
} from "@/components/ecommerce";

const ShopPage = () => {
  return (
    <div className="container-custom section-padding">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <ProductFilters
          categories={categories}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          selectedCategories={selectedCategories}
          onCategoryChange={setSelectedCategories}
        />
        
        <div className="lg:col-span-3">
          {loading ? (
            <LoadingState variant="grid" count={8} />
          ) : products.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Try adjusting your filters"
            />
          ) : (
            <ProductGrid
              products={products}
              columns={3}
              onProductClick={handleProductClick}
            />
          )}
        </div>
      </div>
    </div>
  );
};
```

