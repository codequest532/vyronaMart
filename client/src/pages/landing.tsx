import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingCart, Search, Star, Heart, MapPin, Gamepad2, BookOpen, Building2, Menu, Users } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Product, Store } from "@shared/schema";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [otpStep, setOtpStep] = useState<"email" | "otp" | "reset">("email");
  const [resetEmail, setResetEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch products and stores to display
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: stores } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  // Get products by category
  const electronicsProducts = products?.filter(p => p.category === "electronics") || [];
  const fashionProducts = products?.filter(p => p.category === "fashion") || [];
  const homeProducts = products?.filter(p => p.category === "home") || [];
  const booksProducts = products?.filter(p => p.module === "read") || [];
  const localStores = stores?.filter(s => s.type === "kirana") || [];

  // Filter products based on search and category
  const getFilteredProducts = () => {
    let filtered = products || [];
    
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  const { toast } = useToast();

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
      // Store user data in query cache to maintain auth state
      queryClient.setQueryData(["/api/current-user"], data.user);
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      setLocation("/");
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
      // Store user data in query cache after successful signup
      queryClient.setQueryData(["/api/current-user"], data.user);
      setShowAuthModal(false);
      toast({
        title: "Account Created",
        description: "Welcome to VyronaMart! You've received 500 welcome coins.",
      });
      setLocation("/");
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
        const error = await response.text();
        throw new Error(error);
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
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const mobile = formData.get("mobile") as string;

    if (!email || !password || !confirmPassword || !mobile) {
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

    signupMutation.mutate({ email, password, confirmPassword, mobile });
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

  const handleProductClick = (productId: number) => {
    setLocation(`/product/${productId}`);
  };

  const handleStoreClick = (storeId: number) => {
    setLocation(`/store/${storeId}`);
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">VyronaMart</h1>
              <span className="text-sm text-blue-200">Everything Store</span>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search VyronaMart"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 text-black rounded-md border-0 focus:ring-2 focus:ring-orange-500"
                />
                <Button
                  size="sm"
                  className="absolute right-1 top-1 bottom-1 bg-orange-500 hover:bg-orange-600 px-4"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setShowAuthModal(true)}
                className="text-white hover:bg-blue-800"
              >
                Hello, Sign in
              </Button>
              <Button
                onClick={() => setShowAuthModal(true)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* VyronaMart Modules Navigation */}
      <nav className="bg-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 text-sm">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className={`text-white hover:bg-blue-700 ${selectedCategory === "all" ? "bg-blue-700" : ""}`}
              >
                <Menu className="h-4 w-4 mr-1" />
                All Products
              </Button>
              <span className="cursor-pointer hover:underline font-medium">VyronaHub</span>
              <span className="cursor-pointer hover:underline">VyronaSpace</span>
              <span className="cursor-pointer hover:underline">VyronaSocial</span>
              <span className="cursor-pointer hover:underline">VyronaRead</span>
              <span className="cursor-pointer hover:underline">MallConnect</span>
            </div>
            <div className="text-xs text-blue-200">
              🎮 Gamified Shopping • 🏆 Earn Rewards • 🎯 Social Shopping
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Banner - VyronaMart Features */}
      <section className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-3">Experience VyronaMart</h2>
            <p className="text-xl mb-6">India's First Gamified Social Shopping Platform</p>
          </div>
          
          {/* VyronaMart 6 Core Modules */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all cursor-pointer">
              <div className="text-4xl mb-3">🏠</div>
              <h3 className="font-semibold text-base mb-1">Home</h3>
              <p className="text-sm opacity-90">Dashboard</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all cursor-pointer">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="font-semibold text-base mb-1">VyronaSocial</h3>
              <p className="text-sm opacity-90">Social Shopping</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all cursor-pointer">
              <div className="text-4xl mb-3">🚀</div>
              <h3 className="font-semibold text-base mb-1">VyronaSpace</h3>
              <p className="text-sm opacity-90">Quick Delivery</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all cursor-pointer">
              <div className="text-4xl mb-3">📚</div>
              <h3 className="font-semibold text-base mb-1">VyronaRead</h3>
              <p className="text-sm opacity-90">Books & Learning</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all cursor-pointer">
              <div className="text-4xl mb-3">🏪</div>
              <h3 className="font-semibold text-base mb-1">MallConnect</h3>
              <p className="text-sm opacity-90">Premium Stores</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all cursor-pointer">
              <div className="text-4xl mb-3">👤</div>
              <h3 className="font-semibold text-base mb-1">MyVyrona</h3>
              <p className="text-sm opacity-90">Your Profile</p>
            </div>
          </div>
          
          {/* Unique Features */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🎮</div>
              <h3 className="font-bold mb-1">Gamified Shopping</h3>
              <p className="text-sm opacity-90">Earn coins, XP, and achievements while you shop</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🎯</div>
              <h3 className="font-bold mb-1">Social Shopping Rooms</h3>
              <p className="text-sm opacity-90">Shop together with friends in interactive rooms</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🏆</div>
              <h3 className="font-bold mb-1">Rewards & Levels</h3>
              <p className="text-sm opacity-90">Level up your shopping experience with rewards</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* VyronaSocial Features */}
        <div className="mb-8">
          {searchQuery || selectedCategory !== "all" ? (
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {searchQuery ? `Results for "${searchQuery}"` : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Products`} 
              ({filteredProducts.length} items)
            </h2>
          ) : (
            <section className="mb-12 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">VyronaSocial - Social Shopping Revolution</h2>
                <p className="text-lg text-gray-600">Shop together, share experiences, and discover trends with friends</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-3xl mb-4 text-center">👥</div>
                  <h3 className="font-bold text-lg mb-3 text-center">Social Shopping Rooms</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Create shopping rooms with friends</li>
                    <li>• Real-time product sharing</li>
                    <li>• Group wishlists and collections</li>
                    <li>• Live chat while shopping</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-3xl mb-4 text-center">🎯</div>
                  <h3 className="font-bold text-lg mb-3 text-center">Smart Recommendations</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• AI-powered friend suggestions</li>
                    <li>• Trending products in your circle</li>
                    <li>• Personalized style matches</li>
                    <li>• Social influence insights</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-3xl mb-4 text-center">📱</div>
                  <h3 className="font-bold text-lg mb-3 text-center">Social Feed & Reviews</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Share purchase experiences</li>
                    <li>• Photo & video reviews</li>
                    <li>• Rate and recommend products</li>
                    <li>• Follow influencer picks</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-3xl mb-4 text-center">🏆</div>
                  <h3 className="font-bold text-lg mb-3 text-center">Social Rewards</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Earn coins for social activity</li>
                    <li>• Group purchase discounts</li>
                    <li>• Referral bonus rewards</li>
                    <li>• Social leaderboards</li>
                  </ul>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg">
                  Join VyronaSocial Community
                  <Users className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </section>
          )}
          
          {(searchQuery || selectedCategory !== "all") && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredProducts.slice(0, 24).map((product) => (
                <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow border-gray-200" onClick={() => handleProductClick(product.id)}>
                  <CardContent className="p-3">
                    <div className="aspect-square bg-gray-100 rounded-md mb-2 overflow-hidden">
                      <img
                        src={product.imageUrl || "/api/placeholder/200/200"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-medium text-xs mb-1 line-clamp-2 leading-tight">{product.name}</h3>
                    <div className="flex items-center mb-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 ml-1">(4.5)</span>
                    </div>
                    <p className="text-red-600 font-bold text-sm">₹{product.price}</p>
                    <p className="text-xs text-gray-500 line-through">₹{Math.floor(product.price * 1.3)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* VyronaMart Features Showcase (when no search/filter) */}
        {!searchQuery && selectedCategory === "all" && (
          <>
            {/* VyronaHub - Comprehensive Categories */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">VyronaHub - Complete Shopping Universe</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-6">
                <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="text-2xl mb-3">🔌</div>
                  <h4 className="font-semibold text-sm mb-2">Electronics</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Smartphones & Accessories</li>
                    <li>• Laptops & Tablets</li>
                    <li>• Smart TVs & Monitors</li>
                    <li>• Wearables & Smart Devices</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="text-2xl mb-3">👗</div>
                  <h4 className="font-semibold text-sm mb-2">Fashion & Apparels</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Men's, Women's & Kids' Wear</li>
                    <li>• Footwear & Accessories</li>
                    <li>• Ethnic & Western Clothing</li>
                    <li>• Bags, Wallets & Belts</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="text-2xl mb-3">🏠</div>
                  <h4 className="font-semibold text-sm mb-2">Home & Kitchen</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Kitchen Appliances & Tools</li>
                    <li>• Storage & Organization</li>
                    <li>• Furnishings & Decor</li>
                    <li>• Lighting & Cleaning</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="text-2xl mb-3">🧸</div>
                  <h4 className="font-semibold text-sm mb-2">Kids Corner</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Toys, Games & Puzzles</li>
                    <li>• School Supplies & Stationery</li>
                    <li>• Baby Care Products</li>
                    <li>• Learning & Educational Kits</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="text-2xl mb-3">🥬</div>
                  <h4 className="font-semibold text-sm mb-2">Organic Store</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Organic Fruits & Vegetables</li>
                    <li>• Herbal Juices & Superfoods</li>
                    <li>• Ayurvedic & Natural Products</li>
                    <li>• Organic Skincare & Wellness</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="text-2xl mb-3">🛒</div>
                  <h4 className="font-semibold text-sm mb-2">Groceries</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Daily Essentials (Atta, Rice, Pulses)</li>
                    <li>• Oils, Spices & Condiments</li>
                    <li>• Beverages & Snacks</li>
                    <li>• Dairy, Bakery & Frozen Foods</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="text-2xl mb-3">🏡</div>
                  <h4 className="font-semibold text-sm mb-2">Home Automation</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Smart Plugs & Switches</li>
                    <li>• Voice Assistants (Alexa, Google)</li>
                    <li>• Smart Lights & Sensors</li>
                    <li>• Home Security & Surveillance</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="text-2xl mb-3">🧾</div>
                  <h4 className="font-semibold text-sm mb-2">Office & Stationery</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Office Chairs & Desks</li>
                    <li>• Files, Folders & Organizers</li>
                    <li>• Pens, Notebooks & Writing Tools</li>
                    <li>• Printers & Computer Accessories</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="text-2xl mb-3">🧘</div>
                  <h4 className="font-semibold text-sm mb-2">Health & Wellness</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Fitness Equipment (Yoga Mats)</li>
                    <li>• Health Monitoring Devices</li>
                    <li>• Nutrition & Supplements</li>
                    <li>• Skincare & Personal Hygiene</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="text-2xl mb-3">🐶</div>
                  <h4 className="font-semibold text-sm mb-2">Pet Care</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Pet Food & Treats</li>
                    <li>• Grooming Essentials</li>
                    <li>• Beds, Toys & Accessories</li>
                    <li>• Leashes, Collars & Carriers</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Instagram Store Connect - VyronaSocial Feature */}
            <section className="mb-12 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Instagram Store Connect</h2>
                <p className="text-lg text-gray-600">Experience Instagram shopping like never before — with VyronaSocial</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-3xl mb-4 text-center">📸</div>
                  <h3 className="font-bold text-lg mb-3 text-center">Direct Instagram Import</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Import products from Instagram posts</li>
                    <li>• Sync your Instagram shopping tags</li>
                    <li>• Auto-create VyronaMart listings</li>
                    <li>• Maintain product authenticity</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-3xl mb-4 text-center">🛍️</div>
                  <h3 className="font-bold text-lg mb-3 text-center">Social Shopping Bridge</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Share Instagram finds with friends</li>
                    <li>• Create group wishlists from IG posts</li>
                    <li>• Vote on Instagram discoveries</li>
                    <li>• Collaborative Instagram shopping</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-3xl mb-4 text-center">💫</div>
                  <h3 className="font-bold text-lg mb-3 text-center">Influencer Integration</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Follow influencer product picks</li>
                    <li>• Get notified of new IG drops</li>
                    <li>• Direct purchase from posts</li>
                    <li>• Earn rewards for sharing</li>
                  </ul>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 text-lg">
                  InstaShop Now
                  <Heart className="ml-2 h-5 w-5" />
                </Button>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">Part of VyronaSocial - Transform your Instagram shopping experience</p>
              </div>
            </section>

            {/* VyronaRead - Books & Learning */}
            <section className="mb-12 bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">VyronaRead - Books & Learning</h2>
                <p className="text-lg text-gray-600">Discover knowledge, earn rewards, and grow with every page</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-3xl mb-4 text-center">📚</div>
                  <h3 className="font-bold text-lg mb-3 text-center">Digital Library</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Extensive collection of e-books</li>
                    <li>• Academic textbooks & references</li>
                    <li>• Fiction, non-fiction & biographies</li>
                    <li>• Multi-language support</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-3xl mb-4 text-center">🎓</div>
                  <h3 className="font-bold text-lg mb-3 text-center">Learning Rewards</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Earn coins for reading progress</li>
                    <li>• Complete reading challenges</li>
                    <li>• Unlock knowledge achievements</li>
                    <li>• Reading streak bonuses</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-3xl mb-4 text-center">👥</div>
                  <h3 className="font-bold text-lg mb-3 text-center">Reading Communities</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Join book clubs & discussions</li>
                    <li>• Share reviews & recommendations</li>
                    <li>• Reading buddy system</li>
                    <li>• Author meet & greet events</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-3xl mb-4 text-center">🎯</div>
                  <h3 className="font-bold text-lg mb-3 text-center">Smart Features</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Personalized reading suggestions</li>
                    <li>• Progress tracking & analytics</li>
                    <li>• Note-taking & highlighting</li>
                    <li>• Offline reading mode</li>
                  </ul>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <Button className="bg-gradient-to-r from-blue-500 to-green-600 hover:from-blue-600 hover:to-green-700 text-white px-8 py-3 text-lg">
                  Start Reading Journey
                  <BookOpen className="ml-2 h-5 w-5" />
                </Button>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">Expand your mind while earning rewards - only with VyronaRead</p>
              </div>
            </section>

            {/* VyronaMart Unique Features */}
            <section className="mb-12 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-center mb-8">Why Choose VyronaMart?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center text-white text-xl">
                    🎮
                  </div>
                  <h3 className="font-bold mb-2">Gamified Shopping</h3>
                  <p className="text-sm text-gray-600">Earn coins, XP, and unlock achievements with every purchase</p>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center text-white text-xl">
                    🎯
                  </div>
                  <h3 className="font-bold mb-2">Social Shopping Rooms</h3>
                  <p className="text-sm text-gray-600">Shop together with friends in interactive multiplayer rooms</p>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center text-white text-xl">
                    🏆
                  </div>
                  <h3 className="font-bold mb-2">Rewards & Levels</h3>
                  <p className="text-sm text-gray-600">Level up your profile and unlock exclusive rewards</p>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center text-white text-xl">
                    🏬
                  </div>
                  <h3 className="font-bold mb-2">MallConnect Integration</h3>
                  <p className="text-sm text-gray-600">City mall shops delivering through our e-commerce platform</p>
                </div>
              </div>
            </section>

            {/* MallConnect - Premium Stores */}
            <section className="mb-12 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">VyronaMallConnect - Premium Stores</h2>
                <p className="text-lg text-gray-600">Connecting premium city malls with seamless e-commerce delivery</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-3xl mb-4 text-center">🏬</div>
                  <h3 className="font-bold text-lg mb-3 text-center">Mall Integration</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Direct partnerships with premium malls</li>
                    <li>• Seamless inventory synchronization</li>
                    <li>• Real-time stock availability</li>
                    <li>• Authentic brand verification</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-3xl mb-4 text-center">🚚</div>
                  <h3 className="font-bold text-lg mb-3 text-center">Smart Delivery</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Same-day delivery from malls</li>
                    <li>• Express pickup services</li>
                    <li>• Temperature-controlled transport</li>
                    <li>• Premium packaging options</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-3xl mb-4 text-center">💎</div>
                  <h3 className="font-bold text-lg mb-3 text-center">Premium Experience</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Exclusive mall-only collections</li>
                    <li>• Personal shopping assistance</li>
                    <li>• Virtual store walkthroughs</li>
                    <li>• Priority customer support</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-3xl mb-4 text-center">🎁</div>
                  <h3 className="font-bold text-lg mb-3 text-center">Mall Rewards</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Mall loyalty points integration</li>
                    <li>• Exclusive member discounts</li>
                    <li>• VIP shopping events access</li>
                    <li>• Seasonal festival offers</li>
                  </ul>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-8 py-3 text-lg">
                  Start Shopping
                  <Building2 className="ml-2 h-5 w-5" />
                </Button>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">Think Premium brands Think VyronaMall</p>
              </div>
            </section>

            {/* VyronaSpace - Local Store Connect */}
            <section className="mb-12 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">VyronaSpace - Local Store Connect</h2>
                <p className="text-lg text-gray-600">Connecting you to local neighborhood stores with lightning-fast delivery</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-3xl mb-4 text-center">⚡</div>
                  <h3 className="font-bold text-lg mb-3 text-center">Ultra-Fast Delivery</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• 15-30 minute delivery windows</li>
                    <li>• Real-time order tracking</li>
                    <li>• Express delivery options</li>
                    <li>• Contactless delivery available</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-3xl mb-4 text-center">🏪</div>
                  <h3 className="font-bold text-lg mb-3 text-center">Local Store Network</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Neighborhood grocery stores</li>
                    <li>• Local pharmacies & chemists</li>
                    <li>• Fresh produce vendors</li>
                    <li>• Specialty local shops</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-3xl mb-4 text-center">📍</div>
                  <h3 className="font-bold text-lg mb-3 text-center">Hyper-Local Focus</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Within 3km radius coverage</li>
                    <li>• GPS-based store matching</li>
                    <li>• Local inventory management</li>
                    <li>• Community-first approach</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-3xl mb-4 text-center">💰</div>
                  <h3 className="font-bold text-lg mb-3 text-center">Smart Savings</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Local store competitive pricing</li>
                    <li>• No minimum order value</li>
                    <li>• Bulk purchase discounts</li>
                    <li>• Community loyalty rewards</li>
                  </ul>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <Button className="bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white px-8 py-3 text-lg">
                  Explore Local Stores
                  <MapPin className="ml-2 h-5 w-5" />
                </Button>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">Supporting local businesses while serving your neighborhood</p>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Authentication Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {authMode === "login" ? "Sign In" : "Create Account"}
            </DialogTitle>
            <DialogDescription>
              {authMode === "login" 
                ? "Sign in to your VyronaMart account to continue shopping."
                : "Create a new account to start your shopping journey."
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
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing In..." : "Sign In"}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot Password?
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
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
                    type="tel"
                    placeholder="Enter your mobile number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
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
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              {otpStep === "email" && "Enter your email to receive a reset code."}
              {otpStep === "otp" && "Enter the verification code sent to your email."}
              {otpStep === "reset" && "Enter your new password."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleForgotPasswordStep} className="space-y-4">
            {otpStep === "email" && (
              <div>
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
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
                  type="text"
                  placeholder="Enter 6-digit code"
                  required
                />
              </div>
            )}
            
            {otpStep === "reset" && (
              <>
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    name="password"
                    type="password"
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                  <Input
                    id="confirm-new-password"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </>
            )}
            
            <Button
              type="submit"
              className="w-full"
              disabled={forgotPasswordMutation.isPending || verifyOtpMutation.isPending || resetPasswordMutation.isPending}
            >
              {otpStep === "email" && (forgotPasswordMutation.isPending ? "Sending..." : "Send Code")}
              {otpStep === "otp" && (verifyOtpMutation.isPending ? "Verifying..." : "Verify Code")}
              {otpStep === "reset" && (resetPasswordMutation.isPending ? "Resetting..." : "Reset Password")}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowForgotPassword(false);
                setOtpStep("email");
                setResetEmail("");
              }}
            >
              Cancel
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}