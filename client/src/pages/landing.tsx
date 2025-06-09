import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingCart, Search, Star, Heart, MapPin, Gamepad2, BookOpen, Building2, Menu, Users, ShoppingBag, Shield } from "lucide-react";
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

  const handleProductClick = (productId: number) => {
    // Navigate to product detail page or handle product selection
    console.log("Product clicked:", productId);
    // setLocation(`/product/${productId}`);
  };

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
      
      // Redirect based on user role
      if (data.user?.role === 'admin') {
        setLocation("/admin");
      } else if (data.user?.role === 'seller') {
        setLocation("/seller");
      } else {
        setLocation("/");
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
                Log In
              </Button>
              <Button
                onClick={() => setShowAuthModal(true)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Sign Up
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
              <div className="text-4xl mb-3">🛍️</div>
              <h3 className="font-semibold text-base mb-1">VyronaHub</h3>
              <p className="text-sm opacity-90">Shop Smart</p>
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
              <div className="text-4xl mb-3">📸</div>
              <h3 className="font-semibold text-base mb-1">InstaStore Connect</h3>
              <p className="text-sm opacity-90">Instagram Shopping</p>
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
        {/* Product Grid */}
        <div className="mb-8">
          {searchQuery || selectedCategory !== "all" ? (
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {searchQuery ? `Results for "${searchQuery}"` : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Products`} 
              ({filteredProducts.length} items)
            </h2>
          ) : null}
          
          {(searchQuery || selectedCategory !== "all") && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredProducts.slice(0, 24).map((product) => (
                <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 border-0 shadow-lg" onClick={() => handleProductClick(product.id)}>
                  <div className="relative overflow-hidden rounded-t-lg bg-gray-100 h-48">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <ShoppingBag className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Button size="sm" variant="ghost" className="bg-white/80 backdrop-blur-sm hover:bg-white rounded-full p-2">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                    {product.enableGroupBuy && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">
                          Group Buy
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-base mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h4>
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500 ml-2">(4.5)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 font-bold text-lg">₹{product.price}</p>
                        <p className="text-sm text-gray-500 line-through">₹{(product.price * 1.3).toFixed(0)}</p>
                      </div>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* VyronaMart Features Showcase (when no search/filter) */}
        {!searchQuery && selectedCategory === "all" && (
          <>
            {/* VyronaHub - Redesigned with Better Appeal */}
            <section className="mb-16">
              {/* Hero Header */}
              <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 rounded-3xl p-10 mb-12 text-white">
                <div className="text-center max-w-4xl mx-auto">
                  <h2 className="text-4xl md:text-5xl font-bold mb-6">
                    Welcome to VyronaHub
                  </h2>
                  <p className="text-xl md:text-2xl mb-8 opacity-90">
                    Discover millions of products from trusted sellers worldwide
                  </p>
                  <div className="flex justify-center items-center space-x-8 text-lg">
                    <div className="flex items-center">
                      <Shield className="h-6 w-6 mr-2" />
                      <span>Secure Shopping</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-6 w-6 mr-2" />
                      <span>Trusted Community</span>
                    </div>
                    <div className="flex items-center">
                      <ShoppingBag className="h-6 w-6 mr-2" />
                      <span>Fast Delivery</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Grid - Larger Tiles */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-center mb-8">Shop by Category</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  <div 
                    className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 border border-gray-100"
                    onClick={() => setSelectedCategory("electronics")}
                  >
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">📱</div>
                    <h4 className="font-bold text-lg mb-3 text-gray-800">Electronics</h4>
                    <p className="text-sm text-gray-600 mb-4">Latest gadgets & tech</p>
                    <div className="text-xs text-blue-600 font-medium">Explore →</div>
                  </div>
                  
                  <div 
                    className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 border border-gray-100"
                    onClick={() => setSelectedCategory("fashion")}
                  >
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">👗</div>
                    <h4 className="font-bold text-lg mb-3 text-gray-800">Fashion</h4>
                    <p className="text-sm text-gray-600 mb-4">Trendy clothing & style</p>
                    <div className="text-xs text-pink-600 font-medium">Explore →</div>
                  </div>
                  
                  <div 
                    className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 border border-gray-100"
                    onClick={() => setSelectedCategory("home")}
                  >
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🏠</div>
                    <h4 className="font-bold text-lg mb-3 text-gray-800">Home & Living</h4>
                    <p className="text-sm text-gray-600 mb-4">Furniture & decor</p>
                    <div className="text-xs text-green-600 font-medium">Explore →</div>
                  </div>
                  
                  <div 
                    className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 border border-gray-100"
                    onClick={() => setSelectedCategory("kids")}
                  >
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🧸</div>
                    <h4 className="font-bold text-lg mb-3 text-gray-800">Kids & Baby</h4>
                    <p className="text-sm text-gray-600 mb-4">Toys & essentials</p>
                    <div className="text-xs text-orange-600 font-medium">Explore →</div>
                  </div>
                  
                  <div 
                    className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 border border-gray-100"
                    onClick={() => setSelectedCategory("organic")}
                  >
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🥬</div>
                    <h4 className="font-bold text-lg mb-3 text-gray-800">Organic Store</h4>
                    <p className="text-sm text-gray-600 mb-4">Fresh & healthy</p>
                    <div className="text-xs text-green-600 font-medium">Explore →</div>
                  </div>
                  
                  <div 
                    className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 border border-gray-100"
                    onClick={() => setSelectedCategory("groceries")}
                  >
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🛒</div>
                    <h4 className="font-bold text-lg mb-3 text-gray-800">Groceries</h4>
                    <p className="text-sm text-gray-600 mb-4">Daily essentials</p>
                    <div className="text-xs text-blue-600 font-medium">Explore →</div>
                  </div>
                  
                  <div 
                    className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 border border-gray-100"
                    onClick={() => setSelectedCategory("sports")}
                  >
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">💪</div>
                    <h4 className="font-bold text-lg mb-3 text-gray-800">Sports & Fitness</h4>
                    <p className="text-sm text-gray-600 mb-4">Gear & wellness</p>
                    <div className="text-xs text-red-600 font-medium">Explore →</div>
                  </div>
                  
                  <div 
                    className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 border border-gray-100"
                    onClick={() => setSelectedCategory("books")}
                  >
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">📚</div>
                    <h4 className="font-bold text-lg mb-3 text-gray-800">Books & Media</h4>
                    <p className="text-sm text-gray-600 mb-4">Knowledge & entertainment</p>
                    <div className="text-xs text-purple-600 font-medium">Explore →</div>
                  </div>
                  
                  <div 
                    className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 border border-gray-100"
                    onClick={() => setSelectedCategory("automotive")}
                  >
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🚗</div>
                    <h4 className="font-bold text-lg mb-3 text-gray-800">Automotive</h4>
                    <p className="text-sm text-gray-600 mb-4">Car care & accessories</p>
                    <div className="text-xs text-gray-600 font-medium">Explore →</div>
                  </div>
                  
                  <div 
                    className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 border border-gray-100"
                    onClick={() => setSelectedCategory("gifts")}
                  >
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🎁</div>
                    <h4 className="font-bold text-lg mb-3 text-gray-800">Gifts & More</h4>
                    <p className="text-sm text-gray-600 mb-4">Special occasions</p>
                    <div className="text-xs text-pink-600 font-medium">Explore →</div>
                  </div>
                </div>
              </div>

              {/* Featured Products Grid - Larger Product Cards */}
              <div className="mb-12">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold">Featured Products</h3>
                  <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                    View All Products
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {(products || []).slice(0, 10).map((product) => (
                    <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 border-0 shadow-lg">
                      <div className="relative overflow-hidden rounded-t-lg bg-gray-100 h-48">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <ShoppingBag className="h-16 w-16 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <Button size="sm" variant="ghost" className="bg-white/80 backdrop-blur-sm hover:bg-white rounded-full p-2">
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                        {product.enableGroupBuy && (
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">
                              Group Buy
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-base mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                          {product.name}
                        </h4>
                        <div className="flex items-center mb-3">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500 ml-2">(4.5)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-600 font-bold text-lg">₹{product.price}</p>
                            <p className="text-sm text-gray-500 line-through">₹{(product.price * 1.3).toFixed(0)}</p>
                          </div>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              <div className="text-center">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                  Start Shopping Now
                  <ShoppingBag className="ml-3 h-6 w-6" />
                </Button>
              </div>
            </section>

            {/* VyronaSocial - Social Shopping Revolution */}
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
                  Discover Premium Shops
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
          </>
        )}
      </main>

      {/* Authentication Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-lg border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-sm">
          <DialogHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {authMode === "login" ? "Welcome Back!" : "Join VyronaMart"}
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-base">
              {authMode === "login" 
                ? "Sign in to continue your shopping adventure"
                : "Create your account and earn 500 welcome coins!"
              }
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as "login" | "signup")}>
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl h-12">
              <TabsTrigger 
                value="login" 
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 font-medium"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 font-medium"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="h-12 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    className="h-12 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg transition-all"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    "Sign In to VyronaMart"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot Password?
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-gray-700 font-medium">Email Address</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="h-12 bg-white/80 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-lg transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile" className="text-gray-700 font-medium">Mobile Number</Label>
                  <Input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    placeholder="Enter your mobile number"
                    className="h-12 bg-white/80 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-lg transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-gray-700 font-medium">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="Create a strong password"
                    className="h-12 bg-white/80 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-lg transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-gray-700 font-medium">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    className="h-12 bg-white/80 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-lg transition-all"
                    required
                  />
                </div>
                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                    disabled={signupMutation.isPending}
                  >
                    {signupMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      "Create Your Account"
                    )}
                  </Button>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    By creating an account, you agree to our Terms of Service
                  </p>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Modal */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-lg border-0 shadow-2xl bg-gradient-to-br from-white via-green-50/30 to-blue-50/30 backdrop-blur-sm">
          <DialogHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Reset Your Password
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-base">
              {otpStep === "email" && "We'll send a secure verification code to your email"}
              {otpStep === "otp" && "Enter the 6-digit code sent to your email"}
              {otpStep === "reset" && "Create a new secure password for your account"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleForgotPasswordStep} className="space-y-5">
            {otpStep === "email" && (
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-gray-700 font-medium">Email Address</Label>
                <Input
                  id="reset-email"
                  name="email"
                  type="email"
                  placeholder="Enter your registered email"
                  className="h-12 bg-white/80 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-lg transition-all"
                  required
                />
              </div>
            )}
            
            {otpStep === "otp" && (
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-gray-700 font-medium">Verification Code</Label>
                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  placeholder="Enter 6-digit verification code"
                  className="h-12 bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg transition-all text-center tracking-widest"
                  maxLength={6}
                  required
                />
                <p className="text-sm text-gray-500 text-center">
                  Code expires in 15 minutes
                </p>
              </div>
            )}
            
            {otpStep === "reset" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-gray-700 font-medium">New Password</Label>
                  <Input
                    id="new-password"
                    name="password"
                    type="password"
                    placeholder="Create a strong password"
                    className="h-12 bg-white/80 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-lg transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password" className="text-gray-700 font-medium">Confirm New Password</Label>
                  <Input
                    id="confirm-new-password"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    className="h-12 bg-white/80 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-lg transition-all"
                    required
                  />
                </div>
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              disabled={forgotPasswordMutation.isPending || verifyOtpMutation.isPending || resetPasswordMutation.isPending}
            >
              {otpStep === "email" && (
                forgotPasswordMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Sending Code...</span>
                  </div>
                ) : (
                  "Send Verification Code"
                )
              )}
              {otpStep === "otp" && (
                verifyOtpMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </div>
                ) : (
                  "Verify Code"
                )
              )}
              {otpStep === "reset" && (
                resetPasswordMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Updating Password...</span>
                  </div>
                ) : (
                  "Update Password"
                )
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-gray-200 hover:bg-gray-50 transition-all duration-200"
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