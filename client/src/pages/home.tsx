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

  // Fetch all products from different modules
  const { data: vyronaHubProducts = [], isLoading: isLoadingHub } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: socialProducts = [], isLoading: isLoadingSocial } = useQuery({
    queryKey: ["/api/social/products"],
  });

  const { data: groupBuyProducts = [], isLoading: isLoadingGroupBuy } = useQuery({
    queryKey: ["/api/group-buy/products"],
  });

  const { data: vyronaSpaceProducts = [], isLoading: isLoadingSpace } = useQuery({
    queryKey: ["/api/vyronaspace/products"],
  });

  const { data: mallConnectProducts = [], isLoading: isLoadingMallConnect } = useQuery({
    queryKey: ["/api/mallconnect/products"],
  });

  const { data: instaStoreProducts = [], isLoading: isLoadingInstaStore } = useQuery({
    queryKey: ["/api/instashop/products"],
  });

  const { data: stores = [] } = useQuery({
    queryKey: ["/api/stores"],
  });

  const isLoadingProducts = isLoadingHub || isLoadingSocial || isLoadingGroupBuy || isLoadingSpace || isLoadingMallConnect || isLoadingInstaStore;

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
                    <h1 className="text-3xl font-bold mb-2">Welcome to VyronaMart</h1>
                    <p className="text-purple-100 text-lg">Discover amazing products across all our platforms</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">₹{Math.round((walletBalance as any)?.balance || 0)}</div>
                    <div className="text-purple-200">Wallet Balance</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Module Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* VyronaHub */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/vyronahub')}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Store className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-700">VyronaHub</h3>
                      <p className="text-sm text-blue-600">Traditional E-commerce</p>
                    </div>
                  </div>
                  <p className="text-blue-700 font-bold text-xl">{vyronaHubProducts.length} Products</p>
                </CardContent>
              </Card>

              {/* VyronaSocial */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/social')}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-700">VyronaSocial</h3>
                      <p className="text-sm text-green-600">Group Shopping</p>
                    </div>
                  </div>
                  <p className="text-green-700 font-bold text-xl">{socialProducts.length + groupBuyProducts.length} Products</p>
                </CardContent>
              </Card>

              {/* VyronaSpace */}
              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/vyronaspace')}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Zap className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-700">VyronaSpace</h3>
                      <p className="text-sm text-purple-600">Hyperlocal Delivery</p>
                    </div>
                  </div>
                  <p className="text-purple-700 font-bold text-xl">{vyronaSpaceProducts.length} Products</p>
                </CardContent>
              </Card>

              {/* VyronaMallConnect */}
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/vyronamallconnect')}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <Building className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-700">VyronaMallConnect</h3>
                      <p className="text-sm text-amber-600">Virtual Malls</p>
                    </div>
                  </div>
                  <p className="text-amber-700 font-bold text-xl">{mallConnectProducts.length} Products</p>
                </CardContent>
              </Card>

              {/* VyronaRead */}
              <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/vyronaread')}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-pink-700">VyronaRead</h3>
                      <p className="text-sm text-pink-600">Library Management</p>
                    </div>
                  </div>
                  <p className="text-pink-700 font-bold text-xl">{sellerBooks.length + sellerEBooks.length} Books</p>
                </CardContent>
              </Card>

              {/* VyronaInstaStore */}
              <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/instashop')}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                      <Camera className="h-6 w-6 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-teal-700">VyronaInstaStore</h3>
                      <p className="text-sm text-teal-600">Instagram Shopping</p>
                    </div>
                  </div>
                  <p className="text-teal-700 font-bold text-xl">{instaStoreProducts.length} Products</p>
                </CardContent>
              </Card>
            </div>

            {/* Featured Products Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="vyronahub">VyronaHub</SelectItem>
                    <SelectItem value="social">VyronaSocial</SelectItem>
                    <SelectItem value="space">VyronaSpace</SelectItem>
                    <SelectItem value="mallconnect">VyronaMallConnect</SelectItem>
                    <SelectItem value="read">VyronaRead</SelectItem>
                    <SelectItem value="instastore">VyronaInstaStore</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoadingProducts ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                      <CardContent className="p-4">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* VyronaHub Products */}
                  {(selectedCategory === "all" || selectedCategory === "vyronahub") &&
                    vyronaHubProducts.slice(0, 4).map((product: any) => (
                      <Card key={`hub-${product.id}`} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => setLocation(`/product/${product.id}`)}>
                        <div className="relative overflow-hidden rounded-t-lg">
                          <img
                            src={product.imageUrl || "/api/placeholder/300/200"}
                            alt={product.name}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <Badge className="absolute top-2 left-2 bg-blue-600 text-white">
                            VyronaHub
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-1 line-clamp-1">{product.name}</h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-blue-600">₹{product.price / 100}</span>
                            <Button size="sm" variant="outline">
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                  {/* Social Products */}
                  {(selectedCategory === "all" || selectedCategory === "social") &&
                    [...socialProducts, ...groupBuyProducts].slice(0, 4).map((product: any) => (
                      <Card key={`social-${product.id}`} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => setLocation(`/social/product/${product.id}`)}>
                        <div className="relative overflow-hidden rounded-t-lg">
                          <img
                            src={product.imageUrl || "/api/placeholder/300/200"}
                            alt={product.name}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <Badge className="absolute top-2 left-2 bg-green-600 text-white">
                            VyronaSocial
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-1 line-clamp-1">{product.name}</h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-green-600">₹{product.price / 100}</span>
                            <Button size="sm" variant="outline">
                              <Users className="h-4 w-4 mr-1" />
                              Join
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                  {/* VyronaSpace Products */}
                  {(selectedCategory === "all" || selectedCategory === "space") &&
                    vyronaSpaceProducts.slice(0, 4).map((product: any) => (
                      <Card key={`space-${product.id}`} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => setLocation(`/vyronaspace`)}>
                        <div className="relative overflow-hidden rounded-t-lg">
                          <img
                            src={product.imageUrl || "/api/placeholder/300/200"}
                            alt={product.name}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <Badge className="absolute top-2 left-2 bg-purple-600 text-white">
                            VyronaSpace
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-1 line-clamp-1">{product.name}</h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-purple-600">₹{product.price / 100}</span>
                            <Button size="sm" variant="outline">
                              <Zap className="h-4 w-4 mr-1" />
                              Quick
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                  {/* VyronaMallConnect Products */}
                  {(selectedCategory === "all" || selectedCategory === "mallconnect") &&
                    mallConnectProducts.slice(0, 4).map((product: any) => (
                      <Card key={`mall-${product.id}`} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => setLocation(`/vyronamallconnect`)}>
                        <div className="relative overflow-hidden rounded-t-lg">
                          <img
                            src={product.imageUrl || "/api/placeholder/300/200"}
                            alt={product.name}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <Badge className="absolute top-2 left-2 bg-amber-600 text-white">
                            MallConnect
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-1 line-clamp-1">{product.name}</h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-amber-600">₹{product.price / 100}</span>
                            <Button size="sm" variant="outline">
                              <Building className="h-4 w-4 mr-1" />
                              Mall
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                  {/* VyronaRead Books */}
                  {(selectedCategory === "all" || selectedCategory === "read") &&
                    [...sellerBooks, ...sellerEBooks].slice(0, 4).map((book: any) => (
                      <Card key={`read-${book.id}`} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => setLocation(`/vyronaread`)}>
                        <div className="relative overflow-hidden rounded-t-lg">
                          <img
                            src={book.coverImage || "/api/placeholder/300/200"}
                            alt={book.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <Badge className="absolute top-2 left-2 bg-pink-600 text-white">
                            VyronaRead
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-1 line-clamp-1">{book.title}</h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{book.author}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-pink-600">₹{book.price / 100}</span>
                            <Button size="sm" variant="outline">
                              <BookOpen className="h-4 w-4 mr-1" />
                              Read
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                  {/* VyronaInstaStore Products */}
                  {(selectedCategory === "all" || selectedCategory === "instastore") &&
                    instaStoreProducts.slice(0, 4).map((product: any) => (
                      <Card key={`insta-${product.id}`} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => setLocation(`/instashop`)}>
                        <div className="relative overflow-hidden rounded-t-lg">
                          <img
                            src={product.imageUrl || "/api/placeholder/300/200"}
                            alt={product.name}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <Badge className="absolute top-2 left-2 bg-teal-600 text-white">
                            InstaStore
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-1 line-clamp-1">{product.name}</h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-teal-600">₹{product.price / 100}</span>
                            <Button size="sm" variant="outline">
                              <Camera className="h-4 w-4 mr-1" />
                              Shop
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}

              {/* View All Button */}
              <div className="text-center">
                <Button variant="outline" size="lg" onClick={() => setLocation('/vyronahub')}>
                  <Eye className="h-4 w-4 mr-2" />
                  Explore All Products
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-8 w-8 text-gray-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Join Group Shopping</h3>
                  <p className="text-sm text-gray-600 mb-4">Shop together and save more with friends</p>
                  <Button variant="outline" onClick={() => setLocation('/social')}>
                    Start Shopping
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck className="h-8 w-8 text-gray-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Quick Delivery</h3>
                  <p className="text-sm text-gray-600 mb-4">Get your orders delivered in 30-60 minutes</p>
                  <Button variant="outline" onClick={() => setLocation('/vyronaspace')}>
                    Order Now
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet className="h-8 w-8 text-gray-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Manage Wallet</h3>
                  <p className="text-sm text-gray-600 mb-4">Add money and track your transactions</p>
                  <Button variant="outline" onClick={() => setLocation('/myvyrona')}>
                    Open Wallet
                  </Button>
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