import { useState, useEffect } from "react";
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
  Trash2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

// Form schemas
const createRoomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  category: z.string().min(1, "Category is required"),
  privacy: z.enum(["public", "private"]),
  scheduledTime: z.string().optional(),
  description: z.string().optional()
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
  const { items: groupBuyItems } = useGroupBuyCartStore();
  const [location, setLocation] = useLocation();
  
  const [currentView, setCurrentView] = useState<"dashboard" | "room">("dashboard");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [selectedRoomForInvite, setSelectedRoomForInvite] = useState<number | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Fetch data
  const { data: userGroups, isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/vyronasocial/rooms"],
  });

  const { data: groupBuyProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/social/products"],
  });

  const { data: notifications } = useQuery({
    queryKey: ["/api/social/notifications"],
  });

  // Forms
  const createRoomForm = useForm<CreateRoomForm>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      privacy: "public"
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
      const response = await fetch("/api/vyronasocial/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
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
        description: "Your room is ready for shopping together!"
      });
      setShowCreateRoom(false);
      createRoomForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/vyronasocial/rooms"] });
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
        throw new Error(error.message || "Failed to join room");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Joined Room",
        description: "Welcome to the shopping room!"
      });
      setShowJoinRoom(false);
      joinRoomForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/vyronasocial/rooms"] });
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

  // Hero Section Component
  const HeroSection = () => (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white p-10 rounded-3xl mb-8 shadow-2xl">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-center mb-6">
          <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
            <Users className="w-12 h-12 text-white" />
          </div>
        </div>
        
        <h1 className="text-5xl font-bold text-center mb-4 tracking-tight">
          VyronaSocial
        </h1>
        <p className="text-xl text-center mb-2 opacity-95 font-medium">
          Shop Together. Save Together.
        </p>
        <p className="text-center mb-8 opacity-80 text-lg">
          Create rooms, invite friends, and unlock amazing group discounts
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Button 
            onClick={() => setShowCreateRoom(true)}
            size="lg"
            className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Room
          </Button>
          
          <Button 
            onClick={() => setShowJoinRoom(true)}
            size="lg"
            variant="outline"
            className="border-2 border-white text-white hover:bg-white hover:text-purple-600 font-semibold px-8 py-3 rounded-xl backdrop-blur-sm bg-white/10 hover:shadow-xl transition-all duration-200"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Join Room
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl hover:bg-white/15 transition-all duration-300">
            <Globe className="w-10 h-10 mx-auto mb-4 text-white" />
            <h3 className="font-semibold mb-2 text-lg">Global Shopping</h3>
            <p className="text-sm opacity-80">Discover products from sellers worldwide</p>
          </div>
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl hover:bg-white/15 transition-all duration-300">
            <Vote className="w-10 h-10 mx-auto mb-4 text-white" />
            <h3 className="font-semibold mb-2 text-lg">Group Decisions</h3>
            <p className="text-sm opacity-80">Vote on products with your friends</p>
          </div>
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl hover:bg-white/15 transition-all duration-300">
            <TrendingUp className="w-10 h-10 mx-auto mb-4 text-white" />
            <h3 className="font-semibold mb-2 text-lg">Better Savings</h3>
            <p className="text-sm opacity-80">Unlock exclusive group discounts</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Room Dashboard Component
  const RoomDashboard = () => (
    <div className="space-y-6">
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            <Users className="w-4 h-4 mr-2" />
            Active Rooms
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Calendar className="w-4 h-4 mr-2" />
            Scheduled
          </TabsTrigger>
          <TabsTrigger value="create">
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupsLoading ? (
              <div className="col-span-full text-center py-8">Loading rooms...</div>
            ) : (userGroups as any[])?.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                No active rooms. Create or join one to start shopping together!
              </div>
            ) : (
              (userGroups as any[])?.map((room: any) => (
                <Card key={room.id} className="group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300" />
                  
                  <CardHeader className="relative pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {room.name}
                      </CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedRoomForInvite(room.id)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite Members
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share className="w-4 h-4 mr-2" />
                            Share Room
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Leave Room
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={room.privacy === "private" ? "secondary" : "default"} className="text-xs">
                        {room.privacy === "private" ? <Lock className="w-3 h-3 mr-1" /> : <Globe className="w-3 h-3 mr-1" />}
                        {room.privacy}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                        {room.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="relative space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <Users className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">{room.memberCount || 1}</p>
                        <p className="text-xs text-blue-600">Members</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <ShoppingCart className="w-5 h-5 mx-auto mb-1 text-green-600" />
                        <p className="text-sm font-semibold text-green-900 dark:text-green-300">₹{room.totalCart || 0}</p>
                        <p className="text-xs text-green-600">Total Cart</p>
                      </div>
                    </div>
                    
                    {room.currentGame && (
                      <div className="flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg">
                        <Gift className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800 dark:text-orange-300">Game Active</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleEnterRoom(room.id)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                        size="sm"
                      >
                        Enter Room
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRoomForInvite(room.id)}
                        className="px-3 rounded-xl border-purple-200 hover:bg-purple-50"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No scheduled rooms yet. Schedule shopping sessions with friends!</p>
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <CreateRoomCard />
        </TabsContent>
      </Tabs>
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shopping Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fashion">Fashion</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="books">Books</SelectItem>
                      <SelectItem value="home">Home & Garden</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="beauty">Beauty</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={createRoomForm.control}
              name="privacy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Privacy Setting</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Public - Anyone can join
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Private - Invite only
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
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

    const roomData = allRooms?.find((room: any) => room.id === selectedRoomId);

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
                    {(roomMembers as any[])?.length || 1} members
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
              
              {roomData?.creatorId === 1 ? (
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

        {/* Room Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">

          {/* Product Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Group Buy Products
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Discover exclusive group discounts and vote with your team
                  </p>
                </div>
              </div>
            </div>

            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-64 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl"></div>
                  </div>
                ))}
              </div>
            ) : (groupBuyProducts as any[])?.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-6 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl w-fit mx-auto mb-4">
                  <Package className="w-16 h-16 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">No group buy products available</p>
                <p className="text-sm text-gray-500 mt-2">Check back later for exclusive deals</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(groupBuyProducts as any[])?.map((product: any) => (
                  <Card 
                    key={product.id} 
                    className="group cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-0 bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-800 dark:to-purple-900/20 overflow-hidden"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="relative">
                      <img 
                        src={product.imageUrl || "/api/placeholder/200/150"} 
                        alt={product.name}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-xs">
                          {product.groupBuyDiscount || 10}% OFF
                        </Badge>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    
                    <CardContent className="p-3">
                      <h4 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {product.name}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                        {product.description}
                      </p>
                      
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
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
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 px-1 py-0">
                          Deal
                        </Badge>
                      </div>

                      <Button 
                        size="sm"
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-xs py-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          toast({
                            title: "Added to Group Cart",
                            description: `${product.name} added to group cart`,
                          });
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add to Group
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Group Cart with Checkout */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Group Cart
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cart Items */}
                <div className="lg:col-span-2">
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {(sharedCart as any[])?.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No items in group cart yet.</p>
                          <p className="text-sm">Add products to start shopping together!</p>
                        </div>
                      ) : (
                        (sharedCart as any[])?.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <img 
                              src={item.imageUrl || "/api/placeholder/60/60"} 
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{item.name}</h4>
                              <p className="text-xs text-gray-500">Added by {item.addedBy}</p>
                              <p className="text-sm font-semibold">₹{item.price}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Qty: {item.quantity}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Group Checkout with Contribution Tracking */}
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Group Checkout</h4>
                    
                    {/* Order Summary */}
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span>Product Total:</span>
                        <span>₹240.00</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Group Discount:</span>
                        <span>-₹36.00</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-semibold">
                        <span>Required Amount:</span>
                        <span>₹204.00</span>
                      </div>
                    </div>

                    {/* Contribution Progress */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Collected:</span>
                        <span className="font-semibold text-green-600">₹150.00</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '73%' }}></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>73% funded</span>
                        <span>₹54.00 remaining</span>
                      </div>
                    </div>

                    {/* Member Contributions */}
                    <div className="space-y-2 mb-4">
                      <h5 className="font-medium text-sm">Member Contributions:</h5>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>You (35%)</span>
                          <span className="text-green-600">₹71.40 ✓</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Alice (25%)</span>
                          <span className="text-green-600">₹51.00 ✓</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bob (20%)</span>
                          <span className="text-orange-600">₹40.80 pending</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Carol (20%)</span>
                          <span className="text-gray-500">₹40.80 not set</span>
                        </div>
                      </div>
                    </div>

                    {/* VyronaWallet Balance */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">VyronaWallet</span>
                        </div>
                        <span className="font-semibold text-blue-600">₹125.00</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full" variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your Contribution
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <CreditCard className="w-5 h-5" />
                              Add Contribution
                            </DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            {/* Contribution Amount */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Contribution Amount</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                                <Input 
                                  placeholder="0.00" 
                                  className="pl-8"
                                  type="number"
                                />
                              </div>
                              <p className="text-xs text-gray-500">
                                Suggested: ₹51.00 (25% share)
                              </p>
                            </div>

                            {/* VyronaWallet Balance */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <Wallet className="w-4 h-4 text-blue-600" />
                                  <span>Available Balance</span>
                                </div>
                                <span className="font-semibold text-blue-600">₹125.00</span>
                              </div>
                            </div>

                            {/* Delivery Address */}
                            <div className="space-y-3">
                              <label className="text-sm font-medium flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Delivery Address
                              </label>
                              
                              <div className="space-y-2">
                                <Input placeholder="Full Name" />
                                <Textarea 
                                  placeholder="Street Address, Apartment/Suite" 
                                  rows={2}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <Input placeholder="City" />
                                  <Input placeholder="Postal Code" />
                                </div>
                                <Input placeholder="State/Province" />
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <input type="checkbox" id="same-address" className="rounded" />
                                <label htmlFor="same-address" className="text-xs text-gray-600">
                                  Use my default address
                                </label>
                              </div>
                            </div>

                            {/* Payment Method */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Payment Method</label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="wallet">VyronaWallet</SelectItem>
                                  <SelectItem value="upi">UPI</SelectItem>
                                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2 pt-2">
                              <Button className="w-full">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Confirm Contribution
                              </Button>
                              
                              <p className="text-xs text-center text-gray-500">
                                Funds will be held securely until order is placed
                              </p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button className="w-full" disabled>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Place Group Order
                      </Button>
                      
                      <p className="text-xs text-gray-500 text-center">
                        Order can be placed when 100% funded
                      </p>
                    </div>
                  </div>
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
    <div className="container mx-auto px-4 py-6">
      {/* Back to Dashboard Button */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={handleBackToDashboard}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {currentView === "dashboard" ? (
        <>
          <HeroSection />
          <RoomDashboard />
        </>
      ) : (
        <RoomInterface />
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
                      toast({
                        title: "Added to Group Cart",
                        description: `${selectedProduct.name} added to group cart`,
                      });
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
    </div>
  );
}