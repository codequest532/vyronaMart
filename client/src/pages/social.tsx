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
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useGroupBuyCartStore } from "@/lib/cart-store";

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
  
  const [currentView, setCurrentView] = useState<"dashboard" | "room">("dashboard");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);

  // Fetch data
  const { data: userGroups, isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/vyronasocial/rooms"],
  });

  const { data: groupBuyProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/group-buy/products"],
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

  // Hero Section Component
  const HeroSection = () => (
    <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 text-white p-8 rounded-lg mb-8">
      <div className="relative z-10">
        <h1 className="text-4xl font-bold mb-4">Shop Together. Save Together.</h1>
        <p className="text-lg mb-6 opacity-90">
          Join shopping rooms, chat with friends, vote on products, and unlock exclusive group discounts.
        </p>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <Button 
            onClick={() => setShowCreateRoom(true)}
            className="bg-white text-purple-600 hover:bg-gray-100"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Shopping Room
          </Button>
          
          <Button 
            onClick={() => setShowJoinRoom(true)}
            variant="outline" 
            className="border-white text-white hover:bg-white hover:text-purple-600"
          >
            <Code className="w-4 h-4 mr-2" />
            Join Room via Code
          </Button>
        </div>

        {/* Featured Sellers & Trending Rooms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5" />
              <h3 className="font-semibold">Popular Sellers</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-white/20 text-white">Electronics Hub</Badge>
              <Badge variant="secondary" className="bg-white/20 text-white">Fashion Central</Badge>
              <Badge variant="secondary" className="bg-white/20 text-white">BookWorld</Badge>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5" />
              <h3 className="font-semibold">Trending Rooms</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Fashion Friday Deals</span>
                <Badge variant="secondary" className="bg-white/20 text-white text-xs">12 members</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Tech Enthusiasts</span>
                <Badge variant="secondary" className="bg-white/20 text-white text-xs">8 members</Badge>
              </div>
            </div>
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
                <Card key={room.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                      <Badge variant={room.privacy === "private" ? "secondary" : "default"}>
                        {room.privacy === "private" ? <Lock className="w-3 h-3 mr-1" /> : <Globe className="w-3 h-3 mr-1" />}
                        {room.privacy}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {room.memberCount || 1} members
                      </span>
                      <span className="flex items-center gap-1">
                        <ShoppingCart className="w-4 h-4" />
                        ${room.totalCart || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{room.category}</Badge>
                      {room.currentGame && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                          <Gift className="w-3 h-3 mr-1" />
                          Game Active
                        </Badge>
                      )}
                    </div>

                    <Button 
                      onClick={() => handleEnterRoom(room.id)}
                      className="w-full"
                      size="sm"
                    >
                      Enter Room
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
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

        {/* Room Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg">
          <div>
            <h2 className="text-2xl font-bold">{roomData?.name || "Shopping Room"}</h2>
            <p className="text-gray-600">Category: {roomData?.category}</p>
            <p className="text-sm text-gray-500">Room Code: {roomData?.roomCode}</p>
          </div>
          <div className="flex gap-2">
            {/* Show Delete Room button only for admin/creator */}
            {roomData?.creatorId === 1 && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => deleteRoomMutation.mutate(selectedRoomId!)}
                disabled={deleteRoomMutation.isPending}
              >
                {deleteRoomMutation.isPending ? "Deleting..." : "Delete Room"}
              </Button>
            )}
            
            {/* Show Exit Room button for non-admin users */}
            {roomData?.creatorId !== 1 ? (
              <Button 
                variant="outline" 
                onClick={() => exitRoomMutation.mutate(selectedRoomId!)}
                disabled={exitRoomMutation.isPending}
              >
                {exitRoomMutation.isPending ? "Exiting..." : "Exit Room"}
              </Button>
            ) : (
              <Button variant="outline" onClick={handleLeaveRoom}>
                Leave Room
              </Button>
            )}
          </div>
        </div>

        {/* Room Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Participants & Chat */}
          <div className="space-y-6">
            {/* Room Participants */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Participants ({(roomMembers as any[])?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(roomMembers as any[])?.map((member: any) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{member.username}</p>
                        <p className="text-xs text-gray-500">
                          {member.isOnline ? "Online" : "Offline"}
                        </p>
                      </div>
                      {member.isCreator && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat Window */}
            <Card className="h-96">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col h-80">
                <ScrollArea className="flex-1 mb-4">
                  <div className="space-y-3">
                    {(roomMessages as any[])?.map((message: any) => (
                      <div key={message.id} className="flex gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">{message.username?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">{message.username}</p>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
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
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Shared Cart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Shared Cart
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {(sharedCart as any[])?.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No items in shared cart yet.</p>
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
                          <p className="text-sm font-semibold">${item.price}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Qty: {item.quantity}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Right Column - Voting & Final Cart */}
          <div className="space-y-6">
            {/* Vote Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Vote className="w-5 h-5" />
                  Group Voting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Approve Cart
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      Suggest Changes
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>Current votes:</p>
                    <div className="flex justify-between mt-1">
                      <span className="text-green-600">✓ Approve: 3</span>
                      <span className="text-red-600">✗ Changes: 1</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Final Cart View */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Final Cart
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹240.00</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Group Discount:</span>
                      <span>-₹36.00</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>₹204.00</span>
                    </div>
                  </div>
                  
                  <Button className="w-full">
                    Proceed to Group Checkout
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center">
                    Everyone will pay their share individually
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
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
    </div>
  );
}