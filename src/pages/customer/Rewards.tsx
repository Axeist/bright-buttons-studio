import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import { motion } from "framer-motion";
import { Gift, Star, TrendingUp, Award, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { supabase } from "@/integrations/supabase/client";

interface LoyaltyTransaction {
  id: string;
  points: number;
  transaction_type: string;
  description: string;
  order_id: string | null;
  created_at: string;
  expires_at: string | null;
}

const CustomerRewards = () => {
  const { customer, loading: customerLoading } = useCustomerAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyTier, setLoyaltyTier] = useState("bronze");
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);

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
      setLoyaltyPoints(customer.loyalty_points || 0);
      setLoyaltyTier(customer.loyalty_tier || "bronze");

      const { data: transactionsData } = await supabase
        .from("loyalty_points_transactions")
        .select("*")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setTransactions(transactionsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
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

          {/* Loyalty Points Card */}
          <Card className={`bg-gradient-to-br ${getTierColor(loyaltyTier)} text-white mb-6`}>
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

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Tier Benefits */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Tier Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {getTierBenefits(loyaltyTier).map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Gift className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Transactions */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Points History</CardTitle>
                  <CardDescription>Your recent loyalty point transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions.length > 0 ? (
                    <div className="space-y-4">
                      {transactions.map((transaction) => (
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
                              <p className="font-medium capitalize">
                                {transaction.transaction_type}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {transaction.description}
                              </p>
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
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No transactions yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Start shopping to earn points!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerRewards;
