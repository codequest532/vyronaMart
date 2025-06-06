import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Plus, 
  ShoppingCart,
  ArrowLeft,
  ShoppingBag,
  Search,
  Package,
  Crown,
  UserPlus,
  Trash2,
  Minus,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Heart,
  Filter,
  Grid3X3,
  List,
  Bell,
  Sparkles,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

// Form schemas
const createGroupSchema = z.object({
  name: z.string().min(3, "Group name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

const joinGroupSchema = z.object({
  code: z.string().min(6, "Group code must be at least 6 characters"),
});

type CreateGroupForm = z.infer<typeof createGroupSchema>;
type JoinGroupForm = z.infer<typeof joinGroupSchema>;

interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  userId: number;
  roomId: number | null;
  addedAt: Date | null;
  name: string;
  price: number;
  imageUrl?: string | null;
  description?: string;
}

export default function VyronaSocial() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State Management
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isGroupCartOpen, setIsGroupCartOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Authentication check
  const { data: authUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/current-user"],
    retry: false,
  });

  // Fetch groups
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/shopping-rooms"],
    enabled: !!authUser,
  });

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
    enabled: !!authUser,
  });

  // Group cart data
  const { data: groupCart, refetch: refetchCart } = useQuery({
    queryKey: ["/api/room-cart", selectedGroupId],
    enabled: !!selectedGroupId,
  });

  // Forms
  const createGroupForm = useForm<CreateGroupForm>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { name: "", description: "" },
  });

  const joinGroupForm = useForm<JoinGroupForm>({
    resolver: zodResolver(joinGroupSchema),
    defaultValues: { code: "" },
  });

  // Mutations
  const createGroupMutation = useMutation({
    mutationFn: async (data: CreateGroupForm) => {
      return apiRequest("/api/shopping-rooms", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({ title: "Group created successfully!" });
      setIsCreateGroupOpen(false);
      createGroupForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-rooms"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error creating group", description: error.message, variant: "destructive" });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (data: JoinGroupForm) => {
      return apiRequest("/api/shopping-rooms/join", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({ title: "Joined group successfully!" });
      setIsJoinGroupOpen(false);
      joinGroupForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-rooms"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error joining group", description: error.message, variant: "destructive" });
    },
  });

  const addToGroupCartMutation = useMutation({
    mutationFn: async ({ productId, groupId }: { productId: number; groupId: number }) => {
      return apiRequest("/api/room-cart/add", {
        method: "POST",
        body: JSON.stringify({ productId, roomId: groupId, quantity: 1 }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({ title: "Added to group cart!" });
      refetchCart();
    },
    onError: (error: Error) => {
      toast({ title: "Error adding to cart", description: error.message, variant: "destructive" });
    },
  });

  const updateCartQuantityMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: number; quantity: number }) => {
      return apiRequest("/api/room-cart/update", {
        method: "POST",
        body: JSON.stringify({ cartItemId, quantity }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      refetchCart();
    },
    onError: (error: Error) => {
      toast({ title: "Error updating quantity", description: error.message, variant: "destructive" });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (cartItemId: number) => {
      return apiRequest("/api/room-cart/remove", {
        method: "POST",
        body: JSON.stringify({ cartItemId }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({ title: "Removed from cart" });
      refetchCart();
    },
    onError: (error: Error) => {
      toast({ title: "Error removing from cart", description: error.message, variant: "destructive" });
    },
  });

  // Video call functions
  const handleJoinVideoCall = async () => {
    if (!selectedGroupId) {
      toast({ title: "Please select a group first", variant: "destructive" });
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsVideoCallActive(true);
      setIsCameraOn(true);
      setIsMicOn(true);
      toast({ title: "Joined video call successfully!" });
    } catch (error) {
      toast({ title: "Unable to access camera/microphone", variant: "destructive" });
    }
  };

  const handleEndVideoCall = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsVideoCallActive(false);
    setIsCameraOn(false);
    setIsMicOn(false);
    toast({ title: "Left video call" });
  };

  const handleAddToGroupCart = (productId: number) => {
    if (!selectedGroupId) {
      toast({ title: "Please select a group first", variant: "destructive" });
      return;
    }
    addToGroupCartMutation.mutate({ productId, groupId: selectedGroupId });
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading VyronaSocial...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    setLocation("/auth");
    return null;
  }

  const filteredProducts = (products as any[])?.filter((product: any) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const userGroups = (groups as any[]) || [];
  const selectedGroup = selectedGroupId ? userGroups.find((group: any) => group.id === selectedGroupId) : null;
  const cartItems = (groupCart as CartItem[]) || [];
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/20">
      {/* Modern Header with Group Cart */}
      <div className="border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Back button and Logo */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/dashboard")}
                className="flex items-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    VyronaSocial
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Group Shopping Experience</p>
                </div>
              </div>
            </div>

            {/* Center - Search */}
            <div className="hidden md:flex items-center gap-4 flex-1 max-w-md mx-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search exclusive products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>

            {/* Right side - Actions and Group Cart */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500 text-white rounded-full">
                  3
                </Badge>
              </Button>
              
              {/* Video Call Toggle */}
              {selectedGroupId && (
                <Button
                  onClick={() => isVideoCallActive ? handleEndVideoCall() : handleJoinVideoCall()}
                  className={`gap-2 ${isVideoCallActive 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-indigo-500 hover:bg-indigo-600'}`}
                  size="sm"
                >
                  {isVideoCallActive ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                  {isVideoCallActive ? 'End Call' : 'Join Call'}
                </Button>
              )}

              {/* Group Cart Button - Prominent */}
              <Dialog open={isGroupCartOpen} onOpenChange={setIsGroupCartOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2 relative shadow-lg">
                    <ShoppingCart className="h-5 w-5" />
                    Group Cart
                    {cartItems.length > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center text-xs bg-orange-500 text-white rounded-full animate-pulse">
                        {cartItems.length}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Group Cart {selectedGroup && `- ${selectedGroup.name}`}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {cartItems.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Cart is empty</p>
                            <p className="text-xs opacity-75">Add products to start shopping!</p>
                          </div>
                        ) : (
                          cartItems.map((item) => (
                            <Card key={item.id} className="p-3">
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.name}
                                      className="w-full h-full object-cover rounded"
                                    />
                                  ) : (
                                    <Package className="w-6 h-6 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm truncate">{item.name}</h4>
                                  <p className="text-xs text-gray-600 mb-2">₹{item.price}</p>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 w-6 p-0"
                                        onClick={() => {
                                          if (item.quantity > 1) {
                                            updateCartQuantityMutation.mutate({
                                              cartItemId: item.id,
                                              quantity: item.quantity - 1
                                            });
                                          }
                                        }}
                                        disabled={item.quantity <= 1}
                                      >
                                        <Minus className="w-3 h-3" />
                                      </Button>
                                      <span className="text-sm px-2">{item.quantity}</span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 w-6 p-0"
                                        onClick={() => updateCartQuantityMutation.mutate({
                                          cartItemId: item.id,
                                          quantity: item.quantity + 1
                                        })}
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                      onClick={() => removeFromCartMutation.mutate(item.id)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                    
                    {cartItems.length > 0 && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold">Total:</span>
                          <span className="font-bold text-lg">₹{cartTotal}</span>
                        </div>
                        <Button className="w-full" size="sm">
                          Proceed to Group Checkout
                        </Button>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Avatar className="h-8 w-8 ring-2 ring-indigo-200 dark:ring-indigo-800">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  {(authUser as any)?.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      {/* Video Call Overlay */}
      {isVideoCallActive && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-4xl w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Group Video Call - {selectedGroup?.name}</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={isMicOn ? "bg-green-100" : "bg-red-100"}
                >
                  {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCameraOn(!isCameraOn)}
                  className={isCameraOn ? "bg-green-100" : "bg-red-100"}
                >
                  {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleEndVideoCall}
                >
                  <Phone className="h-4 w-4" />
                  End Call
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg aspect-video flex items-center justify-center">
                <p className="text-gray-500">Other participants</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content with Modern Layout */}
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="groups" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="groups" className="gap-2">
              <Users className="h-4 w-4" />
              Shopping Groups
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Exclusive Products
            </TabsTrigger>
          </TabsList>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Shopping Groups
                </h2>
                <p className="text-gray-600 dark:text-gray-400">Join groups and shop together with exclusive deals</p>
              </div>
              <div className="flex gap-3">
                <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 gap-2">
                      <Plus className="h-4 w-4" />
                      Create Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-600" />
                        Create Shopping Group
                      </DialogTitle>
                      <DialogDescription>
                        Start a new group for collaborative shopping with exclusive discounts
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...createGroupForm}>
                      <form onSubmit={createGroupForm.handleSubmit((data) => createGroupMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={createGroupForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Group Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Weekend Electronics Deal..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createGroupForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="What kind of products are you looking to buy together?" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={createGroupMutation.isPending} className="w-full">
                          {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isJoinGroupOpen} onOpenChange={setIsJoinGroupOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Join Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-green-600" />
                        Join Shopping Group
                      </DialogTitle>
                      <DialogDescription>
                        Enter a group code to join an existing shopping group
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...joinGroupForm}>
                      <form onSubmit={joinGroupForm.handleSubmit((data) => joinGroupMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={joinGroupForm.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Group Code</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter 6-digit group code..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={joinGroupMutation.isPending} className="w-full">
                          {joinGroupMutation.isPending ? "Joining..." : "Join Group"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </Card>
                ))
              ) : userGroups.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="p-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl inline-block mb-4">
                    <Users className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No groups yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first shopping group or join an existing one</p>
                  <Button onClick={() => setIsCreateGroupOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Group
                  </Button>
                </div>
              ) : (
                userGroups.map((group: any) => (
                  <Card 
                    key={group.id} 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                      selectedGroupId === group.id 
                        ? 'ring-2 ring-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedGroupId(group.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{group.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{group.description}</p>
                        </div>
                        {group.creatorId === (authUser as any)?.id && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs">
                            <Crown className="w-3 h-3 mr-1" />
                            Owner
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm mb-4">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-500" />
                            {group.memberCount || 0} members
                          </span>
                          <span className="flex items-center gap-1">
                            <ShoppingCart className="w-4 h-4 text-gray-500" />
                            ₹{group.totalCart || 0}
                          </span>
                        </div>
                        {group.roomCode && (
                          <Badge variant="outline" className="text-xs font-mono">
                            {group.roomCode}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGroupId(group.id);
                          }}
                        >
                          Select Group
                        </Button>
                        {selectedGroupId === group.id && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinVideoCall();
                            }}
                            className="gap-1"
                          >
                            <Video className="w-4 h-4" />
                            Call
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Exclusive Products
                </h2>
                <p className="text-gray-600 dark:text-gray-400">VyronaSocial exclusive products with group discounts</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="gap-2"
                >
                  {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                  {viewMode === 'grid' ? 'List' : 'Grid'}
                </Button>
                {selectedGroup && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    Adding to: {selectedGroup.name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Products Grid */}
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {productsLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="animate-pulse">
                      <div className="aspect-square bg-gray-200"></div>
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl inline-block mb-4">
                    <Package className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No products found</h3>
                  <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters</p>
                </div>
              ) : (
                filteredProducts.map((product: any) => (
                  <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-all duration-200">
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-white/90 text-gray-800 shadow-sm">
                          {product.category}
                        </Badge>
                      </div>
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Exclusive
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{product.description}</p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-indigo-600">₹{product.price}</span>
                          <span className="text-sm text-gray-500 line-through">₹{Math.floor(product.price * 1.2)}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          20% OFF
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600" 
                          size="sm"
                          disabled={!selectedGroupId || addToGroupCartMutation.isPending}
                          onClick={() => handleAddToGroupCart(product.id)}
                        >
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          Add to Group
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="px-3"
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}