import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, ShoppingBag, Users, MapPin, BookOpen, Building2, Trophy, Coins, Star, Heart, Play } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product, Store } from "@shared/schema";

export default function Landing() {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // Fetch featured products for catalog display
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: stores } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
    staleTime: 5 * 60 * 1000,
  });

  const featuredProducts = products?.slice(0, 8) || [];
  const featuredStores = stores?.slice(0, 6) || [];

  const productCategories = [
    { name: "Electronics", icon: "📱", count: products?.filter(p => p.category === "electronics").length || 0 },
    { name: "Fashion", icon: "👕", count: products?.filter(p => p.category === "fashion").length || 0 },
    { name: "Books", icon: "📚", count: products?.filter(p => p.module === "read").length || 0 },
    { name: "Local Stores", icon: "🏪", count: stores?.filter(s => s.type === "kirana").length || 0 }
  ];

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
      // Store user data and refresh queries
      queryClient.setQueryData(["/api/user", data.user.id], data.user);
      queryClient.invalidateQueries();
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
    mutationFn: async (data: { username: string; email: string; password: string }) => {
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
        description: `Account created successfully! You've received 500 VyronaCoins as a welcome bonus.`,
      });
      // Store user data and refresh queries
      queryClient.setQueryData(["/api/user", data.user.id], data.user);
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast({
        title: "Signup failed",
        description: "Unable to create account. Please try again.",
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
      signupMutation.mutate({
        username: formData.get("username") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Features Overview */}
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                  VyronaMart
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  The ultimate gamified shopping experience combining social commerce, local discovery, and rewards
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 border-0 bg-white/60 backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Social Shopping</h3>
                      <p className="text-sm text-gray-600">Shop with friends in real-time</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border-0 bg-white/60 backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Gamepad2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Gaming Rewards</h3>
                      <p className="text-sm text-gray-600">Earn coins playing games</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border-0 bg-white/60 backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Local Discovery</h3>
                      <p className="text-sm text-gray-600">Find nearby stores</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border-0 bg-white/60 backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <BookOpen className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Book Marketplace</h3>
                      <p className="text-sm text-gray-600">Buy & rent books</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Stats */}
              <div className="flex space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{products?.length || 0}+</div>
                  <div className="text-sm text-gray-600">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stores?.length || 0}+</div>
                  <div className="text-sm text-gray-600">Stores</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">50K+</div>
                  <div className="text-sm text-gray-600">Users</div>
                </div>
              </div>
            </div>

            {/* Right Column - Auth Form */}
            <div className="lg:max-w-md lg:ml-auto">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Join VyronaMart</CardTitle>
                  <CardDescription>
                    Start your gamified shopping journey today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as "login" | "signup")} className="w-full">
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
                        <Button 
                          type="submit" 
                          disabled={loginMutation.isPending}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
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
                          <Label htmlFor="signup-password">Password</Label>
                          <Input id="signup-password" name="password" type="password" placeholder="Create a password" required />
                        </div>
                        <Button 
                          type="submit" 
                          disabled={signupMutation.isPending}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                          {signupMutation.isPending ? "Creating Account..." : "Create Account & Get 500 Coins"}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                      By joining, you get <span className="font-semibold text-purple-600">500 VyronaCoins</span> to start!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Product Categories Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop Across Categories</h2>
          <p className="text-lg text-gray-600">Discover products from electronics to books, all in one platform</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {productCategories.map((category, index) => (
            <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow cursor-pointer border-0 bg-white/60 backdrop-blur-sm">
              <div className="text-4xl mb-3">{category.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
              <Badge variant="secondary">{category.count} items</Badge>
            </Card>
          ))}
        </div>

        {/* Featured Products */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Featured Products</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow border-0 bg-white/60 backdrop-blur-sm">
                <div className="aspect-square overflow-hidden rounded-t-lg">
                  <img 
                    src={product.imageUrl || "/placeholder.jpg"} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-2 line-clamp-2">{product.name}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-purple-600">
                      ₹{(product.price / 100).toLocaleString()}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* App Modules Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="p-6 border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <Users className="h-8 w-8 mb-4" />
            <h3 className="text-xl font-bold mb-2">VyronaSocial</h3>
            <p className="text-purple-100 mb-4">Create shopping rooms, invite friends, and discover Instagram sellers together</p>
            <div className="flex items-center space-x-2 text-sm">
              <Play className="h-4 w-4" />
              <span>Interactive shopping games</span>
            </div>
          </Card>

          <Card className="p-6 border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <MapPin className="h-8 w-8 mb-4" />
            <h3 className="text-xl font-bold mb-2">VyronaSpace</h3>
            <p className="text-blue-100 mb-4">Discover local stores, kirana shops, and hidden gems near you</p>
            <div className="flex items-center space-x-2 text-sm">
              <Star className="h-4 w-4" />
              <span>Real-time store ratings</span>
            </div>
          </Card>

          <Card className="p-6 border-0 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <BookOpen className="h-8 w-8 mb-4" />
            <h3 className="text-xl font-bold mb-2">VyronaRead</h3>
            <p className="text-green-100 mb-4">Buy, rent, and discover books with library integration</p>
            <div className="flex items-center space-x-2 text-sm">
              <Heart className="h-4 w-4" />
              <span>Personalized recommendations</span>
            </div>
          </Card>

          <Card className="p-6 border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <Building2 className="h-8 w-8 mb-4" />
            <h3 className="text-xl font-bold mb-2">VyronaMallConnect</h3>
            <p className="text-orange-100 mb-4">Connect with major malls and big brand stores</p>
            <div className="flex items-center space-x-2 text-sm">
              <ShoppingBag className="h-4 w-4" />
              <span>Exclusive mall deals</span>
            </div>
          </Card>

          <Card className="p-6 border-0 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <Gamepad2 className="h-8 w-8 mb-4" />
            <h3 className="text-xl font-bold mb-2">Gaming Rewards</h3>
            <p className="text-indigo-100 mb-4">Play mini-games while shopping and earn VyronaCoins</p>
            <div className="flex items-center space-x-2 text-sm">
              <Coins className="h-4 w-4" />
              <span>Ludo, 2048, Trivia & more</span>
            </div>
          </Card>

          <Card className="p-6 border-0 bg-gradient-to-br from-pink-500 to-pink-600 text-white">
            <Trophy className="h-8 w-8 mb-4" />
            <h3 className="text-xl font-bold mb-2">MyVyrona Profile</h3>
            <p className="text-pink-100 mb-4">Track your XP, achievements, and shopping journey</p>
            <div className="flex items-center space-x-2 text-sm">
              <Trophy className="h-4 w-4" />
              <span>Unlock exclusive badges</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white/40 backdrop-blur-sm border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Start Your Gaming Shopping Journey?</h4>
            <p className="text-gray-600 mb-4">Join thousands of users earning rewards while they shop</p>
            <Button 
              onClick={() => setAuthMode("signup")} 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}