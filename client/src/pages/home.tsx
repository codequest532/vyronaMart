import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import TabNavigation from "@/components/layout/tab-navigation";
import CartButton from "@/components/shopping/cart-button";
import NotificationToast from "@/components/ui/notification-toast";
import { useUserData } from "@/hooks/use-user-data";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Wallet,
  Gift,
  Instagram,
  ExternalLink,
  Verified,
  Camera,
  ThumbsUp,
  MessageCircle,
  BookOpen,
  Share2,
  Eye,
  TrendingUp
} from "lucide-react";

type TabType = "home" | "vyronahub" | "social" | "space" | "read" | "mall" | "instashop" | "profile";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [, setLocation] = useLocation();
  
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
    if (tab === "instashop") {
      setLocation("/instashop");
      return;
    }
    setActiveTab(tab);
  };
  const { user, updateCoins } = useUserData();
  const { notification, showNotification, hideNotification } = useToastNotifications();

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: stores = [] } = useQuery({
    queryKey: ["/api/stores"],
  });

  const { data: books = [] } = useQuery({
    queryKey: ["/api/books"],
  });

  const { data: libraryRequests = [] } = useQuery({
    queryKey: ["/api/admin/library-requests"],
  });

  const { data: shoppingRooms = [] } = useQuery({
    queryKey: ["/api/shopping-rooms"],
  });

  const { data: achievements = [] } = useQuery({
    queryKey: [`/api/achievements/${user?.id}`],
    enabled: !!user?.id,
  });

  const handleGameClick = (gameName: string) => {
    const coinReward = Math.floor(Math.random() * 100) + 10;
    updateCoins(coinReward);
    showNotification("Game Started!", `Playing ${gameName}`, "game");
  };

  const handleProductClick = (productName: string) => {
    const coinReward = Math.floor(Math.random() * 50) + 10;
    updateCoins(coinReward);
    showNotification("Product Viewed!", `Earned ${coinReward} coins`, "success");
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
        const coinReward = 25;
        updateCoins(coinReward);
        showNotification("Book Borrowed!", `Successfully borrowed from library. Earned ${coinReward} coins!`, "success");
        
        // Refresh library data
        queryClient.invalidateQueries({ queryKey: ["/api/admin/library-requests"] });
      } else {
        const error = await response.json();
        showNotification("Borrow Failed", error.message || "Unable to borrow book", "success");
      }
    } catch (error) {
      console.error('Library borrow error:', error);
      showNotification("Error", "Failed to borrow book from library", "success");
    }
  };

  const handleBookPurchase = async (bookId: number, action: 'buy' | 'rent') => {
    if (!user) {
      showNotification("Login Required", "Please login to purchase books", "success");
      return;
    }

    try {
      const response = await fetch(`/api/books/${bookId}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action }),
      });

      if (response.ok) {
        const order = await response.json();
        const coinReward = Math.floor(order.amount / 100);
        updateCoins(coinReward);
        showNotification(
          action === 'buy' ? "Book Purchased!" : "Book Rented!",
          `Transaction successful! Earned ${coinReward} coins`,
          "success"
        );
        queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      } else {
        showNotification("Purchase Failed", "Unable to complete transaction", "error");
      }
    } catch (error) {
      showNotification("Purchase Failed", "Network error occurred", "error");
    }
  };

  const handleReadBook = (book: any) => {
    if (!user) {
      showNotification("Login Required", "Please login to access reading", "error");
      return;
    }
    
    // Navigate to e-book reader with book data
    setLocation(`/ebook-reader?book=${encodeURIComponent(JSON.stringify(book))}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading VyronaMart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header user={user} onNavigateToProfile={() => handleTabChange("profile")} />
      <CartButton />
      <NotificationToast 
        title={notification.title}
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onHide={hideNotification}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Home Tab */}
        {activeTab === "home" && (
          <div className="space-y-8">
            {/* Hero Section */}
            <Card className="vyrona-gradient-primary text-white relative overflow-hidden">
              <CardContent className="p-8">
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold mb-2">Welcome to VyronaMart!</h2>
                  <p className="text-lg opacity-90 mb-6">Your gamified shopping universe awaits</p>
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-white/20 rounded-lg px-4 py-2 backdrop-blur-sm">
                      <div className="text-sm opacity-80">Daily Streak</div>
                      <div className="font-bold text-lg">Day 7</div>
                    </div>
                    <div className="bg-white/20 rounded-lg px-4 py-2 backdrop-blur-sm">
                      <div className="text-sm opacity-80">Today's Rewards</div>
                      <div className="font-bold text-lg">+150 Coins</div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-4 right-4 text-6xl opacity-20">
                  <Gamepad2 className="animate-bounce-slow" />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleGameClick("Daily Games")}>
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <Dice1 className="text-green-600 h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Daily Games</h3>
                  <p className="text-sm text-gray-500">Play & Earn Coins</p>
                  <Badge variant="secondary" className="mt-2 text-green-600 bg-green-50">+50 coins available</Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="text-pink-600 h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Flash Sales</h3>
                  <p className="text-sm text-gray-500">Limited Time Offers</p>
                  <Badge variant="secondary" className="mt-2 text-pink-600 bg-pink-50">Ends in 2h 35m</Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("social")}>
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Users className="text-purple-600 h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Social Rooms</h3>
                  <p className="text-sm text-gray-500">Shop with Friends</p>
                  <Badge variant="secondary" className="mt-2 text-purple-600 bg-purple-50">3 friends online</Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("space")}>
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                    <Store className="text-amber-600 h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Local Stores</h3>
                  <p className="text-sm text-gray-500">Nearby Shops</p>
                  <Badge variant="secondary" className="mt-2 text-amber-600 bg-amber-50">{stores.length} stores within 2km</Badge>
                </CardContent>
              </Card>
            </div>

            {/* VyronaRead Books Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Book className="text-purple-600 h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">VyronaRead Books</h3>
                      <p className="text-sm text-gray-500">Physical & Digital Library</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" className="text-purple-600">View All Books</Button>
                    <Button variant="outline" className="text-purple-600 border-purple-300" onClick={() => setLocation('/ebook-reader')}>
                      <Book className="h-4 w-4 mr-1" />
                      E-Reader
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  {books && books.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {books.slice(0, 6).map((book: any) => (
                        <div key={book.id} className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{book.title}</h4>
                              <p className="text-xs text-gray-600 mb-1">{book.author}</p>
                              <p className="text-xs text-gray-500">{book.genre} • {book.pages} pages</p>
                            </div>
                            <Badge variant={book.type === 'physical' ? 'default' : 'secondary'} className="text-xs">
                              {book.type === 'physical' ? 'Physical' : 'Digital'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-purple-600">${book.price}</span>
                              {book.type === 'digital' && (
                                <span className="text-xs text-gray-500">or rent $2.99</span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                className="text-xs bg-purple-600 hover:bg-purple-700"
                                onClick={() => {
                                  showNotification(`Purchased "${book.title}" successfully! +15 VyronaCoins`, "success");
                                  updateCoins(15);
                                }}
                              >
                                Buy
                              </Button>
                              {book.type === 'digital' && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs border-purple-300 text-purple-600"
                                  onClick={() => {
                                    showNotification(`Rented "${book.title}" for 30 days! +10 VyronaCoins`, "success");
                                    updateCoins(10);
                                  }}
                                >
                                  Rent
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-purple-200">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Library: {book.libraryName || 'VyronaRead'}</span>
                              <span>{book.condition || 'New'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Book className="text-purple-600 h-8 w-8" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">No Books Available Yet</h4>
                      <p className="text-gray-500 text-sm mb-4">Books will appear here once library integrations are approved by admin</p>
                      <Badge variant="secondary" className="text-purple-600 bg-purple-50">
                        Library Integration Required
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Product Categories */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Shop by Category</h3>
                  <Button variant="ghost" className="text-blue-600">View All Categories</Button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { name: "Electronics", icon: Laptop, color: "blue", count: products.filter(p => p.category === "electronics").length },
                    { name: "Fashion", icon: Shirt, color: "pink", count: products.filter(p => p.category === "fashion").length },
                    { name: "Books", icon: Book, color: "purple", count: products.filter(p => p.category === "mystery" || p.category === "sci-fi").length },
                    { name: "Home & Living", icon: HomeIcon, color: "green", count: products.filter(p => p.category === "home").length || 3 },
                  ].map((category) => (
                    <Card key={category.name} className={`bg-${category.color}-50 border-${category.color}-200 cursor-pointer hover:bg-${category.color}-100 hover:shadow-lg transition-all duration-300 group`}>
                      <CardContent className="p-6 text-center">
                        <div className={`w-16 h-16 bg-${category.color}-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                          <category.icon className={`text-${category.color}-600 h-8 w-8`} />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">{category.name}</h4>
                        <p className="text-sm text-gray-600">{category.count}+ products</p>
                        <Badge variant="secondary" className={`mt-2 text-${category.color}-600 bg-${category.color}-50`}>
                          Earn up to 50 coins
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Trending Products */}
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-gray-900">🔥 Trending Products</h4>
                  <Button variant="ghost" className="text-blue-600 text-sm">View All</Button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {products.slice(0, 4).map((product) => (
                    <div 
                      key={product.id} 
                      className="group cursor-pointer bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
                      onClick={() => handleProductClick(product.name)}
                    >
                      <div className="relative">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs">
                            +{Math.floor(product.price / 10000)}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">{product.name}</h4>
                        <p className="text-blue-600 font-bold text-lg">₹{(product.price / 100).toLocaleString()}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">Free shipping</span>
                          <Button size="sm" className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700">
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Game Explorer */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">🎮 Game Explorer</h3>
                    <p className="text-gray-600">Play games, earn coins, and unlock exclusive rewards!</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">2,450</div>
                    <div className="text-sm text-gray-500">Your Coins</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: "Ludo Battle", icon: Dice1, color: "from-red-400 to-red-600", reward: "50-100 coins", players: "2-4 players" },
                    { name: "Trivia Master", icon: Brain, color: "from-blue-400 to-blue-600", reward: "30-80 coins", players: "1-6 players" },
                    { name: "Merge Tiles", icon: Grid3X3, color: "from-green-400 to-green-600", reward: "40-90 coins", players: "Solo" },
                    { name: "Lucky Wheel", icon: Target, color: "from-purple-400 to-purple-600", reward: "10-200 coins", players: "Daily spins" },
                  ].map((game) => (
                    <div 
                      key={game.name}
                      className={`bg-gradient-to-br ${game.color} rounded-xl p-4 text-white cursor-pointer hover:scale-105 hover:shadow-xl transition-all duration-300 group relative overflow-hidden`}
                      onClick={() => handleGameClick(game.name)}
                    >
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative z-10">
                        <game.icon className="h-8 w-8 mb-3" />
                        <h4 className="font-semibold mb-1">{game.name}</h4>
                        <p className="text-xs opacity-90 mb-2">{game.players}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{game.reward}</span>
                          <Play className="h-4 w-4 opacity-80" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-white/50 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Trophy className="text-amber-500 h-6 w-6" />
                      <div>
                        <h5 className="font-semibold text-gray-900">Daily Challenge</h5>
                        <p className="text-sm text-gray-600">Complete 3 games to unlock bonus rewards</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-600">Progress: 1/3</div>
                      <Progress value={33} className="w-20 mt-1" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* VyronaSocial Tab */}
        {activeTab === "social" && (
          <div className="space-y-6">
            <Card className="vyrona-gradient-social text-white">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-2">VyronaSocial</h2>
                <p className="opacity-90">Shop with friends, connect with Instagram sellers, and win together!</p>
              </CardContent>
            </Card>

            {/* Instagram Seller Connect */}
            <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Instagram className="text-white h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Instagram Store Connect</h3>
                      <p className="text-gray-600">Discover and shop from your favorite Instagram sellers</p>
                    </div>
                  </div>
                  <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white">
                    <Instagram className="mr-2 h-4 w-4" />
                    Connect Store
                  </Button>
                </div>

                {/* Featured Instagram Sellers */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { username: "@trendy_fashion_tn", followers: "12.5K", category: "Fashion", verified: true, products: 156, rating: 4.8 },
                    { username: "@chennai_electronics", followers: "8.3K", category: "Electronics", verified: true, products: 89, rating: 4.9 },
                    { username: "@homestyle_decor", followers: "15.2K", category: "Home Decor", verified: false, products: 234, rating: 4.7 },
                  ].map((seller, index) => (
                    <Card key={index} className="bg-white border border-pink-100 hover:border-pink-300 hover:shadow-lg transition-all duration-300 cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {seller.username.charAt(1).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-1">
                              <h4 className="font-semibold text-gray-900">{seller.username}</h4>
                              {seller.verified && <Verified className="text-blue-500 h-4 w-4" />}
                            </div>
                            <p className="text-sm text-gray-500">{seller.followers} followers</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Category:</span>
                            <Badge variant="secondary" className="text-pink-600 bg-pink-50">{seller.category}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Products:</span>
                            <span className="font-semibold">{seller.products}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Rating:</span>
                            <div className="flex items-center space-x-1">
                              <Star className="text-amber-400 h-4 w-4 fill-current" />
                              <span className="font-semibold">{seller.rating}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center space-x-2">
                          <Button size="sm" className="flex-1 bg-pink-600 hover:bg-pink-700">
                            <Eye className="mr-1 h-3 w-3" />
                            View Store
                          </Button>
                          <Button size="sm" variant="outline" className="border-pink-200 text-pink-600">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Instagram Connect Stats */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-pink-600">500+</div>
                    <div className="text-sm text-gray-600">Connected Sellers</div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">15K+</div>
                    <div className="text-sm text-gray-600">Products Available</div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">95%</div>
                    <div className="text-sm text-gray-600">Customer Satisfaction</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Shopping Rooms */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">🛍️ Active Shopping Rooms</h3>
                  <Button className="bg-pink-600 hover:bg-pink-700">
                    <Users className="mr-2 h-4 w-4" />
                    Create Room
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {(shoppingRooms as any[]).map((room: any) => (
                    <Card key={room.id} className="border border-gray-200 hover:border-pink-300 hover:shadow-lg transition-all duration-300 cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl flex items-center justify-center">
                              <Users className="text-pink-600 h-6 w-6" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{room.name}</h4>
                              <p className="text-sm text-gray-500">{room.memberCount} friends shopping • Playing {room.currentGame}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">₹{(room.totalCart / 100).toLocaleString()}</div>
                            <div className="text-xs text-gray-500">Group discount: 15% off</div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="flex -space-x-2">
                              {Array.from({ length: room.memberCount }).map((_, i) => (
                                <div key={i} className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                                  {i + 1}
                                </div>
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">+200 bonus coins</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline" className="border-pink-200 text-pink-600">
                              <MessageCircle className="mr-1 h-3 w-3" />
                              Chat
                            </Button>
                            <Button size="sm" className="bg-pink-600 hover:bg-pink-700">
                              Join Room
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Social Games */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">🎮 Social Games</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: "Ludo Battle", icon: Dice1, color: "from-red-400 to-red-600", desc: "Compete while shopping", reward: "50-100 coins" },
                    { name: "Product Trivia", icon: Brain, color: "from-blue-400 to-blue-600", desc: "Test product knowledge", reward: "30-80 coins" },
                    { name: "Cart Builder", icon: Grid3X3, color: "from-green-400 to-green-600", desc: "Build mega carts together", reward: "40-90 coins" },
                    { name: "Lucky Wheel", icon: Target, color: "from-purple-400 to-purple-600", desc: "Daily room rewards", reward: "10-200 coins" },
                  ].map((game) => (
                    <div 
                      key={game.name}
                      className={`bg-gradient-to-br ${game.color} rounded-xl p-4 text-white cursor-pointer hover:scale-105 hover:shadow-xl transition-all duration-300 group relative overflow-hidden`}
                      onClick={() => handleGameClick(game.name)}
                    >
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative z-10">
                        <game.icon className="h-8 w-8 mb-3" />
                        <h4 className="font-semibold mb-1">{game.name}</h4>
                        <p className="text-xs opacity-90 mb-2">{game.desc}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{game.reward}</span>
                          <Play className="h-4 w-4 opacity-80" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* VyronaSpace Tab */}
        {activeTab === "space" && (
          <div className="space-y-6">
            <Card className="vyrona-gradient-space text-white">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-2">VyronaSpace</h2>
                <p className="opacity-90">Discover local stores and unlock geo-rewards!</p>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Your Location</h3>
                  <Button variant="ghost" className="text-green-600">
                    <MapPin className="mr-2 h-4 w-4" />
                    Update Location
                  </Button>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-lg p-6 mb-4 relative overflow-hidden">
                  <div className="flex items-center space-x-3 mb-3">
                    <MapPin className="text-green-600 h-6 w-6" />
                    <div>
                      <h4 className="font-semibold">T. Nagar, Chennai</h4>
                      <p className="text-sm text-gray-600">Tamil Nadu, India</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">{stores.length} local stores within 2km radius</div>
                </div>
              </CardContent>
            </Card>

            {/* Store Categories */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Store Categories</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: "Kirana Stores", icon: ShoppingBag, color: "orange", count: stores.filter(s => s.type === "kirana").length },
                    { name: "Fashion", icon: Shirt, color: "pink", count: stores.filter(s => s.type === "fashion").length },
                    { name: "Electronics", icon: Laptop, color: "blue", count: stores.filter(s => s.type === "electronics").length },
                    { name: "Lifestyle", icon: Heart, color: "green", count: stores.filter(s => s.type === "lifestyle").length },
                  ].map((category) => (
                    <Card key={category.name} className={`bg-${category.color}-50 border-${category.color}-200 cursor-pointer hover:bg-${category.color}-100 transition-colors`}>
                      <CardContent className="p-4">
                        <category.icon className={`text-${category.color}-500 h-8 w-8 mb-2`} />
                        <h4 className="font-semibold text-sm">{category.name}</h4>
                        <p className="text-xs text-gray-500">{category.count} stores nearby</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Nearby Stores */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Nearby Stores</h3>
                <div className="space-y-4">
                  {stores.slice(0, 3).map((store) => (
                    <Card key={store.id} className="border border-gray-200 hover:border-green-300 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Store className="text-orange-500 h-6 w-6" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{store.name}</h4>
                              <p className="text-sm text-gray-500">{store.type} • 0.3km away</p>
                              <div className="flex items-center mt-1">
                                <div className="flex text-yellow-400 text-xs">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className="h-3 w-3 fill-current" />
                                  ))}
                                </div>
                                <span className="text-xs text-gray-500 ml-2">{(store.rating / 100).toFixed(1)} ({store.reviewCount} reviews)</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="mb-1 bg-green-100 text-green-700">Open</Badge>
                            <div className="text-xs text-gray-500">Closes at 10 PM</div>
                          </div>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">Book Slot</Button>
                          <Button size="sm" variant="outline">View Products</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* VyronaRead Tab */}
        {activeTab === "read" && (
          <div className="space-y-6">
            <Card className="vyrona-gradient-read text-white">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-2">VyronaRead</h2>
                <p className="opacity-90">Read. Return. Repeat. - Your smart reading ecosystem</p>
              </CardContent>
            </Card>

            {/* Reading Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Books Read", value: "12", icon: Book, color: "indigo" },
                { label: "Currently Rented", value: "3", icon: Play, color: "purple" },
                { label: "Books Donated", value: "5", icon: Heart, color: "green" },
                { label: "Reading Score", value: "4.8", icon: Star, color: "yellow" },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                        <stat.icon className={`text-${stat.color}-500 h-5 w-5`} />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                        <div className="text-xs text-gray-500">{stat.label}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Book Categories */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Browse Categories</h3>
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                  {[
                    { name: "Romance", icon: Heart, color: "red" },
                    { name: "Sci-Fi", icon: Zap, color: "blue" },
                    { name: "Mystery", icon: Target, color: "yellow" },
                    { name: "Education", icon: GraduationCap, color: "green" },
                    { name: "Fantasy", icon: Sparkles, color: "purple" },
                    { name: "Biography", icon: User, color: "gray" },
                  ].map((category) => (
                    <Button
                      key={category.name}
                      variant="outline"
                      className={`bg-${category.color}-50 border-${category.color}-200 hover:bg-${category.color}-100 h-auto p-3 flex-col`}
                    >
                      <category.icon className={`text-${category.color}-500 h-5 w-5 mb-1`} />
                      <div className="text-sm font-medium">{category.name}</div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Browse Books - Purchase/Rent */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Browse Books</h3>
                  <div className="flex space-x-2">
                    <Badge variant="outline" className="text-indigo-700">Purchase</Badge>
                    <Badge variant="outline" className="text-purple-700">Rent</Badge>
                    <Badge variant="outline" className="text-green-700">Digital</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      id: 1,
                      name: "The Art of Programming",
                      author: "Robert Martin",
                      price: 2999,
                      rentPrice: 599,
                      type: "physical",
                      imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400"
                    },
                    {
                      id: 2,
                      name: "Digital Marketing Mastery",
                      author: "Sarah Johnson",
                      price: 1999,
                      rentPrice: 399,
                      type: "physical",
                      imageUrl: "https://images.unsplash.com/photo-1553484771-371a605b060b?w=400"
                    },
                    {
                      id: 3,
                      name: "Modern Web Development",
                      author: "Alex Thompson",
                      price: 1499,
                      type: "digital",
                      imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400"
                    },
                    {
                      id: 4,
                      name: "Data Science Fundamentals",
                      author: "Dr. Emily Chen",
                      price: 2499,
                      type: "digital",
                      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400"
                    }
                  ].map((book) => (
                    <div key={book.id} className="group bg-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
                      <div className="relative">
                        <img 
                          src={book.imageUrl} 
                          alt={book.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge variant={book.type === "digital" ? "default" : "secondary"} className="text-xs">
                            {book.type}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">{book.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-lg font-bold text-indigo-600">
                            ₹{(book.price / 100).toFixed(0)}
                          </div>
                          {book.rentPrice && (
                            <div className="text-sm text-purple-600">
                              ₹{(book.rentPrice / 100).toFixed(0)}/week
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            onClick={() => {
                              const coinReward = Math.floor(book.price / 100);
                              updateCoins(coinReward);
                              showNotification("Book Purchased!", `You earned ${coinReward} coins!`, "success");
                            }}
                            className="flex-1"
                          >
                            Buy
                          </Button>
                          {book.rentPrice && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const coinReward = Math.floor(book.rentPrice / 50);
                                updateCoins(coinReward);
                                showNotification("Book Rented!", `You earned ${coinReward} coins!`, "success");
                              }}
                              className="flex-1"
                            >
                              Rent
                            </Button>
                          )}
                          {book.type === "digital" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                showNotification("Opening E-Reader", "Starting VyronaRead experience", "success");
                                // Would navigate to e-reader
                              }}
                              className="flex-1"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Physical Library Books Lending */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Library Integration</h3>
                  <div className="flex space-x-2">
                    <Badge variant="outline" className="text-green-700">Borrow</Badge>
                    <Badge variant="outline" className="text-blue-700">Return</Badge>
                  </div>
                </div>

                {/* Sample Libraries for demonstration */}
                <div className="space-y-6">
                  {[
                    {
                      id: 1,
                      name: "Central City Library",
                      address: "123 Main Street, Downtown",
                      totalBooks: 15000,
                      books: [
                        { id: "lib1-1", name: "Programming Fundamentals", author: "John Smith", available: true, type: "physical" },
                        { id: "lib1-2", name: "Data Structures Guide", author: "Jane Doe", available: true, type: "physical" },
                        { id: "lib1-3", name: "Web Development Basics", author: "Mike Johnson", available: false, type: "digital" }
                      ]
                    },
                    {
                      id: 2,
                      name: "University Technical Library",
                      address: "456 University Ave, Campus",
                      totalBooks: 25000,
                      books: [
                        { id: "lib2-1", name: "Advanced Algorithms", author: "Dr. Sarah Chen", available: true, type: "physical" },
                        { id: "lib2-2", name: "Machine Learning Basics", author: "Prof. Michael Lee", available: true, type: "digital" }
                      ]
                    }
                  ].map((library) => (
                    <div key={library.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{library.name}</h4>
                          <p className="text-sm text-gray-600">{library.address}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="secondary">
                              <BookOpen className="h-3 w-3 mr-1" />
                              {library.totalBooks.toLocaleString()} Books
                            </Badge>
                            <Badge variant="outline" className="text-green-600">
                              <Heart className="h-3 w-3 mr-1" />
                              Verified Library
                            </Badge>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <MapPin className="h-4 w-4 mr-1" />
                          Visit Library
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {library.books.map((book) => (
                          <div key={book.id} className="bg-gray-50 rounded-lg p-3">
                            <h5 className="font-medium text-gray-900 mb-1">{book.name}</h5>
                            <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                            <div className="flex items-center justify-between">
                              <Badge variant={book.available ? "default" : "destructive"} className="text-xs">
                                {book.available ? "Available" : "Borrowed"}
                              </Badge>
                              {book.available && (
                                <Button 
                                  size="sm" 
                                  onClick={() => {
                                    updateCoins(25);
                                    showNotification("Book Borrowed!", `Borrowed from ${library.name}. Earned 25 coins!`, "success");
                                  }}
                                >
                                  Borrow
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* VyronaRead E-Reader */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">VyronaRead E-Reader</h3>
                  <Badge variant="outline" className="text-blue-700">Kindle-like Experience</Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Reading Features</h4>
                    <div className="space-y-3">
                      {[
                        { feature: "Customizable Font Size", icon: "📖" },
                        { feature: "Night Mode Reading", icon: "🌙" },
                        { feature: "Bookmark Management", icon: "🔖" },
                        { feature: "Progress Tracking", icon: "📊" },
                        { feature: "Highlight & Notes", icon: "✏️" },
                        { feature: "Offline Reading", icon: "📱" }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-lg">{item.icon}</span>
                          <span className="text-gray-700">{item.feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Currently Reading</h4>
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4">
                      <div className="flex items-start space-x-4">
                        <img 
                          src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100" 
                          alt="Current book"
                          className="w-16 h-24 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">The Art of Programming</h5>
                          <p className="text-sm text-gray-600 mb-2">by Robert Martin</p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>68%</span>
                            </div>
                            <Progress value={68} className="h-2" />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Page 204 of 300</span>
                              <span>2h 30m left</span>
                            </div>
                          </div>
                          <Button size="sm" className="mt-3 w-full">
                            <Play className="h-4 w-4 mr-2" />
                            Continue Reading
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-900">Reading Settings</h5>
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="outline">Font Size</Button>
                        <Button size="sm" variant="outline">Theme</Button>
                        <Button size="sm" variant="outline">Bookmarks</Button>
                        <Button size="sm" variant="outline">Notes</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* VyronaMall Tab */}
        {activeTab === "mall" && (
          <div className="space-y-6">
            <Card className="vyrona-gradient-mall text-white">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-2">VyronaMallConnect</h2>
                <p className="opacity-90">Mall brands delivered to your doorstep with exclusive pricing</p>
              </CardContent>
            </Card>

            {/* Mall Selection */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Select Your Mall</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {stores.filter(s => s.type === "mall").map((mall, index) => (
                    <Card key={mall.id} className={index === 0 ? "border-2 border-amber-500 bg-amber-50" : "border border-gray-200 hover:border-amber-300 transition-colors cursor-pointer"}>
                      <CardContent className="p-4">
                        <div className="w-full h-32 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg mb-3 flex items-center justify-center">
                          <Building className="text-amber-600 h-12 w-12" />
                        </div>
                        <h4 className="font-semibold">{mall.name}</h4>
                        <p className="text-sm text-gray-500">Chennai • 2.5km away</p>
                        <Badge className="mt-2 bg-green-100 text-green-700">150+ brands</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Brand Categories */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Brand Categories</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: "Fashion", icon: Shirt, color: "pink", count: "50+ brands" },
                    { name: "Electronics", icon: Laptop, color: "blue", count: "25+ brands" },
                    { name: "Food Court", icon: Utensils, color: "green", count: "30+ outlets" },
                    { name: "Home & Living", icon: HomeIcon, color: "purple", count: "35+ brands" },
                  ].map((category) => (
                    <Card key={category.name} className={`bg-${category.color}-50 border-${category.color}-200 cursor-pointer hover:bg-${category.color}-100 transition-colors`}>
                      <CardContent className="p-4">
                        <category.icon className={`text-${category.color}-500 h-8 w-8 mb-2`} />
                        <h4 className="font-semibold text-sm">{category.name}</h4>
                        <p className="text-xs text-gray-500">{category.count}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Featured Products */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Featured Products</h3>
                  <Button variant="ghost" className="text-amber-600">View All Products</Button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {products.filter(p => p.module === "mall").map((product) => (
                    <div key={product.id} className="group cursor-pointer" onClick={() => handleProductClick(product.name)}>
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-40 object-cover rounded-lg mb-3 group-hover:scale-105 transition-transform"
                      />
                      <h4 className="font-semibold text-sm">{product.name}</h4>
                      <p className="text-blue-600 font-bold">₹{(product.price / 100).toLocaleString()}</p>
                      <Badge variant="secondary" className="mt-1 text-green-600 bg-green-50">
                        +{Math.floor(product.price / 10000)} coins
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* MyVyrona Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
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
                      <p className="opacity-90">Level {user.level} • VyronaMart Explorer</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1">
                          <Coins className="text-amber-300 h-4 w-4" />
                          <span className="font-semibold">{user.vyronaCoins.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="text-yellow-300 h-4 w-4" />
                          <span className="font-semibold">{user.xp.toLocaleString()} XP</span>
                        </div>
                      </div>
                    </div>
                  </div>
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
              </CardContent>
            </Card>

            {/* Level Progress */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">Level Progress</h3>
                  <span className="text-sm text-gray-500">1,660 XP to Level {user.level + 1}</span>
                </div>
                <Progress value={75} className="mb-4" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Games Played", value: "47" },
                    { label: "Orders Placed", value: "23" },
                    { label: "Friends Invited", value: "8" },
                    { label: "Achievements", value: achievements.length.toString() },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                      <div className="text-xs text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Achievements & Badges</h3>
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { name: "First Purchase", icon: ShoppingCart, color: "amber", unlocked: true },
                    { name: "Social Shopper", icon: Users, color: "emerald", unlocked: true },
                    { name: "Game Master", icon: Gamepad, color: "indigo", unlocked: true },
                    { name: "Book Lover", icon: Book, color: "rose", unlocked: true },
                    { name: "Local Explorer", icon: MapPin, color: "cyan", unlocked: true },
                    { name: "Mall Expert", icon: Building, color: "gray", unlocked: false },
                  ].map((achievement) => (
                    <Card key={achievement.name} className={`text-center p-3 ${achievement.unlocked ? `bg-gradient-to-br from-${achievement.color}-100 to-${achievement.color}-200` : "bg-gray-100 opacity-50"}`}>
                      <CardContent className="p-0">
                        <achievement.icon className={`h-8 w-8 mx-auto mb-2 ${achievement.unlocked ? `text-${achievement.color}-600` : "text-gray-400"}`} />
                        <div className="text-xs font-medium">{achievement.name}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Wallet */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">VyronaWallet</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Coins className="text-amber-600 h-5 w-5" />
                        <span className="font-medium">VyronaCoins</span>
                      </div>
                      <span className="font-bold text-amber-600">{user.vyronaCoins.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Wallet className="text-green-600 h-5 w-5" />
                        <span className="font-medium">Wallet Balance</span>
                      </div>
                      <span className="font-bold text-green-600">₹1,250</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Gift className="text-blue-600 h-5 w-5" />
                        <span className="font-medium">Vouchers</span>
                      </div>
                      <span className="font-bold text-blue-600">5 Active</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {[
                      { type: "Ludo Win Bonus", time: "2 hours ago", amount: "+150", color: "green" },
                      { type: "Book Purchase", time: "1 day ago", amount: "+50", color: "blue" },
                      { type: "Friend Referral", time: "3 days ago", amount: "+200", color: "purple" },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-8 h-8 bg-${activity.color}-100 rounded-full flex items-center justify-center`}>
                          <Coins className={`text-${activity.color}-600 h-4 w-4`} />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{activity.type}</div>
                          <div className="text-xs text-gray-500">{activity.time}</div>
                        </div>
                        <div className={`text-sm font-bold text-${activity.color}-600`}>{activity.amount}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <CartButton />
      <NotificationToast />
    </div>
  );
}
