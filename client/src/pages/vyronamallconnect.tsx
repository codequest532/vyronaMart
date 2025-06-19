import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Building, Shirt, Laptop, Utensils, Home as HomeIcon, Star, Coins, 
  MapPin, Clock, ShoppingCart, Users, Heart, Gift, Truck, MessageCircle,
  Search, Filter, Phone, Mail, Calendar, CheckCircle, Timer, Package,
  Crown, Zap, Target, Camera, Share2, Bell, Award, Store, CreditCard, X,
  MoreVertical, Settings, Trash2, LogOut as ExitIcon
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
  const [showGroupCartModal, setShowGroupCartModal] = useState(false);
  const [showConciergeChat, setShowConciergeChat] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [mallCart, setMallCart] = useState<any[]>([]);
  const [groupMallCart, setGroupMallCart] = useState<any[]>([]);
  const [nearbyLocation, setNearbyLocation] = useState("Chennai");
  const [userLocation, setUserLocation] = useState<any>(null);
  const [joinGroupCode, setJoinGroupCode] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [selectedGroupForAction, setSelectedGroupForAction] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stores = [] } = useQuery({
    queryKey: ["/api/mallconnect/stores"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/mallconnect/products"],
  });

  const { data: user } = useQuery({
    queryKey: ["/api/current-user"],
  });

  // Fetch VyronaMallConnect shopping groups with real-time updates
  const { data: shoppingRooms = [], isLoading: loadingRooms } = useQuery({
    queryKey: ["/api/mallconnect/shopping-groups"],
    enabled: !!user,
    refetchInterval: 3000, // Refresh every 3 seconds for real-time member count updates
    refetchIntervalInBackground: true,
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

  // Load both carts from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('mallCart');
    if (savedCart) {
      setMallCart(JSON.parse(savedCart));
    }
    
    const savedGroupCart = localStorage.getItem('groupMallCart');
    if (savedGroupCart) {
      setGroupMallCart(JSON.parse(savedGroupCart));
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
      id: `${product.id}-${store.id}-${deliveryOption}`,
      storeId: store.id,
      storeName: store.name,
      mallId: selectedMall?.id,
      mallName: selectedMall?.name,
      quantity: 1,
      deliveryOption
    };
    const updatedCart = [...mallCart, cartItem];
    setMallCart(updatedCart);
    localStorage.setItem('mallCart', JSON.stringify(updatedCart));
    toast({
      title: "Added to Mall Cart",
      description: `${product.name} from ${store.name} added to your cart`,
    });
  };

  const addToGroupMallCart = (product: any, store: any) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to add items to group cart",
        variant: "destructive",
      });
      return;
    }

    // Check if user is in any active group
    if (!Array.isArray(shoppingRooms) || shoppingRooms.length === 0) {
      toast({
        title: "No Active Group",
        description: "Create or join a group first to add items to group cart",
        variant: "destructive",
      });
      setShowGroupModal(true);
      return;
    }

    // For now, add to the first active group (user can have multiple groups)
    const activeGroup = shoppingRooms[0];
    
    const groupCartItem = {
      ...product,
      id: `group-${product.id}-${store.id}-${Date.now()}`,
      storeId: store.id,
      storeName: store.name,
      mallId: selectedMall?.id,
      mallName: selectedMall?.name,
      quantity: 1,
      deliveryOption: "group",
      groupId: activeGroup.id,
      groupName: activeGroup.name
    };
    
    // Update group cart state and localStorage
    const updatedGroupCart = [...groupMallCart, groupCartItem];
    setGroupMallCart(updatedGroupCart);
    localStorage.setItem('groupMallCart', JSON.stringify(updatedGroupCart));
    
    toast({
      title: "Added to Group MallCart",
      description: `${product.name} added to ${activeGroup.name} group cart`,
    });
    
    // Refresh group data to update cart totals
    queryClient.invalidateQueries({ queryKey: ["/api/shopping-rooms"] });
  };

  // Group room creation mutation
  const createGroupRoomMutation = useMutation({
    mutationFn: async (roomData: any) => {
      const response = await apiRequest("POST", "/api/mallconnect/create-group", roomData);
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Group Created Successfully",
        description: `Group code: ${data.roomCode}. Share with friends to shop together!`,
      });
      setShowGroupModal(false);
      // Stay in VyronaMallConnect and show group shopping interface
      setActiveTab("group-shopping");
      // Store the created room data for the group shopping interface
      localStorage.setItem('currentGroupRoom', JSON.stringify(data));
      // Refresh the group shopping data
      queryClient.invalidateQueries({ queryKey: ["/api/mallconnect/shopping-groups"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create shopping group",
        variant: "destructive",
      });
    },
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: async (groupCode: string) => {
      const response = await apiRequest("POST", "/api/join-group", { code: groupCode });
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Joined Group Successfully",
        description: `Welcome to ${data.group?.name || 'the group'}! Start shopping together.`,
      });
      setJoinGroupCode("");
      // Stay in VyronaMallConnect and show group shopping interface
      setActiveTab("group-shopping");
      // Store the joined room data
      if (data.group) {
        localStorage.setItem('currentGroupRoom', JSON.stringify(data.group));
      }
      // Refresh the group shopping data
      queryClient.invalidateQueries({ queryKey: ["/api/mallconnect/shopping-groups"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Join Group",
        description: error.message || "Invalid group code or group not found",
        variant: "destructive",
      });
    },
  });

  // Delete group mutation (for admins)
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      return apiRequest("DELETE", `/api/shopping-rooms/${groupId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-rooms"] });
      toast({
        title: "Success",
        description: "Group deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete group",
        variant: "destructive",
      });
    },
  });

  // Remove member mutation (for admins)
  const removeMemberMutation = useMutation({
    mutationFn: async ({ groupId, memberId }: { groupId: number; memberId: number }) => {
      return apiRequest("DELETE", `/api/shopping-rooms/${groupId}/members/${memberId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-rooms"] });
      toast({
        title: "Success",
        description: "Member removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    },
  });

  // Exit group mutation (for non-admin members)
  const exitGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      // Get current user info first
      const currentUser = await apiRequest("GET", "/api/current-user");
      return apiRequest("DELETE", `/api/shopping-rooms/${groupId}/members/${currentUser.id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-rooms"] });
      toast({
        title: "Success",
        description: "You have left the group successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to leave group",
        variant: "destructive",
      });
    },
  });

  const createGroupRoom = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to create a group shopping room",
        variant: "destructive",
      });
      return;
    }

    const roomData = {
      name: `${selectedMall?.name || 'Mall'} Shopping Group`,
      description: `Group shopping session for ${selectedMall?.name || 'mall'} with shared delivery costs`,
      locality: selectedMall?.location || nearbyLocation,
      maxMembers: 10
    };

    createGroupRoomMutation.mutate(roomData);
  };

  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    let updatedCart;
    if (newQuantity === 0) {
      updatedCart = mallCart.filter(item => item.id !== itemId);
    } else {
      updatedCart = mallCart.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
    }
    setMallCart(updatedCart);
    localStorage.setItem('mallCart', JSON.stringify(updatedCart));
  };

  const removeFromCart = (itemId: string) => {
    const updatedCart = mallCart.filter(item => item.id !== itemId);
    setMallCart(updatedCart);
    localStorage.setItem('mallCart', JSON.stringify(updatedCart));
    toast({
      title: "Item Removed",
      description: "Item removed from your MallCart",
    });
  };

  const getTotalPrice = () => {
    return mallCart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return mallCart.reduce((total, item) => total + item.quantity, 0);
  };

  const getDeliveryFee = () => {
    const storeCount = new Set(mallCart.map(item => item.storeId)).size;
    if (deliveryOption === "pickup") return 0;
    if (deliveryOption === "group") return Math.ceil(99 / 2); // Split delivery
    return storeCount > 1 ? 99 : 99; // Single delivery fee for multiple stores in same mall
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
                  <span className="font-bold">{(user as any)?.vyronaCoins || 0}</span>
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

  // 3. Individual Store Interface
  if (selectedStore) {
    const storeProducts = [
      {
        id: 1,
        name: "Premium Cotton T-Shirt",
        price: 2999,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300",
        rating: 4.5,
        inStock: true,
        tags: ["Bestseller", "New Arrival"]
      },
      {
        id: 2,
        name: "Denim Jacket",
        price: 5999,
        image: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=300",
        rating: 4.7,
        inStock: true,
        tags: ["Top Pick", "Limited Edition"]
      },
      {
        id: 3,
        name: "Casual Sneakers",
        price: 8999,
        image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300",
        rating: 4.3,
        inStock: false,
        tags: ["Popular"]
      }
    ];

    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Store Header */}
        <Card className="vyrona-gradient-mall text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedStore(null)}
                  className="text-white hover:bg-white/20"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Mall
                </Button>
                <img 
                  src={selectedStore.logo} 
                  alt={selectedStore.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h1 className="text-2xl font-bold">{selectedStore.name}</h1>
                    {selectedStore.isExclusive && (
                      <Badge className="bg-purple-500 text-white">
                        <Crown className="h-3 w-3 mr-1" />
                        Exclusive
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg opacity-90 mb-2">{selectedStore.description}</p>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-300" />
                      <span className="text-sm">{selectedStore.rating} rating</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Timer className="h-4 w-4 text-green-300" />
                      <span className="text-sm">Delivery: {selectedStore.deliveryTime}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Button 
                  onClick={() => setShowGroupModal(true)}
                  className="bg-white/20 text-white border-white/30 mr-2"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Shop with Friends
                </Button>
                <div className="mt-2">
                  <div className="flex items-center space-x-1">
                    <ShoppingCart className="h-4 w-4" />
                    <span className="font-bold">{mallCart.filter(item => item.storeId === selectedStore.id).length}</span>
                  </div>
                  <p className="text-xs opacity-80">Items in cart</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Categories & Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-blue-600">
                  <Target className="h-3 w-3 mr-1" />
                  {selectedStore.topPicks} Top Picks
                </Badge>
                <Badge variant="outline" className="text-red-600">
                  <Zap className="h-3 w-3 mr-1" />
                  {selectedStore.bestSellers} Bestsellers
                </Badge>
                <Badge variant="outline" className="text-green-600">
                  Category: {selectedStore.category}
                </Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Products */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {storeProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                <div className="relative">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    {product.tags.map((tag, index) => (
                      <Badge 
                        key={index}
                        className={`text-xs ${
                          tag === "Bestseller" ? "bg-red-500" :
                          tag === "Top Pick" ? "bg-blue-500" :
                          tag === "New Arrival" ? "bg-green-500" :
                          tag === "Limited Edition" ? "bg-purple-500" :
                          "bg-gray-500"
                        } text-white`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-lg">
                      <Badge className="bg-red-500 text-white">Out of Stock</Badge>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-amber-600 font-bold text-xl">
                        ₹{Math.round(product.price / 100).toLocaleString()}
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-gray-600">{product.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium text-green-600">
                        +{Math.floor(product.price / 10000)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                      disabled={!product.inStock}
                      onClick={() => addToMallCart(product, selectedStore)}
                    >
                      {product.inStock ? "Add to MallCart" : "Out of Stock"}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:from-blue-100 hover:to-purple-100"
                      disabled={!product.inStock}
                      onClick={() => addToGroupMallCart(product, selectedStore)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Add to Group MallCart
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Store Delivery Options */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4">Delivery Options from {selectedStore.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Truck className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium">VyronaExpress</h4>
                </div>
                <p className="text-sm text-gray-600 mb-1">{selectedStore.deliveryTime}</p>
                <p className="font-bold text-green-600">₹99</p>
              </div>
              
              <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Store className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium">Store Pickup</h4>
                </div>
                <p className="text-sm text-gray-600 mb-1">Available now</p>
                <p className="font-bold text-blue-600">FREE</p>
              </div>
              
              <div className="p-4 border border-purple-200 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <h4 className="font-medium">Group Delivery</h4>
                </div>
                <p className="text-sm text-gray-600 mb-1">Share with friends</p>
                <p className="font-bold text-purple-600">₹25-50</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Information */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4">Store Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">About {selectedStore.name}</h4>
                <p className="text-sm text-gray-600 mb-4">{selectedStore.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Open: 10:00 AM - 10:00 PM</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{selectedMall.name}, {selectedMall.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">+91 98765 43210</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Customer Reviews</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <Star className="h-4 w-4 text-yellow-500" />
                      <Star className="h-4 w-4 text-yellow-500" />
                      <Star className="h-4 w-4 text-yellow-500" />
                      <Star className="h-4 w-4 text-gray-300" />
                    </div>
                    <span className="text-sm font-medium">{selectedStore.rating}/5</span>
                    <Badge variant="outline" className="text-xs">Verified Mall Buyer</Badge>
                  </div>
                  <p className="text-sm text-gray-600">"Great quality products and fast delivery. Highly recommended!"</p>
                  <Button variant="outline" size="sm">
                    View All Reviews
                  </Button>
                </div>
              </div>
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
          {/* Top Row - Mall Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedMall(null)}
                className="text-white hover:bg-white/20 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                All Malls
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{selectedMall.name}</h1>
              </div>
            </div>
            
            {/* Cart Buttons - Individual and Group */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Button 
                variant="outline"
                className="bg-white/20 text-white border-white/30"
                onClick={() => setShowCartModal(true)}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                <span className="font-bold">{mallCart.length}</span>
                <span className="ml-1 hidden sm:inline">MallCart</span>
              </Button>
              
              <Button 
                variant="outline"
                className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 text-white border-white/30"
                onClick={() => {
                  setShowGroupCartModal(true);
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                <span className="font-bold">{groupMallCart.length}</span>
                <span className="ml-1 hidden sm:inline">Group MallCart</span>
                <span className="ml-1 sm:hidden">Group</span>
              </Button>
            </div>
          </div>

          {/* Bottom Row - Details and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-wrap">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{selectedMall.timing}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Truck className="h-4 w-4 text-green-300" />
                <span className="text-sm">Delivery: {selectedMall.deliveryTime}</span>
              </div>
              <Badge className="bg-red-500 text-white animate-pulse text-xs">
                {selectedMall.currentOffers}
              </Badge>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <Dialog open={showGroupModal} onOpenChange={setShowGroupModal}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Group Shopping Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">Invite friends to shop together at {selectedMall?.name} and share delivery costs</p>
                    
                    {/* Group Shopping Benefits */}
                    <div className="space-y-3 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Walk Together Mode</span>
                        <span className="text-xs text-gray-500">- Shop as if walking through mall together</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Gift className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Group Buy Discounts</span>
                        <span className="text-xs text-gray-500">- Bulk purchase savings</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium">Shared Delivery</span>
                        <span className="text-xs text-gray-500">- Split delivery costs among friends</span>
                      </div>
                    </div>

                    {/* Room Settings */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Shopping Group Name</label>
                        <Input 
                          placeholder={`${selectedMall?.name || 'Mall'} Shopping Group`}
                          className="mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Max Members</label>
                          <Select defaultValue="10">
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 friends</SelectItem>
                              <SelectItem value="10">10 friends</SelectItem>
                              <SelectItem value="15">15 friends</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Duration</label>
                          <Select defaultValue="2">
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 hour</SelectItem>
                              <SelectItem value="2">2 hours</SelectItem>
                              <SelectItem value="4">4 hours</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={createGroupRoom} 
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                      disabled={createGroupRoomMutation.isPending}
                    >
                      {createGroupRoomMutation.isPending ? "Creating..." : "Create Shopping Group"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button 
                variant="outline"
                className="bg-white/20 text-white border-white/30 text-xs px-3 py-2"
                onClick={() => setShowConciergeChat(true)}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                <span className="hidden md:inline">Concierge</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Mall Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="browse">Browse Stores</TabsTrigger>
          <TabsTrigger value="group-shopping">Group Shopping</TabsTrigger>
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

        {/* Group Shopping Tab */}
        <TabsContent value="group-shopping" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Group Shopping at {selectedMall?.name}</h2>
                  <p className="text-gray-600">Shop together with friends and split delivery costs</p>
                </div>
                <Button 
                  onClick={() => setShowGroupModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Create New Group
                </Button>
              </div>

              {/* Current Group Room Info - Show user's joined rooms with live member counts */}
              {!loadingRooms && Array.isArray(shoppingRooms) && shoppingRooms.length > 0 && (
                <div className="space-y-4 mb-6">
                  <h3 className="font-semibold text-lg">Your Active Groups</h3>
                  {shoppingRooms.map((room: any) => (
                    <div key={room.id} className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{room.name}</h3>
                          <p className="text-gray-600">{room.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <Badge variant="outline" className="text-blue-600">
                              <Users className="h-3 w-3 mr-1" />
                              {room.memberCount} members
                            </Badge>
                            <Badge variant="outline" className="text-green-600">
                              Group Code: {room.roomCode}
                            </Badge>
                            <Badge variant="outline" className="text-purple-600">
                              Cart Total: ₹{Math.round(room.totalCart || 0)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {user && room.creatorId === user.id ? (
                            // Admin controls (creator of the group)
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Settings className="h-4 w-4 mr-2" />
                                  Admin
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => {
                                  navigator.clipboard.writeText(room.roomCode);
                                  toast({ title: "Group code copied!", description: "Share with friends to invite them" });
                                }}>
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share Group Code
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedGroupForAction(room);
                                  setShowDeleteConfirm(true);
                                }} className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Group
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            // Non-admin controls (regular group members)
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(room.roomCode);
                                  toast({ title: "Group code copied!", description: "Share with friends to invite them" });
                                }}
                              >
                                <Share2 className="h-4 w-4 mr-2" />
                                Share Code
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedGroupForAction(room);
                                  setShowExitConfirm(true);
                                }}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <ExitIcon className="h-4 w-4 mr-2" />
                                Exit Group
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Group Shopping Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <h4 className="font-medium">Walk Together Mode</h4>
                  </div>
                  <p className="text-sm text-gray-600">Browse stores together virtually as if walking through the mall</p>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Gift className="h-5 w-5 text-green-500" />
                    <h4 className="font-medium">Group Discounts</h4>
                  </div>
                  <p className="text-sm text-gray-600">Unlock bulk purchase savings when buying together</p>
                </div>
                
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Truck className="h-5 w-5 text-amber-500" />
                    <h4 className="font-medium">Shared Delivery</h4>
                  </div>
                  <p className="text-sm text-gray-600">Split delivery costs among group members</p>
                </div>
              </div>

              {/* Group Shopping Instructions */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">How Group Shopping Works:</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">1</div>
                    <span>Create a group room or join one using a group code</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">2</div>
                    <span>Browse stores together and add items to shared group cart</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">3</div>
                    <span>Members contribute to items they want using various payment methods</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">4</div>
                    <span>Order is placed when funding goals are met and delivery costs are shared</span>
                  </div>
                </div>
              </div>

              {/* Quick Join Section */}
              <div className="mt-6 p-4 border border-dashed border-gray-300 rounded-lg">
                <h4 className="font-medium mb-3">Join Existing Group</h4>
                <div className="flex items-center space-x-3">
                  <Input 
                    placeholder="Enter group code (e.g., ABC123)"
                    className="flex-1"
                    value={joinGroupCode}
                    onChange={(e) => setJoinGroupCode(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && joinGroupCode.trim()) {
                        joinGroupMutation.mutate(joinGroupCode.trim());
                      }
                    }}
                  />
                  <Button 
                    variant="outline"
                    disabled={!joinGroupCode.trim() || joinGroupMutation.isPending}
                    onClick={() => joinGroupMutation.mutate(joinGroupCode.trim())}
                  >
                    {joinGroupMutation.isPending ? "Joining..." : "Join Group"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
                    <span className="font-bold text-lg">{(user as any)?.vyronaCoins || 0}</span>
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
            <div className="flex items-center space-x-4 cursor-pointer" onClick={() => setShowCartModal(true)}>
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-amber-600" />
                <span className="font-medium">{mallCart.length} items in MallCart</span>
              </div>
              <div className="text-sm text-gray-600">
                From {new Set(mallCart.map(item => item.storeName)).size} stores
              </div>
            </div>
            <Button 
              className="bg-amber-500 hover:bg-amber-600"
              onClick={() => setShowCartModal(true)}
            >
              View MallCart
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

      {/* MallCart Modal */}
      {showCartModal && (
        <Dialog open={showCartModal} onOpenChange={setShowCartModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-amber-600" />
                <span>MallCart - {selectedMall.name}</span>
              </DialogTitle>
            </DialogHeader>
            
            {mallCart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your MallCart is Empty</h3>
                <p className="text-gray-500 mb-4">Add some products from mall stores to get started.</p>
                <Button onClick={() => setShowCartModal(false)} className="bg-amber-500 hover:bg-amber-600">
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Cart Items */}
                <div className="space-y-4">
                  {Object.entries(
                    mallCart.reduce((grouped: any, item) => {
                      if (!grouped[item.storeId]) {
                        grouped[item.storeId] = [];
                      }
                      grouped[item.storeId].push(item);
                      return grouped;
                    }, {})
                  ).map(([storeId, items]: [string, any]) => {
                    const storeItems = items as any[];
                    return (
                    <Card key={storeId}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-4">
                          <Store className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-lg">{storeItems[0]?.storeName}</h3>
                          <Badge variant="outline" className="text-xs">
                            {storeItems.length} item{storeItems.length > 1 ? 's' : ''}
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          {storeItems.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <img 
                                  src={item.image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=80"} 
                                  alt={item.name}
                                  className="w-16 h-16 rounded-lg object-cover"
                                />
                                <div className="flex-1">
                                  <h4 className="font-medium">{item.name}</h4>
                                  <p className="text-sm text-gray-600">{item.deliveryOption === "express" ? "VyronaExpress" : item.deliveryOption === "pickup" ? "Store Pickup" : "Group Delivery"}</p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="font-bold text-amber-600">
                                      ₹{Math.round(item.price / 100).toLocaleString()}
                                    </span>
                                    <div className="flex items-center space-x-1">
                                      <Coins className="h-3 w-3 text-yellow-500" />
                                      <span className="text-xs text-green-600">
                                        +{Math.floor(item.price / 10000)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                  >
                                    -
                                  </Button>
                                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                                  >
                                    +
                                  </Button>
                                </div>
                                
                                <div className="text-right">
                                  <p className="font-bold">
                                    ₹{Math.round((item.price * item.quantity) / 100).toLocaleString()}
                                  </p>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => removeFromCart(item.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    )
                  })}
                </div>

                {/* Order Summary */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Subtotal ({getTotalItems()} items)</span>
                        <span>₹{Math.round(getTotalPrice() / 100).toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span className={getDeliveryFee() === 0 ? "text-green-600" : ""}>
                          {getDeliveryFee() === 0 ? "FREE" : `₹${getDeliveryFee()}`}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>VyronaCoins Earned</span>
                        <span className="text-green-600">+{Math.floor(getTotalPrice() / 10000)}</span>
                      </div>
                      
                      <div className="border-t pt-3">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span>₹{Math.round((getTotalPrice() + getDeliveryFee() * 100) / 100).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Delivery Information</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>📍 Delivering to: {selectedMall.location}</p>
                        <p>🕐 Estimated delivery: {deliveryOption === "express" ? "90 minutes" : deliveryOption === "pickup" ? "Ready for pickup" : "2 hours (shared)"}</p>
                        <p>🏪 From {new Set(mallCart.map(item => item.storeId)).size} store{new Set(mallCart.map(item => item.storeId)).size > 1 ? 's' : ''} in {selectedMall.name}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 space-y-3">
                      <Button 
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={() => {
                          // Save cart to localStorage and redirect to checkout
                          localStorage.setItem('mallCart', JSON.stringify(mallCart));
                          setShowCartModal(false);
                          setLocation("/mallcart-checkout");
                        }}
                      >
                        Proceed to Checkout - ₹{Math.round((getTotalPrice() + getDeliveryFee() * 100) / 100).toLocaleString()}
                      </Button>
                      
                      <div className="flex space-x-3">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setShowGroupModal(true)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Share with Friends
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setShowCartModal(false)}
                        >
                          Continue Shopping
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Group MallCart Modal */}
      {showGroupCartModal && (
        <Dialog open={showGroupCartModal} onOpenChange={setShowGroupCartModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Group MallCart
                </span>
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                  {groupMallCart.length} items
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {groupMallCart.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Your Group Cart is Empty</h3>
                    <p className="text-gray-500">Add items to your group cart using the "Add to Group MallCart" button on products</p>
                  </div>
                  <Button 
                    onClick={() => setShowGroupCartModal(false)}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <>
                  {/* Group Cart Items */}
                  <div className="space-y-3">
                    {groupMallCart.map((item: any, index: number) => (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                              {item.imageUrl ? (
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Package className="h-8 w-8 text-gray-400" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{item.name}</h4>
                              <p className="text-sm text-gray-500">{item.storeName}</p>
                              {item.groupName && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <Users className="h-3 w-3 text-blue-500" />
                                  <span className="text-xs text-blue-600">{item.groupName}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-right">
                              <p className="font-medium text-gray-900">₹{Math.round(item.price / 100)}</p>
                              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updatedCart = groupMallCart.filter((_, i) => i !== index);
                                setGroupMallCart(updatedCart);
                                localStorage.setItem('groupMallCart', JSON.stringify(updatedCart));
                              }}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              ×
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Group Cart Summary */}
                  <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-medium text-gray-900">Group Cart Total</span>
                        <span className="text-xl font-bold text-blue-600">
                          ₹{Math.round(groupMallCart.reduce((total: number, item: any) => total + ((item.price / 100) * item.quantity), 0))}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span>Items will be shared with your group members</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4 text-green-500" />
                          <span>Shared delivery costs reduce individual expenses</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => setShowGroupCartModal(false)}
                          variant="outline"
                          className="flex-1"
                        >
                          Continue Shopping
                        </Button>
                        <Button 
                          onClick={() => {
                            setShowGroupCartModal(false);
                            setLocation("/group-mallcart-checkout");
                          }}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Proceed to Group Checkout
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Group Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to delete "{selectedGroupForAction?.name}"? This action cannot be undone and will remove all group data including messages and shared cart items.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setSelectedGroupForAction(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedGroupForAction) {
                  deleteGroupMutation.mutate(selectedGroupForAction.id);
                }
                setShowDeleteConfirm(false);
                setSelectedGroupForAction(null);
              }}
            >
              Delete Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit Group Confirmation Dialog */}
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exit Group</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to leave "{selectedGroupForAction?.name}"? You'll lose access to the group chat and shared cart.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowExitConfirm(false);
                setSelectedGroupForAction(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedGroupForAction) {
                  exitGroupMutation.mutate(selectedGroupForAction.id);
                }
                setShowExitConfirm(false);
                setSelectedGroupForAction(null);
              }}
            >
              Exit Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}