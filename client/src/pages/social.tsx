import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GroupCartModal } from "@/components/GroupCartModal";
import { useGroupBuyCartStore } from "@/lib/cart-store";
import { 
  Users, 
  MessageCircle, 
  Share2, 
  Plus, 
  ThumbsUp, 
  ThumbsDown,
  ShoppingCart,
  Send,
  Calendar,
  Gift,
  Bell,
  Settings,
  Crown,
  Heart,
  Star,
  Filter,
  Clock,
  Lock,
  Globe,
  TrendingUp,
  Code,
  UserPlus,
  Vote,
  Package,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Eye,
  Wallet,
  MapPin,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  MoreVertical,
  Share,
  Trash2,
  ShoppingBag,
  Search,
  LayoutGrid,
  List,
  DoorOpen
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

// Cart Display Component
const CartDisplay = ({ cartData, selectedRoomId, refetchCart, setLocation }: any) => {
  console.log('CartDisplay - cartData:', cartData);
  console.log('CartDisplay - typeof cartData:', typeof cartData);
  console.log('CartDisplay - Array.isArray(cartData):', Array.isArray(cartData));
  
  const cartItems = Array.isArray(cartData) ? cartData : [];
  
  if (cartItems.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">Group Cart is Empty</h3>
        <p className="text-sm">Add products to start shopping together!</p>
        <p className="text-xs mt-2">Products added by any room member will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cart Items */}
      <div className="space-y-3">
        {cartItems.map((item: any) => (
          <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <img 
                src={item.imageUrl || "/api/placeholder/60/60"} 
                alt={item.name}
                className="w-12 h-12 object-cover rounded"
              />
              <div>
                <h4 className="font-medium text-gray-900">{item.name}</h4>
                <p className="text-sm text-gray-500">{item.description}</p>
                <p className="text-sm font-medium text-blue-600">₹{item.price}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/shopping-rooms/${selectedRoomId}/remove-cart-item`, {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ productId: item.productId })
                    });
                    if (response.ok) {
                      refetchCart();
                    }
                  } catch (error) {
                    console.error('Error removing item:', error);
                  }
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-700">Cart Summary</span>
          <span className="text-lg font-semibold text-blue-600">
            ₹{cartItems.reduce((total: number, item: any) => total + (item.price * item.quantity), 0)}
          </span>
        </div>
        <Button 
          className="w-full mt-3"
          onClick={() => setLocation(`/place-order/${selectedRoomId}`)}
          disabled={cartItems.length === 0}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Place Group Order ({cartItems.length} items)
        </Button>
      </div>
    </div>
  );
};

// Form schemas
const createRoomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  description: z.string().optional(),
  addMembers: z.array(z.string()).optional()
});

const joinRoomSchema = z.object({
  roomCode: z.string().min(6, "Room code must be at least 6 characters")
});

const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty")
});

type CreateRoomForm = z.infer<typeof createRoomSchema>;
type JoinRoomForm = z.infer<typeof joinRoomSchema>;
type MessageForm = z.infer<typeof messageSchema>;

export default function VyronaSocial() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { items: groupBuyItems, addItem: addGroupBuyItem } = useGroupBuyCartStore();
  const [location, setLocation] = useLocation();
  
  // Authentication check
  const { data: authUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/current-user"],
    retry: false,
  });
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !authUser) {
      setLocation("/login");
    }
  }, [authUser, userLoading, setLocation]);
  
  // Show loading while checking authentication
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Don't render if not authenticated
  if (!authUser) {
    return null;
  }
  
  const [currentView, setCurrentView] = useState<"dashboard" | "room">("dashboard");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showRoomInterface, setShowRoomInterface] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [selectedRoomForInvite, setSelectedRoomForInvite] = useState<number | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [groupCartModalOpen, setGroupCartModalOpen] = useState(false);
  const [selectedProductForGroupCart, setSelectedProductForGroupCart] = useState<any>(null);
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch data
  const { data: userGroups, isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/vyronasocial/rooms"],
  });

  // Use correct variable names for rooms
  const rooms = userGroups;
  const roomsLoading = groupsLoading;

  const { data: groupBuyProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/social/products"],
  });

  const { data: notifications } = useQuery({
    queryKey: ["/api/social/notifications"],
  });

  // Fetch available users for invitations
  const { data: availableUsers } = useQuery({
    queryKey: ["/api/users"],
  });



  // Fetch shared cart for selected room
  const { data: rawCartData, isLoading: cartLoading, refetch: refetchCart } = useQuery({
    queryKey: [`/api/shopping-rooms/${selectedRoomId}/cart`],
    enabled: !!selectedRoomId,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    gcTime: 0, // Don't cache the data
  });

  // Ensure we have an array for cart data
  const sharedCart = Array.isArray(rawCartData) ? rawCartData : [];
  
  // Debug cart data flow
  console.log('DEBUG CART FLOW:');
  console.log('selectedRoomId:', selectedRoomId);
  console.log('rawCartData:', rawCartData);
  console.log('sharedCart:', sharedCart);
  console.log('cartLoading:', cartLoading);



  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    if (!groupBuyProducts) return [];
    
    let filtered = [...(groupBuyProducts as any[])];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product =>
        product.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price-high":
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "discount":
        filtered.sort((a, b) => (b.groupBuyDiscount || 0) - (a.groupBuyDiscount || 0));
        break;
      case "popular":
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case "newest":
      default:
        filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
    }

    return filtered;
  }, [groupBuyProducts, searchQuery, selectedCategory, sortBy]);

  // Forms
  const createRoomForm = useForm<CreateRoomForm>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: "",
      description: ""
    }
  });

  const joinRoomForm = useForm<JoinRoomForm>({
    resolver: zodResolver(joinRoomSchema)
  });

  const messageForm = useForm<MessageForm>({
    resolver: zodResolver(messageSchema)
  });

  // Mutations
  const createRoomMutation = useMutation({
    mutationFn: async (data: CreateRoomForm) => {
      const requestData = {
        ...data,
        addMembers: selectedUsers
      };
      
      const response = await fetch("/api/vyronasocial/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create room");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Shopping Room Created",
        description: selectedUsers.length > 0 
          ? `Room created with ${selectedUsers.length} members added!`
          : "Your room is ready for shopping together!"
      });
      setShowCreateRoom(false);
      createRoomForm.reset();
      setSelectedUsers([]);
      setUserSearchQuery("");
      // Invalidate both VyronaSocial rooms and shopping rooms for checkout
      queryClient.invalidateQueries({ queryKey: ["/api/vyronasocial/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-rooms"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Room",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const joinRoomMutation = useMutation({
    mutationFn: async (data: JoinRoomForm) => {
      const response = await fetch("/api/vyronasocial/rooms/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to join room");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const isAlreadyMember = data.alreadyMember;
      toast({
        title: isAlreadyMember ? "Already a Member" : "Joined Room",
        description: isAlreadyMember 
          ? `You are already a member of ${data.roomName || 'this room'}`
          : `Welcome to ${data.roomName || 'the shopping room'}!`
      });
      setShowJoinRoom(false);
      joinRoomForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/vyronasocial/rooms"] });
      
      // If successfully joined or already a member, navigate to the room
      if (data.roomId) {
        setSelectedRoomId(data.roomId);
        setShowRoomInterface(true);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error Joining Room",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete Room Mutation (Admin Only)
  const deleteRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      const response = await fetch(`/api/vyronasocial/rooms/${roomId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete room");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Room Deleted",
        description: "The shopping room has been deleted successfully."
      });
      setCurrentView("dashboard");
      setSelectedRoomId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/vyronasocial/rooms"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Deleting Room",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Exit Room Mutation
  const exitRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      const response = await fetch(`/api/vyronasocial/rooms/${roomId}/exit`, {
        method: "POST",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to exit room");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Exited Room",
        description: "You have left the shopping room."
      });
      setCurrentView("dashboard");
      setSelectedRoomId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/vyronasocial/rooms"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Exiting Room",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle pending group buy product from VyronaHub
  useEffect(() => {
    const pendingProduct = localStorage.getItem('pendingGroupBuyProduct');
    if (pendingProduct) {
      const product = JSON.parse(pendingProduct);
      toast({
        title: "Group Buy Product Ready",
        description: `${product.name} is ready for group purchase. Select or create a room to continue.`
      });
      localStorage.removeItem('pendingGroupBuyProduct');
    }
  }, []);

  const handleEnterRoom = (roomId: number) => {
    setSelectedRoomId(roomId);
    setCurrentView("room");
  };

  const handleLeaveRoom = () => {
    setSelectedRoomId(null);
    setCurrentView("dashboard");
  };

  const handleBackToDashboard = () => {
    setLocation("/home");
  };

  // Hero Section Component with Active Rooms
  const HeroSection = () => (
    <div className="space-y-4">
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white p-6 rounded-2xl shadow-lg">
        <div className="relative z-10">
          <div className="flex items-center justify-center mb-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-2 tracking-tight">
            VyronaSocial
          </h1>
          <p className="text-sm text-center mb-4 opacity-90">
            Shop Together. Save Together.
          </p>
          
          <div className="flex justify-center gap-3">
            <Button 
              onClick={() => setShowCreateRoom(true)}
              size="sm"
              className="bg-white text-purple-600 hover:bg-gray-100 font-medium px-4 py-2 rounded-lg"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create Room
            </Button>
            
            <Button 
              onClick={() => setShowJoinRoom(true)}
              size="sm"
              variant="outline"
              className="border border-white text-white hover:bg-white hover:text-purple-600 font-medium px-4 py-2 rounded-lg backdrop-blur-sm bg-white/10"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Join Room
            </Button>
          </div>
        </div>
      </div>


    </div>
  );

  // Room Dashboard Component
  const RoomDashboard = () => (
    <div className="space-y-8">
      {/* Search and Filter Section */}
      <Card className="border-0 bg-white dark:bg-gray-800 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Category Filter */}
            <div className="flex-1 max-w-xs">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="fashion">Fashion</SelectItem>
                  <SelectItem value="home">Home & Garden</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="books">Books</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
            </div>

            {/* Sort Filter */}
            <div className="flex-1 max-w-xs">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                  <SelectValue placeholder="Newest First" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="discount">Highest Discount</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                className="p-2 border-gray-300 dark:border-gray-600"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                className="p-2 border-gray-300 dark:border-gray-600"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Featured Group Buy Products */}
      <Card className="border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  VyronaSocial Exclusive
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Products available for group buying with exclusive discounts
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-40 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-6 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl w-fit mx-auto mb-4">
                <Package className="w-16 h-16 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery || selectedCategory !== "all" ? "No Products Found" : "No Products Available"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery || selectedCategory !== "all" 
                  ? "Try adjusting your search or filter criteria" 
                  : "Check back later for exclusive group buy deals"
                }
              </p>
            </div>
          ) : (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" 
              : "space-y-4"
            }>
              {filteredAndSortedProducts.slice(0, 20).map((product: any) => (
                <Card 
                  key={product.id} 
                  className="group cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-0 bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-800 dark:to-orange-900/20 overflow-hidden"
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="relative">
                    <img 
                      src={product.imageUrl || "/api/placeholder/150/120"} 
                      alt={product.name}
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute top-1 left-1">
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-xs">
                        {product.groupBuyDiscount || 10}% OFF
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-2">
                    <h4 className="font-semibold text-xs mb-1 line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {product.name}
                    </h4>
                    
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-sm font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        ₹{Math.round((product.price / 100) * (1 - (product.groupBuyDiscount || 10) / 100)).toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500 line-through">
                        ₹{(product.price / 100).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-blue-600" />
                        <span className="text-xs text-blue-600 font-medium">
                          {product.groupBuyMinQuantity || 4}+
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 px-1 py-0">
                        Deal
                      </Badge>
                    </div>
                    
                    <Button 
                      size="sm" 
                      className="w-full h-6 text-xs bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
                      onClick={async (e) => {
                        e.stopPropagation();
                        
                        if (!selectedRoomId) {
                          toast({
                            title: "No Room Selected",
                            description: "Please select or enter a room first",
                            variant: "destructive"
                          });
                          return;
                        }

                        try {
                          const response = await fetch(`/api/shopping-rooms/${selectedRoomId}/add-cart-item`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              productId: product.id,
                              quantity: 1,
                              addedAt: new Date().toISOString()
                            })
                          });

                          if (response.ok) {
                            toast({
                              title: "Added to Group Cart",
                              description: `${product.name} added for group purchase`,
                            });
                            // Refresh the shared cart
                            queryClient.invalidateQueries({ queryKey: [`/api/shopping-rooms/${selectedRoomId}/cart`] });
                          } else {
                            const error = await response.json();
                            toast({
                              title: "Failed to Add Item",
                              description: error.message || "Could not add item to group cart",
                              variant: "destructive"
                            });
                          }
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to add item to group cart",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      <ShoppingBag className="w-3 h-3 mr-1" />
                      Add to Group
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Join a shopping room to start group buying and unlock these discounts
            </p>
            <Button 
              onClick={() => setShowCreateRoom(true)} 
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Shopping Room
            </Button>
          </div>
        </CardContent>
      </Card>


    </div>
  );

  // Create Room Card Component
  const CreateRoomCard = () => (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Shopping Room</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...createRoomForm}>
          <form onSubmit={createRoomForm.handleSubmit((data) => createRoomMutation.mutate(data))} className="space-y-4">
            <FormField
              control={createRoomForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Fashion Friday Deals" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />



            <FormField
              control={createRoomForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What are you shopping for?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Add Users Section */}
            <div className="space-y-3">
              <FormLabel>Add Members (Optional)</FormLabel>
              
              {/* User Search */}
              <div className="relative">
                <Input
                  placeholder="Search users by username or email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>

              {/* Available Users List */}
              {userSearchQuery && (
                <div className="max-h-32 overflow-y-auto border rounded-lg bg-white dark:bg-gray-800">
                  {(availableUsers as any[])?.filter((user: any) => 
                    user.username?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                    user.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
                  ).slice(0, 5).map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => {
                        if (!selectedUsers.includes(user.username)) {
                          setSelectedUsers([...selectedUsers, user.username]);
                        }
                        setUserSearchQuery("");
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {user.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{user.username}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Selected Users ({selectedUsers.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((username) => (
                      <div
                        key={username}
                        className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-lg text-sm"
                      >
                        <span>{username}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedUsers(selectedUsers.filter(u => u !== username))}
                          className="text-purple-500 hover:text-purple-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={createRoomMutation.isPending}>
              {createRoomMutation.isPending ? "Creating..." : "Create Room"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  // Room Interface Component
  const RoomInterface = () => {
    const { data: allRooms } = useQuery({
      queryKey: ["/api/vyronasocial/rooms"]
    });

    const roomData = Array.isArray(allRooms) ? allRooms.find((room: any) => room.id === selectedRoomId) : null;

    const { data: roomMessages } = useQuery({
      queryKey: ["/api/social/groups", selectedRoomId, "messages"],
      enabled: !!selectedRoomId
    });

    const { data: roomMembers } = useQuery({
      queryKey: ["/api/social/groups", selectedRoomId, "members"],
      enabled: !!selectedRoomId
    });

    const { data: sharedCart } = useQuery({
      queryKey: ["/api/cart", selectedRoomId],
      enabled: !!selectedRoomId
    });

    return (
      <div className="space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={handleLeaveRoom}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to VyronaSocial
        </Button>

        {/* Modern Room Header */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {roomData?.name || "Shopping Room"}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Live Session
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Users className="w-3 h-3 mr-1" />
                    {roomData?.memberCount || 1} members
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    {roomData?.category || "General"}
                  </Badge>
                  {roomData?.roomCode && (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 font-mono">
                      Code: {roomData.roomCode}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-2 hover:bg-purple-50 hover:border-purple-300">
                <Share className="w-4 h-4" />
                Invite Friends
              </Button>
              
              {roomData?.creatorId === authUser?.id ? (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => deleteRoomMutation.mutate(selectedRoomId!)}
                  disabled={deleteRoomMutation.isPending}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleteRoomMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exitRoomMutation.mutate(selectedRoomId!)}
                  disabled={exitRoomMutation.isPending}
                  className="gap-2"
                >
                  {exitRoomMutation.isPending ? "Exiting..." : "Exit Room"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Room Interface - Group Cart */}
        <div className="flex justify-center">
          {/* Group Cart with Checkout */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Group Cart
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Cart Items Display */}
                <div className="space-y-4">
                  <CartDisplay 
                    cartData={sharedCart} 
                    selectedRoomId={selectedRoomId} 
                    refetchCart={refetchCart}
                    setLocation={setLocation}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat Sidebar - Compact design */}
          <div className="fixed bottom-0 right-4 bg-white dark:bg-gray-900 shadow-2xl rounded-t-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out z-50" 
               style={{ 
                 width: '280px',
                 height: isChatMinimized ? '48px' : '400px'
               }}>
            <div className="flex flex-col h-full">
              {/* Chat Header */}
              <div className="p-3 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm">Group Chat</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChatMinimized(!isChatMinimized)}
                  title={isChatMinimized ? "Expand Chat" : "Minimize Chat"}
                  className="h-8 w-8 p-0"
                >
                  {isChatMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>

              {/* Chat Content - Only visible when not minimized */}
              {!isChatMinimized && (
                <>
                  {/* Participants Section - Compact */}
                  <div className="px-3 py-2 border-b bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <h4 className="font-medium text-xs">Members ({(roomMembers as any[])?.length || 0})</h4>
                      </div>
                      <div className="flex -space-x-1">
                        {(roomMembers as any[])?.slice(0, 3).map((member: any) => (
                          <Avatar key={member.id} className="w-5 h-5 border border-white">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs bg-purple-100 text-purple-700">{member.username?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                        ))}
                        {(roomMembers as any[])?.length > 3 && (
                          <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium border border-white">
                            +{(roomMembers as any[]).length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages - Compact */}
                  <div className="flex-1 px-3 py-2 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="space-y-2">
                        {(roomMessages as any[])?.map((message: any) => (
                          <div key={message.id} className="flex gap-2 text-xs">
                            <Avatar className="w-5 h-5 flex-shrink-0">
                              <AvatarFallback className="text-xs bg-purple-100 text-purple-700">{message.username?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <p className="font-medium text-xs truncate">{message.username}</p>
                                <p className="text-xs text-gray-400">•</p>
                                <p className="text-xs text-gray-400">now</p>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{message.content}</p>
                            </div>
                          </div>
                        ))}
                        {(roomMessages as any[])?.length === 0 && (
                          <div className="text-center py-6 text-gray-500">
                            <MessageCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">No messages yet</p>
                            <p className="text-xs opacity-75">Start chatting!</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 border-t">
                    <Form {...messageForm}>
                      <form onSubmit={messageForm.handleSubmit((data) => {
                        // Send message logic
                        messageForm.reset();
                      })} className="flex gap-2">
                        <FormField
                          control={messageForm.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input placeholder="Type a message..." {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button type="submit" size="sm">
                          <Send className="w-4 h-4" />
                        </Button>
                      </form>
                    </Form>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Overlay when chat is open */}
          {!isChatMinimized && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-20 z-40 lg:hidden"
              onClick={() => setIsChatMinimized(true)}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBackToDashboard}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                VyronaSocial
              </h1>
            </div>
          </div>
        </div>
      </div>

      {currentView === "dashboard" ? (
        <div className="flex">
          {/* Active Rooms Sidebar */}
          <div className="w-64 bg-white dark:bg-gray-900 border-r min-h-screen p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-base">Active Rooms</h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Shopping rooms</p>
                </div>
              </div>



              {/* Active Rooms List */}
              <div className="space-y-2">
                {roomsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : (rooms as any[])?.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg w-fit mx-auto mb-2">
                      <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium text-sm">No active rooms</p>
                    <p className="text-xs text-gray-500 mt-1">Create one to start shopping</p>
                  </div>
                ) : (
                  (rooms as any[])?.map((room: any) => (
                    <Card 
                      key={room.id} 
                      className="group cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-200 border-0 bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-800 dark:to-purple-900/20"
                      onClick={() => {
                        setSelectedRoomId(room.id);
                        setCurrentView("room");
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm mb-0.5 truncate group-hover:text-purple-600 transition-colors">
                              {room.name}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                              {room.description || "No description"}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-shrink-0 p-1 h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRoomForInvite(room.id);
                              setShowInviteDialog(true);
                            }}
                          >
                            <UserPlus className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center gap-0.5">
                                <Users className="w-3 h-3 text-blue-600" />
                                <span className="text-blue-600 font-medium">{room.memberCount || 0}</span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <ShoppingCart className="w-3 h-3 text-green-600" />
                                <span className="text-green-600 font-medium">₹{(room.totalCart || 0).toLocaleString()}</span>
                              </div>
                            </div>
                            <Badge 
                              variant={room.isActive ? "default" : "secondary"} 
                              className={`text-xs px-1.5 py-0 ${room.isActive ? 'bg-green-100 text-green-700 border-green-200' : ''}`}
                            >
                              {room.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          
                          {/* Checkout Button */}
                          {(room.memberCount || 0) >= 2 ? (
                            <Button
                              size="sm"
                              className="w-full h-7 text-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/place-order/${room.id}`);
                              }}
                            >
                              <Wallet className="w-3 h-3 mr-1" />
                              Checkout with VyronaWallet
                            </Button>
                          ) : (
                            <div className="space-y-1">
                              <Button
                                size="sm"
                                disabled
                                className="w-full h-7 text-xs bg-gray-300 text-gray-500 cursor-not-allowed"
                              >
                                <Users className="w-3 h-3 mr-1" />
                                Need 2+ Members
                              </Button>
                              <p className="text-xs text-orange-600 text-center">
                                Invite {2 - (room.memberCount || 0)} more member{2 - (room.memberCount || 0) === 1 ? '' : 's'} to enable checkout
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-6">
            <HeroSection />
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      VyronaSocial Exclusives
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Discover trending items and group buy deals
                    </p>
                  </div>
                </div>
              </div>

              {/* Product Grid */}
              {productsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (groupBuyProducts as any[])?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl w-fit mx-auto mb-3">
                    <Package className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">No products available</p>
                  <p className="text-sm text-gray-500 mt-1">Check back later for exclusive deals</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {(groupBuyProducts as any[])?.map((product: any) => (
                    <Card 
                      key={product.id} 
                      className="group cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all duration-200 border-0 bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-800 dark:to-purple-900/20 overflow-hidden"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="relative">
                        <img 
                          src={product.imageUrl || "/api/placeholder/300/200"} 
                          alt={product.name}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold">
                            {product.groupBuyDiscount || 10}% OFF
                          </Badge>
                        </div>
                      </div>
                      
                      <CardContent className="p-3">
                        <h4 className="font-medium text-sm mb-1 line-clamp-1 group-hover:text-purple-600 transition-colors">
                          {product.name}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                          {product.description}
                        </p>
                        
                        <div className="flex items-center gap-1 mb-2">
                          <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            ₹{Math.round((product.price / 100) * (1 - (product.groupBuyDiscount || 10) / 100)).toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500 line-through">
                            ₹{(product.price / 100).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-blue-600" />
                            <span className="text-xs text-blue-600 font-medium">
                              Min {product.groupBuyMinQuantity || 4}
                            </span>
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs px-1 py-0">
                            Group
                          </Badge>
                        </div>
                        
                        <Button 
                          size="sm" 
                          className="w-full text-xs h-7 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProductForGroupCart(product);
                            setGroupCartModalOpen(true);
                          }}
                        >
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          Add to Group Cart
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-6">
          <RoomInterface />
        </div>
      )}

      {/* Create Room Dialog */}
      <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Shopping Room</DialogTitle>
            <DialogDescription>
              Set up a new room for shopping with friends
            </DialogDescription>
          </DialogHeader>
          <CreateRoomCard />
        </DialogContent>
      </Dialog>

      {/* Join Room Dialog */}
      <Dialog open={showJoinRoom} onOpenChange={setShowJoinRoom}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Join Shopping Room</DialogTitle>
            <DialogDescription>
              Enter the room code to join an existing shopping session
            </DialogDescription>
          </DialogHeader>
          <Form {...joinRoomForm}>
            <form onSubmit={joinRoomForm.handleSubmit((data) => joinRoomMutation.mutate(data))} className="space-y-4">
              <FormField
                control={joinRoomForm.control}
                name="roomCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter 6-digit code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={joinRoomMutation.isPending}>
                {joinRoomMutation.isPending ? "Joining..." : "Join Room"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{selectedProduct.name}</DialogTitle>
              <DialogDescription>
                Complete product details and group buying information
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Product Images */}
              <div className="space-y-4">
                <div className="relative">
                  <img 
                    src={selectedProduct.imageUrl || "/api/placeholder/500/400"} 
                    alt={selectedProduct.name}
                    className="w-full h-80 object-cover rounded-xl shadow-lg"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg px-3 py-1">
                      {selectedProduct.groupBuyDiscount || 10}% OFF
                    </Badge>
                  </div>
                </div>
                
                {/* Additional product images could go here */}
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <img 
                      key={i}
                      src={selectedProduct.imageUrl || `/api/placeholder/100/100`} 
                      alt={`${selectedProduct.name} view ${i}`}
                      className="w-full h-20 object-cover rounded-lg border-2 border-gray-200 hover:border-purple-400 cursor-pointer transition-colors"
                    />
                  ))}
                </div>
              </div>
              
              {/* Product Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-3">{selectedProduct.name}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star}>★</span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">(4.5/5) · 127 reviews</span>
                  </div>
                </div>
                
                {/* Pricing */}
                <div className="space-y-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      ₹{Math.round((selectedProduct.price / 100) * (1 - (selectedProduct.groupBuyDiscount || 10) / 100)).toLocaleString()}
                    </span>
                    <span className="text-xl text-gray-500 line-through">
                      ₹{(selectedProduct.price / 100).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Users className="w-4 h-4 mr-1" />
                      Min {selectedProduct.groupBuyMinQuantity || 4} orders
                    </Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Group Deal Active
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-green-700 font-medium">
                    Save ₹{Math.round((selectedProduct.price / 100) * (selectedProduct.groupBuyDiscount || 10) / 100).toLocaleString()} with group buying!
                  </p>
                </div>

                {/* Product Description */}
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold">About this product</h4>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedProduct.description}
                  </p>
                </div>

                {/* Key Features */}
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold">Key Features</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">Premium quality materials and construction</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">Advanced technology for superior performance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">Ergonomic design for maximum comfort</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">1-year manufacturer warranty included</span>
                    </li>
                  </ul>
                </div>

                {/* Product Specifications */}
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold">Specifications</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <span className="font-medium text-gray-500">Brand</span>
                      <p className="font-semibold">{selectedProduct.category || 'Premium Brand'}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <span className="font-medium text-gray-500">Model</span>
                      <p className="font-semibold">Pro Series</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <span className="font-medium text-gray-500">Warranty</span>
                      <p className="font-semibold">1 Year</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <span className="font-medium text-gray-500">Category</span>
                      <p className="font-semibold">{selectedProduct.category}</p>
                    </div>
                  </div>
                </div>

                {/* Group Buy Progress */}
                <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Group Buy Progress
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current orders: 2 of {selectedProduct.groupBuyMinQuantity || 4}</span>
                      <span className="font-medium">50% complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                    </div>
                    <p className="text-xs text-gray-600">
                      {(selectedProduct.groupBuyMinQuantity || 4) - 2} more orders needed to activate group discount
                    </p>
                  </div>
                </div>
                
                {/* Add to Group Button */}
                <div className="pt-4">
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={() => {
                      setSelectedProductForGroupCart(selectedProduct);
                      setGroupCartModalOpen(true);
                      setSelectedProduct(null);
                    }}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add to Group Cart
                  </Button>
                  
                  <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Free shipping</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Easy returns</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Secure payment</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Invite Members Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Invite Members
            </DialogTitle>
            <DialogDescription>
              Share this room code with friends to invite them
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Room Code Display */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Room Code</div>
              <div className="text-2xl font-bold font-mono tracking-wider text-purple-600">
                {(() => {
                  const room = Array.isArray(rooms) ? rooms.find((r: any) => r.id === selectedRoomForInvite) : null;
                  return room?.roomCode || "LOADING...";
                })()}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  const room = Array.isArray(rooms) ? rooms.find((r: any) => r.id === selectedRoomForInvite) : null;
                  const roomCode = room?.roomCode || "";
                  if (roomCode) {
                    navigator.clipboard.writeText(roomCode);
                    toast({
                      title: "Copied!",
                      description: "Room code copied to clipboard",
                    });
                  }
                }}
              >
                <Share className="w-4 h-4 mr-2" />
                Copy Code
              </Button>
            </div>

            {/* Quick Share Options */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Quick Share</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Link
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <div className="font-medium mb-1">How to join:</div>
                <ol className="text-xs space-y-1 list-decimal list-inside">
                  <li>Share the room code with friends</li>
                  <li>They can use "Join Room" to enter</li>
                  <li>Start shopping together!</li>
                </ol>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Group Cart Modal */}
      <GroupCartModal
        isOpen={groupCartModalOpen}
        onClose={() => {
          setGroupCartModalOpen(false);
          setSelectedProductForGroupCart(null);
        }}
        product={selectedProductForGroupCart}
        onSuccess={() => {
          // Invalidate cart cache to refresh shared cart display
          queryClient.invalidateQueries({ queryKey: [`/api/cart/${selectedRoomId}`] });
          queryClient.invalidateQueries({ queryKey: ["/api/shopping-rooms"] });
          setGroupCartModalOpen(false);
          setSelectedProductForGroupCart(null);
        }}
      />
    </div>
  );
}