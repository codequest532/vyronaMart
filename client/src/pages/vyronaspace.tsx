import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { 
  Sparkles, Package, Award, Users, Search, Filter, MapPin, Clock, 
  Star, ShoppingCart, ShoppingBag, Plus, Minus, Truck, Phone,
  MessageCircle, RefreshCw, Trophy, Target, Zap, Gift, ArrowLeft,
  Calendar, Repeat, Camera, User, Store, Bell, X, Edit, Wallet, Settings
} from "lucide-react";

interface Store {
  id: number;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  distance: string;
  isOpen: boolean;
  address: string;
  description: string;
  featuredProducts: string[];
  totalProducts: number;
  deliveryFee: number;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  storeName: string;
}

interface Order {
  id: number;
  status: string;
  estimatedDelivery: string;
  trackingNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  deliveryPartner: string;
  currentLocation: string;
}

const mockStores: Store[] = [
  {
    id: 1,
    name: "FreshMart Express",
    category: "Grocery",
    rating: 4.8,
    reviewCount: 1250,
    deliveryTime: "8 min",
    distance: "0.5 km",
    isOpen: true,
    address: "123 Green Valley Road",
    description: "Fresh fruits, vegetables, and daily essentials",
    featuredProducts: ["Fresh Bananas", "Organic Apples", "Green Vegetables"],
    totalProducts: 450,
    deliveryFee: 25
  },
  {
    id: 2,
    name: "MedPlus Essentials",
    category: "Pharmacy",
    rating: 4.7,
    reviewCount: 890,
    deliveryTime: "6 min",
    distance: "0.3 km",
    isOpen: true,
    address: "456 Health Street",
    description: "Medicines, healthcare products, and wellness items",
    featuredProducts: ["Pain Relief", "Vitamins", "First Aid"],
    totalProducts: 320,
    deliveryFee: 15
  },
  {
    id: 3,
    name: "TechHub Electronics",
    category: "Electronics",
    rating: 4.6,
    reviewCount: 670,
    deliveryTime: "12 min",
    distance: "0.8 km",
    isOpen: true,
    address: "789 Tech Avenue",
    description: "Latest gadgets, accessories, and electronics",
    featuredProducts: ["Smartphones", "Headphones", "Chargers"],
    totalProducts: 280,
    deliveryFee: 35
  },
  {
    id: 4,
    name: "Fashion District",
    category: "Fashion",
    rating: 4.5,
    reviewCount: 540,
    deliveryTime: "15 min",
    distance: "1.2 km",
    isOpen: true,
    address: "321 Style Boulevard",
    description: "Trendy clothing, accessories, and footwear",
    featuredProducts: ["T-Shirts", "Jeans", "Sneakers"],
    totalProducts: 890,
    deliveryFee: 45
  },
  {
    id: 5,
    name: "BookWorld Cafe",
    category: "Books",
    rating: 4.9,
    reviewCount: 320,
    deliveryTime: "10 min",
    distance: "0.7 km",
    isOpen: false,
    address: "654 Literature Lane",
    description: "Books, stationery, and coffee",
    featuredProducts: ["Bestsellers", "Notebooks", "Coffee"],
    totalProducts: 150,
    deliveryFee: 30
  },
  {
    id: 6,
    name: "HomeMart Essentials",
    category: "Home & Garden",
    rating: 4.4,
    reviewCount: 420,
    deliveryTime: "14 min",
    distance: "1.0 km",
    isOpen: true,
    address: "987 Garden Grove",
    description: "Home improvement, garden supplies, and decor",
    featuredProducts: ["Plants", "Tools", "Decor"],
    totalProducts: 380,
    deliveryFee: 40
  }
];

const mockOrders: Order[] = [
  {
    id: 1001,
    status: "In Transit",
    estimatedDelivery: "Today, 4:30 PM",
    trackingNumber: "VYR1001",
    items: [
      { name: "Fresh Bananas", quantity: 2, price: 45 },
      { name: "Organic Milk", quantity: 1, price: 85 }
    ],
    total: 175,
    deliveryPartner: "SpeedX",
    currentLocation: "Near your location"
  },
  {
    id: 1002,
    status: "Delivered",
    estimatedDelivery: "Yesterday, 3:15 PM",
    trackingNumber: "VYR1002",
    items: [
      { name: "Whole Wheat Bread", quantity: 1, price: 35 },
      { name: "Premium Rice", quantity: 1, price: 120 }
    ],
    total: 155,
    deliveryPartner: "FastTrack",
    currentLocation: "Delivered"
  }
];

export default function VyronaSpace() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [viewMode, setViewMode] = useState<"stores" | "store-products">("stores");
  const [isSubscriptionMode, setIsSubscriptionMode] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showManageAddresses, setShowManageAddresses] = useState(false);
  const [ordersViewMode, setOrdersViewMode] = useState<"orders" | "reorder" | "subscriptions">("orders");
  const [profileForm, setProfileForm] = useState({ username: "", email: "", mobile: "" });
  const [newAddress, setNewAddress] = useState({ 
    name: "", address: "", city: "", state: "", pincode: "", phone: "", isDefault: false 
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: { username: string; email: string; mobile: string }) => {
      return await apiRequest("PUT", "/api/profile/1", profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile/1"] });
      setShowEditProfile(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add address mutation
  const addAddressMutation = useMutation({
    mutationFn: async (addressData: any) => {
      return await apiRequest("POST", "/api/addresses", { ...addressData, userId: 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses/1"] });
      setShowManageAddresses(false);
      setNewAddress({ name: "", address: "", city: "", state: "", pincode: "", phone: "", isDefault: false });
      toast({
        title: "Address Added",
        description: "Your address has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add address. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Real API calls replacing mock data
  const { data: stores = [], isLoading: storesLoading } = useQuery({
    queryKey: ["/api/stores"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: userOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders/user/1"],
  });

  const { data: walletBalance = { balance: 0 }, isLoading: balanceLoading } = useQuery({
    queryKey: ["/api/wallet/balance/1"],
  });

  const { data: achievements = [], isLoading: achievementsLoading } = useQuery({
    queryKey: ["/api/achievements/1"],
  });

  // Fetch user subscriptions
  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery({
    queryKey: ["/api/subscriptions/1"]
  });

  // Fetch user reorder history
  const { data: reorderHistory = [], isLoading: reorderLoading } = useQuery({
    queryKey: ["/api/reorder-history/1"]
  });

  // Fetch user addresses
  const { data: userAddresses = [], isLoading: addressesLoading } = useQuery({
    queryKey: ["/api/addresses/1"]
  });

  // Fetch user profile
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/profile/1"]
  });

  const categories = ["All", "Grocery", "Pharmacy", "Electronics", "Fashion", "Books", "Home & Garden"];

  // Check for subscription mode on component mount
  useEffect(() => {
    const subscriptionMode = sessionStorage.getItem('subscription-cart-mode');
    if (subscriptionMode === 'true') {
      setIsSubscriptionMode(true);
      console.log("🔔 Subscription cart mode activated");
    }
  }, []);

  // Clear subscription mode
  const exitSubscriptionMode = () => {
    setIsSubscriptionMode(false);
    sessionStorage.removeItem('subscription-cart-mode');
    sessionStorage.removeItem('subscription-mode');
    setCart([]);
  };

  const getFilteredStores = () => {
    return (stores as any[]).filter((store: any) => {
      const matchesSearch = store.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          store.address?.toLowerCase().includes(searchQuery.toLowerCase());
      const categoryMap: { [key: string]: string } = {
        "Grocery": "kirana",
        "Pharmacy": "pharmacy", 
        "Fashion": "fashion",
        "Electronics": "electronics",
        "Books": "books",
        "Home & Garden": "lifestyle"
      };
      const storeType = categoryMap[selectedCategory] || selectedCategory.toLowerCase();
      const matchesCategory = selectedCategory === "All" || store.type === storeType;
      
      return matchesSearch && matchesCategory;
    });
  };

  const addToCart = (item: { id: number; name: string; price: number; storeName: string }) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const getStoreProducts = (storeId: number) => {
    return (products as any[]).filter((product: any) => product.storeId === storeId).map((product: any) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.description || "1 unit",
      inStock: 25 // Default stock level
    }));
  };

  const updateCartQuantity = (itemId: number, change: number) => {
    const item = cart.find(item => item.id === itemId);
    if (item) {
      if (item.quantity + change <= 0) {
        setCart(cart.filter(item => item.id !== itemId));
      } else {
        setCart(cart.map(item => 
          item.id === itemId 
            ? { ...item, quantity: item.quantity + change }
            : item
        ));
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/">
              <Button variant="outline" className="rounded-xl border-orange-200 hover:bg-orange-50 text-orange-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Subscription Mode Banner */}
          {isSubscriptionMode && (
            <div className="mb-6 p-4 bg-gradient-to-r from-orange-100 to-pink-100 border border-orange-200 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-orange-800">Subscription Mode Active</h3>
                    <p className="text-sm text-orange-700">Select products for your recurring delivery subscription</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={exitSubscriptionMode}
                  className="border-orange-300 hover:bg-orange-50 text-orange-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Exit
                </Button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                  VyronaSpace
                </h1>
                <p className="text-lg text-gray-700">Ultra-Fast Hyperlocal Delivery</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-700">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-orange-600" />
                <span className="font-medium">5-15 Min Delivery</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-pink-600" />
                <span className="font-medium">Nearby Stores</span>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-2 text-purple-600" />
                <span className="font-medium">Verified Stores</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 bg-orange-50/80 backdrop-blur-sm rounded-2xl p-2 h-auto border border-orange-200/50">
              <TabsTrigger value="discover" className="rounded-xl py-3 data-[state=active]:bg-orange-100 data-[state=active]:shadow-md data-[state=active]:text-orange-800">
                <Sparkles className="h-4 w-4 mr-2" />
                Discover
              </TabsTrigger>
              <TabsTrigger value="orders" className="rounded-xl py-3 data-[state=active]:bg-orange-100 data-[state=active]:shadow-md data-[state=active]:text-orange-800">
                <Package className="h-4 w-4 mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="rewards" className="rounded-xl py-3 data-[state=active]:bg-pink-100 data-[state=active]:shadow-md data-[state=active]:text-pink-800">
                <Award className="h-4 w-4 mr-2" />
                Rewards
              </TabsTrigger>
              <TabsTrigger value="profile" className="rounded-xl py-3 data-[state=active]:bg-purple-100 data-[state=active]:shadow-md data-[state=active]:text-purple-800">
                <Users className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
            </TabsList>

            {/* Discover Tab - Store Discovery */}
            <TabsContent value="discover" className="space-y-8">
              <div className="container mx-auto px-4 py-8">
                {viewMode === "stores" ? (
                  <>
                    {/* Search and Filters */}
                    <div className="bg-orange-50/80 backdrop-blur-sm rounded-2xl p-6 space-y-4 border border-orange-200/50">
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search stores by name or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl border-0 bg-white/70"
                  />
                </div>
                <Button variant="outline" className="rounded-xl border-orange-200 hover:bg-orange-50">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>

              <div className="flex space-x-2 overflow-x-auto pb-2">
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={`whitespace-nowrap rounded-xl ${
                      selectedCategory === category 
                        ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-md' 
                        : 'border-orange-200 hover:bg-orange-50 text-orange-700'
                    }`}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Stores Grid */}
            {getFilteredStores().length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredStores().map(store => (
                  <Card key={store.id} className="rounded-2xl border-0 bg-white/90 backdrop-blur-sm shadow-md hover:shadow-xl transition-all hover:border-orange-200 hover:bg-orange-50/30 group">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-xl flex items-center justify-center group-hover:from-orange-200 group-hover:to-pink-200 transition-colors">
                          <ShoppingBag className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-gray-900">{store.name}</h4>
                          <p className="text-sm text-gray-600">{store.description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge className="bg-orange-100 text-orange-700 text-xs">
                              {store.category}
                            </Badge>
                            <Badge className={`${store.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} text-xs`}>
                              {store.isOpen ? 'Open' : 'Closed'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-emerald-600" />
                            <span className="text-xs text-emerald-600 font-medium">8 min</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1 text-teal-600" />
                            <span className="text-xs text-gray-600">0.5 km</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Star className="h-3 w-3 mr-1 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-600">{(store.rating / 100).toFixed(1)} ({store.reviewCount})</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Store Type:</p>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                            {store.type === 'kirana' ? 'Grocery Store' : 
                             store.type === 'pharmacy' ? 'Pharmacy' : 
                             store.type === 'fashion' ? 'Fashion Store' : store.type}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-600">
                          {getStoreProducts(store.id).length} products available
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button 
                          disabled={!store.isOpen}
                          onClick={() => {
                            setSelectedStore(store);
                            setViewMode("store-products");
                          }}
                          className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 rounded-xl disabled:opacity-50 shadow-md"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Browse Store
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-orange-200 hover:bg-orange-50"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-orange-50/80 backdrop-blur-sm rounded-2xl border border-orange-200/50">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No stores found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your category filter or search terms</p>
                <Button onClick={clearFilters} variant="outline" className="rounded-xl border-orange-200 hover:bg-orange-50">
                  Clear Filters
                </Button>
              </div>
            )}
              </>
            ) : viewMode === "store-products" && selectedStore ? (
              /* Store Products View - Full Page */
              <div className="space-y-6">
                {/* Store Header with Back Button */}
                <div className="bg-emerald-50/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200/50">
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setViewMode("stores");
                        setSelectedStore(null);
                      }}
                      className="rounded-xl border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Stores
                    </Button>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${selectedStore.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} text-sm`}>
                        {selectedStore.isOpen ? 'Open' : 'Closed'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                      <ShoppingBag className="h-10 w-10 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-gray-900">{selectedStore.name}</h2>
                      <p className="text-gray-600 text-lg">{selectedStore.description}</p>
                      <div className="flex items-center space-x-6 mt-2">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-emerald-600" />
                          <span className="text-sm text-emerald-600 font-medium">{selectedStore.deliveryTime}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-teal-600" />
                          <span className="text-sm text-gray-600">{selectedStore.distance}</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">{selectedStore.rating} ({selectedStore.reviewCount} reviews)</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="border-emerald-200 hover:bg-emerald-50 rounded-xl">
                      <Store className="h-4 w-4 mr-2" />
                      Store Profile
                    </Button>
                  </div>

                  {/* Store Owner & Hours Info */}
                  <div className="mt-4 p-4 bg-white/70 rounded-xl border border-emerald-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Managed by Rajesh Kumar</p>
                          <p className="text-sm text-gray-600">Open: 7:00 AM - 10:00 PM • Family-owned since 2015</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="border-blue-200 hover:bg-blue-50 rounded-lg">
                          <Camera className="h-4 w-4 mr-1" />
                          Photos
                        </Button>
                        <Button size="sm" variant="outline" className="border-orange-200 hover:bg-orange-50 rounded-lg">
                          <Bell className="h-4 w-4 mr-1" />
                          Events
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Local Events & Promotions */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-900 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                        Store Events & Offers
                      </h4>
                      <Badge className="bg-orange-100 text-orange-700">Live Now</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Weekend Fresh Fruit Tasting</p>
                          <p className="text-sm text-gray-600">Free samples of seasonal fruits • Today 2-6 PM</p>
                        </div>
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 rounded-lg text-white">
                          Join Event
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">25% Off Organic Vegetables</p>
                          <p className="text-sm text-gray-600">Valid till Dec 20 • Limited stock</p>
                        </div>
                        <Button size="sm" variant="outline" className="border-orange-200 hover:bg-orange-50 rounded-lg">
                          View Deals
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products Grid */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">Available Products ({getStoreProducts(selectedStore.id).length} items)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getStoreProducts(selectedStore.id).map(product => (
                      <Card key={product.id} className="rounded-2xl border-0 bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all hover:border-emerald-200 hover:bg-emerald-50/30">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4 mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                              <ShoppingBag className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-lg text-gray-900">{product.name}</h4>
                              <p className="text-sm text-gray-600">{product.unit}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className="font-bold text-xl text-gray-900">₹{product.price}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-gray-600">
                              {product.inStock > 0 ? `${product.inStock} in stock` : 'Out of stock'}
                            </span>
                            {product.inStock <= 5 && product.inStock > 0 && (
                              <Badge className="bg-orange-100 text-orange-700 text-xs">
                                Low Stock
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            {cart.find(item => item.id === product.id) ? (
                              <div className="flex items-center space-x-3 flex-1 bg-gray-50 rounded-xl p-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => updateCartQuantity(product.id, -1)}
                                  className="h-8 w-8 p-0 rounded-lg"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="font-semibold">
                                  {cart.find(item => item.id === product.id)?.quantity || 0}
                                </span>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => updateCartQuantity(product.id, 1)}
                                  className="h-8 w-8 p-0 rounded-lg"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button 
                                onClick={() => addToCart({...product, storeName: selectedStore.name})}
                                disabled={product.inStock === 0}
                                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl"
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Add to Cart
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
              </div>
            </TabsContent>

            {/* Orders Tab - Complete Functionality */}
            <TabsContent value="orders" className="space-y-6">
              <div className="container mx-auto px-4 py-8">
                <div className="bg-emerald-50/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Your Orders</h2>
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => setOrdersViewMode("orders")}
                    variant={ordersViewMode === "orders" ? "default" : "outline"}
                    className={`rounded-xl ${ordersViewMode === "orders" ? "bg-emerald-600 hover:bg-emerald-700" : "border-emerald-200 hover:bg-emerald-50"}`}
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    All Orders
                  </Button>
                  <Button 
                    onClick={() => setOrdersViewMode("reorder")}
                    variant={ordersViewMode === "reorder" ? "default" : "outline"}
                    className={`rounded-xl ${ordersViewMode === "reorder" ? "bg-emerald-600 hover:bg-emerald-700" : "border-emerald-200 hover:bg-emerald-50"}`}
                  >
                    <Repeat className="h-4 w-4 mr-2" />
                    Quick Reorder
                  </Button>
                  <Button 
                    onClick={() => setOrdersViewMode("subscriptions")}
                    variant={ordersViewMode === "subscriptions" ? "default" : "outline"}
                    className={`rounded-xl ${ordersViewMode === "subscriptions" ? "bg-emerald-600 hover:bg-emerald-700" : "border-emerald-200 hover:bg-emerald-50"}`}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Subscriptions
                  </Button>
                </div>
              </div>

              {/* Conditional Content Based on View Mode */}
              {ordersViewMode === "reorder" && (
                <div className="mb-6 p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-emerald-200/50">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Easy Reorder</h3>
                  {reorderLoading ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-16 bg-gray-200 rounded-xl"></div>
                      <div className="h-16 bg-gray-200 rounded-xl"></div>
                    </div>
                  ) : (reorderHistory as any[]).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(reorderHistory as any[]).slice(0, 4).map((order: any) => (
                        <Card key={order.id} className="rounded-xl border-0 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900">{order.orderName}</h4>
                                <p className="text-sm text-gray-600">
                                  {order.itemCount} items • ₹{Math.round(order.totalAmount)} • {order.storeName}
                                </p>
                              </div>
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 rounded-lg">
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Reorder
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-gray-50 rounded-xl">
                      <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No previous orders to reorder</p>
                    </div>
                  )}
                </div>
              )}

              {ordersViewMode === "subscriptions" && (
                <div className="mb-6 p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-emerald-200/50">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Active Subscriptions</h3>
                  {subscriptionsLoading ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-20 bg-gray-200 rounded-xl"></div>
                      <div className="h-20 bg-gray-200 rounded-xl"></div>
                    </div>
                  ) : (subscriptions as any[]).length > 0 ? (
                    <div className="space-y-3">
                      {(subscriptions as any[]).map((subscription: any) => (
                      <Card key={subscription.id} className="rounded-xl border-0 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Repeat className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{subscription.productName}</h4>
                                <p className="text-sm text-gray-600">
                                  Every {subscription.frequency} • Next: {new Date(subscription.nextDelivery).toLocaleDateString()} • ₹{Math.round(subscription.amount)}/{subscription.frequency.toLowerCase()}
                                </p>
                                <Badge className={`text-xs ${subscription.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" className="border-blue-200 hover:bg-blue-50 rounded-lg">
                                Edit
                              </Button>
                              <Button size="sm" variant="outline" className="border-gray-200 hover:bg-gray-50 rounded-lg">
                                {subscription.status === 'active' ? 'Pause' : 'Resume'}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 bg-gray-50 rounded-xl">
                    <Repeat className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No active subscriptions</p>
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    console.log("🔔 Create New Subscription clicked!");
                    // Set subscription mode and redirect to main page for product selection
                    sessionStorage.setItem('subscription-mode', 'true');
                    sessionStorage.setItem('subscription-cart-mode', 'true');
                    // Switch to the main store browsing tab
                    setActiveTab('space');
                  }}
                  className="w-full mt-4 border-orange-200 hover:bg-orange-50 rounded-xl bg-gradient-to-r from-orange-50 to-pink-50 hover:from-orange-100 hover:to-pink-100 transition-all shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-2 text-orange-600" />
                  <span className="text-orange-700 font-medium">Create New Subscription</span>
                </Button>
              </div>
            )}

              {/* Default Orders View */}
              {ordersViewMode === "orders" && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Order History</h3>
              {ordersLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full"></div>
                </div>
              ) : (userOrders as any[]).length === 0 ? (
                <div className="text-center p-8 bg-white/90 rounded-xl">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Orders Yet</h4>
                  <p className="text-gray-600">Start shopping to see your orders here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(userOrders as any[]).map((order: any) => (
                  <Card key={order.id} className="rounded-2xl border-0 bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Order #{order.id}</h3>
                        <Badge className={`${
                          order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                          order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {order.status || 'pending'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Order from {order.module || 'VyronaSpace'}</span>
                          <span className="font-semibold">₹{order.totalAmount || order.total || 0}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.createdAt || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-3 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg">Total</span>
                          <span className="font-bold text-lg text-emerald-600">₹{order.totalAmount || order.total || 0}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Truck className="h-4 w-4 mr-2 text-emerald-600" />
                          <span>Status: {order.status || 'Processing'}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-teal-600" />
                          <span>Delivery Address</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mt-4">
                        <Button 
                          onClick={() => setSelectedOrder(order)} 
                          variant="outline" 
                          className="flex-1 rounded-xl border-emerald-200 hover:bg-emerald-50"
                        >
                          View Details
                        </Button>
                        {(order.status === 'processing' || order.status === 'shipped' || order.status === 'out for delivery' || order.status === 'delivered') && (
                          <Link to={`/track-order/${order.id}`}>
                            <Button 
                              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl"
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Track Order
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                </div>
              )}
                </div>
              )}
            </div>
              </div>
            </TabsContent>

            {/* Rewards Tab - VyronaCoins System */}
            <TabsContent value="rewards" className="space-y-6">
              <div className="container mx-auto px-4 py-8">
                <div className="bg-emerald-50/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200/50">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">VyronaCoins & Rewards</h2>
                  
                  {/* Current Points */}
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold">Your VyronaCoins</h3>
                        <p className="text-emerald-100">Available balance</p>
                      </div>
                      <div className="text-right">
                        {balanceLoading ? (
                          <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          <>
                            <div className="text-3xl font-bold">{Math.round((walletBalance as any)?.balance * 10 || 0)}</div>
                            <div className="text-emerald-100">≈ ₹{Math.round((walletBalance as any)?.balance || 0)}</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Achievements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <Card className="rounded-2xl border-0 bg-white/90 backdrop-blur-sm shadow-md">
                      <CardContent className="p-4 text-center">
                        <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                        <h4 className="font-bold text-gray-900">First Purchase</h4>
                        <p className="text-sm text-gray-600">+100 VyronaCoins</p>
                        <Badge className="bg-green-100 text-green-700 mt-2">Completed</Badge>
                      </CardContent>
                    </Card>
                    
                    <Card className="rounded-2xl border-0 bg-white/90 backdrop-blur-sm shadow-md">
                      <CardContent className="p-4 text-center">
                        <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <h4 className="font-bold text-gray-900">Local Explorer</h4>
                        <p className="text-sm text-gray-600">Shop from 5 different stores</p>
                        <Badge className="bg-yellow-100 text-yellow-700 mt-2">3/5 Progress</Badge>
                      </CardContent>
                    </Card>
                    
                    <Card className="rounded-2xl border-0 bg-white/90 backdrop-blur-sm shadow-md">
                      <CardContent className="p-4 text-center">
                        <Zap className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                        <h4 className="font-bold text-gray-900">Speed Shopper</h4>
                        <p className="text-sm text-gray-600">Order within 15 minutes</p>
                        <Badge className="bg-gray-100 text-gray-700 mt-2">Locked</Badge>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Rewards Store */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Redeem Rewards</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="rounded-2xl border-0 bg-white/90 backdrop-blur-sm shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-gray-900">₹50 Off Coupon</h4>
                              <p className="text-sm text-gray-600">Valid on orders above ₹500</p>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-emerald-600">500 Coins</div>
                              <Button size="sm" className="mt-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg">
                                Redeem
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="rounded-2xl border-0 bg-white/90 backdrop-blur-sm shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-gray-900">Free Delivery</h4>
                              <p className="text-sm text-gray-600">Next 3 orders</p>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-emerald-600">300 Coins</div>
                              <Button size="sm" className="mt-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg">
                                Redeem
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Profile Tab - Customer Management */}
            <TabsContent value="profile" className="space-y-6">
              <div className="container mx-auto px-4 py-8">
                <div className="bg-emerald-50/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200/50">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Customer Profile</h2>
                  
                  {/* Profile Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card className="rounded-2xl border-0 bg-white/90 backdrop-blur-sm shadow-md">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h3>
                    <div className="space-y-3">
                      {profileLoading ? (
                        <div className="animate-pulse space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Full Name</label>
                            <p className="text-gray-900">{(userProfile as any)?.username || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <p className="text-gray-900">{(userProfile as any)?.email || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Phone</label>
                            <p className="text-gray-900">{(userProfile as any)?.mobile || 'Not provided'}</p>
                          </div>
                        </>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-4 rounded-xl border-emerald-200 hover:bg-emerald-50"
                      onClick={() => {
                        setProfileForm({
                          username: (userProfile as any)?.username || "",
                          email: (userProfile as any)?.email || "",
                          mobile: (userProfile as any)?.mobile || ""
                        });
                        setShowEditProfile(true);
                      }}
                    >
                      Edit Profile
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="rounded-2xl border-0 bg-white/90 backdrop-blur-sm shadow-md">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Delivery Address</h3>
                    <div className="space-y-3">
                      {addressesLoading ? (
                        <div className="animate-pulse space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      ) : (userAddresses as any[]).length > 0 ? (
                        <>
                          {(userAddresses as any[]).filter((addr: any) => addr.isPrimary).map((address: any) => (
                            <div key={address.id}>
                              <label className="text-sm font-medium text-gray-700">{address.type}</label>
                              <p className="text-gray-900">
                                {address.addressLine1}, {address.city}, {address.state} - {address.pincode}
                              </p>
                            </div>
                          ))}
                          {(userAddresses as any[]).filter((addr: any) => addr.isPrimary).length === 0 && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">{(userAddresses as any[])[0]?.type || 'Primary'}</label>
                              <p className="text-gray-900">
                                {(userAddresses as any[])[0]?.addressLine1 || 'No address'}, {(userAddresses as any[])[0]?.city || ''}, {(userAddresses as any[])[0]?.state || ''} - {(userAddresses as any[])[0]?.pincode || ''}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div>
                          <label className="text-sm font-medium text-gray-700">No addresses found</label>
                          <p className="text-gray-900">Please add a delivery address</p>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-emerald-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>Primary address</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-4 rounded-xl border-emerald-200 hover:bg-emerald-50"
                      onClick={() => setShowManageAddresses(true)}
                    >
                      Manage Addresses
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              {/* Quick Actions */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="p-4 h-auto flex-col rounded-xl border-emerald-200 hover:bg-emerald-50">
                    <RefreshCw className="h-6 w-6 mb-2 text-emerald-600" />
                    <span className="text-sm">Reorder</span>
                  </Button>
                  
                  <Button variant="outline" className="p-4 h-auto flex-col rounded-xl border-emerald-200 hover:bg-emerald-50">
                    <Phone className="h-6 w-6 mb-2 text-emerald-600" />
                    <span className="text-sm">Support</span>
                  </Button>
                  
                  <Button variant="outline" className="p-4 h-auto flex-col rounded-xl border-emerald-200 hover:bg-emerald-50">
                    <MessageCircle className="h-6 w-6 mb-2 text-emerald-600" />
                    <span className="text-sm">Feedback</span>
                  </Button>
                  
                  <Button variant="outline" className="p-4 h-auto flex-col rounded-xl border-emerald-200 hover:bg-emerald-50">
                    <Gift className="h-6 w-6 mb-2 text-emerald-600" />
                    <span className="text-sm">Refer & Earn</span>
                  </Button>
                </div>
              </div>
              </div>
              </div>
            </TabsContent>
            
            {/* Profile Tab - Customer Profile */}
            <TabsContent value="profile" className="space-y-6">
              <div className="container mx-auto px-4 py-8">
                <div className="bg-orange-50/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">Customer Profile</h2>
                    <div className="flex space-x-3">
                      <Button 
                        onClick={() => setShowEditProfile(true)}
                        className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 rounded-xl"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button 
                        onClick={() => setShowManageAddresses(true)}
                        variant="outline" 
                        className="rounded-xl border-orange-200 hover:bg-orange-50"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Manage Addresses
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="bg-white/70 backdrop-blur-sm border-orange-200/50">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <User className="h-10 w-10 text-orange-600" />
                          <div>
                            <h3 className="font-semibold text-gray-900">Personal Information</h3>
                            <p className="text-sm text-gray-600">Manage your account details</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-white/70 backdrop-blur-sm border-orange-200/50">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <Wallet className="h-10 w-10 text-pink-600" />
                          <div>
                            <h3 className="font-semibold text-gray-900">VyronaWallet</h3>
                            <p className="text-sm text-gray-600">Balance: ₹500</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-white/70 backdrop-blur-sm border-orange-200/50">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <Settings className="h-10 w-10 text-purple-600" />
                          <div>
                            <h3 className="font-semibold text-gray-900">Preferences</h3>
                            <p className="text-sm text-gray-600">App settings & notifications</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

      {/* Fixed Position Quick Cart Button */}
      <div className="fixed bottom-6 right-6 z-50">
          <Button 
            onClick={() => {
              if (cart.length > 0) {
                // Save cart to sessionStorage for checkout page
                sessionStorage.setItem('vyronaspace-cart', JSON.stringify(cart));
                
                // Set subscription mode flag if in subscription mode
                if (isSubscriptionMode) {
                  sessionStorage.setItem('subscription-mode', 'true');
                }
                
                setLocation('/vyronaspace-checkout');
              }
            }}
            disabled={cart.length === 0}
            className={`relative h-14 w-14 rounded-full shadow-2xl border-2 border-white transition-all duration-300 hover:scale-105 ${
              cart.length > 0 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed hover:scale-100'
            }`}
            title={cart.length > 0 ? `${getCartItemCount()} items in cart - ₹${getCartTotal()}` : 'Cart is empty'}
          >
            <ShoppingCart className="h-6 w-6" />
            {cart.length > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full min-w-[1.5rem] h-6 flex items-center justify-center font-bold shadow-lg">
                {getCartItemCount()}
              </Badge>
            )}
          </Button>
      </div>

      {/* Cart Summary (appears when items are added) */}
      {cart.length > 0 && (
          <div className="fixed bottom-4 left-4 right-20 bg-emerald-50 rounded-2xl shadow-xl border border-emerald-200 p-4 z-40">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-lg text-emerald-900">₹{getCartTotal()}</div>
                <div className="text-sm text-emerald-700">{getCartItemCount()} items in cart</div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setCart([])} className="rounded-xl border-emerald-200 hover:bg-emerald-100">
                  Clear
                </Button>
                <Button 
                  onClick={() => {
                    // Save cart to sessionStorage for checkout page
                    sessionStorage.setItem('vyronaspace-cart', JSON.stringify(cart));
                    
                    // Set subscription mode flag if in subscription mode
                    if (isSubscriptionMode) {
                      sessionStorage.setItem('subscription-mode', 'true');
                    }
                    
                    setLocation('/vyronaspace-checkout');
                  }}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl"
                >
                  Checkout
                </Button>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Edit Profile Modal */}
          <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Full Name</Label>
                  <Input
                    id="username"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <Label htmlFor="mobile">Phone Number</Label>
                  <Input
                    id="mobile"
                    value={profileForm.mobile}
                    onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEditProfile(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => updateProfileMutation.mutate(profileForm)}
              disabled={updateProfileMutation.isPending}
              className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
            >
              {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Addresses Modal */}
      <Dialog open={showManageAddresses} onOpenChange={setShowManageAddresses}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Addresses</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newAddress.name}
                  onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newAddress.address}
                onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                placeholder="House/Flat No, Building, Street"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={newAddress.state}
                  onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                  placeholder="State"
                />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={newAddress.pincode}
                  onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                  placeholder="Pincode"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={newAddress.isDefault}
                onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isDefault">Set as default address</Label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowManageAddresses(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => addAddressMutation.mutate(newAddress)}
              disabled={addAddressMutation.isPending}
              className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
            >
              {addAddressMutation.isPending ? "Adding..." : "Add Address"}
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
      </div>
    </div>
    </>
  );
}