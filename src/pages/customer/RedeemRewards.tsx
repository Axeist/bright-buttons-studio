import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import { motion } from "framer-motion";
import { Gift, Star, TrendingUp, Award, Clock, Wallet, Sparkles, ArrowRight, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface LoyaltyTransaction {
  id: string;
  points: number;
  transaction_type: string;
  description: string;
  order_id: string | null;
  created_at: string;
  expires_at: string | null;
}

interface WalletTransaction {
  id: string;
  transaction_type: "credit" | "debit";
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  created_at: string;
  order_id: string | null;
}

interface RedeemableItem {
  id: string;
  name: string;
  description: string | null;
  category: 'discount' | 'coupon' | 'product' | 'wallet_credit' | 'other';
  points_required: number;
  value: number | null;
  value_type: 'percentage' | 'fixed' | 'wallet_credit' | null;
  image_url: string | null;
}

const CustomerRedeemRewards = () => {
  const { customer, loading: customerLoading, refreshCustomer } = useCustomerAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyTier, setLoyaltyTier] = useState("bronze");
  const [walletBalance, setWalletBalance] = useState(0);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [redeemableItems, setRedeemableItems] = useState<RedeemableItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<RedeemableItem | null>(null);
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    if (!customerLoading && !customer) {
      navigate("/customer/login");
      return;
    }
    if (customer) {
      fetchData();
    }
  }, [customer, customerLoading]);

  const fetchData = async () => {
    if (!customer) return;

    setLoading(true);
    try {
      // Fetch customer data
      const { data: customerData } = await supabase
        .from("customers")
        .select("loyalty_points, loyalty_tier, wallet_balance")
        .eq("id", customer.id)
        .single();

      if (customerData) {
        setLoyaltyPoints(customerData.loyalty_points || 0);
        setLoyaltyTier(customerData.loyalty_tier || "bronze");
        setWalletBalance(customerData.wallet_balance || 0);
      }

      // Fetch loyalty transactions
      const { data: loyaltyData } = await supabase
        .from("loyalty_points_transactions")
        .select("*")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setLoyaltyTransactions(loyaltyData || []);

      // Fetch wallet transactions
      const { data: walletData } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setWalletTransactions(walletData || []);

      // Fetch redeemable items
      const { data: itemsData } = await supabase
        .from("redeemable_items")
        .select("*")
        .eq("is_active", true)
        .order("points_required", { ascending: true });

      setRedeemableItems(itemsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (item: RedeemableItem) => {
    if (!customer) return;

    if (loyaltyPoints < item.points_required) {
      toast({
        title: "Insufficient Points",
        description: `You need ${item.points_required} points to redeem this item. You currently have ${loyaltyPoints} points.`,
        variant: "destructive",
      });
      return;
    }

    setSelectedItem(item);
    setIsRedeemDialogOpen(true);
  };

  const confirmRedeem = async () => {
    if (!customer || !selectedItem) return;

    setIsRedeeming(true);
    try {
      const { data, error } = await supabase.rpc("redeem_item", {
        _customer_id: customer.id,
        _redeemable_item_id: selectedItem.id,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: `${selectedItem.name} has been redeemed successfully!`,
      });

      setIsRedeemDialogOpen(false);
      setSelectedItem(null);
      await fetchData();
      await refreshCustomer?.();
    } catch (error: any) {
      console.error("Error redeeming item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to redeem item",
        variant: "destructive",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "platinum":
        return "from-purple-500 to-purple-700";
      case "gold":
        return "from-yellow-500 to-yellow-700";
      case "silver":
        return "from-gray-400 to-gray-600";
      default:
        return "from-orange-500 to-orange-700";
    }
  };

  const getTierBenefits = (tier: string) => {
    switch (tier) {
      case "platinum":
        return [
          "20% discount on all orders",
          "Free shipping on all orders",
          "Early access to new collections",
          "Exclusive platinum member events",
        ];
      case "gold":
        return [
          "15% discount on all orders",
          "Free shipping on orders above ₹1000",
          "Priority customer support",
        ];
      case "silver":
        return [
          "10% discount on all orders",
          "Free shipping on orders above ₹2000",
        ];
      default:
        return [
          "5% discount on orders above ₹5000",
          "Standard shipping rates",
        ];
    }
  };

  const getNextTierInfo = (tier: string, points: number) => {
    switch (tier) {
      case "bronze":
        return { name: "Silver", required: 2000, current: points, progress: (points / 2000) * 100 };
      case "silver":
        return { name: "Gold", required: 5000, current: points, progress: (points / 5000) * 100 };
      case "gold":
        return { name: "Platinum", required: 10000, current: points, progress: (points / 10000) * 100 };
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'discount':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'coupon':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'product':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'wallet_credit':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CustomerLayout>
    );
  }

  const nextTier = getNextTierInfo(loyaltyTier, loyaltyPoints);

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Redeem & Rewards
          </h1>
          <p className="text-muted-foreground mt-2">
            Use your loyalty points to redeem exciting rewards
          </p>
        </div>

        {/* Points and Wallet Overview */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Loyalty Points Card */}
          <Card className={`bg-gradient-to-br ${getTierColor(loyaltyTier)} text-white`}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Star className="w-5 h-5" />
                {loyaltyTier.charAt(0).toUpperCase() + loyaltyTier.slice(1)} Member
              </CardTitle>
              <CardDescription className="text-white/80">
                You have {loyaltyPoints.toLocaleString()} loyalty points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-4">{loyaltyPoints.toLocaleString()}</div>
              {nextTier && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/80">Progress to {nextTier.name}</span>
                    <span className="text-white">{nextTier.current} / {nextTier.required}</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-white rounded-full h-2 transition-all"
                      style={{ width: `${Math.min(100, nextTier.progress)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wallet Balance Card */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Wallet Balance
              </CardTitle>
              <CardDescription>Available balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary mb-2">
                ₹{walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-muted-foreground">
                Get 10% discount when you pay with wallet!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Redeemable Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Available Rewards
            </CardTitle>
            <CardDescription>Redeem your points for exciting rewards</CardDescription>
          </CardHeader>
          <CardContent>
            {redeemableItems.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No redeemable items available at the moment</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {redeemableItems.map((item) => {
                  const canRedeem = loyaltyPoints >= item.points_required;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
                    >
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-32 object-cover rounded mb-3"
                        />
                      )}
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{item.name}</h3>
                        <Badge className={getCategoryBadgeColor(item.category)}>
                          {item.category}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                      )}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Points Required</p>
                          <p className="text-lg font-bold">{item.points_required}</p>
                        </div>
                        {item.value && (
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Value</p>
                            <p className="text-lg font-bold">
                              {item.value_type === 'percentage'
                                ? `${item.value}%`
                                : `₹${item.value}`}
                            </p>
                          </div>
                        )}
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handleRedeem(item)}
                        disabled={!canRedeem}
                        variant={canRedeem ? "default" : "secondary"}
                      >
                        {canRedeem ? "Redeem Now" : "Insufficient Points"}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Your points and wallet transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="points" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="points">Loyalty Points</TabsTrigger>
                <TabsTrigger value="wallet">Wallet</TabsTrigger>
              </TabsList>
              <TabsContent value="points" className="space-y-4 mt-4">
                {loyaltyTransactions.length > 0 ? (
                  loyaltyTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.transaction_type === "earned"
                              ? "bg-green-100 dark:bg-green-900/40"
                              : "bg-red-100 dark:bg-red-900/40"
                          }`}
                        >
                          {transaction.transaction_type === "earned" ? (
                            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <Gift className="w-5 h-5 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{transaction.transaction_type}</p>
                          <p className="text-sm text-muted-foreground">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            transaction.transaction_type === "earned"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {transaction.transaction_type === "earned" ? "+" : "-"}
                          {transaction.points}
                        </p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No transactions yet</p>
                    <p className="text-sm text-muted-foreground mt-2">Start shopping to earn points!</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="wallet" className="space-y-4 mt-4">
                {walletTransactions.length > 0 ? (
                  walletTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-full ${
                            transaction.transaction_type === "credit"
                              ? "bg-green-100 dark:bg-green-900/30"
                              : "bg-red-100 dark:bg-red-900/30"
                          }`}
                        >
                          {transaction.transaction_type === "credit" ? (
                            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <Wallet className="h-5 w-5 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {transaction.description || "Wallet transaction"}
                          </p>
                          <p className="text-sm text-muted-foreground">{formatDate(transaction.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            transaction.transaction_type === "credit"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {transaction.transaction_type === "credit" ? "+" : "-"}₹
                          {transaction.amount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Balance: ₹
                          {transaction.balance_after.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No wallet transactions yet</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Tier Benefits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Tier Benefits
            </CardTitle>
            <CardDescription>Benefits of your {loyaltyTier} membership</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {getTierBenefits(loyaltyTier).map((benefit, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Redeem Confirmation Dialog */}
        <Dialog open={isRedeemDialogOpen} onOpenChange={setIsRedeemDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Redemption</DialogTitle>
              <DialogDescription>
                Are you sure you want to redeem this item? Points will be deducted from your account.
              </DialogDescription>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">{selectedItem.name}</h3>
                  {selectedItem.description && (
                    <p className="text-sm text-muted-foreground mb-3">{selectedItem.description}</p>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Points Required:</span>
                    <span className="font-semibold">{selectedItem.points_required}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-sm text-muted-foreground">Your Points:</span>
                    <span className="font-semibold">{loyaltyPoints}</span>
                  </div>
                  <div className="flex justify-between mt-2 pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Points After:</span>
                    <span className="font-semibold text-primary">
                      {loyaltyPoints - selectedItem.points_required}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsRedeemDialogOpen(false)}
                    className="flex-1"
                    disabled={isRedeeming}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmRedeem}
                    className="flex-1"
                    disabled={isRedeeming}
                  >
                    {isRedeeming ? "Processing..." : "Confirm Redemption"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </CustomerLayout>
  );
};

export default CustomerRedeemRewards;

