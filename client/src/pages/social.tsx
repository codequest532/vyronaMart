import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  MessageCircle, 
  Plus, 
  ShoppingCart,
  Send,
  ArrowLeft,
  ShoppingBag,
  Search,
  Package,
  Crown,
  UserPlus,
  X,
  Share,
  Trash2,
  ChevronUp,
  ChevronDown,
  Minus
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

// Form schemas
const createRoomSchema = z.object({
  name: z.string().min(3, "Room name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

const joinRoomSchema = z.object({
  code: z.string().min(6, "Room code must be at least 6 characters"),
});

const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

type CreateRoomForm = z.infer<typeof createRoomSchema>;
type JoinRoomForm = z.infer<typeof joinRoomSchema>;
type MessageForm = z.infer<typeof messageSchema>;

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
  
  // State
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isJoinRoomOpen, setIsJoinRoomOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Authentication check
  const { data: authUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/current-user"],
    retry: false,
  });

  // Fetch rooms
  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ["/api/shopping-rooms"],
    enabled: !!authUser,
  });

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
    enabled: !!authUser,
  });

  // Room cart data
  const { data: roomCart, refetch: refetchCart } = useQuery({
    queryKey: ["/api/room-cart", selectedRoomId],
    enabled: !!selectedRoomId,
  });

  // Forms
  const createRoomForm = useForm<CreateRoomForm>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: { name: "", description: "" },
  });

  const joinRoomForm = useForm<JoinRoomForm>({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: { code: "" },
  });

  const messageForm = useForm<MessageForm>({
    resolver: zodResolver(messageSchema),
    defaultValues: { message: "" },
  });

  // Mutations
  const createRoomMutation = useMutation({
    mutationFn: async (data: CreateRoomForm) => {
      return apiRequest("/api/shopping-rooms", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: "Room created successfully!" });
      setIsCreateRoomOpen(false);
      createRoomForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-rooms"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error creating room", description: error.message, variant: "destructive" });
    },
  });

  const joinRoomMutation = useMutation({
    mutationFn: async (data: JoinRoomForm) => {
      return apiRequest("/api/shopping-rooms/join", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: "Joined room successfully!" });
      setIsJoinRoomOpen(false);
      joinRoomForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-rooms"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error joining room", description: error.message, variant: "destructive" });
    },
  });

  const addToRoomCartMutation = useMutation({
    mutationFn: async ({ productId, roomId }: { productId: number; roomId: number }) => {
      return apiRequest("/api/room-cart/add", {
        method: "POST",
        body: JSON.stringify({ productId, roomId, quantity: 1 }),
      });
    },
    onSuccess: () => {
      toast({ title: "Added to room cart!" });
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

  const handleBackToDashboard = () => {
    setLocation("/dashboard");
  };

  const handleAddToRoomCart = (productId: number) => {
    if (!selectedRoomId) {
      toast({ title: "Please select a room first", variant: "destructive" });
      return;
    }
    addToRoomCartMutation.mutate({ productId, roomId: selectedRoomId });
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

  const userRooms = (rooms as any[]) || [];
  const selectedRoom = selectedRoomId ? userRooms.find((room: any) => room.id === selectedRoomId) : null;
  const cartItems = (roomCart as CartItem[]) || [];
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                VyronaSocial
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar - Rooms */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Rooms
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Room</DialogTitle>
                          <DialogDescription>
                            Create a new shopping room for group purchases
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...createRoomForm}>
                          <form onSubmit={createRoomForm.handleSubmit((data) => createRoomMutation.mutate(data))} className="space-y-4">
                            <FormField
                              control={createRoomForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Room Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter room name..." {...field} />
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
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="Describe your room..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" disabled={createRoomMutation.isPending}>
                              {createRoomMutation.isPending ? "Creating..." : "Create Room"}
                            </Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isJoinRoomOpen} onOpenChange={setIsJoinRoomOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Join Room</DialogTitle>
                          <DialogDescription>
                            Enter a room code to join an existing room
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...joinRoomForm}>
                          <form onSubmit={joinRoomForm.handleSubmit((data) => joinRoomMutation.mutate(data))} className="space-y-4">
                            <FormField
                              control={joinRoomForm.control}
                              name="code"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Room Code</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter room code..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" disabled={joinRoomMutation.isPending}>
                              {joinRoomMutation.isPending ? "Joining..." : "Join Room"}
                            </Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {roomsLoading ? (
                      <div className="text-center py-4">Loading rooms...</div>
                    ) : userRooms.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No rooms yet</p>
                        <p className="text-xs opacity-75">Create your first room!</p>
                      </div>
                    ) : (
                      userRooms.map((room: any) => (
                        <Card 
                          key={room.id} 
                          className={`cursor-pointer transition-colors ${
                            selectedRoomId === room.id ? 'bg-purple-50 border-purple-200' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedRoomId(room.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">{room.name}</h4>
                              {room.creatorId === authUser?.id && (
                                <Badge variant="secondary" className="text-xs">
                                  <Crown className="w-3 h-3 mr-1" />
                                  Owner
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {room.memberCount || 0} members
                              </span>
                              <Badge variant="outline" className="text-xs">
                                ₹{room.totalCart || 0}
                              </Badge>
                            </div>
                            {room.roomCode && (
                              <div className="mt-2 text-xs text-gray-400">
                                Code: {room.roomCode}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Products */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Products
                  {selectedRoom && (
                    <Badge variant="outline" className="ml-auto">
                      Adding to: {selectedRoom.name}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {productsLoading ? (
                      <div className="col-span-full text-center py-8">Loading products...</div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No products found</p>
                      </div>
                    ) : (
                      filteredProducts.map((product: any) => (
                        <Card key={product.id} className="overflow-hidden">
                          <div className="aspect-square bg-gray-100 relative">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Package className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute top-2 right-2">
                              <Badge>{product.category}</Badge>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-lg">₹{product.price}</span>
                              <Button 
                                size="sm" 
                                disabled={!selectedRoomId || addToRoomCartMutation.isPending}
                                onClick={() => handleAddToRoomCart(product.id)}
                              >
                                <ShoppingBag className="w-4 h-4 mr-1" />
                                Add to Room
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Room Cart */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Room Cart
                  {selectedRoom && (
                    <Badge variant="outline" className="text-xs ml-auto">
                      {selectedRoom.name}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedRoomId ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Select a room to view cart</p>
                  </div>
                ) : (
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
                          Proceed to Checkout
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      {selectedRoomId && (
        <div 
          className="fixed bottom-0 right-4 bg-white dark:bg-gray-900 shadow-2xl rounded-t-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out z-50" 
          style={{ 
            width: '280px',
            height: isChatMinimized ? '48px' : '400px'
          }}
        >
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

            {/* Chat Content */}
            {!isChatMinimized && (
              <>
                <div className="flex-1 px-3 py-2 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-2">
                      <div className="text-center py-6 text-gray-500">
                        <MessageCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">No messages yet</p>
                        <p className="text-xs opacity-75">Start chatting!</p>
                      </div>
                    </div>
                  </ScrollArea>
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t">
                  <Form {...messageForm}>
                    <form onSubmit={messageForm.handleSubmit((data) => {
                      // Send message logic would go here
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

          {/* Overlay for mobile */}
          {!isChatMinimized && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-20 z-40 lg:hidden"
              onClick={() => setIsChatMinimized(true)}
            />
          )}
        </div>
      )}
    </div>
  );
}