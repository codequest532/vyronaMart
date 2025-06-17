import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Building, Shirt, Laptop, Utensils, Home as HomeIcon, Star, Coins, 
  MapPin, Clock, ShoppingCart, Users, Heart, Gift, Truck, MessageCircle,
  Search, Filter, Phone, Mail, Calendar, CheckCircle, Timer, Package,
  Crown, Zap, Target, Camera, Share2, Bell, Award, Store, CreditCard
} from "lucide-react";
import { useLocation } from "wouter";

export default function VyronaMallConnect() {
  const [, setLocation] = useLocation();
  const [selectedMall, setSelectedMall] = useState<any>(null);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [deliveryOption, setDeliveryOption] = useState("express");
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showConciergeChat, setShowConciergeChat] = useState(false);
  const [mallCart, setMallCart] = useState<any[]>([]);
  const [nearbyLocation, setNearbyLocation] = useState("Chennai");
  const [userLocation, setUserLocation] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stores = [] } = useQuery({
    queryKey: ["/api/stores"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: user } = useQuery({
    queryKey: ["/api/current-user"],
  });

  // Get user location for nearby malls
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log("Location access denied");
        }
      );
    }
  }, []);

  const handleProductClick = (productName: string) => {
    console.log(`Clicked on ${productName}`);
  };

  const mallStores = Array.isArray(stores) ? stores.filter((s: any) => s.type === "mall") : [];
  const mallProducts = Array.isArray(products) ? products.filter((p: any) => p.module === "mall") : [];

  // Mock data for comprehensive mall experience
  const mockMalls = [
    {
      id: "phoenix-chennai",
      name: "Phoenix MarketCity",
      location: "Chennai",
      distance: "2.5 km",
      deliveryTime: "90 min",
      rating: 4.8,
      totalStores: 150,
      isOpen: true,
      timing: "10:00 AM - 10:00 PM",
      image: "https://images.unsplash.com/photo-1555529902-8ac3d4b95963?w=400",
      currentOffers: "Mega Sale - Up to 70% Off",
      categories: ["Fashion", "Electronics", "Food Court", "Beauty", "Footwear", "Home & Living"]
    },
    {
      id: "brookefields-coimbatore", 
      name: "Brookefields Mall",
      location: "Coimbatore",
      distance: "1.8 km",
      deliveryTime: "2 hours",
      rating: 4.6,
      totalStores: 120,
      isOpen: true,
      timing: "10:00 AM - 9:30 PM",
      image: "https://images.unsplash.com/photo-1574098160653-04cfc24ff0c4?w=400",
      currentOffers: "Weekend Special - Buy 2 Get 1 Free",
      categories: ["Fashion", "Electronics", "Food Court", "Beauty", "Sports", "Books"]
    }
  ];

  const mockBrands = [
    {
      id: "zara-phoenix",
      name: "Zara",
      mallId: "phoenix-chennai",
      category: "Fashion",
      rating: 4.7,
      deliveryTime: "90 min",
      logo: "https://images.unsplash.com/photo-1555529902-8ac3d4b95963?w=100",
      isExclusive: true,
      topPicks: 15,
      bestSellers: 8,
      description: "International fashion brand with latest trends"
    },
    {
      id: "mac-phoenix",
      name: "MAC Cosmetics", 
      mallId: "phoenix-chennai",
      category: "Beauty",
      rating: 4.9,
      deliveryTime: "90 min",
      logo: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=100",
      isExclusive: false,
      topPicks: 12,
      bestSellers: 6,
      description: "Professional makeup and cosmetics"
    },
    {
      id: "apple-store",
      name: "Apple Store",
      mallId: "phoenix-chennai", 
      category: "Electronics",
      rating: 4.8,
      deliveryTime: "2 hours",
      logo: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=100",
      isExclusive: true,
      topPicks: 10,
      bestSellers: 5,
      description: "Latest Apple products and accessories"
    }
  ];

  const addToMallCart = (product: any, store: any) => {
    const cartItem = {
      ...product,
      storeId: store.id,
      storeName: store.name,
      mallId: selectedMall?.id,
      mallName: selectedMall?.name,
      quantity: 1,
      deliveryOption
    };
    setMallCart([...mallCart, cartItem]);
    toast({
      title: "Added to Mall Cart",
      description: `${product.name} from ${store.name} added to your cart`,
    });
  };

  const createGroupRoom = () => {
    // Integration with VyronaSocial for group shopping
    toast({
      title: "Group Room Created",
      description: "Invite friends to shop together and share delivery costs",
    });
    setShowGroupModal(false);
  };

  if (!selectedMall) {
    // 1. Virtual Mall Home - Mall Selection Page
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>

        {/* Header with Location Detection */}
        <Card className="vyrona-gradient-mall text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">VyronaMallConnect</h1>
                <p className="text-lg opacity-90">Shopping malls from your phone with VyronaExpress delivery</p>
                <div className="flex items-center space-x-2 mt-3">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">Nearby: {nearbyLocation}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <Coins className="h-5 w-5 text-yellow-300" />
                  <span className="font-bold">{user?.vyronaCoins || 0}</span>
                </div>
                <p className="text-sm opacity-80">VyronaCoins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Select value={nearbyLocation} onValueChange={setNearbyLocation}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Choose City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chennai">Chennai</SelectItem>
                  <SelectItem value="Coimbatore">Coimbatore</SelectItem>
                  <SelectItem value="Bangalore">Bangalore</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="text-green-600">
                <Clock className="h-3 w-3 mr-1" />
                90 min delivery
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Mall Selection with Live Offers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mockMalls.map((mall) => (
            <Card 
              key={mall.id} 
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-amber-400"
              onClick={() => setSelectedMall(mall)}
            >
              <CardContent className="p-0">
                {/* Mall Image with Overlay */}
                <div className="relative">
                  <img 
                    src={mall.image} 
                    alt={mall.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge className={`${mall.isOpen ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                      {mall.isOpen ? 'Open' : 'Closed'}
                    </Badge>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <h3 className="text-white font-bold text-xl">{mall.name}</h3>
                    <p className="text-white/90 text-sm">{mall.currentOffers}</p>
                  </div>
                </div>

                {/* Mall Details */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{mall.distance}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Truck className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">{mall.deliveryTime}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{mall.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{mall.timing}</p>
                      <Badge variant="secondary">{mall.totalStores}+ brands</Badge>
                    </div>
                    <Button 
                      onClick={() => setSelectedMall(mall)}
                      className="bg-amber-500 hover:bg-amber-600"
                    >
                      Enter Mall
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Access Categories */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Quick Browse by Category</h2>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
              {["Fashion", "Electronics", "Beauty", "Food Court", "Footwear", "Home & Living"].map((category) => (
                <div key={category} className="text-center p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Store className="h-6 w-6 text-amber-600" />
                  </div>
                  <p className="text-sm font-medium">{category}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. Virtual Mall Interface with Comprehensive Features
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Mall Header with Live Info */}
      <Card className="vyrona-gradient-mall text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedMall(null)}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                All Malls
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{selectedMall.name}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{selectedMall.timing}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Truck className="h-4 w-4 text-green-300" />
                    <span className="text-sm">Delivery: {selectedMall.deliveryTime}</span>
                  </div>
                  <Badge className="bg-red-500 text-white animate-pulse">
                    {selectedMall.currentOffers}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-3">
              <Dialog open={showGroupModal} onOpenChange={setShowGroupModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-white/20 text-white border-white/30">
                    <Users className="h-4 w-4 mr-2" />
                    Group Shop
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Group Shopping Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">Invite friends to shop together and share delivery costs</p>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Walk Together Mode - Shop as if walking through mall</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Gift className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Group Buy Discounts on combo purchases</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-amber-500" />
                        <span className="text-sm">Shared delivery costs</span>
                      </div>
                    </div>
                    <Button onClick={createGroupRoom} className="w-full">
                      Create VyronSocial Room
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button 
                variant="outline"
                className="bg-white/20 text-white border-white/30"
                onClick={() => setShowConciergeChat(true)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Mall Concierge
              </Button>

              <div className="text-right">
                <div className="flex items-center space-x-1">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="font-bold">{mallCart.length}</span>
                </div>
                <p className="text-xs opacity-80">Mall Cart</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Mall Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse">Browse Stores</TabsTrigger>
          <TabsTrigger value="delivery">Delivery Options</TabsTrigger>
          <TabsTrigger value="loyalty">Loyalty & Offers</TabsTrigger>
          <TabsTrigger value="support">Support & Reviews</TabsTrigger>
        </TabsList>

        {/* Browse Stores Tab */}
        <TabsContent value="browse" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search across all mall stores..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Fashion">Fashion</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Beauty">Beauty</SelectItem>
                    <SelectItem value="Food Court">Food Court</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Digital Storefronts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {mockBrands
              .filter(brand => selectedCategory === "all" || brand.category === selectedCategory)
              .map((brand) => (
              <Card key={brand.id} className="hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => setSelectedStore(brand)}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <img 
                      src={brand.logo} 
                      alt={brand.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-bold text-lg">{brand.name}</h3>
                        {brand.isExclusive && (
                          <Badge className="bg-purple-500 text-white text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            Exclusive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{brand.description}</p>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">{brand.rating}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Timer className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">{brand.deliveryTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-blue-600">
                        <Target className="h-3 w-3 mr-1" />
                        {brand.topPicks} Top Picks
                      </Badge>
                      <Badge variant="outline" className="text-red-600">
                        <Zap className="h-3 w-3 mr-1" />
                        {brand.bestSellers} Bestsellers
                      </Badge>
                    </div>
                    
                    <Button className="w-full" onClick={() => setSelectedStore(brand)}>
                      Visit Store
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Delivery Options Tab */}
        <TabsContent value="delivery" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-6">Choose Your Delivery Option</h2>
              
              <div className="space-y-4">
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    deliveryOption === "express" ? "border-green-500 bg-green-50" : "border-gray-200"
                  }`}
                  onClick={() => setDeliveryOption("express")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Truck className="h-6 w-6 text-green-500" />
                      <div>
                        <h3 className="font-semibold">VyronaExpress Delivery</h3>
                        <p className="text-sm text-gray-600">90 min - 4 hour hyperlocal delivery</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₹99</p>
                      <p className="text-xs text-gray-500">Per order</p>
                    </div>
                  </div>
                </div>

                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    deliveryOption === "pickup" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  }`}
                  onClick={() => setDeliveryOption("pickup")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Store className="h-6 w-6 text-blue-500" />
                      <div>
                        <h3 className="font-semibold">Store Pickup</h3>
                        <p className="text-sm text-gray-600">Pick up directly from mall store</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">FREE</p>
                      <p className="text-xs text-gray-500">No delivery charge</p>
                    </div>
                  </div>
                </div>

                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    deliveryOption === "group" ? "border-purple-500 bg-purple-50" : "border-gray-200"
                  }`}
                  onClick={() => setDeliveryOption("group")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Users className="h-6 w-6 text-purple-500" />
                      <div>
                        <h3 className="font-semibold">Group Delivery</h3>
                        <p className="text-sm text-gray-600">Share delivery with friends</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">₹25-50</p>
                      <p className="text-xs text-gray-500">Split among group</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* MallCart Checkout Info */}
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <ShoppingCart className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-800">MallCart Checkout</h3>
                </div>
                <p className="text-sm text-amber-700">
                  Unified cart for multiple stores within the same mall. Single delivery fee when ordering from multiple stores.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loyalty & Offers Tab */}
        <TabsContent value="loyalty" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* VyronaCoins & Wallet */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">VyronaCoins & Coupons</h3>
                  <div className="flex items-center space-x-1">
                    <Coins className="h-5 w-5 text-yellow-500" />
                    <span className="font-bold text-lg">{user?.vyronaCoins || 0}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-yellow-800">Mall Exclusive 20% Off</p>
                        <p className="text-sm text-yellow-600">Valid on orders above ₹2000</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-yellow-500 text-yellow-700">
                        Apply
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-800">Free Delivery Voucher</p>
                        <p className="text-sm text-green-600">Save ₹99 on next order</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-green-500 text-green-700">
                        Use Now
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* VyronaMallPass */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Crown className="h-6 w-6 text-purple-500" />
                  <h3 className="text-lg font-bold">VyronaMallPass</h3>
                  <Badge className="bg-purple-500 text-white">Premium</Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Early access to mall sales</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Free delivery on all orders</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">5% cashback in VyronaCoins</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Priority customer support</span>
                  </div>
                </div>
                
                <Button className="w-full mt-4 bg-purple-500 hover:bg-purple-600">
                  Upgrade to MallPass - ₹299/month
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Brand Loyalty Integration */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4">Brand Loyalty Integration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { brand: "MAC Cosmetics", points: "1,250 points", status: "Linked" },
                  { brand: "Puma", points: "890 points", status: "Available to Link" },
                  { brand: "Apple", points: "Not available", status: "Coming Soon" }
                ].map((loyalty, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium mb-2">{loyalty.brand}</h4>
                    <p className="text-sm text-gray-600 mb-3">{loyalty.points}</p>
                    <Badge 
                      variant={loyalty.status === "Linked" ? "default" : "outline"}
                      className={loyalty.status === "Linked" ? "bg-green-500" : ""}
                    >
                      {loyalty.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support & Reviews Tab */}
        <TabsContent value="support" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Mall Concierge */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <MessageCircle className="h-6 w-6 text-blue-500" />
                  <h3 className="text-lg font-bold">Live Mall Concierge</h3>
                  <Badge className="bg-green-500 text-white">Online</Badge>
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Get help with multi-store orders, delivery tracking, and mall information
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Instant chat support</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Multi-store order assistance</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Real-time delivery tracking</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={() => setShowConciergeChat(true)}
                  >
                    Start Chat with Concierge
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reviews & Ratings */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Store Reviews & Ratings</h3>
                
                <div className="space-y-4">
                  {mockBrands.slice(0, 3).map((brand) => (
                    <div key={brand.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={brand.logo} 
                          alt={brand.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <h4 className="font-medium">{brand.name}</h4>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm">{brand.rating}</span>
                            <Badge variant="outline" className="text-xs">
                              Verified Mall Buyer
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Rate Store
                      </Button>
                    </div>
                  ))}
                </div>
                
                <Button variant="outline" className="w-full mt-4">
                  View All Reviews
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Customer Feedback */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4">Help & Feedback</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>Contact Support</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Award className="h-4 w-4" />
                  <span>Rate Experience</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Share2 className="h-4 w-4" />
                  <span>Share Feedback</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fixed Bottom Cart */}
      {mallCart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-amber-600" />
                <span className="font-medium">{mallCart.length} items in MallCart</span>
              </div>
              <div className="text-sm text-gray-600">
                From {new Set(mallCart.map(item => item.storeName)).size} stores
              </div>
            </div>
            <Button className="bg-amber-500 hover:bg-amber-600">
              Proceed to MallCart Checkout
            </Button>
          </div>
        </div>
      )}

      {/* Live Mall Concierge Chat Modal */}
      {showConciergeChat && (
        <Dialog open={showConciergeChat} onOpenChange={setShowConciergeChat}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Mall Concierge Chat</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="h-64 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="space-y-3">
                  <div className="bg-blue-500 text-white p-2 rounded-lg text-sm max-w-xs">
                    Hello! I'm your mall concierge. How can I help you today?
                  </div>
                  <div className="bg-gray-200 p-2 rounded-lg text-sm max-w-xs ml-auto">
                    I need help with delivery timing for multiple stores
                  </div>
                  <div className="bg-blue-500 text-white p-2 rounded-lg text-sm max-w-xs">
                    I can help coordinate delivery from multiple stores. What stores are you shopping from?
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Input placeholder="Type your message..." className="flex-1" />
                <Button>Send</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}