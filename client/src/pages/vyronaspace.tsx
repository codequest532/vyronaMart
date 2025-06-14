import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MapPin, 
  ShoppingBag, 
  Shirt, 
  Laptop, 
  Heart, 
  Store, 
  Star,
  ArrowLeft,
  Search,
  Filter,
  Clock,
  Phone,
  MessageCircle,
  Truck,
  Package,
  ShoppingCart,
  Plus,
  Minus,
  Timer,
  MapIcon,
  Calendar,
  RefreshCw,
  Eye,
  ThumbsUp,
  Camera,
  Navigation,
  Zap,
  Award,
  Shield,
  CreditCard,
  RotateCcw
} from "lucide-react";
import { Link } from "wouter";

export default function VyronaSpace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentLocation, setCurrentLocation] = useState("T. Nagar, Chennai");
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("stores");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data for comprehensive demo - would come from APIs in production
  const localStores = [
    {
      id: 1,
      name: "Fresh Market",
      category: "grocery",
      rating: 4.8,
      reviewCount: 324,
      distance: "0.3 km",
      estimatedDelivery: "15-20 min",
      isOpen: true,
      badges: ["verified", "top_rated", "fast_delivery"],
      minimumOrder: 100,
      deliveryFee: 25,
      address: "No. 23, Habibullah Road, T. Nagar",
      phone: "+91 98765 43210",
      image: "/api/placeholder/80/80",
      offers: ["20% off on fruits", "Free delivery above ₹200"]
    },
    {
      id: 2,
      name: "MedPlus Pharmacy",
      category: "pharmacy",
      rating: 4.9,
      reviewCount: 156,
      distance: "0.5 km",
      estimatedDelivery: "10-15 min",
      isOpen: true,
      badges: ["verified", "24x7"],
      minimumOrder: 50,
      deliveryFee: 20,
      address: "Pondy Bazaar, T. Nagar",
      phone: "+91 98765 43211",
      image: "/api/placeholder/80/80",
      offers: ["10% off on prescription medicines"]
    },
    {
      id: 3,
      name: "Fashion Hub",
      category: "clothing",
      rating: 4.6,
      reviewCount: 89,
      distance: "0.8 km",
      estimatedDelivery: "25-30 min",
      isOpen: true,
      badges: ["verified", "new"],
      minimumOrder: 500,
      deliveryFee: 50,
      address: "Ranganathan Street, T. Nagar",
      phone: "+91 98765 43212",
      image: "/api/placeholder/80/80",
      offers: ["Buy 2 Get 1 Free", "Flat 30% off on summer collection"]
    }
  ];

  const recentOrders = [
    {
      id: 1,
      orderNumber: "VS2025001",
      storeName: "Fresh Market",
      items: ["Organic Apples (1kg)", "Fresh Milk (1L)", "Bread"],
      total: 245,
      status: "out_for_delivery",
      estimatedDelivery: "2:30 PM",
      deliveryPartner: { name: "Ravi Kumar", phone: "+91 98765 11111", rating: 4.7 }
    },
    {
      id: 2,
      orderNumber: "VS2025002",
      storeName: "MedPlus Pharmacy",
      items: ["Paracetamol", "Vitamin D3", "Hand Sanitizer"],
      total: 180,
      status: "delivered",
      deliveredAt: "Yesterday, 4:15 PM"
    }
  ];

  const storeProducts = selectedStore ? [
    {
      id: 1,
      name: "Organic Apples",
      price: 120,
      originalPrice: 150,
      unit: "1 kg",
      image: "/api/placeholder/60/60",
      inStock: 25,
      category: "fruits",
      brand: "FreshCo"
    },
    {
      id: 2,
      name: "Fresh Milk",
      price: 65,
      unit: "1 L",
      image: "/api/placeholder/60/60",
      inStock: 12,
      category: "dairy",
      brand: "Nandini"
    },
    {
      id: 3,
      name: "Whole Wheat Bread",
      price: 45,
      unit: "500g",
      image: "/api/placeholder/60/60",
      inStock: 8,
      category: "bakery",
      brand: "Britannia"
    }
  ] : [];

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast({
      title: "Added to cart",
      description: `${product.name} added to your cart`,
    });
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message = {
      id: Date.now(),
      content: newMessage,
      sender: "customer",
      timestamp: new Date(),
    };
    
    setChatMessages([...chatMessages, message]);
    setNewMessage("");
    
    // Simulate store response
    setTimeout(() => {
      const storeResponse = {
        id: Date.now() + 1,
        content: "Thank you for your message! How can I help you today?",
        sender: "store",
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, storeResponse]);
    }, 1000);
  };

  const categories = [
    { id: "all", name: "All Stores", icon: Store, count: localStores.length },
    { id: "grocery", name: "Grocery", icon: ShoppingBag, count: 1 },
    { id: "pharmacy", name: "Pharmacy", icon: Heart, count: 1 },
    { id: "clothing", name: "Fashion", icon: Shirt, count: 1 },
    { id: "electronics", name: "Electronics", icon: Laptop, count: 0 }
  ];

  const filteredStores = selectedCategory === "all" 
    ? localStores 
    : localStores.filter(store => store.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">VyronaSpace</h1>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <MapPin className="h-4 w-4 mr-1" />
                  {currentLocation}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Navigation className="h-4 w-4 mr-2" />
                Update Location
              </Button>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <Zap className="h-3 w-3 mr-1" />
                15-30 min delivery
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search for stores, products, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center space-x-2">
                      <category.icon className="h-4 w-4" />
                      <span>{category.name} ({category.count})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stores">
              <Store className="h-4 w-4 mr-2" />
              Local Stores
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Package className="h-4 w-4 mr-2" />
              My Orders
            </TabsTrigger>
            <TabsTrigger value="subscriptions">
              <Calendar className="h-4 w-4 mr-2" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="rewards">
              <Award className="h-4 w-4 mr-2" />
              Geo-Rewards
            </TabsTrigger>
          </TabsList>

          {/* Stores Tab */}
          <TabsContent value="stores" className="space-y-6">
            {/* Store Categories */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {categories.map(category => (
                <Card 
                  key={category.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedCategory === category.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <CardContent className="p-4 text-center">
                    <category.icon className={`h-8 w-8 mx-auto mb-2 ${
                      selectedCategory === category.id ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                    <h4 className="font-medium text-sm">{category.name}</h4>
                    <p className="text-xs text-gray-500">{category.count} stores</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Store List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStores.map(store => (
                <Card key={store.id} className="hover:shadow-lg transition-all cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Store className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-lg">{store.name}</h3>
                          {store.badges.includes("verified") && (
                            <Shield className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{store.address}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="font-medium">{store.rating}</span>
                            <span className="text-gray-500 ml-1">({store.reviewCount})</span>
                          </div>
                          <div className="flex items-center text-green-600">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{store.estimatedDelivery}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Store Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {store.badges.map(badge => (
                        <Badge key={badge} variant="secondary" className="text-xs">
                          {badge === "verified" && <Shield className="h-3 w-3 mr-1" />}
                          {badge === "top_rated" && <Star className="h-3 w-3 mr-1" />}
                          {badge === "fast_delivery" && <Zap className="h-3 w-3 mr-1" />}
                          {badge === "24x7" && <Clock className="h-3 w-3 mr-1" />}
                          {badge === "new" && <Award className="h-3 w-3 mr-1" />}
                          {badge.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>

                    {/* Store Info */}
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Distance:</span>
                        <span className="font-medium">{store.distance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Min Order:</span>
                        <span className="font-medium">₹{store.minimumOrder}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Fee:</span>
                        <span className="font-medium">₹{store.deliveryFee}</span>
                      </div>
                    </div>

                    {/* Offers */}
                    {store.offers && store.offers.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-green-600 mb-2">Special Offers</h4>
                        {store.offers.map((offer, index) => (
                          <div key={index} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded mb-1">
                            {offer}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => setSelectedStore(store)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Browse Products
                      </Button>
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Chat with {store.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="h-64 border rounded-lg p-4 overflow-y-auto space-y-3">
                              {chatMessages.length === 0 ? (
                                <div className="text-center text-gray-500 mt-8">
                                  <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                                  <p>Start a conversation with the store</p>
                                </div>
                              ) : (
                                chatMessages.map(message => (
                                  <div key={message.id} className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs p-3 rounded-lg ${
                                      message.sender === 'customer' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-100 text-gray-900'
                                    }`}>
                                      <p className="text-sm">{message.content}</p>
                                      <p className="text-xs opacity-70 mt-1">
                                        {message.timestamp.toLocaleTimeString()}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <Input
                                placeholder="Type your message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                className="flex-1"
                              />
                              <Button onClick={sendMessage}>Send</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">My Orders</h2>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="space-y-4">
              {recentOrders.map(order => (
                <Card key={order.id} className="hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{order.storeName}</h3>
                        <p className="text-sm text-gray-600">Order #{order.orderNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">₹{order.total}</p>
                        <Badge className={`${
                          order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Items:</p>
                      <p className="text-sm">{order.items.join(", ")}</p>
                    </div>

                    {order.status === 'out_for_delivery' && order.deliveryPartner && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                          <Truck className="h-4 w-4 inline mr-2" />
                          Out for Delivery
                        </h4>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              Delivery Partner: {order.deliveryPartner.name}
                            </p>
                            <p className="text-sm text-blue-600 dark:text-blue-300">
                              Expected by: {order.estimatedDelivery}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <MapIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {order.status === 'delivered' && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-4">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          Delivered on {order.deliveredAt}
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reorder
                      </Button>
                      {order.status === 'delivered' && (
                        <Button variant="outline" size="sm">
                          <Star className="h-4 w-4 mr-2" />
                          Rate Order
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Active Subscriptions
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Set up regular deliveries for your daily essentials and never run out again.
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Subscription
              </Button>
            </div>
          </TabsContent>

          {/* Geo-Rewards Tab */}
          <TabsContent value="rewards" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                <CardContent className="p-6 text-center">
                  <Award className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                  <h3 className="font-bold text-xl mb-2">Local Explorer</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Shop from 3 different local stores in your area
                  </p>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Progress: 2/3 stores</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{width: '66%'}}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <CardContent className="p-6 text-center">
                  <Zap className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-bold text-xl mb-2">Speed Shopper</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Complete 5 orders within 2km radius
                  </p>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Progress: 3/5 orders</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{width: '60%'}}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <CardContent className="p-6 text-center">
                  <Heart className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-bold text-xl mb-2">Community Helper</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Rate and review 10 local stores
                  </p>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Progress: 7/10 reviews</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{width: '70%'}}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Your VyronaCoins Balance</h3>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">VC</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">1,250 Coins</p>
                      <p className="text-sm text-gray-600">≈ ₹125 value</p>
                    </div>
                  </div>
                  <Button>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Redeem
                  </Button>
                </div>
                <div className="text-sm text-gray-600">
                  <p>• Earn 10 coins for every local order</p>
                  <p>• Get bonus coins for trying new stores</p>
                  <p>• Double coins on weekend orders</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Store Product Browser Modal */}
        {selectedStore && (
          <Dialog open={!!selectedStore} onOpenChange={() => setSelectedStore(null)}>
            <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                    <Store className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedStore.name}</h2>
                    <p className="text-sm text-gray-600">{selectedStore.address}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Store Info Bar */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span className="font-medium">{selectedStore.rating}</span>
                        <span className="text-gray-500 ml-1">({selectedStore.reviewCount})</span>
                      </div>
                      <div className="flex items-center text-green-600">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{selectedStore.estimatedDelivery}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Min Order: </span>
                        <span className="font-medium">₹{selectedStore.minimumOrder}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4 mr-2" />
                        Call Store
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Product Categories */}
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {["All", "Fruits", "Vegetables", "Dairy", "Bakery", "Snacks"].map(cat => (
                    <Button 
                      key={cat}
                      variant="outline" 
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      {cat}
                    </Button>
                  ))}
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {storeProducts.map(product => (
                    <Card key={product.id} className="hover:shadow-lg transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3 mb-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{product.name}</h4>
                            <p className="text-sm text-gray-600">{product.brand} • {product.unit}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="font-bold text-lg">₹{product.price}</span>
                              {product.originalPrice && (
                                <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-600">
                            {product.inStock > 0 ? `${product.inStock} in stock` : 'Out of stock'}
                          </span>
                          {product.inStock <= 5 && product.inStock > 0 && (
                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                              Low Stock
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {cart.find(item => item.id === product.id) ? (
                            <div className="flex items-center space-x-2 flex-1">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  const item = cart.find(item => item.id === product.id);
                                  if (item && item.quantity > 1) {
                                    setCart(cart.map(cartItem => 
                                      cartItem.id === product.id 
                                        ? { ...cartItem, quantity: cartItem.quantity - 1 }
                                        : cartItem
                                    ));
                                  } else {
                                    setCart(cart.filter(cartItem => cartItem.id !== product.id));
                                  }
                                }}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="font-medium px-3">
                                {cart.find(item => item.id === product.id)?.quantity || 0}
                              </span>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => addToCart(product)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              onClick={() => addToCart(product)}
                              disabled={product.inStock === 0}
                              className="flex-1"
                              size="sm"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add to Cart
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Shopping Cart Summary */}
                {cart.length > 0 && (
                  <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t p-4 -mx-6 -mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">
                          {cart.reduce((sum, item) => sum + item.quantity, 0)} items in cart
                        </p>
                        <p className="text-sm text-gray-600">
                          Total: ₹{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" onClick={() => setCart([])}>
                          Clear Cart
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-700">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Proceed to Checkout
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedOrder.storeName}</h3>
                    <p className="text-sm text-gray-600">Order #{selectedOrder.orderNumber}</p>
                  </div>
                  <Badge className={`${
                    selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    selectedOrder.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedOrder.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Order Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item: string, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span>{item}</span>
                        <span className="text-gray-600">₹{Math.floor(selectedOrder.total / selectedOrder.items.length)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t mt-3 pt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>₹{selectedOrder.total}</span>
                    </div>
                  </div>
                </div>

                {selectedOrder.status === 'out_for_delivery' && selectedOrder.deliveryPartner && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      <Truck className="h-4 w-4 inline mr-2" />
                      Delivery Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Delivery Partner:</span>
                        <span className="font-medium">{selectedOrder.deliveryPartner.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phone:</span>
                        <span className="font-medium">{selectedOrder.deliveryPartner.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expected Delivery:</span>
                        <span className="font-medium">{selectedOrder.estimatedDelivery}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rating:</span>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                          <span className="font-medium">{selectedOrder.deliveryPartner.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Store
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Get Support
                  </Button>
                  {selectedOrder.status === 'delivered' && (
                    <Button variant="outline" className="flex-1">
                      <Star className="h-4 w-4 mr-2" />
                      Rate Order
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}