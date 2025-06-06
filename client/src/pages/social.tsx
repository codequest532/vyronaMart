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
  Gamepad2,
  Trophy,
  Target,
  Zap,
  Coins,
  Search,
  Copy
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Validation schemas
const createRoomSchema = z.object({
  name: z.string().min(1, "Room name is required").max(50, "Room name too long"),
  description: z.string().optional(),
  privacy: z.enum(["public", "private"]),
  maxMembers: z.number().min(2).max(50).default(10)
});

const joinRoomSchema = z.object({
  roomCode: z.string().min(6, "Room code must be 6 characters").max(6, "Room code must be 6 characters")
});

const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(500, "Message too long")
});

type CreateRoomForm = z.infer<typeof createRoomSchema>;
type JoinRoomForm = z.infer<typeof joinRoomSchema>;
type MessageForm = z.infer<typeof messageSchema>;

export default function VyronaSocial() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [activeTab, setActiveTab] = useState("products");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedProductForGroupCart, setSelectedProductForGroupCart] = useState<any>(null);
  const [groupCartModalOpen, setGroupCartModalOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(true);

  // API Queries
  const { data: user } = useQuery({ queryKey: ["/api/current-user"] });
  const { data: users } = useQuery({ queryKey: ["/api/users"] });
  const { data: socialProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/social/products"]
  });
  const { data: notifications } = useQuery({
    queryKey: ["/api/social/notifications"]
  });
  const { data: allRooms } = useQuery({
    queryKey: ["/api/vyronasocial/rooms"]
  });

  // Room-specific queries
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

  // Forms
  const createRoomForm = useForm<CreateRoomForm>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: "",
      description: "",
      privacy: "public",
      maxMembers: 10
    }
  });

  const joinRoomForm = useForm<JoinRoomForm>({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: {
      roomCode: ""
    }
  });

  // Mutations
  const createRoomMutation = useMutation({
    mutationFn: async (data: CreateRoomForm) => {
      const response = await apiRequest("POST", "/api/vyronasocial/rooms", data);
      if (!response.ok) throw new Error("Failed to create room");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vyronasocial/rooms"] });
      createRoomForm.reset();
      setSelectedRoomId(data.id);
      toast({
        title: "Room Created",
        description: `Room "${data.name}" created successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const joinRoomMutation = useMutation({
    mutationFn: async (data: JoinRoomForm) => {
      const response = await apiRequest("POST", "/api/vyronasocial/join-room", data);
      if (!response.ok) throw new Error("Failed to join room");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vyronasocial/rooms"] });
      joinRoomForm.reset();
      setSelectedRoomId(data.roomId);
      toast({
        title: "Joined Room",
        description: "Successfully joined the room",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/social/groups/message", {
        groupId: selectedRoomId,
        content
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/groups", selectedRoomId, "messages"] });
      setNewMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  });

  const exitRoomMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/vyronasocial/exit-room", {
        roomId: selectedRoomId
      });
      if (!response.ok) throw new Error("Failed to exit room");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vyronasocial/rooms"] });
      setSelectedRoomId(null);
      toast({
        title: "Left Room",
        description: "You have left the room",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to exit room",
        variant: "destructive",
      });
    }
  });

  // Event handlers
  const handleCreateRoom = (data: CreateRoomForm) => {
    createRoomMutation.mutate(data);
  };

  const handleJoinRoom = (data: JoinRoomForm) => {
    joinRoomMutation.mutate(data);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && selectedRoomId) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  const handleLeaveRoom = () => {
    setSelectedRoomId(null);
  };

  const handleJoinRoomFromList = (roomId: number) => {
    setSelectedRoomId(roomId);
  };

  // Room interface for when user is in a room
  if (selectedRoomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20">
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={handleLeaveRoom}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Rooms
          </Button>

          {/* Room Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {roomData?.name || 'Room'}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {roomData?.description || 'Welcome to the room'}
                  </p>
                </div>
              </div>

              {user && roomData?.creatorId !== user.id && (
                <Button 
                  variant="outline" 
                  onClick={() => exitRoomMutation.mutate()}
                  disabled={exitRoomMutation.isPending}
                  className="gap-2"
                >
                  {exitRoomMutation.isPending ? "Exiting..." : "Exit Room"}
                </Button>
              )}
            </div>
          </div>

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
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Members ({(roomMembers as any[])?.length || 0})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(roomMembers as any[])?.slice(0, 8).map((member: any) => (
                        <div 
                          key={member.id}
                          className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-700 rounded-full text-xs"
                        >
                          <div className="w-4 h-4 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {member.username?.charAt(0).toUpperCase()}
                          </div>
                          <span className="max-w-16 truncate">{member.username}</span>
                        </div>
                      ))}
                      {(roomMembers as any[])?.length > 8 && (
                        <div className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded-full text-xs text-gray-600 dark:text-gray-400">
                          +{(roomMembers as any[])?.length - 8} more
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-3">
                    <div className="space-y-3">
                      {(roomMessages as any[])?.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        (roomMessages as any[])?.map((message: any) => (
                          <div key={message.id} className="flex gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {message.username?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-gray-900 dark:text-white">
                                  {message.username}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300 break-words">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <form 
                    onSubmit={handleSendMessage}
                    className="p-3 border-t bg-gray-50/50 dark:bg-gray-800/50"
                  >
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 text-xs h-8"
                        disabled={sendMessageMutation.isPending}
                      />
                      <Button 
                        type="submit" 
                        size="sm"
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        className="h-8 w-8 p-0 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        <Send className="w-3 h-3" />
                      </Button>
                    </div>
                  </form>
                </>
              )}
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
      </div>
    );
  }

  // Main VyronaSocial interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => {
                console.log("Calling onTabChange with:", "social");
                setActiveTab("social");
                console.log("Tab clicked:", "social");
                if (typeof window !== 'undefined' && (window as any).onTabChange) {
                  console.log("onTabChange called");
                  (window as any).onTabChange("social");
                }
              }}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Main
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  VyronaSocial
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Connect, Shop, Share
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4" />
                {(notifications as any[])?.length > 0 && (
                  <Badge className="ml-1 bg-red-500 text-white text-xs">
                    {(notifications as any[])?.length}
                  </Badge>
                )}
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="rooms" className="gap-2">
              <Users className="w-4 h-4" />
              Rooms
            </TabsTrigger>
            <TabsTrigger value="create" className="gap-2">
              <Plus className="w-4 h-4" />
              Create
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {productsLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-64 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl"></div>
                  </div>
                ))
              ) : (socialProducts as any[])?.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <div className="p-6 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl w-fit mx-auto mb-4">
                    <Package className="w-16 h-16 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">No products available</p>
                  <p className="text-sm text-gray-500 mt-2">Check back later for new items</p>
                </div>
              ) : (
                (socialProducts as any[])?.map((product: any) => (
                  <Card 
                    key={product.id} 
                    className="group cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-0 bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-800 dark:to-purple-900/20 overflow-hidden"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="relative">
                      <img 
                        src={product.imageUrl || "/api/placeholder/300/200"} 
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold">
                          {product.groupBuyDiscount || 10}% OFF
                        </Badge>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          ₹{Math.round((product.price / 100) * (1 - (product.groupBuyDiscount || 10) / 100)).toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          ₹{(product.price / 100).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-600 font-medium">
                            Min {product.groupBuyMinQuantity || 4}
                          </span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Deal
                        </Badge>
                      </div>

                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProductForGroupCart(product);
                          setGroupCartModalOpen(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Group Cart
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Rooms Tab */}
          <TabsContent value="rooms" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(allRooms as any[])?.map((room: any) => (
                <Card key={room.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleJoinRoomFromList(room.id)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                      <Badge variant={room.privacy === "public" ? "default" : "secondary"}>
                        {room.privacy === "public" ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                        {room.privacy}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {room.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {room.memberCount || 0} members
                        </span>
                      </div>
                      <Button size="sm">
                        Join Room
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(allRooms as any[])?.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">No rooms available</p>
                  <p className="text-sm text-gray-500 mt-2">Create the first room to get started</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Create Tab */}
          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create Room */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Create Room
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...createRoomForm}>
                    <form onSubmit={createRoomForm.handleSubmit(handleCreateRoom)} className="space-y-4">
                      <FormField
                        control={createRoomForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter room name" {...field} />
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
                              <Textarea placeholder="Room description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createRoomForm.control}
                        name="privacy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Privacy</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select privacy" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="public">Public</SelectItem>
                                <SelectItem value="private">Private</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createRoomForm.control}
                        name="maxMembers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Members</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="2" 
                                max="50" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={createRoomMutation.isPending}
                      >
                        {createRoomMutation.isPending ? "Creating..." : "Create Room"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Join Room */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Join Room
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...joinRoomForm}>
                    <form onSubmit={joinRoomForm.handleSubmit(handleJoinRoom)} className="space-y-4">
                      <FormField
                        control={joinRoomForm.control}
                        name="roomCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room Code</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter 6-character room code" 
                                maxLength={6}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={joinRoomMutation.isPending}
                      >
                        {joinRoomMutation.isPending ? "Joining..." : "Join Room"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Group Cart Modal */}
      <GroupCartModal
        isOpen={groupCartModalOpen}
        onClose={() => {
          setGroupCartModalOpen(false);
          setSelectedProductForGroupCart(null);
        }}
        product={selectedProductForGroupCart}
        onSuccess={() => {
          setGroupCartModalOpen(false);
          setSelectedProductForGroupCart(null);
        }}
      />
    </div>
  );
}