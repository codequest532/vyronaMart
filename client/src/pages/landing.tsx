import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingCart, Search, Star, Heart, MapPin, Gamepad2, BookOpen, Building2, Menu } from "lucide-react";
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
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        throw new Error("Login failed");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in to VyronaMart.",
      });
      queryClient.setQueryData(["/api/current-user"], data.user);
      queryClient.invalidateQueries();
      setShowAuthModal(false);
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: { username: string; email: string; mobile?: string; password: string }) => {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        throw new Error("Signup failed");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Welcome to VyronaMart!",
        description: "Account created! You've received 500 VyronaCoins as a welcome bonus.",
      });
      queryClient.setQueryData(["/api/current-user"], data.user);
      queryClient.invalidateQueries();
      setShowAuthModal(false);
    },
    onError: (error) => {
      toast({
        title: "Signup failed",
        description: "Unable to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        throw new Error("Failed to send OTP");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "OTP Sent!",
        description: `Verification code sent to your email. Demo OTP: ${data.otp}`,
      });
      setOtpStep("otp");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (data: { email: string; otp: string; newPassword: string }) => {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        throw new Error("OTP verification failed");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Reset!",
        description: "Your password has been successfully reset.",
      });
      setShowForgotPassword(false);
      setOtpStep("email");
      setResetEmail("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Invalid OTP or password reset failed.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    if (authMode === "login") {
      loginMutation.mutate({
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      });
    } else {
      const password = formData.get("password") as string;
      const confirmPassword = formData.get("confirmPassword") as string;
      
      if (password !== confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "Passwords do not match. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      signupMutation.mutate({
        username: formData.get("username") as string,
        email: formData.get("email") as string,
        mobile: (formData.get("mobile") as string) || undefined,
        password: password,
      });
    }
  };

  const handleAuthRequired = () => {
    setShowAuthModal(true);
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

      {/* Navigation */}
      <nav className="bg-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-8 h-12 text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className={`text-white hover:bg-blue-700 ${selectedCategory === "all" ? "bg-blue-700" : ""}`}
            >
              <Menu className="h-4 w-4 mr-2" />
              All
            </Button>
            <button
              onClick={() => setSelectedCategory("electronics")}
              className={`hover:underline ${selectedCategory === "electronics" ? "underline" : ""}`}
            >
              Electronics
            </button>
            <button
              onClick={() => setSelectedCategory("fashion")}
              className={`hover:underline ${selectedCategory === "fashion" ? "underline" : ""}`}
            >
              Fashion
            </button>
            <button
              onClick={() => setSelectedCategory("home")}
              className={`hover:underline ${selectedCategory === "home" ? "underline" : ""}`}
            >
              Home & Garden
            </button>
            <span className="cursor-pointer hover:underline">Books</span>
            <span className="cursor-pointer hover:underline">Local Stores</span>
            <span className="cursor-pointer hover:underline">Gaming Zone</span>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Welcome to VyronaMart</h2>
          <p className="text-xl mb-8">Shop, Play Games, Earn Rewards & Connect with Your Community</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
              <Gamepad2 className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm font-medium">Mini Games</p>
            </div>
            <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
              <MapPin className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm font-medium">Local Stores</p>
            </div>
            <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
              <BookOpen className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm font-medium">Book Library</p>
            </div>
            <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
              <Building2 className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm font-medium">Mall Brands</p>
            </div>
          </div>
        </div>
      </section>

      {/* Search Results */}
      {searchQuery && (
        <section className="py-8 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h3 className="text-2xl font-bold mb-6">Search Results for "{searchQuery}"</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleAuthRequired}>
                  <CardContent className="p-4">
                    <img 
                      src={product.imageUrl || "/api/placeholder/200/200"} 
                      alt={product.name}
                      className="w-full h-32 object-cover mb-3 rounded"
                    />
                    <h4 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h4>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-green-600">{formatPrice(product.price)}</span>
                      <div className="flex items-center">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-600 ml-1">4.2</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Categories */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Electronics Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Electronics & Gadgets</h3>
            <Button variant="link" onClick={handleAuthRequired}>See all →</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredElectronics.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleAuthRequired}>
                <CardContent className="p-4">
                  <img 
                    src={product.imageUrl || "/api/placeholder/200/200"} 
                    alt={product.name}
                    className="w-full h-32 object-cover mb-3 rounded"
                  />
                  <h4 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h4>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-green-600">{formatPrice(product.price)}</span>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleAuthRequired(); }}>
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center mt-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-gray-600 ml-1">4.2 (128)</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Fashion Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Fashion & Lifestyle</h3>
            <Button variant="link" onClick={handleAuthRequired}>See all →</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredFashion.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleAuthRequired}>
                <CardContent className="p-4">
                  <img 
                    src={product.imageUrl || "/api/placeholder/200/200"} 
                    alt={product.name}
                    className="w-full h-32 object-cover mb-3 rounded"
                  />
                  <h4 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h4>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-green-600">{formatPrice(product.price)}</span>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleAuthRequired(); }}>
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center mt-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-gray-600 ml-1">4.0 (89)</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Books Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Books & Reading</h3>
            <Button variant="link" onClick={handleAuthRequired}>See all →</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredBooks.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleAuthRequired}>
                <CardContent className="p-4">
                  <img 
                    src={product.imageUrl || "/api/placeholder/200/300"} 
                    alt={product.name}
                    className="w-full h-40 object-cover mb-3 rounded"
                  />
                  <h4 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h4>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-green-600">{formatPrice(product.price)}</span>
                    <Badge variant="secondary" className="text-xs">Buy/Rent</Badge>
                  </div>
                  <div className="flex items-center mt-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-gray-600 ml-1">4.5 (234)</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Local Stores Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Local Stores Near You</h3>
            <Button variant="link" onClick={handleAuthRequired}>See all →</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {localStores.map((store) => (
              <Card key={store.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleAuthRequired}>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                      <MapPin className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-bold">{store.name}</h4>
                      <p className="text-sm text-gray-600">{store.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm ml-1">{store.rating || 4.2}</span>
                    </div>
                    <Badge variant={store.isOpen ? "default" : "secondary"}>
                      {store.isOpen ? "Open" : "Closed"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{store.address}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Authentication Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome to VyronaMart</DialogTitle>
            <DialogDescription>
              Sign in to start shopping, playing games, and earning rewards!
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as "login" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="Enter your email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" placeholder="Enter your password" required />
                </div>
                <div className="text-right">
                  <button 
                    type="button" 
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-orange-600 hover:text-orange-700 underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <Button 
                  type="submit" 
                  disabled={loginMutation.isPending}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {loginMutation.isPending ? "Logging in..." : "Login & Start Shopping"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" name="username" placeholder="Choose a username" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" name="email" type="email" placeholder="Enter your email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input id="mobile" name="mobile" type="tel" placeholder="+91-9876543210" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" name="password" type="password" placeholder="Create a password" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input id="confirm-password" name="confirmPassword" type="password" placeholder="Confirm your password" required />
                </div>
                <Button 
                  type="submit" 
                  disabled={signupMutation.isPending}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {signupMutation.isPending ? "Creating Account..." : "Create Account & Get 500 Coins"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Join thousands of users earning rewards while shopping!
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Modal */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              {otpStep === "email" && "Enter your email to receive a verification code"}
              {otpStep === "otp" && "Enter the verification code and your new password"}
            </DialogDescription>
          </DialogHeader>

          {otpStep === "email" && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const email = formData.get("email") as string;
              setResetEmail(email);
              forgotPasswordMutation.mutate(email);
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input 
                  id="reset-email" 
                  name="email" 
                  type="email" 
                  placeholder="Enter your email" 
                  required 
                />
              </div>
              <Button 
                type="submit" 
                disabled={forgotPasswordMutation.isPending}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {forgotPasswordMutation.isPending ? "Sending..." : "Send Verification Code"}
              </Button>
            </form>
          )}

          {otpStep === "otp" && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const otp = formData.get("otp") as string;
              const newPassword = formData.get("newPassword") as string;
              const confirmPassword = formData.get("confirmPassword") as string;
              
              if (newPassword !== confirmPassword) {
                toast({
                  title: "Password Mismatch",
                  description: "Passwords do not match. Please try again.",
                  variant: "destructive",
                });
                return;
              }
              
              verifyOtpMutation.mutate({
                email: resetEmail,
                otp,
                newPassword
              });
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input 
                  id="otp" 
                  name="otp" 
                  placeholder="Enter 6-digit code" 
                  maxLength={6}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input 
                  id="new-password" 
                  name="newPassword" 
                  type="password" 
                  placeholder="Enter new password" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <Input 
                  id="confirm-new-password" 
                  name="confirmPassword" 
                  type="password" 
                  placeholder="Confirm new password" 
                  required 
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setOtpStep("email")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={verifyOtpMutation.isPending}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {verifyOtpMutation.isPending ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-xl font-bold mb-4">VyronaMart - Gamified Shopping</h3>
          <p className="text-gray-400 mb-4">Shop, Play, Earn, Connect with your community</p>
          <div className="flex justify-center space-x-8 text-sm">
            <span>🎮 Mini Games</span>
            <span>🪙 VyronaCoins</span>
            <span>🏆 Achievements</span>
            <span>👥 Social Shopping</span>
          </div>
        </div>
      </footer>
    </div>
  );
}