import { useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Search, Plus, Minus, CreditCard, Banknote, Smartphone, Shuffle, WifiOff, Leaf } from "lucide-react";
import { products, categories } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

const POS = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: typeof products[0]) => {
    const price = parseInt(product.price?.replace(/[^\d]/g, "") || "0");
    const existingItem = cart.find((item) => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { id: product.id, name: product.name, price, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map((item) => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter((item) => item.quantity > 0));
  };

  const removeItem = (id: number) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discount) / 100;
  const tax = (subtotal - discountAmount) * 0.18;
  const total = subtotal - discountAmount + tax;

  const completeSale = (method: string) => {
    toast({
      title: "Sale Completed!",
      description: `Payment of ₹${total.toLocaleString()} received via ${method} (mock).`,
    });
    setCart([]);
    setDiscount(0);
  };

  return (
    <AdminLayout title="Point of Sale">
      {/* Offline Badge */}
      <div className="flex justify-end mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
          <WifiOff className="w-3 h-3" />
          Offline mode available
        </span>
      </div>

      <div className="grid lg:grid-cols-[1fr,400px] gap-6">
        {/* Product Selection */}
        <div className="bg-card rounded-xl p-5 shadow-soft">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="pl-10 rounded-xl"
            />
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[calc(100vh-340px)] overflow-y-auto">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="p-3 bg-accent rounded-xl text-left hover:bg-accent/80 transition-colors group"
              >
                <div className="w-full aspect-square bg-gradient-to-br from-primary-50 to-earth-50 rounded-lg mb-2 flex items-center justify-center">
                  <Leaf className="w-8 h-8 text-primary-400 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-sm font-medium text-foreground line-clamp-1">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.fabric}</p>
                <p className="text-sm font-semibold text-primary mt-1">{product.price}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                  In stock
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="bg-card rounded-xl p-5 shadow-soft flex flex-col">
          <h2 className="text-lg font-semibold text-foreground mb-4">Current Sale</h2>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[300px] lg:max-h-[calc(100vh-520px)]">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No items in cart</p>
                <p className="text-sm">Click products to add them</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">₹{item.price.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 rounded-full bg-background flex items-center justify-center text-foreground hover:bg-muted"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 rounded-full bg-background flex items-center justify-center text-foreground hover:bg-muted"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-destructive hover:text-destructive/80 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Discount (%)</span>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-20 h-8 text-sm rounded-lg"
                min="0"
                max="100"
              />
              <span className="text-sm text-foreground ml-auto">-₹{discountAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (18%)</span>
              <span className="text-foreground">₹{tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">₹{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Payment Method</p>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => completeSale("Cash")}
                disabled={cart.length === 0}
                className="flex flex-col items-center gap-1 p-3 rounded-lg bg-accent hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
              >
                <Banknote className="w-5 h-5" />
                <span className="text-xs">Cash</span>
              </button>
              <button
                onClick={() => completeSale("UPI")}
                disabled={cart.length === 0}
                className="flex flex-col items-center gap-1 p-3 rounded-lg bg-accent hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
              >
                <Smartphone className="w-5 h-5" />
                <span className="text-xs">UPI</span>
              </button>
              <button
                onClick={() => completeSale("Card")}
                disabled={cart.length === 0}
                className="flex flex-col items-center gap-1 p-3 rounded-lg bg-accent hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">Card</span>
              </button>
              <button
                onClick={() => completeSale("Split")}
                disabled={cart.length === 0}
                className="flex flex-col items-center gap-1 p-3 rounded-lg bg-accent hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
              >
                <Shuffle className="w-5 h-5" />
                <span className="text-xs">Split</span>
              </button>
            </div>

            <Button
              onClick={() => completeSale("Cash")}
              disabled={cart.length === 0}
              className="w-full rounded-full"
              size="lg"
            >
              Complete Sale
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default POS;
