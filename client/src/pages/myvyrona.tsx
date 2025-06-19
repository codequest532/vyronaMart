import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useUserData } from "@/hooks/use-user-data";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Wallet, 
  Gift, 
  Plus, 
  Trophy, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft,
  ArrowLeft,
  Coins,
  Star,
  ShoppingBag,
  Heart,
  RotateCcw,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Trash2,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Bell,
  Lock,
  Share2,
  Package,
  Truck,
  Eye,
  UserPlus,
  MessageCircle,
  Shield,
  Home,
  Edit3,
  CreditCard as CreditCardIcon,
  Smartphone,
  QrCode,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";

export default function MyVyrona() {
  const [, setLocation] = useLocation();
  const { user } = useUserData();
  const { toast } = useToast();
  const [addMoneyAmount, setAddMoneyAmount] = useState("");
  const [activeSection, setActiveSection] = useState("profile");
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [showAddMoneyDialog, setShowAddMoneyDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("upi");
  const [showAddAddressDialog, setShowAddAddressDialog] = useState(false);
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [accountForm, setAccountForm] = useState({
    email: user?.email || "",
    phone: user?.mobile || "",
    username: user?.username || ""
  });
  const [supportTicket, setSupportTicket] = useState({
    issueType: "",
    priority: "",
    description: ""
  });
  const [paymentMethodType, setPaymentMethodType] = useState("card");

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setAccountForm({
        email: user.email || "",
        phone: user.mobile || "",
        username: user.username || ""
      });
    }
  }, [user]);

  // Data queries
  const { data: walletBalance = { balance: 0 }, isLoading: isLoadingWallet } = useQuery({
    queryKey: [`/api/wallet/balance/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: walletTransactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: [`/api/wallet/transactions/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: purchases = [] } = useQuery({
    queryKey: [`/api/orders/user/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: shoppingGroups = [] } = useQuery({
    queryKey: ["/api/shopping-rooms"],
    enabled: !!user?.id,
  });

  const { data: achievements = [] } = useQuery({
    queryKey: [`/api/achievements/${user?.id}`],
    enabled: !!user?.id,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Calculate real-time statistics
  const totalOrders = purchases.length;
  const groupOrders = shoppingGroups.filter(group => 
    group.memberCount > 1 && group.isActive
  ).length;
  const totalAchievements = achievements.length;
  
  // Calculate user rating based on completed orders and reviews
  const completedOrders = purchases.filter(order => order.status === 'delivered').length;
  const userRating = completedOrders > 0 ? 
    Math.min(4.8, 3.5 + (completedOrders * 0.1) + (totalAchievements * 0.05)) : 
    0;

  // Calculate order statistics for Orders tab
  const orderStats = {
    active: purchases.filter(order => ['confirmed', 'preparing', 'ready', 'picked_up', 'out_for_delivery'].includes(order.status)).length,
    delivered: purchases.filter(order => order.status === 'delivered').length,
    canceled: purchases.filter(order => order.status === 'canceled').length
  };

  // Wallet mutations
  const addMoneyMutation = useMutation({
    mutationFn: async (data: { amount: number; paymentMethod: string }) => {
      const response = await fetch("/api/wallet/add-money", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user?.id, 
          amount: data.amount,
          paymentMethod: data.paymentMethod 
        }),
      });
      if (!response.ok) throw new Error("Failed to add money");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wallet/balance/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/wallet/transactions/${user?.id}`] });
      toast({
        title: "Money Added Successfully",
        description: `₹${addMoneyAmount} has been added to your wallet. Confirmation email sent.`,
      });
      setAddMoneyAmount("");
      setShowAddMoneyDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to add money to wallet",
        variant: "destructive",
      });
    },
  });

  // Account update mutation
  const updateAccountMutation = useMutation({
    mutationFn: async (data: { email: string; phone: string; username: string }) => {
      const response = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user?.id, 
          ...data
        }),
      });
      if (!response.ok) throw new Error("Failed to update account");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/current-user"] });
      toast({
        title: "Account Updated",
        description: "Your account information has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update account information",
        variant: "destructive",
      });
    },
  });

  // Support ticket submission mutation
  const submitTicketMutation = useMutation({
    mutationFn: async (ticketData: { issueType: string; priority: string; description: string }) => {
      const response = await fetch("/api/support/submit-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user?.id,
          userEmail: user?.email,
          username: user?.username,
          ...ticketData
        }),
      });
      if (!response.ok) throw new Error("Failed to submit ticket");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Support Ticket Submitted",
        description: `Your ticket ${data.ticketId} has been submitted. We'll respond within 24 hours.`,
      });
      setSupportTicket({ issueType: "", priority: "", description: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit support ticket",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Login Required</h2>
            <p className="text-gray-600 mb-4">Please login to access your profile</p>
            <Button onClick={() => setLocation("/")}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
      if (response.ok) {
        // Clear all cached data
        queryClient.clear();
        // Clear local storage
        localStorage.clear();
        sessionStorage.clear();
        
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out.",
        });
        
        // Force reload to ensure clean state
        setTimeout(() => {
          window.location.replace("/");
        }, 1000);
      } else {
        throw new Error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Failed",
        description: "Unable to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MyVyrona</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="profile" className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center space-x-1">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Wallet</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center space-x-1">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Social</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-1">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center space-x-1">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Support</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center space-x-1">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          {/* 1. Profile Overview */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="vyrona-gradient-profile text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                      <User className="h-10 w-10" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">{user.username}</h2>
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center space-x-2 opacity-90">
                          <Mail className="h-4 w-4" />
                          <span>{user.email}</span>
                        </div>
                        {user.mobile && (
                          <div className="flex items-center space-x-2 opacity-90">
                            <Phone className="h-4 w-4" />
                            <span>{user.mobile}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 opacity-90">
                          <MapPin className="h-4 w-4" />
                          <span>{user.city || "Not specified"}, {user.pincode || "------"}</span>
                        </div>
                        <div className="flex items-center space-x-2 opacity-90">
                          <Calendar className="h-4 w-4" />
                          <span>Joined {new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 mt-4">
                        <div className="flex items-center space-x-2">
                          <Coins className="text-amber-300 h-5 w-5" />
                          <span className="font-bold text-lg">{(user.vyronaCoins || 0).toLocaleString()}</span>
                          <span className="text-sm opacity-75">Coins</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="text-yellow-300 h-5 w-5" />
                          <span className="font-bold text-lg">{(user.xp || 0).toLocaleString()}</span>
                          <span className="text-sm opacity-75">XP</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Trophy className="text-orange-300 h-5 w-5" />
                          <span className="font-bold text-lg">Level {user.level || 1}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveSection("orders")}>
                <CardContent className="p-4 text-center">
                  <ShoppingBag className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold">{totalOrders}</p>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  {totalOrders > 0 && (
                    <p className="text-xs text-blue-600 mt-1">Click to view</p>
                  )}
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveSection("social")}>
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold">{groupOrders}</p>
                  <p className="text-sm text-gray-600">Group Orders</p>
                  {groupOrders > 0 && (
                    <p className="text-xs text-green-600 mt-1">Click to view</p>
                  )}
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 text-center">
                  <Trophy className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                  <p className="text-2xl font-bold">{totalAchievements}</p>
                  <p className="text-sm text-gray-600">Achievements</p>
                  {totalAchievements > 0 && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                        {totalAchievements >= 10 ? "Expert" : 
                         totalAchievements >= 5 ? "Advanced" : 
                         totalAchievements >= 1 ? "Beginner" : "New"}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 text-center">
                  <Star className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                  <p className="text-2xl font-bold">
                    {userRating > 0 ? userRating.toFixed(1) : "New"}
                  </p>
                  <p className="text-sm text-gray-600">Rating</p>
                  {userRating > 0 && (
                    <div className="flex justify-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${
                            i < Math.floor(userRating) 
                              ? "text-yellow-400 fill-current" 
                              : "text-gray-300"
                          }`} 
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 2. Wallet & Rewards */}
          <TabsContent value="wallet" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* VyronaCoins Card */}
              <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Coins className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-orange-700">VyronaCoins</p>
                        <p className="text-2xl font-bold text-orange-700">{user?.vyronaCoins || 0}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cash Balance Card */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Wallet className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-700">Cash Balance</p>
                        <p className="text-2xl font-bold text-green-700">
                          ₹{isLoadingWallet ? "..." : (walletBalance?.balance || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setShowAddMoneyDialog(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Money
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Vouchers Card */}
              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Gift className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-700">Vouchers</p>
                        <p className="text-2xl font-bold text-purple-700">3</p>
                      </div>
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
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
          </TabsContent>

          {/* 3. Orders & Wishlist */}
          <TabsContent value="orders" className="space-y-6">
            {/* Order Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold">{orderStats.active}</p>
                  <p className="text-sm text-gray-600">Active Orders</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold">{orderStats.delivered}</p>
                  <p className="text-sm text-gray-600">Delivered</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto text-red-600 mb-2" />
                  <p className="text-2xl font-bold">{orderStats.canceled}</p>
                  <p className="text-sm text-gray-600">Canceled</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span>My Orders</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {purchases.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-gray-600">Showing {Math.min(purchases.length, 5)} of {purchases.length} orders</p>
                      {purchases.length > 5 && (
                        <Button variant="outline" size="sm">
                          View All Orders
                        </Button>
                      )}
                    </div>
                    {purchases.slice(0, 5).map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">Order #{order.id}</p>
                            <p className="text-sm text-gray-600">₹{order.totalAmount}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()} • 
                              {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant={
                            order.status === 'delivered' ? 'default' : 
                            order.status === 'canceled' ? 'destructive' : 'secondary'
                          }>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                          </Badge>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Order Details - #{order.id}</DialogTitle>
                                <DialogDescription>
                                  Complete information about your order
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Order ID</Label>
                                    <p className="font-medium">#{order.id}</p>
                                  </div>
                                  <div>
                                    <Label>Status</Label>
                                    <Badge variant={
                                      order.status === 'delivered' ? 'default' : 
                                      order.status === 'canceled' ? 'destructive' : 'secondary'
                                    }>
                                      {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                                    </Badge>
                                  </div>
                                  <div>
                                    <Label>Total Amount</Label>
                                    <p className="font-medium">₹{order.totalAmount}</p>
                                  </div>
                                  <div>
                                    <Label>Payment Method</Label>
                                    <p className="font-medium">{order.paymentMethod || 'Card'}</p>
                                  </div>
                                  <div>
                                    <Label>Order Date</Label>
                                    <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <Label>Delivery Address</Label>
                                    <p className="font-medium">{order.deliveryAddress || 'Default Address'}</p>
                                  </div>
                                </div>
                                {order.items && order.items.length > 0 && (
                                  <div>
                                    <Label>Order Items</Label>
                                    <div className="space-y-2 mt-2">
                                      {order.items.map((item: any, index: number) => (
                                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                          <span>{item.name || `Item ${index + 1}`}</span>
                                          <span>₹{item.price} x {item.quantity || 1}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          {order.status !== 'delivered' && order.status !== 'canceled' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setLocation(`/track-order/${order.id}`)}
                            >
                              <Truck className="h-4 w-4 mr-1" />
                              Track
                            </Button>
                          )}
                          {order.status === 'delivered' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "Reorder Initiated",
                                  description: "Items added to cart for reordering",
                                });
                              }}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Reorder
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No orders yet</p>
                )}
              </CardContent>
            </Card>

            {/* Wishlist */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-red-600" />
                    <span>My Wishlist</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Items
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">Your wishlist is empty</p>
                  <p className="text-sm text-gray-400">Browse products and add items to your wishlist</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. Social Engagement */}
          <TabsContent value="social" className="space-y-6">
            {/* Shopping Groups */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>My Shopping Groups</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {shoppingGroups.length > 0 ? (
                  <div className="space-y-4">
                    {shoppingGroups.map((group: any) => (
                      <div key={group.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{group.name}</p>
                            <p className="text-sm text-gray-600">{group.memberCount} members</p>
                            <p className="text-xs text-gray-500">Created {new Date(group.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">{group.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No shopping groups yet</p>
                )}
              </CardContent>
            </Card>

            {/* Referral Program */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Share2 className="h-5 w-5 text-green-600" />
                  <span>Referral Code & Earnings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                  <QrCode className="h-8 w-8 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium">Your Referral Code</p>
                    <p className="text-2xl font-bold text-green-600">VYR{user.id}REF</p>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-gray-600">Friends Referred</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">₹0</p>
                    <p className="text-sm text-gray-600">Earnings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 5. Settings & Preferences */}
          <TabsContent value="settings" className="space-y-6">
            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <span>Account Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      value={accountForm.email} 
                      onChange={(e) => setAccountForm({...accountForm, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone" 
                      value={accountForm.phone} 
                      onChange={(e) => setAccountForm({...accountForm, phone: e.target.value})}
                      placeholder="Add phone number" 
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    value={accountForm.username} 
                    onChange={(e) => setAccountForm({...accountForm, username: e.target.value})}
                    placeholder="Enter username" 
                  />
                </div>
                <Button 
                  className="w-full"
                  onClick={() => updateAccountMutation.mutate(accountForm)}
                  disabled={updateAccountMutation.isPending}
                >
                  {updateAccountMutation.isPending ? "Updating..." : "Update Account Information"}
                </Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-yellow-600" />
                  <span>Notification Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Order Updates</p>
                    <p className="text-sm text-gray-600">Get notified about order status changes</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-600">Receive promotional emails</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Group Activities</p>
                    <p className="text-sm text-gray-600">Notifications from shopping groups</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Address Book */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Home className="h-5 w-5 text-green-600" />
                  <span>Address Book</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowAddAddressDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Address
                  </Button>
                  <p className="text-center text-gray-500 py-4">No saved addresses</p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCardIcon className="h-5 w-5 text-purple-600" />
                  <span>Payment Methods</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowAddPaymentDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </Button>
                  <p className="text-center text-gray-500 py-4">No saved payment methods</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 6. Help & Support */}
          <TabsContent value="support" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Help Center */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <HelpCircle className="h-5 w-5 text-blue-600" />
                    <span>Help Center</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Browse FAQs
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Frequently Asked Questions</DialogTitle>
                        <DialogDescription>
                          Find answers to common questions about VyronaMart
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-blue-600">Account & Profile</h3>
                          <div className="space-y-3">
                            <div className="border-l-4 border-blue-200 pl-4">
                              <h4 className="font-medium">How do I update my profile information?</h4>
                              <p className="text-sm text-gray-600 mt-1">Go to MyVyrona → Profile tab → Click "Edit Profile" to update your details including location and contact information.</p>
                            </div>
                            <div className="border-l-4 border-blue-200 pl-4">
                              <h4 className="font-medium">How do I change my password?</h4>
                              <p className="text-sm text-gray-600 mt-1">Visit Settings → Account Settings → Update your password. You'll need to enter your current password for security.</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-green-600">Wallet & Payments</h3>
                          <div className="space-y-3">
                            <div className="border-l-4 border-green-200 pl-4">
                              <h4 className="font-medium">How do I add money to my VyronaWallet?</h4>
                              <p className="text-sm text-gray-600 mt-1">Go to MyVyrona → Wallet tab → Click "Add Money" → Choose payment method (UPI, Card, Net Banking) → Complete payment.</p>
                            </div>
                            <div className="border-l-4 border-green-200 pl-4">
                              <h4 className="font-medium">What are VyronaCoins and how do I earn them?</h4>
                              <p className="text-sm text-gray-600 mt-1">VyronaCoins are reward points earned through shopping, referrals, and platform activities. Use them for discounts and exclusive offers.</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-purple-600">Orders & Delivery</h3>
                          <div className="space-y-3">
                            <div className="border-l-4 border-purple-200 pl-4">
                              <h4 className="font-medium">How can I track my order?</h4>
                              <p className="text-sm text-gray-600 mt-1">Go to MyVyrona → Orders tab → Click "Track" on any active order for real-time location tracking and delivery updates.</p>
                            </div>
                            <div className="border-l-4 border-purple-200 pl-4">
                              <h4 className="font-medium">What are the delivery options available?</h4>
                              <p className="text-sm text-gray-600 mt-1">VyronaExpress (30-min, ₹80), Standard Delivery (60-min, ₹45), Store Pickup (Free). Times may vary by location.</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-orange-600">Group Shopping</h3>
                          <div className="space-y-3">
                            <div className="border-l-4 border-orange-200 pl-4">
                              <h4 className="font-medium">How do I create a shopping group?</h4>
                              <p className="text-sm text-gray-600 mt-1">Go to VyronaSocial → Click "Create Group" → Set group details → Share room code with friends to invite them.</p>
                            </div>
                            <div className="border-l-4 border-orange-200 pl-4">
                              <h4 className="font-medium">How are payments split in group orders?</h4>
                              <p className="text-sm text-gray-600 mt-1">Members contribute individually using their preferred payment method. Order is placed once the funding goal is reached.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat with VyronaBot
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          <MessageCircle className="h-5 w-5 text-blue-600" />
                          <span>VyronaBot Assistant</span>
                        </DialogTitle>
                        <DialogDescription>
                          Get instant help from our AI assistant
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="h-96 border rounded-lg p-4 bg-gray-50 overflow-y-auto">
                          <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <MessageCircle className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="flex-1 bg-white p-3 rounded-lg shadow-sm">
                                <p className="text-sm">Hi {user.username}! I'm VyronaBot, your personal shopping assistant. How can I help you today?</p>
                                <p className="text-xs text-gray-500 mt-1">Just now</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <MessageCircle className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="flex-1 bg-white p-3 rounded-lg shadow-sm">
                                <p className="text-sm">I can help you with:</p>
                                <ul className="text-sm mt-2 space-y-1">
                                  <li>• Order tracking and status</li>
                                  <li>• Wallet and payment issues</li>
                                  <li>• Product recommendations</li>
                                  <li>• Account settings</li>
                                  <li>• Group shopping guidance</li>
                                </ul>
                                <p className="text-xs text-gray-500 mt-2">Just now</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Input placeholder="Type your message..." className="flex-1" />
                          <Button>
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm">Track my order</Button>
                          <Button variant="outline" size="sm">Wallet help</Button>
                          <Button variant="outline" size="sm">Return item</Button>
                          <Button variant="outline" size="sm">Group shopping</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <Mail className="h-4 w-4 mr-2" />
                        Contact Support
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Contact Support Team</DialogTitle>
                        <DialogDescription>
                          Reach our support team directly for personalized assistance
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 border rounded-lg">
                            <Mail className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                            <h3 className="font-medium">Email Support</h3>
                            <p className="text-sm text-gray-600">support@vyronamart.com</p>
                            <p className="text-xs text-gray-500 mt-1">Response within 24 hours</p>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <Phone className="h-8 w-8 mx-auto text-green-600 mb-2" />
                            <h3 className="font-medium">Phone Support</h3>
                            <p className="text-sm text-gray-600">1800-VYRONA-1</p>
                            <p className="text-xs text-gray-500 mt-1">Mon-Sat, 9 AM - 9 PM</p>
                          </div>
                        </div>
                        <div className="text-center p-4 border rounded-lg bg-blue-50">
                          <MessageCircle className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                          <h3 className="font-medium">Live Chat</h3>
                          <p className="text-sm text-gray-600 mb-3">Get instant help from our support team</p>
                          <Button className="bg-blue-600 hover:bg-blue-700">Start Live Chat</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Raise a Ticket */}
              <Card>
                <CardHeader>
                  <CardTitle>Raise a Support Ticket</CardTitle>
                  <CardDescription>Describe your issue and we'll get back to you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="issue-type">Issue Type</Label>
                    <Select value={supportTicket.issueType} onValueChange={(value) => setSupportTicket({...supportTicket, issueType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select issue type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">Order Issue</SelectItem>
                        <SelectItem value="payment">Payment Problem</SelectItem>
                        <SelectItem value="account">Account Issue</SelectItem>
                        <SelectItem value="delivery">Delivery Problem</SelectItem>
                        <SelectItem value="refund">Refund Request</SelectItem>
                        <SelectItem value="technical">Technical Problem</SelectItem>
                        <SelectItem value="feedback">Feedback & Suggestions</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select value={supportTicket.priority} onValueChange={(value) => setSupportTicket({...supportTicket, priority: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - General inquiry</SelectItem>
                        <SelectItem value="medium">Medium - Standard issue</SelectItem>
                        <SelectItem value="high">High - Urgent problem</SelectItem>
                        <SelectItem value="critical">Critical - Immediate attention needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      value={supportTicket.description}
                      onChange={(e) => setSupportTicket({...supportTicket, description: e.target.value})}
                      placeholder="Please describe your issue in detail. Include order numbers, error messages, or any relevant information..."
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => submitTicketMutation.mutate(supportTicket)}
                    disabled={!supportTicket.issueType || !supportTicket.priority || !supportTicket.description || submitTicketMutation.isPending}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {submitTicketMutation.isPending ? "Submitting..." : "Submit Support Ticket"}
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    Ticket reference will be sent to your registered email
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 7. Account Management */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  <span>Account Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Logout</h3>
                    <p className="text-sm text-gray-600">Sign out of your account safely</p>
                  </div>
                  <Button onClick={handleLogout} variant="outline">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <h3 className="font-medium text-red-800">Delete Account</h3>
                    <p className="text-sm text-red-600">Permanently delete your account and all data</p>
                  </div>
                  <Button 
                    onClick={() => setShowDeleteAccountDialog(true)}
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Money Dialog */}
      <Dialog open={showAddMoneyDialog} onOpenChange={setShowAddMoneyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Money to VyronaWallet</DialogTitle>
            <DialogDescription>
              Choose payment method and amount to add to your wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={addMoneyAmount}
                onChange={(e) => setAddMoneyAmount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="netbanking">Net Banking</SelectItem>
                  <SelectItem value="wallet">Other Wallets</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setAddMoneyAmount("100")}
                className="flex-1"
              >
                ₹100
              </Button>
              <Button
                variant="outline"
                onClick={() => setAddMoneyAmount("500")}
                className="flex-1"
              >
                ₹500
              </Button>
              <Button
                variant="outline"
                onClick={() => setAddMoneyAmount("1000")}
                className="flex-1"
              >
                ₹1000
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMoneyDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const amount = parseInt(addMoneyAmount);
                if (amount > 0) {
                  addMoneyMutation.mutate({ amount, paymentMethod: selectedPaymentMethod });
                }
              }}
              disabled={!addMoneyAmount || addMoneyMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {addMoneyMutation.isPending ? "Processing..." : "Add Money"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">What will be deleted:</h4>
              <ul className="text-sm text-red-600 space-y-1">
                <li>• Your profile and account information</li>
                <li>• Order history and wishlist</li>
                <li>• VyronaWallet balance and transaction history</li>
                <li>• Shopping groups and social connections</li>
                <li>• Achievements and rewards</li>
              </ul>
            </div>
            <div>
              <Label htmlFor="confirm-delete">Type "DELETE" to confirm</Label>
              <Input id="confirm-delete" placeholder="Type DELETE to confirm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAccountDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Address Dialog */}
      <Dialog open={showAddAddressDialog} onOpenChange={setShowAddAddressDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
            <DialogDescription>
              Add a delivery address to your address book
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address-type">Address Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="address-name">Address Label</Label>
                <Input id="address-name" placeholder="e.g., Home, Office" />
              </div>
            </div>
            <div>
              <Label htmlFor="full-address">Full Address</Label>
              <Textarea 
                id="full-address" 
                placeholder="House/Flat number, Building name, Street, Area"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="Enter city" />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" placeholder="6-digit pincode" />
              </div>
            </div>
            <div>
              <Label htmlFor="landmark">Landmark (Optional)</Label>
              <Input id="landmark" placeholder="Nearby landmark for easy delivery" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAddressDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: "Address Added",
                description: "Your delivery address has been saved successfully.",
              });
              setShowAddAddressDialog(false);
            }}>
              Save Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Payment Method Dialog */}
      <Dialog open={showAddPaymentDialog} onOpenChange={setShowAddPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Add a new payment method to your account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-type">Payment Type</Label>
              <Select value={paymentMethodType} onValueChange={setPaymentMethodType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="upi">UPI ID</SelectItem>
                  <SelectItem value="netbanking">Net Banking</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Card Payment Form */}
            {paymentMethodType === "card" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="card-number">Card Number</Label>
                    <Input id="card-number" placeholder="1234 5678 9012 3456" />
                  </div>
                  <div>
                    <Label htmlFor="card-name">Cardholder Name</Label>
                    <Input id="card-name" placeholder="Full name on card" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" type="password" />
                  </div>
                </div>
              </>
            )}
            
            {/* UPI Payment Form */}
            {paymentMethodType === "upi" && (
              <div>
                <Label htmlFor="upi-id">UPI ID</Label>
                <Input 
                  id="upi-id" 
                  placeholder="yourname@paytm / yourname@gpay"
                  type="email"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your UPI ID (e.g., 9876543210@paytm, username@gpay)
                </p>
              </div>
            )}
            
            {/* Net Banking Form */}
            {paymentMethodType === "netbanking" && (
              <div>
                <Label htmlFor="bank-name">Select Bank</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sbi">State Bank of India</SelectItem>
                    <SelectItem value="hdfc">HDFC Bank</SelectItem>
                    <SelectItem value="icici">ICICI Bank</SelectItem>
                    <SelectItem value="axis">Axis Bank</SelectItem>
                    <SelectItem value="kotak">Kotak Mahindra Bank</SelectItem>
                    <SelectItem value="pnb">Punjab National Bank</SelectItem>
                    <SelectItem value="other">Other Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="save-payment" className="rounded" />
              <Label htmlFor="save-payment" className="text-sm">
                Save this payment method for future use
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: "Payment Method Added",
                description: "Your payment method has been saved securely.",
              });
              setShowAddPaymentDialog(false);
            }}>
              Add Payment Method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}