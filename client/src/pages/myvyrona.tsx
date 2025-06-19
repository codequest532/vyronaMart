import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useUserData } from "@/hooks/use-user-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User,
  Coins,
  Star,
  Wallet,
  Trophy,
  Heart,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  CreditCard,
  CheckCircle,
  DollarSign,
  Gift,
  Package,
  ShoppingCart,
  Book,
  ArrowLeft
} from "lucide-react";

export default function MyVyrona() {
  const [, setLocation] = useLocation();
  const [addMoneyAmount, setAddMoneyAmount] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // User data
  const { user, isLoading: isLoadingUser } = useUserData();

  // Achievements data
  const { data: achievements = [], isLoading: isLoadingAchievements } = useQuery({
    queryKey: [`/api/achievements/${user?.id}`],
    enabled: !!user?.id,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Wallet-related queries
  const { data: walletBalance = { balance: 0 }, isLoading: isLoadingWallet } = useQuery({
    queryKey: [`/api/wallet/balance/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: walletTransactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: [`/api/wallet/transactions/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: purchases = [], isLoading: isLoadingPurchases } = useQuery({
    queryKey: [`/api/orders/user/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: rentals = [], isLoading: isLoadingRentals } = useQuery({
    queryKey: [`/api/rentals/user/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: loans = [], isLoading: isLoadingLoans } = useQuery({
    queryKey: [`/api/book-loans/user/${user?.id}`],
    enabled: !!user?.id,
  });

  // Wallet mutations
  const addMoneyMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await fetch("/api/wallet/add-money", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, amount }),
      });
      if (!response.ok) throw new Error("Failed to add money");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wallet/balance/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/wallet/transactions/${user?.id}`] });
      toast({
        title: "Money Added Successfully",
        description: `₹${addMoneyAmount} has been added to your wallet`,
      });
      setAddMoneyAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to add money to wallet",
        variant: "destructive",
      });
    },
  });

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to access MyVyrona</h1>
            <Button onClick={() => setLocation('/')}>
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center space-x-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">MyVyrona Dashboard</h1>
        </div>

        {/* User Profile Card */}
        <Card className="vyrona-gradient-profile text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{user.username}</h2>
                  <p className="opacity-90">{user.email}</p>
                  {user.mobile && <p className="opacity-90">{user.mobile}</p>}
                  <p className="opacity-90">Level {user.level || 1} • VyronaMart Explorer</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <Coins className="text-amber-300 h-4 w-4" />
                      <span className="font-semibold">{(user.vyronaCoins || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="text-yellow-300 h-4 w-4" />
                      <span className="font-semibold">{(user.xp || 0).toLocaleString()} XP</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                  onClick={() => {
                    // Clear user data and redirect to landing
                    queryClient.clear();
                    window.location.href = "/";
                  }}
                >
                  Logout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VyronaWallet Management */}
        <div className="space-y-6">
          {/* VyronaWallet Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">VyronaWallet</h2>
            <p className="text-gray-600 dark:text-gray-300">Manage your digital wallet with VyronaCoins, cash balance, and vouchers</p>
          </div>

          {/* Wallet Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* VyronaCoins Card */}
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 dark:from-orange-950 dark:to-amber-950">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🪙</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-300">VyronaCoins</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {user?.vyronaCoins || 0}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">Reward Points</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cash Balance Card */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 dark:from-green-950 dark:to-emerald-950">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                      <Wallet className="h-6 w-6 text-green-600 dark:text-green-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">Cash Balance</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      ₹{isLoadingWallet ? "..." : (walletBalance?.balance || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">Available</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vouchers Card */}
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 dark:from-purple-950 dark:to-violet-950">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                      <Gift className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Vouchers</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">3</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Add Money Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-green-600" />
                  <span>Add Money</span>
                </CardTitle>
                <CardDescription>Add funds to your VyronaWallet for seamless shopping</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddMoneyAmount("100")}
                    className="flex-1"
                  >
                    ₹100
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddMoneyAmount("500")}
                    className="flex-1"
                  >
                    ₹500
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddMoneyAmount("1000")}
                    className="flex-1"
                  >
                    ₹1000
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={addMoneyAmount}
                    onChange={(e) => setAddMoneyAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => {
                      const amount = parseInt(addMoneyAmount);
                      if (amount > 0) {
                        addMoneyMutation.mutate(amount);
                      }
                    }}
                    disabled={!addMoneyAmount || addMoneyMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {addMoneyMutation.isPending ? "Adding..." : "Add Money"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  <span>Quick Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Orders</span>
                    <span className="font-semibold">{purchases?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Books Borrowed</span>
                    <span className="font-semibold">{loans?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Rentals</span>
                    <span className="font-semibold">{rentals?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Achievements</span>
                    <span className="font-semibold">{achievements?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span>Recent Transactions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : walletTransactions?.length > 0 ? (
                <div className="space-y-3">
                  {walletTransactions.slice(0, 10).map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          transaction.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? (
                            <ArrowDownLeft className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{transaction.description || 'Transaction'}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}₹{Math.abs(transaction.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No transactions yet</p>
              )}
            </CardContent>
          </Card>

          {/* Achievements Section */}
          {achievements?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  <span>Achievements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement: any) => (
                    <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{achievement.title}</p>
                        <p className="text-xs text-gray-600">{achievement.description}</p>
                        <p className="text-xs text-yellow-600 font-medium">+{achievement.points} points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}