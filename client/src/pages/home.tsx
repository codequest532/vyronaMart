import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import TabNavigation from "@/components/layout/tab-navigation";
import CartButton from "@/components/shopping/cart-button";
import NotificationToast from "@/components/ui/notification-toast";
import { GroupCartModal } from "@/components/GroupCartModal";
import ProductionWelcome from "@/components/ProductionWelcome";
import { useUserData } from "@/hooks/use-user-data";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import SellerOnboardingModal from "@/components/SellerOnboardingModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSellerOnboarding, setShowSellerOnboarding] = useState(false);
  const [otpStep, setOtpStep] = useState<"email" | "otp" | "reset">("email");
  const [resetEmail, setResetEmail] = useState("");
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
  const { requireAuth } = useAuthGuard();
  const { notification, showNotification, hideNotification } = useToastNotifications();

  // Listen for auth-required events to show login modal
  useEffect(() => {
    const handleAuthRequired = () => {
      setAuthMode("login");
      setShowAuthModal(true);
    };

    window.addEventListener('auth-required', handleAuthRequired);
    return () => window.removeEventListener('auth-required', handleAuthRequired);
  }, []);

  // Authentication mutations
  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: (data) => {
      setShowAuthModal(false);
      queryClient.setQueryData(["/api/current-user"], data.user);
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      
      if (data.user?.role === 'admin') {
        setLocation("/admin");
      } else if (data.user?.role === 'seller') {
        if (data.user.sellerType === 'vyronaread') {
          setLocation("/vyronaread-dashboard");
        } else if (data.user.sellerType === 'VyronaMallConnect') {
          setLocation("/vyronamallconnect-seller-dashboard");
        } else if (data.user.sellerType === 'vyronaspace') {
          setLocation("/vyronaspace-seller-dashboard");
        } else if (data.user.sellerType === 'vyronainstastore') {
          setLocation("/vyronainstastore-seller-dashboard");
        } else {
          setLocation("/vyronahub-dashboard");
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: { 
      username: string;
      email: string; 
      password: string; 
      confirmPassword: string;
      mobile: string;
    }) => {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/current-user"], data.user);
      setShowAuthModal(false);
      toast({
        title: "Account Created",
        description: "Welcome to VyronaMart!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      setOtpStep("otp");
      toast({
        title: "OTP Sent",
        description: "Please check your email for the verification code.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (data: { email: string; otp: string }) => {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      setOtpStep("reset");
      toast({
        title: "OTP Verified",
        description: "You can now reset your password.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Invalid OTP",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; confirmPassword: string }) => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reset password");
      }
      return response.json();
    },
    onSuccess: () => {
      setShowForgotPassword(false);
      setOtpStep("email");
      setResetEmail("");
      toast({
        title: "Password Reset",
        description: "Your password has been reset successfully. Please login with your new password.",
      });
      setAuthMode("login");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate({ email, password });
  };

  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const mobile = formData.get("mobile") as string;

    if (!username || !email || !password || !confirmPassword || !mobile) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    signupMutation.mutate({ username, email, password, confirmPassword, mobile });
  };

  const handleForgotPasswordStep = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (otpStep === "email") {
      const email = formData.get("email") as string;
      if (!email) {
        toast({
          title: "Error",
          description: "Please enter your email address.",
          variant: "destructive",
        });
        return;
      }
      setResetEmail(email);
      forgotPasswordMutation.mutate({ email });
    } else if (otpStep === "otp") {
      const otp = formData.get("otp") as string;
      if (!otp) {
        toast({
          title: "Error",
          description: "Please enter the OTP.",
          variant: "destructive",
        });
        return;
      }
      verifyOtpMutation.mutate({ email: resetEmail, otp });
    } else if (otpStep === "reset") {
      const password = formData.get("password") as string;
      const confirmPassword = formData.get("confirmPassword") as string;
      if (!password || !confirmPassword) {
        toast({
          title: "Error",
          description: "Please fill in all fields.",
          variant: "destructive",
        });
        return;
      }
      if (password !== confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match.",
          variant: "destructive",
        });
        return;
      }
      resetPasswordMutation.mutate({ email: resetEmail, password, confirmPassword });
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      {user ? (
        <Header />
      ) : (
        <header className="bg-white/80 backdrop-blur-sm border-b border-purple-200 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    VyronaMart
                  </h1>
                  <p className="text-sm text-gray-600">Multi-Platform Commerce</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline"
                  onClick={() => setShowSellerOnboarding(true)}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Building className="h-4 w-4 mr-2" />
                  Become a Seller
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setAuthMode("login");
                    setShowAuthModal(true);
                  }}
                  className="text-purple-700 hover:text-purple-800 hover:bg-purple-50"
                >
                  Log in
                </Button>
                <Button 
                  onClick={() => {
                    setAuthMode("signup");
                    setShowAuthModal(true);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                >
                  Sign up
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}
      
      <div className="container mx-auto px-4 py-8">
        {user && (
          <TabNavigation 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            showGroupCartModal={showGroupCartModal}
            setShowGroupCartModal={setShowGroupCartModal}
          />
        )}

        {/* Home Content */}
        {(!user || activeTab === "home") && (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-2xl">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative px-8 py-16 md:py-24">
                <div className="max-w-4xl mx-auto text-center text-white">
                  <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    Welcome to VyronaMart
                  </h1>
                  <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-2xl mx-auto">
                    Your ultimate destination for shopping, socializing, and discovering amazing products across multiple platforms
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <Button size="lg" className="bg-white text-purple-900" onClick={() => user ? setLocation('/vyronahub') : setShowAuthModal(true)}>
                      <Store className="h-5 w-5 mr-2" />
                      Start Shopping
                    </Button>
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={() => setLocation('/social')}>
                      <Users className="h-5 w-5 mr-2" />
                      Join Groups
                    </Button>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-1 left-0 right-0 h-4 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500"></div>
            </div>

            {/* Platform Cards */}
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Explore Our Platforms</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Discover unique shopping experiences tailored to your needs across our diverse ecosystem
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* VyronaHub */}
                <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border-0 bg-gradient-to-br from-blue-50 to-indigo-100" onClick={() => setLocation('/vyronahub')}>
                  <div className="relative overflow-hidden rounded-t-lg h-48 bg-gradient-to-br from-blue-500 to-indigo-600">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="relative p-6 h-full flex flex-col justify-center items-center text-white">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Store className="h-8 w-8" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">VyronaHub</h3>
                      <p className="text-blue-100 text-center">Traditional E-commerce Experience</p>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-gray-600 mb-4">Browse thousands of products from trusted sellers with secure payments and reliable delivery.</p>
                    <div className="flex items-center text-blue-600 group-hover:text-blue-700 transition-colors">
                      <span className="font-semibold">Explore Products</span>
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>

                {/* VyronaSocial */}
                <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border-0 bg-gradient-to-br from-green-50 to-emerald-100" onClick={() => setLocation('/social')}>
                  <div className="relative overflow-hidden rounded-t-lg h-48 bg-gradient-to-br from-green-500 to-emerald-600">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="relative p-6 h-full flex flex-col justify-center items-center text-white">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Users className="h-8 w-8" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">VyronaSocial</h3>
                      <p className="text-green-100 text-center">Group Shopping & Social Commerce</p>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-gray-600 mb-4">Shop together with friends, split costs, and enjoy exclusive group discounts on your favorite items.</p>
                    <div className="flex items-center text-green-600 group-hover:text-green-700 transition-colors">
                      <span className="font-semibold">Join Groups</span>
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>

                {/* VyronaSpace */}
                <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border-0 bg-gradient-to-br from-purple-50 to-violet-100" onClick={() => setLocation('/vyronaspace')}>
                  <div className="relative overflow-hidden rounded-t-lg h-48 bg-gradient-to-br from-purple-500 to-violet-600">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="relative p-6 h-full flex flex-col justify-center items-center text-white">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Zap className="h-8 w-8" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">VyronaSpace</h3>
                      <p className="text-purple-100 text-center">Hyperlocal Quick Commerce</p>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-gray-600 mb-4">Get essentials delivered from nearby stores in 5-15 minutes with real-time tracking.</p>
                    <div className="flex items-center text-purple-600 group-hover:text-purple-700 transition-colors">
                      <span className="font-semibold">Quick Order</span>
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>

                {/* VyronaMallConnect */}
                <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border-0 bg-gradient-to-br from-amber-50 to-orange-100" onClick={() => setLocation('/vyronamallconnect')}>
                  <div className="relative overflow-hidden rounded-t-lg h-48 bg-gradient-to-br from-amber-500 to-orange-600">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="relative p-6 h-full flex flex-col justify-center items-center text-white">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Building className="h-8 w-8" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">VyronaMallConnect</h3>
                      <p className="text-amber-100 text-center">Virtual Mall Experience</p>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-gray-600 mb-4">Experience digital storefronts with brand collections delivered in 30-60 minutes.</p>
                    <div className="flex items-center text-amber-600 group-hover:text-amber-700 transition-colors">
                      <span className="font-semibold">Visit Malls</span>
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>

                {/* VyronaRead */}
                <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border-0 bg-gradient-to-br from-pink-50 to-rose-100" onClick={() => setLocation('/vyronaread')}>
                  <div className="relative overflow-hidden rounded-t-lg h-48 bg-gradient-to-br from-pink-500 to-rose-600">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="relative p-6 h-full flex flex-col justify-center items-center text-white">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <BookOpen className="h-8 w-8" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">VyronaRead</h3>
                      <p className="text-pink-100 text-center">Digital Library & Learning</p>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-gray-600 mb-4">Access digital books, manage library services, and explore educational content.</p>
                    <div className="flex items-center text-pink-600 group-hover:text-pink-700 transition-colors">
                      <span className="font-semibold">Start Reading</span>
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>

                {/* VyronaInstaStore */}
                <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border-0 bg-gradient-to-br from-teal-50 to-cyan-100" onClick={() => setLocation('/instashop')}>
                  <div className="relative overflow-hidden rounded-t-lg h-48 bg-gradient-to-br from-teal-500 to-cyan-600">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="relative p-6 h-full flex flex-col justify-center items-center text-white">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Camera className="h-8 w-8" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">VyronaInstaStore</h3>
                      <p className="text-teal-100 text-center">Instagram-Style Shopping</p>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-gray-600 mb-4">Discover trendy products through visual stories and instant shopping experiences.</p>
                    <div className="flex items-center text-teal-600 group-hover:text-teal-700 transition-colors">
                      <span className="font-semibold">Discover Trends</span>
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Featured Products Section */}
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Discover handpicked products from across our platforms, curated just for you
                </p>
                <div className="flex justify-center">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-64 h-12 text-lg">
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
              </div>

              {isLoadingProducts ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {[...Array(8)].map((_, i) => (
                    <Card key={i} className="animate-pulse border-0 shadow-lg">
                      <div className="h-64 bg-gray-200 rounded-t-xl"></div>
                      <CardContent className="p-6">
                        <div className="h-5 bg-gray-200 rounded mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded mb-3"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {/* VyronaHub Products */}
                  {(selectedCategory === "all" || selectedCategory === "vyronahub") &&
                    vyronaHubProducts.slice(0, 8).map((product: any) => (
                      <Card key={`hub-${product.id}`} className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-0 bg-white overflow-hidden" onClick={() => setLocation(`/product/${product.id}`)}>
                        <div className="relative overflow-hidden h-64">
                          <img
                            src={product.imageUrl || "/api/placeholder/400/300"}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <Badge className="absolute top-3 left-3 bg-blue-600/90 text-white backdrop-blur-sm border-0 px-3 py-1">
                            VyronaHub
                          </Badge>
                          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Button size="sm" className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white hover:text-gray-900">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <CardContent className="p-6">
                          <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                          <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">{product.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-blue-600">₹{product.price / 100}</span>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Add to Cart
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                  {/* Social Products */}
                  {(selectedCategory === "all" || selectedCategory === "social") &&
                    [...socialProducts, ...groupBuyProducts].slice(0, 8).map((product: any) => (
                      <Card key={`social-${product.id}`} className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-0 bg-white overflow-hidden" onClick={() => setLocation(`/social/product/${product.id}`)}>
                        <div className="relative overflow-hidden h-64">
                          <img
                            src={product.imageUrl || "/api/placeholder/400/300"}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <Badge className="absolute top-3 left-3 bg-green-600/90 text-white backdrop-blur-sm border-0 px-3 py-1">
                            VyronaSocial
                          </Badge>
                          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Button size="sm" className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white hover:text-gray-900">
                              <Users className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <CardContent className="p-6">
                          <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-green-600 transition-colors">{product.name}</h3>
                          <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">{product.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-green-600">₹{product.price / 100}</span>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                              <Users className="h-4 w-4 mr-2" />
                              Join Group
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
              <div className="text-center mt-12">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3" onClick={() => user ? setLocation('/vyronahub') : setShowAuthModal(true)}>
                  <Eye className="h-5 w-5 mr-2" />
                  Explore All Products
                </Button>
              </div>
            </div>

            {/* Features Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 md:p-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose VyronaMart?</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Experience the future of e-commerce with our innovative features and seamless shopping experience
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center group">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Social Shopping</h3>
                  <p className="text-gray-600 leading-relaxed">Join friends, create groups, and enjoy exclusive discounts when shopping together</p>
                </div>

                <div className="text-center group">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Zap className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
                  <p className="text-gray-600 leading-relaxed">Get your orders delivered in 5-15 minutes from VyronaSpace or 30-60 minutes from virtual malls</p>
                </div>

                <div className="text-center group">
                  <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Star className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Premium Quality</h3>
                  <p className="text-gray-600 leading-relaxed">Curated products from trusted sellers with quality guarantee and easy returns</p>
                </div>
              </div>
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

      {/* Auth Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {authMode === "login" ? "Sign In to VyronaMart" : "Create Your Account"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {authMode === "login" 
                ? "Welcome back! Enter your credentials to access your account." 
                : "Join VyronaMart today and start your shopping journey."
              }
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as "login" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing In..." : "Sign In"}
                </Button>
                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="text-purple-600 hover:text-purple-700"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot your password?
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="Choose a username"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signupEmail">Email</Label>
                  <Input
                    id="signupEmail"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    name="mobile"
                    placeholder="Enter your mobile number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signupPassword">Password</Label>
                  <Input
                    id="signupPassword"
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  disabled={signupMutation.isPending}
                >
                  {signupMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Modal */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Your Password</DialogTitle>
            <DialogDescription>
              {otpStep === "email" && "Enter your email to receive a reset code"}
              {otpStep === "otp" && "Enter the verification code sent to your email"}
              {otpStep === "reset" && "Create a new password for your account"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleForgotPasswordStep} className="space-y-4">
            {otpStep === "email" && (
              <div>
                <Label htmlFor="resetEmail">Email Address</Label>
                <Input
                  id="resetEmail"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                />
              </div>
            )}
            
            {otpStep === "otp" && (
              <div>
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  name="otp"
                  placeholder="Enter the 6-digit code"
                  required
                />
              </div>
            )}
            
            {otpStep === "reset" && (
              <>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="password"
                    type="password"
                    placeholder="Create a new password"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <Input
                    id="confirmNewPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    required
                  />
                </div>
              </>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              disabled={forgotPasswordMutation.isPending || verifyOtpMutation.isPending || resetPasswordMutation.isPending}
            >
              {otpStep === "email" && (forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Code")}
              {otpStep === "otp" && (verifyOtpMutation.isPending ? "Verifying..." : "Verify Code")}
              {otpStep === "reset" && (resetPasswordMutation.isPending ? "Resetting..." : "Reset Password")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Seller Onboarding Modal */}
      <SellerOnboardingModal 
        isOpen={showSellerOnboarding}
        onClose={() => setShowSellerOnboarding(false)}
      />
    </div>
  );
}