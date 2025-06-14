import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, Package, Award, Users, Search, Filter, MapPin, Clock, 
  Star, ShoppingCart, ShoppingBag, Plus, Minus, Truck, Phone,
  MessageCircle, RefreshCw, Trophy, Target, Zap, Gift
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
    status: "Out for Delivery",
    estimatedDelivery: "5 min",
    trackingNumber: "VYR1001",
    items: [
      { name: "Fresh Bananas", quantity: 2, price: 45 },
      { name: "Organic Milk", quantity: 1, price: 85 }
    ],
    total: 175,
    deliveryPartner: "Raj Kumar",
    currentLocation: "Near City Mall"
  },
  {
    id: 1002,
    status: "Delivered",
    estimatedDelivery: "Completed",
    trackingNumber: "VYR1002",
    items: [
      { name: "Whole Wheat Bread", quantity: 1, price: 35 }
    ],
    total: 35,
    deliveryPartner: "Priya Singh",
    currentLocation: "Delivered"
  }
];

export default function VyronaSpace() {
  const [activeTab, setActiveTab] = useState("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const categories = ["All", "Grocery", "Pharmacy", "Electronics", "Fashion", "Books", "Home & Garden"];

  const getFilteredStores = () => {
    return mockStores.filter(store => {
      const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          store.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          store.featuredProducts.some(product => 
                            product.toLowerCase().includes(searchQuery.toLowerCase())
                          );
      const matchesCategory = selectedCategory === "All" || store.category === selectedCategory;
      
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                VyronaSpace
              </h1>
              <p className="text-lg text-gray-600">Ultra-Fast Hyperlocal Delivery</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-emerald-600" />
              <span className="font-medium">5-15 Min Delivery</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-teal-600" />
              <span className="font-medium">Nearby Stores</span>
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 mr-2 text-emerald-600" />
              <span className="font-medium">Top Rated Products</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-emerald-50/80 backdrop-blur-sm rounded-2xl p-2 h-auto border border-emerald-200/50">
            <TabsTrigger value="discover" className="rounded-xl py-3 data-[state=active]:bg-emerald-100 data-[state=active]:shadow-md data-[state=active]:text-emerald-800">
              <Sparkles className="h-4 w-4 mr-2" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-xl py-3 data-[state=active]:bg-emerald-100 data-[state=active]:shadow-md data-[state=active]:text-emerald-800">
              <Package className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="rewards" className="rounded-xl py-3 data-[state=active]:bg-emerald-100 data-[state=active]:shadow-md data-[state=active]:text-emerald-800">
              <Award className="h-4 w-4 mr-2" />
              Rewards
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-xl py-3 data-[state=active]:bg-emerald-100 data-[state=active]:shadow-md data-[state=active]:text-emerald-800">
              <Users className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Discover Tab - Product Discovery */}
          <TabsContent value="discover" className="space-y-8">
            {/* Search and Filters */}
            <div className="bg-emerald-50/80 backdrop-blur-sm rounded-2xl p-6 space-y-4 border border-emerald-200/50">
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search products, brands, or stores..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl border-0 bg-white/70"
                  />
                </div>
                <Button variant="outline" className="rounded-xl border-emerald-200 hover:bg-emerald-50">
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
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                        : 'border-emerald-200 hover:bg-emerald-50 text-emerald-700'
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
                  <Card key={store.id} className="rounded-2xl border-0 bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all hover:border-emerald-200 hover:bg-emerald-50/30">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-gray-900">{store.name}</h4>
                          <p className="text-sm text-gray-600">{store.description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">
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
                            <span className="text-xs text-emerald-600 font-medium">{store.deliveryTime}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1 text-teal-600" />
                            <span className="text-xs text-gray-600">{store.distance}</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Star className="h-3 w-3 mr-1 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-600">{store.rating}</span>
                          <span className="text-xs text-gray-500 ml-1">({store.reviewCount})</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Featured Products:</p>
                        <div className="flex flex-wrap gap-1">
                          {store.featuredProducts.slice(0, 3).map((product, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                              {product}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-600">
                          {store.totalProducts} products
                        </span>
                        <span className="text-sm text-gray-600">
                          ₹{store.deliveryFee} delivery
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button 
                          disabled={!store.isOpen}
                          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl disabled:opacity-50"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Browse Store
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-emerald-200 hover:bg-emerald-50"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-emerald-50/80 backdrop-blur-sm rounded-2xl border border-emerald-200/50">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No stores found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your category filter or search terms</p>
                <Button onClick={clearFilters} variant="outline" className="rounded-xl border-emerald-200 hover:bg-emerald-50">
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Cart Summary */}
            {cart.length > 0 && (
              <div className="fixed bottom-4 left-4 right-4 bg-emerald-50 rounded-2xl shadow-xl border border-emerald-200 p-4 z-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-lg text-emerald-900">₹{getCartTotal()}</div>
                    <div className="text-sm text-emerald-700">{getCartItemCount()} items in cart</div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setCart([])} className="rounded-xl border-emerald-200 hover:bg-emerald-100">
                      Clear
                    </Button>
                    <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl">
                      Checkout
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-gray-900">Your Orders</h2>
              <Button variant="outline" className="rounded-xl border-emerald-200 hover:bg-emerald-50">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="space-y-6">
              {mockOrders.map(order => (
                <Card key={order.id} className="rounded-2xl border-0 bg-emerald-50/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all border border-emerald-200/50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="font-bold text-lg">Order #{order.trackingNumber}</h3>
                        <p className="text-sm text-gray-600">
                          {order.items.length} items • ₹{order.total}
                        </p>
                      </div>
                      <Badge className={order.status === "Delivered" ? "bg-emerald-500 text-white" : "bg-teal-500 text-white"}>
                        {order.status}
                      </Badge>
                    </div>

                    <div className="space-y-3 mb-6">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.name} x{item.quantity}</span>
                          <span className="font-medium">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Truck className="h-4 w-4 mr-2 text-teal-600" />
                          <span className="text-sm text-gray-600">{order.deliveryPartner}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-emerald-600" />
                          <span className="text-sm text-gray-600">{order.currentLocation}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-xl border-emerald-200 hover:bg-emerald-50">
                        Track Order
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">VyronaCoins & Rewards</h2>
              <p className="text-gray-600">Earn coins with every order and unlock amazing rewards</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="rounded-2xl border-0 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg border border-emerald-200/50">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-2 text-emerald-800">1,250</h3>
                  <p className="text-emerald-600">VyronaCoins</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg border border-emerald-200/50">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-2 text-emerald-800">Gold</h3>
                  <p className="text-emerald-600">Member Status</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 bg-gradient-to-br from-teal-50 to-emerald-50 shadow-lg border border-emerald-200/50">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Gift className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-2 text-emerald-800">5</h3>
                  <p className="text-emerald-600">Available Rewards</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Profile</h2>
              <p className="text-gray-600">Manage your account and preferences</p>
            </div>

            <Card className="rounded-2xl border-0 bg-emerald-50/80 backdrop-blur-sm shadow-lg border border-emerald-200/50">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-xl mb-2 text-emerald-900">Welcome to VyronaSpace</h3>
                  <p className="text-emerald-700 mb-6">Quick commerce at your fingertips</p>
                  
                  <div className="space-y-4">
                    <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl">
                      <Phone className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                    <Button variant="outline" className="w-full rounded-xl border-emerald-200 hover:bg-emerald-100">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Give Feedback
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}