import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Store,
  ShoppingBag,
  Heart,
  Star,
  Clock,
  Phone,
  MessageCircle,
  Search,
  Navigation,
  Zap,
  Package,
  Calendar,
  Award,
  Plus,
  Minus,
  ShoppingCart,
  Eye,
  RefreshCw,
  Truck,
  Shield,
  Laptop,
  Shirt,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Users,
  Target,
  Gift,
  Home,
  Filter,
  Bell,
  MapIcon,
  CreditCard
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
  const [activeTab, setActiveTab] = useState("discover");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [newLocation, setNewLocation] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: "John Doe",
    email: "john.doe@email.com",
    phone: "+91 98765 43210",
    address: currentLocation,
    preferredPayment: "UPI",
    notifications: {
      orderUpdates: true,
      promotions: true,
      newStores: false
    }
  });
  const [filters, setFilters] = useState({
    distance: "all",
    rating: "all",
    deliveryTime: "all",
    openNow: false,
    offers: false
  });
  const { toast } = useToast();

  // Enhanced mock data for modern design
  const localStores = [
    {
      id: 1,
      name: "FreshMart Express",
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
      image: "/api/placeholder/120/120",
      offers: ["20% off on fruits", "Free delivery above ₹200"],
      specialties: ["Organic", "Fresh Produce", "24x7"],
      heroImage: "/api/placeholder/400/200"
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
      badges: ["verified", "24x7", "prescription"],
      minimumOrder: 50,
      deliveryFee: 20,
      address: "Pondy Bazaar, T. Nagar",
      phone: "+91 98765 43211",
      image: "/api/placeholder/120/120",
      offers: ["10% off on prescription medicines"],
      specialties: ["Prescription", "Health Care", "Emergency"],
      heroImage: "/api/placeholder/400/200"
    },
    {
      id: 3,
      name: "Fashion District",
      category: "clothing",
      rating: 4.6,
      reviewCount: 89,
      distance: "0.8 km",
      estimatedDelivery: "25-30 min",
      isOpen: true,
      badges: ["verified", "trending", "premium"],
      minimumOrder: 500,
      deliveryFee: 50,
      address: "Ranganathan Street, T. Nagar",
      phone: "+91 98765 43212",
      image: "/api/placeholder/120/120",
      offers: ["Buy 2 Get 1 Free", "Flat 30% off on summer collection"],
      specialties: ["Latest Fashion", "Designer Wear", "Accessories"],
      heroImage: "/api/placeholder/400/200"
    }
  ];

  const recentOrders = [
    {
      id: 1,
      orderNumber: "VS2025001",
      storeName: "FreshMart Express",
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
      image: "/api/placeholder/80/80",
      inStock: 25,
      category: "fruits",
      brand: "FreshCo",
      discount: 20
    },
    {
      id: 2,
      name: "Fresh Milk",
      price: 65,
      unit: "1 L",
      image: "/api/placeholder/80/80",
      inStock: 12,
      category: "dairy",
      brand: "Nandini"
    },
    {
      id: 3,
      name: "Whole Wheat Bread",
      price: 45,
      unit: "500g",
      image: "/api/placeholder/80/80",
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

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location detection",
        variant: "destructive",
      });
      return;
    }

    setIsDetectingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding to get readable address
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();
          
          const detectedLocation = data.locality 
            ? `${data.locality}, ${data.city}, ${data.principalSubdivision}`
            : `${data.city}, ${data.principalSubdivision}`;
            
          setNewLocation(detectedLocation);
          setIsDetectingLocation(false);
          
          toast({
            title: "Location detected",
            description: `Found your location: ${detectedLocation}`,
          });
        } catch (error) {
          // Fallback to coordinates if reverse geocoding fails
          const coordinateLocation = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setNewLocation(coordinateLocation);
          setIsDetectingLocation(false);
          
          toast({
            title: "Location detected",
            description: "Location detected using coordinates",
          });
        }
      },
      (error) => {
        setIsDetectingLocation(false);
        let errorMessage = "Unable to detect location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        
        toast({
          title: "Location detection failed",
          description: errorMessage,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const updateLocation = () => {
    if (!newLocation.trim()) {
      toast({
        title: "Please enter a location",
        description: "Enter your delivery location to continue",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentLocation(newLocation);
    setShowLocationModal(false);
    setNewLocation("");
    toast({
      title: "Location updated",
      description: `Delivery location changed to ${newLocation}`,
    });
  };

  const proceedToCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add some items to your cart before checkout",
        variant: "destructive",
      });
      return;
    }

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = selectedStore?.deliveryFee || 25;
    const totalAmount = cartTotal + deliveryFee;

    toast({
      title: "Order placed successfully!",
      description: `Your order of ₹${totalAmount} has been confirmed. Expected delivery: 20-25 minutes`,
    });

    // Clear cart and close modals
    setCart([]);
    setSelectedStore(null);
    setShowCheckoutModal(false);
    
    // Switch to orders tab to show the new order
    setActiveTab("orders");
  };

  const saveProfile = () => {
    toast({
      title: "Profile updated",
      description: "Your profile settings have been saved successfully",
    });
    setShowProfileModal(false);
  };

  const applyFilters = () => {
    toast({
      title: "Filters applied",
      description: "Store results have been updated based on your preferences",
    });
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setFilters({
      distance: "all",
      rating: "all",
      deliveryTime: "all",
      openNow: false,
      offers: false
    });
    toast({
      title: "Filters cleared",
      description: "All filters have been reset",
    });
  };

  // Filter stores based on applied filters
  const getFilteredStores = () => {
    return localStores.filter(store => {
      // Distance filter
      if (filters.distance !== "all") {
        const maxDistance = parseInt(filters.distance);
        const storeDistance = parseFloat(store.distance);
        if (storeDistance > maxDistance) return false;
      }
      
      // Rating filter
      if (filters.rating !== "all") {
        const minRating = parseFloat(filters.rating);
        if (store.rating < minRating) return false;
      }
      
      // Delivery time filter (using estimatedDelivery)
      if (filters.deliveryTime !== "all") {
        const maxDeliveryTime = parseInt(filters.deliveryTime);
        const deliveryMinutes = parseInt(store.estimatedDelivery);
        if (deliveryMinutes > maxDeliveryTime) return false;
      }
      
      // Open now filter
      if (filters.openNow && !store.isOpen) return false;
      
      // Offers filter
      if (filters.offers && (!store.offers || store.offers.length === 0)) return false;
      
      return true;
    });
  };

  const categories = [
    { id: "all", name: "All", icon: Home, count: localStores.length, color: "bg-gradient-to-r from-blue-500 to-purple-600" },
    { id: "grocery", name: "Grocery", icon: ShoppingBag, count: 1, color: "bg-gradient-to-r from-green-500 to-emerald-600" },
    { id: "pharmacy", name: "Health", icon: Heart, count: 1, color: "bg-gradient-to-r from-red-500 to-pink-600" },
    { id: "clothing", name: "Fashion", icon: Shirt, count: 1, color: "bg-gradient-to-r from-purple-500 to-indigo-600" },
    { id: "electronics", name: "Tech", icon: Laptop, count: 0, color: "bg-gradient-to-r from-gray-500 to-slate-600" }
  ];

  const filteredStores = selectedCategory === "all" 
    ? localStores 
    : localStores.filter(store => store.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      
      {/* Modern Header with Glassmorphism */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    VyronaSpace
                  </h1>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <MapPin className="h-3 w-3 mr-1" />
                    {currentLocation}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white/50 border-white/20 hover:bg-white/80">
                    <Navigation className="h-4 w-4 mr-2" />
                    Update Location
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Update Delivery Location</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Enter your location
                      </label>
                      <div className="flex space-x-3">
                        <Input
                          placeholder="Enter area, city, or landmark..."
                          value={newLocation}
                          onChange={(e) => setNewLocation(e.target.value)}
                          className="flex-1 rounded-xl"
                        />
                        <Button
                          onClick={detectCurrentLocation}
                          disabled={isDetectingLocation}
                          variant="outline"
                          className="px-4 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          {isDetectingLocation ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Navigation className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Click the GPS icon to detect your current location automatically
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="flex items-center text-blue-600 mb-2">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Current Location</span>
                      </div>
                      <p className="text-blue-800 font-medium">{currentLocation}</p>
                    </div>
                    <div className="flex space-x-3">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowLocationModal(false)}
                        className="flex-1 rounded-xl"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={updateLocation}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl"
                      >
                        Update Location
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" className="bg-white/50 border-white/20 hover:bg-white/80">
                <Bell className="h-4 w-4" />
              </Button>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                <Zap className="h-3 w-3 mr-1" />
                15-30 min delivery
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section with Modern Design */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 mb-8">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Your Local Shopping Companion</h2>
            <p className="text-xl opacity-90 mb-6">Discover nearby stores, order instantly, and get delivery in minutes</p>
            <div className="flex justify-center space-x-8 text-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 min-w-[120px]">
                <div className="text-2xl font-bold">15-30</div>
                <div className="text-sm opacity-80">Min Delivery</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 min-w-[120px]">
                <div className="text-2xl font-bold">{localStores.length}+</div>
                <div className="text-sm opacity-80">Local Stores</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 min-w-[120px]">
                <div className="text-2xl font-bold">2KM</div>
                <div className="text-sm opacity-80">Coverage</div>
              </div>
            </div>
          </div>
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full"></div>
        </div>

        {/* Enhanced Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              placeholder="Search for stores, products, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-16 py-4 text-lg rounded-2xl border-0 bg-white/80 backdrop-blur-sm shadow-lg focus:shadow-xl transition-all"
            />
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
              <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Filter Stores</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Distance Filter */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700">Distance</label>
                      <select
                        value={filters.distance}
                        onChange={(e) => setFilters({...filters, distance: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-xl"
                      >
                        <option value="all">Any distance</option>
                        <option value="1">Within 1 km</option>
                        <option value="2">Within 2 km</option>
                        <option value="5">Within 5 km</option>
                      </select>
                    </div>

                    {/* Rating Filter */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700">Minimum Rating</label>
                      <select
                        value={filters.rating}
                        onChange={(e) => setFilters({...filters, rating: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-xl"
                      >
                        <option value="all">Any rating</option>
                        <option value="4.5">4.5+ stars</option>
                        <option value="4.0">4.0+ stars</option>
                        <option value="3.5">3.5+ stars</option>
                      </select>
                    </div>

                    {/* Delivery Time Filter */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700">Delivery Time</label>
                      <select
                        value={filters.deliveryTime}
                        onChange={(e) => setFilters({...filters, deliveryTime: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-xl"
                      >
                        <option value="all">Any delivery time</option>
                        <option value="15">Within 15 minutes</option>
                        <option value="30">Within 30 minutes</option>
                        <option value="60">Within 1 hour</option>
                      </select>
                    </div>

                    {/* Toggle Filters */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <div className="font-medium">Open Now</div>
                          <div className="text-sm text-gray-600">Show only stores currently open</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={filters.openNow}
                          onChange={(e) => setFilters({...filters, openNow: e.target.checked})}
                          className="rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <div className="font-medium">Special Offers</div>
                          <div className="text-sm text-gray-600">Show only stores with active offers</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={filters.offers}
                          onChange={(e) => setFilters({...filters, offers: e.target.checked})}
                          className="rounded"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <Button 
                        variant="outline" 
                        onClick={clearFilters}
                        className="flex-1 rounded-xl"
                      >
                        Clear All
                      </Button>
                      <Button 
                        onClick={applyFilters}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold"
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Modern Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-white/60 backdrop-blur-sm rounded-2xl p-2 h-auto">
            <TabsTrigger value="discover" className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Sparkles className="h-4 w-4 mr-2" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Package className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="rewards" className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Award className="h-4 w-4 mr-2" />
              Rewards
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Users className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Discover Tab - Enhanced Store Discovery */}
          <TabsContent value="discover" className="space-y-8">
            
            {/* Modern Category Pills */}
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all whitespace-nowrap ${
                    selectedCategory === category.id 
                      ? `${category.color} text-white shadow-lg transform scale-105` 
                      : 'bg-white/60 text-gray-700 hover:bg-white/80 hover:shadow-md'
                  }`}
                >
                  <category.icon className="h-4 w-4" />
                  <span className="font-medium">{category.name}</span>
                  <Badge variant="secondary" className="bg-white/20 text-current border-0">
                    {category.count}
                  </Badge>
                </button>
              ))}
            </div>

            {/* Enhanced Store Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredStores().map(store => (
                <Card key={store.id} className="group overflow-hidden rounded-2xl border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="relative h-48 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
                    <div className="absolute top-4 left-4">
                      <Badge className={`${
                        store.isOpen ? 'bg-green-500' : 'bg-red-500'
                      } text-white border-0`}>
                        {store.isOpen ? 'Open' : 'Closed'}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4 flex space-x-2">
                      {store.badges.slice(0, 2).map(badge => (
                        <Badge key={badge} variant="secondary" className="bg-white/90 text-gray-700 border-0 text-xs">
                          {badge === "verified" && <Shield className="h-3 w-3 mr-1" />}
                          {badge === "top_rated" && <Star className="h-3 w-3 mr-1" />}
                          {badge === "fast_delivery" && <Zap className="h-3 w-3 mr-1" />}
                          {badge === "24x7" && <Clock className="h-3 w-3 mr-1" />}
                          {badge === "trending" && <TrendingUp className="h-3 w-3 mr-1" />}
                          {badge.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Store className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-gray-900 mb-1">{store.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{store.address}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="font-semibold">{store.rating}</span>
                            <span className="text-gray-500 ml-1">({store.reviewCount})</span>
                          </div>
                          <div className="flex items-center text-green-600 font-medium">
                            <Clock className="h-4 w-4 mr-1" />
                            {store.estimatedDelivery}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Store Specialties */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {store.specialties.map(specialty => (
                        <Badge key={specialty} variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                          {specialty}
                        </Badge>
                      ))}
                    </div>

                    {/* Store Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-xl">
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">₹{store.minimumOrder}</div>
                        <div className="text-xs text-gray-600">Min Order</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">₹{store.deliveryFee}</div>
                        <div className="text-xs text-gray-600">Delivery Fee</div>
                      </div>
                    </div>

                    {/* Special Offers */}
                    {store.offers && store.offers.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center mb-2">
                          <Gift className="h-4 w-4 text-orange-500 mr-2" />
                          <span className="text-sm font-medium text-orange-700">Special Offers</span>
                        </div>
                        {store.offers.slice(0, 1).map((offer, index) => (
                          <div key={index} className="text-xs bg-gradient-to-r from-orange-50 to-red-50 text-orange-700 px-3 py-2 rounded-lg border border-orange-200">
                            {offer}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <Button 
                        onClick={() => setSelectedStore(store)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-medium"
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Shop Now
                      </Button>
                      <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="border-purple-200 text-purple-600 hover:bg-purple-50 rounded-xl">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md rounded-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-xl">Chat with {store.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="h-64 border rounded-2xl p-4 overflow-y-auto space-y-3 bg-gray-50">
                              {chatMessages.length === 0 ? (
                                <div className="text-center text-gray-500 mt-8">
                                  <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                  <p className="font-medium">Start a conversation</p>
                                  <p className="text-sm">Ask about products, offers, or availability</p>
                                </div>
                              ) : (
                                chatMessages.map(message => (
                                  <div key={message.id} className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs p-3 rounded-2xl ${
                                      message.sender === 'customer' 
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                                        : 'bg-white text-gray-900 shadow-sm'
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
                                className="flex-1 rounded-xl"
                              />
                              <Button onClick={sendMessage} className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600">
                                Send
                              </Button>
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

          {/* Orders Tab - Enhanced Order Tracking */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-gray-900">Your Orders</h2>
              <Button variant="outline" className="rounded-xl">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="space-y-6">
              {recentOrders.map(order => (
                <Card key={order.id} className="rounded-2xl border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="font-bold text-xl text-gray-900">{order.storeName}</h3>
                        <p className="text-gray-600 font-medium">Order #{order.orderNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-2xl text-gray-900">₹{order.total}</p>
                        <Badge className={`rounded-full px-3 py-1 ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                      <div className="space-y-2">
                        {order.items.map((item: string, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-700">{item}</span>
                            <span className="font-medium text-gray-900">₹{Math.floor(order.total / order.items.length)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.status === 'out_for_delivery' && order.deliveryPartner && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6 border border-blue-200">
                        <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                          <Truck className="h-5 w-5 mr-2" />
                          Out for Delivery
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-blue-600">Delivery Partner:</span>
                            <p className="font-medium text-blue-900">{order.deliveryPartner.name}</p>
                          </div>
                          <div>
                            <span className="text-blue-600">Expected by:</span>
                            <p className="font-medium text-blue-900">{order.estimatedDelivery}</p>
                          </div>
                        </div>
                        <div className="flex space-x-3 mt-4">
                          <Button size="sm" variant="outline" className="flex-1 border-blue-200 text-blue-600 rounded-xl">
                            <Phone className="h-4 w-4 mr-2" />
                            Call Partner
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 border-blue-200 text-blue-600 rounded-xl">
                            <MapIcon className="h-4 w-4 mr-2" />
                            Track Live
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedOrder(order)}
                        className="flex-1 rounded-xl border-gray-200 hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" className="flex-1 rounded-xl border-gray-200 hover:bg-gray-50">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Reorder
                      </Button>
                      {order.status === 'delivered' && (
                        <Button variant="outline" className="flex-1 rounded-xl border-yellow-200 text-yellow-600 hover:bg-yellow-50">
                          <Star className="h-4 w-4 mr-2" />
                          Rate
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Rewards Tab - Enhanced Gamification */}
          <TabsContent value="rewards" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">VyronaCoins & Rewards</h2>
              <p className="text-gray-600">Earn points for every local purchase and unlock exclusive benefits</p>
            </div>

            {/* Coins Balance Card */}
            <Card className="rounded-2xl border-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white shadow-2xl">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold">VC</span>
                </div>
                <h3 className="text-4xl font-bold mb-2">1,250 Coins</h3>
                <p className="text-white/80 mb-6">Worth ₹125 in rewards</p>
                <Button className="bg-white text-orange-600 hover:bg-white/90 rounded-xl font-bold px-8">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Redeem Now
                </Button>
              </CardContent>
            </Card>

            {/* Achievement Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Local Explorer",
                  description: "Shop from 5 different stores",
                  progress: 3,
                  total: 5,
                  color: "from-blue-500 to-cyan-500",
                  icon: Target,
                  reward: "100 VyronaCoins"
                },
                {
                  title: "Speed Shopper",
                  description: "Complete 10 quick deliveries",
                  progress: 7,
                  total: 10,
                  color: "from-green-500 to-emerald-500",
                  icon: Zap,
                  reward: "150 VyronaCoins"
                },
                {
                  title: "Community Helper",
                  description: "Rate 15 local stores",
                  progress: 12,
                  total: 15,
                  color: "from-purple-500 to-pink-500",
                  icon: Heart,
                  reward: "200 VyronaCoins"
                }
              ].map((achievement, index) => (
                <Card key={index} className="rounded-2xl border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 bg-gradient-to-r ${achievement.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                      <achievement.icon className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-bold text-xl text-center mb-2">{achievement.title}</h4>
                    <p className="text-gray-600 text-center text-sm mb-4">{achievement.description}</p>
                    
                    <div className="bg-gray-100 rounded-full h-3 mb-3">
                      <div 
                        className={`bg-gradient-to-r ${achievement.color} h-3 rounded-full transition-all duration-500`}
                        style={{width: `${(achievement.progress / achievement.total) * 100}%`}}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-sm mb-4">
                      <span className="text-gray-600">Progress: {achievement.progress}/{achievement.total}</span>
                      <span className="font-medium text-gray-900">{Math.round((achievement.progress / achievement.total) * 100)}%</span>
                    </div>
                    
                    <div className="text-center">
                      <Badge className={`bg-gradient-to-r ${achievement.color} text-white border-0 px-3 py-1`}>
                        Reward: {achievement.reward}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Earning Opportunities */}
            <Card className="rounded-2xl border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-bold text-xl mb-4">How to Earn VyronaCoins</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { action: "Every local order", coins: "10 coins", icon: ShoppingBag },
                    { action: "First-time store visit", coins: "25 coins", icon: Store },
                    { action: "Rate & review stores", coins: "15 coins", icon: Star },
                    { action: "Refer friends", coins: "100 coins", icon: Users },
                    { action: "Weekend orders", coins: "20 coins", icon: Calendar },
                    { action: "Eco-friendly choices", coins: "30 coins", icon: Heart }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <item.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.action}</p>
                        <p className="text-sm text-gray-600">{item.coins}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Profile Header */}
            <Card className="rounded-2xl border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl">
              <CardContent className="p-8">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                    <Users className="h-10 w-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold mb-2">{userProfile.name}</h2>
                    <p className="text-white/80 mb-1">{userProfile.email}</p>
                    <p className="text-white/80">{userProfile.phone}</p>
                  </div>
                  <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
                    <DialogTrigger asChild>
                      <Button className="bg-white text-blue-600 hover:bg-white/90 rounded-xl font-bold">
                        <Users className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">Profile Settings</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        {/* Personal Information */}
                        <div className="space-y-4">
                          <h3 className="font-bold text-lg">Personal Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">Full Name</label>
                              <Input
                                value={userProfile.name}
                                onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                                className="rounded-xl"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">Phone Number</label>
                              <Input
                                value={userProfile.phone}
                                onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                                className="rounded-xl"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="text-sm font-medium text-gray-700 mb-2 block">Email Address</label>
                              <Input
                                value={userProfile.email}
                                onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                                className="rounded-xl"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="text-sm font-medium text-gray-700 mb-2 block">Default Address</label>
                              <Input
                                value={userProfile.address}
                                onChange={(e) => setUserProfile({...userProfile, address: e.target.value})}
                                className="rounded-xl"
                                placeholder="Enter your default delivery address"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Preferences */}
                        <div className="space-y-4">
                          <h3 className="font-bold text-lg">Preferences</h3>
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Preferred Payment Method</label>
                            <select
                              value={userProfile.preferredPayment}
                              onChange={(e) => setUserProfile({...userProfile, preferredPayment: e.target.value})}
                              className="w-full p-3 border border-gray-300 rounded-xl"
                            >
                              <option value="UPI">UPI</option>
                              <option value="Cards">Credit/Debit Cards</option>
                              <option value="COD">Cash on Delivery</option>
                              <option value="Wallet">Digital Wallet</option>
                            </select>
                          </div>
                        </div>

                        {/* Notification Settings */}
                        <div className="space-y-4">
                          <h3 className="font-bold text-lg">Notification Settings</h3>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                              <div>
                                <div className="font-medium">Order Updates</div>
                                <div className="text-sm text-gray-600">Get notified about order status changes</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={userProfile.notifications.orderUpdates}
                                onChange={(e) => setUserProfile({
                                  ...userProfile,
                                  notifications: {...userProfile.notifications, orderUpdates: e.target.checked}
                                })}
                                className="rounded"
                              />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                              <div>
                                <div className="font-medium">Promotions & Offers</div>
                                <div className="text-sm text-gray-600">Receive special deals and discounts</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={userProfile.notifications.promotions}
                                onChange={(e) => setUserProfile({
                                  ...userProfile,
                                  notifications: {...userProfile.notifications, promotions: e.target.checked}
                                })}
                                className="rounded"
                              />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                              <div>
                                <div className="font-medium">New Stores</div>
                                <div className="text-sm text-gray-600">Get notified when new stores join your area</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={userProfile.notifications.newStores}
                                onChange={(e) => setUserProfile({
                                  ...userProfile,
                                  notifications: {...userProfile.notifications, newStores: e.target.checked}
                                })}
                                className="rounded"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowProfileModal(false)}
                            className="flex-1 rounded-xl"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={saveProfile}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold"
                          >
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Account Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="rounded-2xl border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-2xl text-gray-900 mb-1">
                    {recentOrders.length}
                  </h3>
                  <p className="text-gray-600">Total Orders</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-2xl text-gray-900 mb-1">1,250</h3>
                  <p className="text-gray-600">VyronaCoins</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-2xl text-gray-900 mb-1">
                    {localStores.length}
                  </h3>
                  <p className="text-gray-600">Favorite Stores</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="rounded-2xl border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-bold text-xl mb-6">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2 rounded-xl border-blue-200 hover:bg-blue-50"
                    onClick={() => setActiveTab("orders")}
                  >
                    <Package className="h-6 w-6 text-blue-600" />
                    <span className="text-sm">My Orders</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2 rounded-xl border-yellow-200 hover:bg-yellow-50"
                    onClick={() => setActiveTab("rewards")}
                  >
                    <Award className="h-6 w-6 text-yellow-600" />
                    <span className="text-sm">Rewards</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2 rounded-xl border-green-200 hover:bg-green-50"
                    onClick={() => setShowLocationModal(true)}
                  >
                    <MapPin className="h-6 w-6 text-green-600" />
                    <span className="text-sm">Addresses</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2 rounded-xl border-purple-200 hover:bg-purple-50"
                  >
                    <Phone className="h-6 w-6 text-purple-600" />
                    <span className="text-sm">Support</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card className="rounded-2xl border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-bold text-xl mb-6">Account Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-gray-600" />
                      <div>
                        <div className="font-medium">Privacy & Security</div>
                        <div className="text-sm text-gray-600">Manage your account security settings</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="h-4 w-4 rotate-180" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-gray-600" />
                      <div>
                        <div className="font-medium">Payment Methods</div>
                        <div className="text-sm text-gray-600">Manage saved payment options</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="h-4 w-4 rotate-180" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-5 w-5 text-gray-600" />
                      <div>
                        <div className="font-medium">Notification Preferences</div>
                        <div className="text-sm text-gray-600">Control how you receive notifications</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowProfileModal(true)}>
                      <ArrowLeft className="h-4 w-4 rotate-180" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Store Product Browser Modal - Enhanced */}
        {selectedStore && (
          <Dialog open={!!selectedStore} onOpenChange={() => setSelectedStore(null)}>
            <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto rounded-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-4 text-2xl">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                    <Store className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="font-bold">{selectedStore.name}</h2>
                    <p className="text-sm text-gray-600 font-normal">{selectedStore.address}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Store Info Bar */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center">
                        <Star className="h-5 w-5 text-yellow-400 fill-current mr-2" />
                        <span className="font-bold text-lg">{selectedStore.rating}</span>
                        <span className="text-gray-500 ml-2">({selectedStore.reviewCount} reviews)</span>
                      </div>
                      <div className="flex items-center text-green-600 font-medium">
                        <Clock className="h-5 w-5 mr-2" />
                        {selectedStore.estimatedDelivery}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Min Order: </span>
                        <span className="font-bold">₹{selectedStore.minimumOrder}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button variant="outline" size="sm" className="rounded-xl">
                        <Phone className="h-4 w-4 mr-2" />
                        Call Store
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-xl">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Product Categories */}
                <div className="flex space-x-3 overflow-x-auto pb-2">
                  {["All", "Fruits", "Vegetables", "Dairy", "Bakery", "Snacks"].map(cat => (
                    <Button 
                      key={cat}
                      variant="outline" 
                      size="sm"
                      className="whitespace-nowrap rounded-xl bg-white/50 hover:bg-white"
                    >
                      {cat}
                    </Button>
                  ))}
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {storeProducts.map(product => (
                    <Card key={product.id} className="rounded-2xl border-0 bg-white shadow-md hover:shadow-lg transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3 mb-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-lg">{product.name}</h4>
                            <p className="text-sm text-gray-600">{product.brand} • {product.unit}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="font-bold text-xl text-gray-900">₹{product.price}</span>
                              {product.originalPrice && (
                                <>
                                  <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                                  <Badge className="bg-green-100 text-green-700 text-xs">
                                    {product.discount}% OFF
                                  </Badge>
                                </>
                              )}
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
                                className="rounded-lg"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="font-bold text-lg px-3">
                                {cart.find(item => item.id === product.id)?.quantity || 0}
                              </span>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => addToCart(product)}
                                className="rounded-lg"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              onClick={() => addToCart(product)}
                              disabled={product.inStock === 0}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl"
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

                {/* Enhanced Shopping Cart Summary */}
                {cart.length > 0 && (
                  <div className="sticky bottom-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-6 -mx-6 -mb-6 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg">
                          {cart.reduce((sum, item) => sum + item.quantity, 0)} items in cart
                        </p>
                        <p className="text-white/80">
                          Total: ₹{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                        </p>
                      </div>
                      <div className="flex space-x-3">
                        <Button variant="outline" onClick={() => setCart([])} className="bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-xl">
                          Clear Cart
                        </Button>
                        <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
                          <DialogTrigger asChild>
                            <Button className="bg-white text-blue-600 hover:bg-white/90 rounded-xl font-bold px-6">
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Checkout
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl rounded-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-2xl">Checkout</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6">
                              {/* Order Summary */}
                              <div className="bg-gray-50 rounded-2xl p-6">
                                <h3 className="font-bold text-lg mb-4">Order Summary</h3>
                                <div className="space-y-3">
                                  {cart.map(item => (
                                    <div key={item.id} className="flex justify-between">
                                      <span>{item.name} x {item.quantity}</span>
                                      <span className="font-medium">₹{item.price * item.quantity}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="border-t mt-4 pt-4 space-y-2">
                                  <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>₹{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Delivery Fee</span>
                                    <span>₹{selectedStore?.deliveryFee || 25}</span>
                                  </div>
                                  <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>₹{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + (selectedStore?.deliveryFee || 25)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Delivery Address */}
                              <div className="bg-blue-50 rounded-2xl p-6">
                                <div className="flex items-center text-blue-600 mb-3">
                                  <MapPin className="h-5 w-5 mr-2" />
                                  <span className="font-medium">Delivery Address</span>
                                </div>
                                <p className="text-blue-800 font-medium">{currentLocation}</p>
                                <p className="text-blue-600 text-sm">Expected delivery: 20-25 minutes</p>
                              </div>

                              {/* Payment Method */}
                              <div className="space-y-3">
                                <h4 className="font-medium">Payment Method</h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4 text-center">
                                    <CreditCard className="h-6 w-6 text-green-600 mx-auto mb-2" />
                                    <div className="font-medium text-green-800">UPI</div>
                                    <div className="text-sm text-green-600">Pay on delivery</div>
                                  </div>
                                  <div className="border rounded-xl p-4 text-center hover:border-gray-300">
                                    <ShoppingCart className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="font-medium text-gray-600">Cash</div>
                                    <div className="text-sm text-gray-500">Cash on delivery</div>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex space-x-3">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setShowCheckoutModal(false)}
                                  className="flex-1 rounded-xl"
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={proceedToCheckout}
                                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl font-bold"
                                >
                                  <ShoppingCart className="h-4 w-4 mr-2" />
                                  Place Order
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Order Details Modal - Enhanced */}
        {selectedOrder && (
          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="max-w-2xl rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl">Order Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-xl">{selectedOrder.storeName}</h3>
                    <p className="text-gray-600">Order #{selectedOrder.orderNumber}</p>
                  </div>
                  <Badge className={`rounded-full px-4 py-2 text-sm font-medium ${
                    selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    selectedOrder.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedOrder.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="border rounded-2xl p-6 bg-gray-50">
                  <h4 className="font-bold mb-4">Order Items</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item: string, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span>{item}</span>
                        <span className="font-medium">₹{Math.floor(selectedOrder.total / selectedOrder.items.length)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t mt-4 pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>₹{selectedOrder.total}</span>
                    </div>
                  </div>
                </div>

                {selectedOrder.status === 'out_for_delivery' && selectedOrder.deliveryPartner && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                    <h4 className="font-bold text-blue-900 mb-4 flex items-center">
                      <Truck className="h-5 w-5 mr-2" />
                      Delivery Information
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-600">Delivery Partner:</span>
                        <span className="font-medium">{selectedOrder.deliveryPartner.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Phone:</span>
                        <span className="font-medium">{selectedOrder.deliveryPartner.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Expected Delivery:</span>
                        <span className="font-medium">{selectedOrder.estimatedDelivery}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Rating:</span>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                          <span className="font-medium">{selectedOrder.deliveryPartner.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button variant="outline" className="flex-1 rounded-xl">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Store
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-xl">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Get Support
                  </Button>
                  {selectedOrder.status === 'delivered' && (
                    <Button variant="outline" className="flex-1 rounded-xl">
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