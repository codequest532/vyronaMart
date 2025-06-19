import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import TabNavigation from "@/components/layout/tab-navigation";
import CartButton from "@/components/shopping/cart-button";
import NotificationToast from "@/components/ui/notification-toast";
import { GroupCartModal } from "@/components/GroupCartModal";
import ProductionWelcome from "@/components/ProductionWelcome";
import { useUserData } from "@/hooks/use-user-data";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Gamepad2, 
  Zap, 
  Users, 
  Store, 
  ShoppingBag, 
  Laptop, 
  Utensils, 
  Home as HomeIcon,
  Star,
  ArrowLeft,
  MapPin,
  Book,
  Shirt,
  Coins,
  Trophy,
  Heart,
  GraduationCap,
  Sparkles,
  User,
  Dice1,
  Brain,
  Grid3X3,
  Gamepad,
  Target,
  Layers,
  Play,
  Building,
  ShoppingCart,
  MessageCircle,
  Search,
  Filter,
  BookOpen,
  Clock,
  Plus,
  Minus,
  RefreshCw,
  X,
  CreditCard,
  ChevronDown,
  Gift,
  Calendar,
  UserPlus,
  Truck,
  Wallet,
  Settings,
  Bell,
  Copy,
  Volume2,
  MoreHorizontal,
  TrendingUp,
  Eye,
  EyeOff,
  ShoppingBasket,
  Pizza,
  Coffee,
  Smartphone,
  Headphones,
  Watch,
  Camera,
  Car,
  Plane,
  Tag,
  Heart as LikeIcon,
  Share2,
  Bookmark,
  CheckCircle,
  AlertCircle
} from "lucide-react";

type TabType = "home" | "social" | "space" | "read" | "mall" | "instashop" | "profile" | "vyronahub";

export default function Home() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [readingMode, setReadingMode] = useState("light");
  const [fontSize, setFontSize] = useState("medium");
  const [selectedLibrary, setSelectedLibrary] = useState<any>(null);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedBookForBorrow, setSelectedBookForBorrow] = useState<any>(null);
  const [showGroupCartModal, setShowGroupCartModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [readingProgress, setReadingProgress] = useState(0);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [selectedEbook, setSelectedEbook] = useState<any>(null);
  const [addMoneyAmount, setAddMoneyAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("upi");
  const { toast } = useToast();
  
  const handleTabChange = (tab: TabType) => {
    console.log("Tab clicked:", tab);
    if (tab === "vyronahub") {
      setLocation("/vyronahub");
      return;
    }
    if (tab === "social") {
      setLocation("/social");
      return;
    }
    if (tab === "space") {
      setLocation("/vyronaspace");
      return;
    }
    if (tab === "read") {
      setLocation("/vyronaread");
      return;
    }
    if (tab === "mall") {
      setLocation("/vyronamallconnect");
      return;
    }
    if (tab === "instashop") {
      setLocation("/instashop");
      return;
    }
    if (tab === "profile") {
      setLocation("/myvyrona");
      return;
    }
    setActiveTab(tab);
  };
  const { user } = useUserData();
  const { notification, showNotification, hideNotification } = useToastNotifications();

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: stores = [] } = useQuery({
    queryKey: ["/api/stores"],
  });

  // VyronaRead queries
  const { data: sellerBooks = [] } = useQuery({
    queryKey: ["/api/vyronaread/seller-books"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: sellerEBooks = [] } = useQuery({
    queryKey: ["/api/vyronaread/ebooks"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: libraryBooks = [] } = useQuery({
    queryKey: ["/api/vyronaread/library-books"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: libraries = [] } = useQuery({
    queryKey: ["/api/vyronaread/libraries"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: libraryRequests = [] } = useQuery({
    queryKey: ["/api/admin/library-requests"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: shoppingRooms = [] } = useQuery({
    queryKey: ["/api/shopping-rooms"],
  });

  const { data: achievements = [] } = useQuery({
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

  const handleProductClick = (productName: string) => {
    showNotification("Product Viewed!", `Viewing ${productName}`, "success");
  };

  const handleLibraryBorrow = async (bookId: string, libraryId: number) => {
    if (!user) {
      showNotification("Login Required", "Please login to borrow books", "success");
      return;
    }

    try {
      const response = await fetch(`/api/library-books/${bookId}/borrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, libraryId }),
      });

      if (response.ok) {
        showNotification("Book Borrowed!", `Successfully borrowed from library.`, "success");
        
        // Refresh library data
        queryClient.invalidateQueries({ queryKey: ["/api/admin/library-requests"] });
      } else {
        const error = await response.json();
        showNotification("Borrow Failed", error.message || "Unable to borrow book", "success");
      }
    } catch (error) {
      console.error('Borrow error:', error);
      showNotification("Error", "Failed to borrow book", "success");
    }
  };

  if (!user) {
    return <ProductionWelcome />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <TabNavigation 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          showGroupCartModal={showGroupCartModal}
          setShowGroupCartModal={setShowGroupCartModal}
        />

        {/* Home Tab */}
        {activeTab === "home" && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <Card className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.username || 'User'}!</h1>
                    <p className="text-purple-100 text-lg">Ready to explore the VyronaMart ecosystem?</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">₹{Math.round((walletBalance as any)?.balance || 0)}</div>
                    <div className="text-purple-200">Wallet Balance</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-700">Total Orders</p>
                        <p className="text-2xl font-bold text-green-700">{purchases.length}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-700">Group Orders</p>
                        <p className="text-2xl font-bold text-blue-700">{shoppingRooms.length}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Trophy className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-700">Achievements</p>
                        <p className="text-2xl font-bold text-purple-700">{achievements.length}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                        <Store className="text-amber-600 h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-700">Local Stores</p>
                        <p className="text-2xl font-bold text-amber-700">{stores.length}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Other tabs remain the same as they redirect to dedicated modules */}
        
      </div>

      <CartButton />
      <NotificationToast 
        notification={notification}
        onHide={hideNotification}
      />

      {showGroupCartModal && (
        <GroupCartModal 
          isOpen={showGroupCartModal}
          onClose={() => setShowGroupCartModal(false)}
        />
      )}
    </div>
  );
}