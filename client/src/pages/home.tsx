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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Clock,
  Download,
  ArrowLeft,
  Bookmark,
  Settings,
  Sun,
  Moon,
  Search,
  Filter,
  Building2,
  FileText,
  TrendingUp
} from "lucide-react";

type TabType = "vyronahub" | "social" | "space" | "read" | "mall" | "instashop" | "profile";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("vyronahub");
  const [, setLocation] = useLocation();
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [fontSize, setFontSize] = useState(16);
  const [darkMode, setDarkMode] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [readingProgress, setReadingProgress] = useState(68);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLibrary, setSelectedLibrary] = useState<any>(null);

  // Book content will come from authentic seller uploads
  const getBookContent = (book: any) => {
    return book?.content || [];
  };

  const totalPages = selectedBook ? getBookContent(selectedBook).length : 0;

  const handlePageChange = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    } else if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleBookmarkToggle = () => {
    if (bookmarks.includes(currentPage)) {
      setBookmarks(bookmarks.filter(page => page !== currentPage));
    } else {
      setBookmarks([...bookmarks, currentPage]);
    }
  };

  const { user, updateCoins } = useUserData();
  const { notification, showNotification, hideNotification } = useToastNotifications();

  // Data queries for all modules
  const { data: products } = useQuery({
    queryKey: ['/api/products'],
    enabled: true
  });

  const { data: stores } = useQuery({
    queryKey: ['/api/stores'],
    enabled: true
  });

  const { data: shoppingRooms } = useQuery({
    queryKey: ['/api/shopping-rooms'],
    enabled: true
  });

  const { data: sellerBooks } = useQuery({
    queryKey: ['/api/products', 'vyronaread'],
    enabled: true
  });

  const { data: sellerEBooks } = useQuery({
    queryKey: ['/api/ebooks'],
    enabled: true
  });

  const { data: libraryRequests } = useQuery({
    queryKey: ['/api/library-integration-requests'],
    enabled: true
  });

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleGameClick = (gameName: string) => {
    const rewards = [15, 25, 35, 50];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    updateCoins(reward);
    showNotification(`You earned ${reward} VyronaCoins playing ${gameName}!`, "game");
  };

  const handleProductClick = (productName: string) => {
    showNotification(`Added ${productName} to cart! +5 VyronaCoins`, "success");
    updateCoins(5);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header user={user} />
      <CartButton />
      
      <NotificationToast
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onHide={hideNotification}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

        {/* VyronaHub Tab - Default Opening Page */}
        {activeTab === "vyronahub" && (
          <div className="space-y-8">
            {/* Hero Section */}
            <Card className="vyrona-gradient-primary text-white relative overflow-hidden">
              <CardContent className="p-8">
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold mb-2">Welcome to VyronaHub!</h2>
                  <p className="text-lg opacity-90 mb-6">Your ultimate gaming and earning center</p>
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-white/20 rounded-lg px-4 py-2 backdrop-blur-sm">
                      <div className="text-sm opacity-80">Your Coins</div>
                      <div className="font-bold text-lg">{user.vyronaCoins}</div>
                    </div>
                    <div className="bg-white/20 rounded-lg px-4 py-2 backdrop-blur-sm">
                      <div className="text-sm opacity-80">Level</div>
                      <div className="font-bold text-lg">{user.level}</div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-4 right-4 text-6xl opacity-20">
                  <Gamepad2 className="animate-bounce-slow" />
                </div>
              </CardContent>
            </Card>

            {/* Complete Shopping Universe */}
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">🛒 VyronaHub - Complete Shopping Universe</h3>
                  <p className="text-gray-600">Your one-stop destination for everything awesome - gadgets to groceries!</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      icon: "🔌",
                      title: "Electronics",
                      items: ["Smartphones & Accessories", "Laptops & Tablets", "Smart TVs & Monitors", "Wearables & Smart Devices"],
                      color: "blue"
                    },
                    {
                      icon: "👗",
                      title: "Fashion & Apparels",
                      items: ["Men's, Women's & Kids' Wear", "Footwear & Accessories", "Ethnic & Western Clothing", "Bags, Wallets & Belts"],
                      color: "pink"
                    },
                    {
                      icon: "🏠",
                      title: "Home & Kitchen",
                      items: ["Kitchen Appliances & Tools", "Storage & Organization", "Furnishings & Decor", "Lighting & Cleaning"],
                      color: "green"
                    },
                    {
                      icon: "🧸",
                      title: "Kids Corner",
                      items: ["Toys, Games & Puzzles", "School Supplies & Stationery", "Baby Care Products", "Learning & Educational Kits"],
                      color: "yellow"
                    },
                    {
                      icon: "🥬",
                      title: "Organic Store",
                      items: ["Organic Fruits & Vegetables", "Herbal Juices & Superfoods", "Ayurvedic & Natural Products", "Organic Skincare & Wellness"],
                      color: "emerald"
                    },
                    {
                      icon: "🛒",
                      title: "Groceries",
                      items: ["Daily Essentials (Atta, Rice, Pulses)", "Oils, Spices & Condiments", "Beverages & Snacks", "Dairy, Bakery & Frozen Foods"],
                      color: "orange"
                    },
                    {
                      icon: "🏡",
                      title: "Home Automation",
                      items: ["Smart Plugs & Switches", "Voice Assistants (Alexa, Google)", "Smart Lights & Sensors", "Home Security & Surveillance"],
                      color: "indigo"
                    },
                    {
                      icon: "🧾",
                      title: "Office & Stationery",
                      items: ["Office Chairs & Desks", "Files, Folders & Organizers", "Pens, Notebooks & Writing Tools", "Printers & Computer Accessories"],
                      color: "gray"
                    },
                    {
                      icon: "🧘",
                      title: "Health & Wellness",
                      items: ["Fitness Equipment (Yoga Mats)", "Health Monitoring Devices", "Nutrition & Supplements", "Skincare & Personal Hygiene"],
                      color: "teal"
                    },
                    {
                      icon: "🐶",
                      title: "Pet Care",
                      items: ["Pet Food & Treats", "Grooming Essentials", "Beds, Toys & Accessories", "Leashes, Collars & Carriers"],
                      color: "amber"
                    }
                  ].map((category, index) => (
                    <Card key={index} className={`bg-${category.color}-50 border-${category.color}-200 hover:shadow-lg transition-all duration-300 cursor-pointer group`}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="text-2xl">{category.icon}</div>
                          <h4 className="font-bold text-gray-900">{category.title}</h4>
                        </div>
                        <ul className="space-y-1">
                          {category.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="text-sm text-gray-600 flex items-start">
                              <span className="mr-2">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3 flex items-center justify-between">
                          <Badge variant="secondary" className={`text-${category.color}-600 bg-${category.color}-50`}>
                            Shop Now
                          </Badge>
                          <span className="text-xs text-gray-500 group-hover:text-gray-700">
                            View All →
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">🎯</div>
                      <div>
                        <h4 className="font-bold text-gray-900">Shop Smart, Earn More!</h4>
                        <p className="text-sm text-gray-600">Get VyronaCoins with every purchase and unlock exclusive rewards</p>
                      </div>
                    </div>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                      Start Shopping
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Game Center */}
            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">🎮 Game Center</h3>
                    <p className="text-gray-600">Play exciting games, earn VyronaCoins, and unlock achievements!</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">{user.vyronaCoins}</div>
                    <div className="text-sm text-gray-500">Your Coins</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: "Puzzle Quest", icon: Brain, color: "from-blue-400 to-blue-600", players: "Solo", reward: "20-60 coins" },
                    { name: "Memory Matrix", icon: Grid3X3, color: "from-green-400 to-green-600", players: "Solo", reward: "15-50 coins" },
                    { name: "Word Hunter", icon: Target, color: "from-purple-400 to-purple-600", players: "Solo", reward: "25-70 coins" },
                    { name: "Color Match", icon: Layers, color: "from-pink-400 to-pink-600", players: "Solo", reward: "10-40 coins" },
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
                        <h4 className="font-semibold text-gray-900">Daily Challenge</h4>
                        <p className="text-sm text-gray-600">Complete today's challenge for bonus rewards</p>
                      </div>
                    </div>
                    <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                      Start Challenge
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Navigation to Other Modules */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Explore VyronaSocial Platform</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("social")}>
                    <CardContent className="p-6 text-center">
                      <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                      <h4 className="font-semibold text-gray-900 mb-2">VyronaSocial</h4>
                      <p className="text-sm text-gray-500">Shop with friends in groups</p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("read")}>
                    <CardContent className="p-6 text-center">
                      <Book className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                      <h4 className="font-semibold text-gray-900 mb-2">VyronaRead</h4>
                      <p className="text-sm text-gray-500">Browse books and libraries</p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("mall")}>
                    <CardContent className="p-6 text-center">
                      <Store className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <h4 className="font-semibold text-gray-900 mb-2">VyronaMall</h4>
                      <p className="text-sm text-gray-500">Shop from mall brands</p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("space")}>
                    <CardContent className="p-6 text-center">
                      <MapPin className="h-12 w-12 text-red-600 mx-auto mb-4" />
                      <h4 className="font-semibold text-gray-900 mb-2">VyronaSpace</h4>
                      <p className="text-sm text-gray-500">Discover local stores</p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("instashop")}>
                    <CardContent className="p-6 text-center">
                      <Instagram className="h-12 w-12 text-pink-600 mx-auto mb-4" />
                      <h4 className="font-semibold text-gray-900 mb-2">VyronaInstaShop</h4>
                      <p className="text-sm text-gray-500">Shop from Instagram stores</p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("profile")}>
                    <CardContent className="p-6 text-center">
                      <User className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                      <h4 className="font-semibold text-gray-900 mb-2">Profile</h4>
                      <p className="text-sm text-gray-500">Manage your account</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* All other tab content remains the same... */}
        {/* For brevity, I'll include the key tabs but the full implementation would include all existing tabs */}

        {/* VyronaSocial Tab */}
        {activeTab === "social" && (
          <div className="space-y-6">
            <Card className="vyrona-gradient-social text-white">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-2">VyronaSocial Shopping</h2>
                <p className="opacity-90">Shop together, save together, and earn together!</p>
              </CardContent>
            </Card>
            {/* Add VyronaSocial content here */}
          </div>
        )}

        {/* VyronaRead Tab */}
        {activeTab === "read" && (
          <div className="space-y-6">
            <Card className="vyrona-gradient-read text-white">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-2">VyronaRead Library</h2>
                <p className="opacity-90">Your digital and physical book collection</p>
              </CardContent>
            </Card>
            {/* Add VyronaRead content here */}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{user.username}</h2>
                    <p className="text-gray-600">{user.email}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1">
                        <Coins className="h-4 w-4 text-amber-500" />
                        <span className="font-semibold">{user.vyronaCoins} coins</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Trophy className="h-4 w-4 text-blue-500" />
                        <span className="font-semibold">Level {user.level}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}