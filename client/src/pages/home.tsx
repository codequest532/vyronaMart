import { useState } from "react";
import Header from "@/components/layout/header";
import TabNavigation from "@/components/layout/tab-navigation";
import CartButton from "@/components/shopping/cart-button";
import NotificationToast from "@/components/ui/notification-toast";
import { useUserData } from "@/hooks/use-user-data";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { useQuery } from "@tanstack/react-query";
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
  Gift
} from "lucide-react";

type TabType = "home" | "social" | "space" | "read" | "mall" | "profile";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const { user, updateCoins } = useUserData();
  const { showNotification } = useToastNotifications();

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: stores = [] } = useQuery({
    queryKey: ["/api/stores"],
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
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

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

            {/* Trending Products */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Trending Products</h3>
                  <Button variant="ghost" className="text-blue-600">View All</Button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {products.slice(0, 4).map((product) => (
                    <div 
                      key={product.id} 
                      className="group cursor-pointer"
                      onClick={() => handleProductClick(product.name)}
                    >
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

        {/* VyronaSocial Tab */}
        {activeTab === "social" && (
          <div className="space-y-6">
            <Card className="vyrona-gradient-social text-white">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-2">VyronaSocial</h2>
                <p className="opacity-90">Shop with friends, play games, and win together!</p>
              </CardContent>
            </Card>

            {/* Active Shopping Rooms */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Active Shopping Rooms</h3>
                  <Button className="bg-pink-600 hover:bg-pink-700">
                    <Users className="mr-2 h-4 w-4" />
                    Create Room
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {shoppingRooms.map((room) => (
                    <Card key={room.id} className="border border-gray-200 hover:border-pink-300 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                              <Users className="text-pink-600 h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{room.name}</h4>
                              <p className="text-sm text-gray-500">{room.memberCount} friends shopping • Playing {room.currentGame}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-600">₹{(room.totalCart / 100).toLocaleString()} shared cart</div>
                            <div className="text-xs text-gray-500">Group discount: 15%</div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center space-x-2">
                          <div className="flex -space-x-2">
                            {Array.from({ length: room.memberCount }).map((_, i) => (
                              <div key={i} className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-white"></div>
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">Join game to unlock 200 bonus coins!</span>
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
                <h3 className="text-lg font-bold text-gray-900 mb-4">Social Games</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: "Ludo", icon: Dice1, color: "from-red-400 to-red-600", desc: "Compete while shopping" },
                    { name: "Trivia", icon: Brain, color: "from-blue-400 to-blue-600", desc: "Test product knowledge" },
                    { name: "2048 Merge", icon: Grid3X3, color: "from-green-400 to-green-600", desc: "Build mega carts" },
                    { name: "Spin Wheel", icon: Target, color: "from-purple-400 to-purple-600", desc: "Daily room rewards" },
                  ].map((game) => (
                    <div 
                      key={game.name}
                      className={`bg-gradient-to-br ${game.color} rounded-lg p-4 text-white cursor-pointer hover:scale-105 transition-transform`}
                      onClick={() => handleGameClick(game.name)}
                    >
                      <game.icon className="h-8 w-8 mb-2" />
                      <h4 className="font-semibold">{game.name}</h4>
                      <p className="text-xs opacity-80">{game.desc}</p>
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

            {/* Featured Books */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Featured Books</h3>
                  <div className="flex space-x-2">
                    <Badge variant="outline" className="text-indigo-700">Buy</Badge>
                    <Badge variant="outline" className="text-purple-700">Rent</Badge>
                    <Badge variant="outline" className="text-green-700">Borrow</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {products.filter(p => p.module === "read").map((book) => (
                    <div key={book.id} className="group cursor-pointer" onClick={() => handleProductClick(book.name)}>
                      <img 
                        src={book.imageUrl} 
                        alt={book.name}
                        className="w-full h-48 object-cover rounded-lg mb-3 group-hover:scale-105 transition-transform"
                      />
                      <h4 className="font-semibold text-sm">{book.name}</h4>
                      <p className="text-xs text-gray-500">{book.metadata?.author}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-sm font-bold text-indigo-600">₹{(book.price / 100).toLocaleString()}</div>
                        {book.metadata?.rentalPrice && (
                          <div className="text-xs text-purple-600">₹{(book.metadata.rentalPrice / 100)}/week</div>
                        )}
                      </div>
                      <Badge variant="secondary" className="mt-1 text-green-600 bg-green-50">
                        +{Math.floor(book.price / 10000)} coins on purchase
                      </Badge>
                    </div>
                  ))}
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
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{user.username}</h2>
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
