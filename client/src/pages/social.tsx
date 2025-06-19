import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
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
  LogOut,
  Grid3X3,
  List,
  Bell,
  Sparkles,
  Send,
  Smile,
  Paperclip,
  Copy,
  MoreVertical,
  MessageCircle,
  Clock,
  MapPin,
  Star,
  Eye,
  Zap,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAuthGuard } from "@/hooks/useAuthGuard";

// Form schemas
const createGroupSchema = z.object({
  name: z.string().min(3, "Group name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

const joinGroupSchema = z.object({
  code: z.string().min(6, "Group code must be at least 6 characters"),
});

const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
});

type CreateGroupForm = z.infer<typeof createGroupSchema>;
type JoinGroupForm = z.infer<typeof joinGroupSchema>;
type MessageForm = z.infer<typeof messageSchema>;

// Chat message interface
interface ChatMessage {
  id: number;
  content: string;
  userId: number;
  username: string;
  groupId: number;
  messageType: 'text' | 'system' | 'product_share' | 'cart_update' | 'file';
  metadata?: any;
  sentAt: string;
}

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
  const { requireAuth, isAuthenticated } = useAuthGuard();
  
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("groups");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const [videoCallInvite, setVideoCallInvite] = useState<any>(null);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [callParticipants, setCallParticipants] = useState<any[]>([]);
  const [isGroupSelectionOpen, setIsGroupSelectionOpen] = useState(false);
  const [selectedProductForGroup, setSelectedProductForGroup] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Authentication check
  const { data: authUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/current-user"],
    retry: false,
  });

  // Fetch groups with error handling for unauthenticated users
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/shopping-rooms"],
    retry: false,
  });

  // Fetch products (VyronaSocial specific - group buy enabled products only)
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/social/products"],
  });

  // Group cart data
  const { data: groupCart, refetch: refetchCart } = useQuery({
    queryKey: ["/api/room-cart", selectedGroupId],
    queryFn: () => fetch(`/api/room-cart/${selectedGroupId}`).then(res => res.json()),
    enabled: !!selectedGroupId && isAuthenticated,
  });

  // Fetch messages for selected group
  const { data: fetchedMessages, refetch: refetchMessages } = useQuery({
    queryKey: ["/api/group-messages", selectedGroupId],
    queryFn: () => fetch(`/api/group-messages/${selectedGroupId}`).then(res => res.json()),
    enabled: !!selectedGroupId && isAuthenticated,
  });

  // Fetch online members for selected group
  const { data: onlineMembersData, refetch: refetchOnlineMembers } = useQuery({
    queryKey: ["/api/groups", selectedGroupId, "online-members"],
    queryFn: () => fetch(`/api/groups/${selectedGroupId}/online-members`).then(res => res.json()),
    enabled: !!selectedGroupId && isAuthenticated,
    refetchInterval: 5000, // Refresh every 5 seconds
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

  const messageForm = useForm<MessageForm>({
    resolver: zodResolver(messageSchema),
    defaultValues: { content: "" },
  });

  // WebSocket setup
  useEffect(() => {
    if (selectedGroupId && isAuthenticated) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        ws.send(JSON.stringify({
          type: 'join_group',
          groupId: selectedGroupId,
          userId: authUser?.id
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);
        
        if (data.type === 'new_message') {
          setMessages(prev => [...prev, data.message]);
        } else if (data.type === 'cart_update') {
          refetchCart();
        } else if (data.type === 'members_update') {
          refetchOnlineMembers();
        } else if (data.type === 'video_call_invite') {
          setVideoCallInvite(data);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
      };

      return () => {
        ws.close();
        wsRef.current = null;
      };
    }
  }, [selectedGroupId, authUser?.id, isAuthenticated]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, fetchedMessages]);

  // Update messages when fetched data changes
  useEffect(() => {
    if (fetchedMessages) {
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages]);

  // Mutations
  const createGroupMutation = useMutation({
    mutationFn: async (data: CreateGroupForm) => {
      const response = await apiRequest("POST", "/api/shopping-rooms", data);
      return response.json();
    },
    onSuccess: (response) => {
      toast({ title: "Group created successfully!", description: `Group code: ${response.code}` });
      setIsCreateGroupOpen(false);
      createGroupForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-rooms"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to create group", variant: "destructive" });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (data: JoinGroupForm) => {
      const response = await apiRequest("POST", "/api/join-group", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Successfully joined group!" });
      setIsJoinGroupOpen(false);
      joinGroupForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-rooms"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to join group", variant: "destructive" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/group-messages", {
        groupId: selectedGroupId,
        content,
        messageType: 'text'
      });
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      messageForm.reset();
      // Message will be added via WebSocket
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest("POST", "/api/room-cart", {
        productId,
        roomId: selectedGroupId,
        quantity: 1
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Added to group cart!" });
      refetchCart();
    },
  });

  const updateCartQuantityMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: number; quantity: number }) => {
      const response = await apiRequest("PUT", `/api/room-cart/${cartItemId}`, { quantity });
      return response.json();
    },
    onSuccess: () => {
      refetchCart();
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (cartItemId: number) => {
      const response = await apiRequest("DELETE", `/api/room-cart/${cartItemId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Removed from cart" });
      refetchCart();
    },
  });

  // Handlers
  const handleCreateGroup = (data: CreateGroupForm) => {
    if (!requireAuth("create a group")) return;
    createGroupMutation.mutate(data);
  };

  const handleJoinGroup = (data: JoinGroupForm) => {
    if (!requireAuth("join a group")) return;
    joinGroupMutation.mutate(data);
  };

  const handleSendMessage = (data: MessageForm) => {
    if (!requireAuth("send messages")) return;
    sendMessageMutation.mutate(data.content);
  };

  const handleAddToCart = (productId: number) => {
    if (!requireAuth("add items to cart")) return;
    if (!selectedGroupId) {
      toast({ title: "Please select a group first", variant: "destructive" });
      return;
    }
    addToCartMutation.mutate(productId);
  };

  const handleStartVideoCall = () => {
    if (!requireAuth("start video calls")) return;
    setIsVideoCallActive(true);
    setCurrentCallId(`call_${Date.now()}`);
    // Broadcast video call invitation
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'video_call_start',
        groupId: selectedGroupId,
        callId: currentCallId
      }));
    }
  };

  const handleEndVideoCall = () => {
    setIsVideoCallActive(false);
    setCurrentCallId(null);
    setCallParticipants([]);
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'video_call_end',
        groupId: selectedGroupId
      }));
    }
  };

  const filteredProducts = products?.filter((product: any) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const cartTotal = groupCart?.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0) || 0;
  const cartItemCount = groupCart?.reduce((sum: number, item: CartItem) => sum + item.quantity, 0) || 0;

  const selectedGroup = groups?.find((g: any) => g.id === selectedGroupId);
  const onlineMembers = onlineMembersData || [];

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600">Loading VyronaSocial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-purple-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/")}
                className="flex items-center space-x-2 hover:bg-purple-100"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Home</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    VyronaSocial
                  </h1>
                  <p className="text-sm text-gray-600">Shop Together, Save Together</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {selectedGroupId && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        {onlineMembers.length} online
                      </Badge>
                      {!isVideoCallActive ? (
                        <Button
                          onClick={handleStartVideoCall}
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        >
                          <Video className="h-4 w-4 mr-1" />
                          Start Call
                        </Button>
                      ) : (
                        <Button
                          onClick={handleEndVideoCall}
                          size="sm"
                          variant="destructive"
                        >
                          <VideoOff className="h-4 w-4 mr-1" />
                          End Call
                        </Button>
                      )}
                    </div>
                  )}
                  <Button
                    onClick={() => setIsGroupCartOpen(true)}
                    variant="outline"
                    className="relative border-purple-200 hover:bg-purple-50"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Group Cart
                    {cartItemCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {cartItemCount}
                      </Badge>
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    setShowAuthModal(true);
                    setAuthMode("login");
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Sign In to Join Groups
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-white/70 backdrop-blur-sm rounded-2xl p-2 border border-purple-200/50">
            <TabsTrigger value="groups" className="rounded-xl py-3 data-[state=active]:bg-purple-100 data-[state=active]:shadow-md">
              <Users className="h-4 w-4 mr-2" />
              My Groups
            </TabsTrigger>
            <TabsTrigger value="products" className="rounded-xl py-3 data-[state=active]:bg-purple-100 data-[state=active]:shadow-md">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Social Shopping
            </TabsTrigger>
            <TabsTrigger value="chat" className="rounded-xl py-3 data-[state=active]:bg-purple-100 data-[state=active]:shadow-md">
              <MessageCircle className="h-4 w-4 mr-2" />
              Group Chat
            </TabsTrigger>
          </TabsList>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-6">
            {isAuthenticated ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Shopping Groups</h2>
                  <div className="flex space-x-3">
                    <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Group
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Shopping Group</DialogTitle>
                          <DialogDescription>
                            Start a new group shopping session with friends and family.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...createGroupForm}>
                          <form onSubmit={createGroupForm.handleSubmit(handleCreateGroup)} className="space-y-4">
                            <FormField
                              control={createGroupForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Group Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Weekend Grocery Run" {...field} />
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
                                    <Textarea
                                      placeholder="What will you be shopping for?"
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
                              disabled={createGroupMutation.isPending}
                            >
                              {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                            </Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isJoinGroupOpen} onOpenChange={setIsJoinGroupOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-purple-200 hover:bg-purple-50">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Join Group
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Join Shopping Group</DialogTitle>
                          <DialogDescription>
                            Enter the group code to join an existing shopping session.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...joinGroupForm}>
                          <form onSubmit={joinGroupForm.handleSubmit(handleJoinGroup)} className="space-y-4">
                            <FormField
                              control={joinGroupForm.control}
                              name="code"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Group Code</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter 6-digit group code" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="submit"
                              className="w-full"
                              disabled={joinGroupMutation.isPending}
                            >
                              {joinGroupMutation.isPending ? "Joining..." : "Join Group"}
                            </Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {groupsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : groups && groups.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group: any) => (
                      <Card
                        key={group.id}
                        className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                          selectedGroupId === group.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                        onClick={() => setSelectedGroupId(group.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-gray-900 mb-1">
                                {group.name}
                              </h3>
                              <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <div className="flex items-center">
                                  <Users className="h-3 w-3 mr-1" />
                                  {group.memberCount || 1} members
                                </div>
                                <div className="flex items-center">
                                  <ShoppingCart className="h-3 w-3 mr-1" />
                                  {group.cartItemCount || 0} items
                                </div>
                              </div>
                            </div>
                            {group.isOwner && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs">
                              Code: {group.code}
                            </Badge>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-green-600">Active</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Groups Yet</h3>
                    <p className="text-gray-600 mb-6">Create or join a shopping group to start collaborative shopping.</p>
                    <div className="flex justify-center space-x-3">
                      <Button
                        onClick={() => setIsCreateGroupOpen(true)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Group
                      </Button>
                      <Button
                        onClick={() => setIsJoinGroupOpen(true)}
                        variant="outline"
                        className="border-purple-200 hover:bg-purple-50"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Join Group
                      </Button>
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <Card className="p-12 text-center">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign In Required</h3>
                <p className="text-gray-600 mb-6">Please sign in to create or join shopping groups and collaborate with friends.</p>
                <Button
                  onClick={() => {
                    setShowAuthModal(true);
                    setAuthMode("login");
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Sign In to Continue
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Social Shopping</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <div className="flex border rounded-lg p-1 bg-white">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {productsLoading ? (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-32 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {filteredProducts.map((product: any) => (
                  <Card key={product.id} className="hover:shadow-lg transition-shadow border border-gray-200">
                    <CardContent className="p-6">
                      <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg mb-4 flex items-center justify-center">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <ShoppingBag className="h-12 w-12 text-purple-400" />
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-xl font-bold text-purple-600">
                          ₹{Math.round(product.price)}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Group Buy Enabled
                        </Badge>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleAddToCart(product.id)}
                          disabled={!selectedGroupId || !isAuthenticated}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add to Group Cart
                        </Button>
                        <Button variant="outline" size="sm" className="px-3">
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>

                      {!selectedGroupId && isAuthenticated && (
                        <p className="text-xs text-orange-600 mt-2 text-center">
                          Select a group to add items
                        </p>
                      )}
                      {!isAuthenticated && (
                        <p className="text-xs text-blue-600 mt-2 text-center">
                          Sign in to add items to group cart
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
                <p className="text-gray-600">Try adjusting your search terms or check back later for new products.</p>
              </Card>
            )}
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            {selectedGroupId && isAuthenticated ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Chat Area */}
                <div className="lg:col-span-3">
                  <Card className="h-[600px] flex flex-col">
                    <CardHeader className="border-b bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{selectedGroup?.name}</CardTitle>
                          <p className="text-sm opacity-90">{onlineMembers.length} members online</p>
                        </div>
                        {isVideoCallActive && (
                          <Badge className="bg-green-500 text-white">
                            <Video className="h-3 w-3 mr-1" />
                            Video Call Active
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1 p-0 flex flex-col">
                      {/* Video Call Area */}
                      {isVideoCallActive && (
                        <div className="bg-gray-900 p-4 flex items-center justify-center">
                          <div className="grid grid-cols-2 gap-4 max-w-2xl">
                            <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                              <div className="text-center text-white">
                                <Video className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-sm">You</p>
                              </div>
                            </div>
                            {callParticipants.map((participant, index) => (
                              <div key={index} className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                                <div className="text-center text-white">
                                  <Video className="h-8 w-8 mx-auto mb-2" />
                                  <p className="text-sm">{participant.name}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Messages */}
                      <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.userId === authUser?.id ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[70%] ${
                                message.userId === authUser?.id
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              } rounded-lg p-3`}>
                                {message.userId !== authUser?.id && (
                                  <p className="text-xs font-medium mb-1 opacity-75">
                                    {message.username}
                                  </p>
                                )}
                                <p className="text-sm">{message.content}</p>
                                <p className="text-xs opacity-75 mt-1">
                                  {new Date(message.sentAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>

                      {/* Message Input */}
                      <div className="border-t p-4">
                        <Form {...messageForm}>
                          <form
                            onSubmit={messageForm.handleSubmit(handleSendMessage)}
                            className="flex space-x-2"
                          >
                            <FormField
                              control={messageForm.control}
                              name="content"
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input
                                      placeholder="Type a message..."
                                      {...field}
                                      value={newMessage}
                                      onChange={(e) => {
                                        setNewMessage(e.target.value);
                                        field.onChange(e);
                                      }}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <Button
                              type="submit"
                              disabled={!newMessage.trim() || sendMessageMutation.isPending}
                              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </form>
                        </Form>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  {/* Online Members */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Online Members</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {onlineMembers.length > 0 ? (
                        onlineMembers.map((member: any) => (
                          <div key={member.id} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">{member.username}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No one else online</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        onClick={() => setIsGroupCartOpen(true)}
                        variant="outline"
                        className="w-full justify-start"
                        size="sm"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        View Group Cart ({cartItemCount})
                      </Button>
                      <Button
                        onClick={() => setActiveTab("products")}
                        variant="outline"
                        className="w-full justify-start"
                        size="sm"
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Browse Products
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="p-12 text-center">
                <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {!isAuthenticated ? "Sign In Required" : "Select a Group"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {!isAuthenticated 
                    ? "Please sign in to access group chat features." 
                    : "Choose a shopping group from the Groups tab to start chatting."
                  }
                </p>
                {!isAuthenticated ? (
                  <Button
                    onClick={() => {
                      setShowAuthModal(true);
                      setAuthMode("login");
                    }}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Sign In to Continue
                  </Button>
                ) : (
                  <Button onClick={() => setActiveTab("groups")} variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Go to Groups
                  </Button>
                )}
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Group Cart Modal */}
      <Dialog open={isGroupCartOpen} onOpenChange={setIsGroupCartOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Group Shopping Cart</DialogTitle>
            <DialogDescription>
              {selectedGroup?.name} • {cartItemCount} items • ₹{Math.round(cartTotal)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto">
            {groupCart && groupCart.length > 0 ? (
              <div className="space-y-4">
                {groupCart.map((item: CartItem) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600">₹{Math.round(item.price)} each</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartQuantityMutation.mutate({ 
                          cartItemId: item.id, 
                          quantity: item.quantity - 1 
                        })}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartQuantityMutation.mutate({ 
                          cartItemId: item.id, 
                          quantity: item.quantity + 1 
                        })}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromCartMutation.mutate(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total:</span>
                    <span>₹{Math.round(cartTotal)}</span>
                  </div>
                  <Button 
                    className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    onClick={() => {
                      // Save cart for checkout
                      sessionStorage.setItem('group-cart', JSON.stringify(groupCart));
                      sessionStorage.setItem('group-id', selectedGroupId?.toString() || '');
                      setLocation('/social-checkout');
                    }}
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Your group cart is empty</p>
                <Button
                  onClick={() => {
                    setIsGroupCartOpen(false);
                    setActiveTab("products");
                  }}
                  className="mt-4"
                  variant="outline"
                >
                  Browse Products
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Auth Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {authMode === "login" ? "Sign In to VyronaSocial" : "Create Your Account"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {authMode === "login" 
                ? "Please sign in to create and join shopping groups." 
                : "Create an account to unlock social shopping features."
              }
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as "login" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const email = formData.get("email") as string;
                const password = formData.get("password") as string;
                
                fetch("/api/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email, password }),
                }).then(async (response) => {
                  if (response.ok) {
                    toast({ title: "Welcome back!", description: "You're now signed in." });
                    setShowAuthModal(false);
                    window.location.reload();
                  } else {
                    const error = await response.json();
                    toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
                  }
                });
              }} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
                  Sign In
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const username = formData.get("username") as string;
                const email = formData.get("email") as string;
                const password = formData.get("password") as string;
                
                fetch("/api/register", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ username, email, password, userType: "customer" }),
                }).then(async (response) => {
                  if (response.ok) {
                    toast({ title: "Account created!", description: "Welcome to VyronaSocial!" });
                    setShowAuthModal(false);
                    window.location.reload();
                  } else {
                    const error = await response.json();
                    toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
                  }
                });
              }} className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Choose a username"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}