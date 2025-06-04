import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Users, MessageCircle, Share2, Heart, Plus, Send, Bell, ShoppingCart, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGroupBuyCartStore } from "@/lib/cart-store";
import { useLocation } from "wouter";

const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
  creatorId: z.number(),
  maxMembers: z.number().min(2).max(20).default(10),
});

const addMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  userId: z.number(),
});

export default function VyronaSocial() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const { addItem: addToGroupBuyCart } = useGroupBuyCartStore();
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [showGroupSelection, setShowGroupSelection] = useState(false);
  
  // Mock user ID for demo - in real app this would come from auth
  const currentUserId = 1;

  // Check for pending group buy product on component mount
  useEffect(() => {
    const storedProduct = localStorage.getItem('pendingGroupBuyProduct');
    if (storedProduct) {
      try {
        const product = JSON.parse(storedProduct);
        setPendingProduct(product);
        setShowGroupSelection(true);
        // Clear from localStorage
        localStorage.removeItem('pendingGroupBuyProduct');
      } catch (error) {
        console.error("Failed to parse pending product:", error);
      }
    }
  }, []);

  // Fetch user's shopping groups
  const { data: userGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/social/groups", currentUserId],
  });

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/social/notifications", currentUserId],
  });

  // Fetch messages for selected group
  const { data: groupMessages = [] } = useQuery({
    queryKey: ["/api/social/groups", selectedGroup, "messages"],
    enabled: !!selectedGroup,
  });

  // Fetch group members
  const { data: groupMembers = [] } = useQuery({
    queryKey: ["/api/social/groups", selectedGroup, "members"],
    enabled: !!selectedGroup,
  });

  // Fetch group wishlist
  const { data: groupWishlist = [] } = useQuery({
    queryKey: ["/api/social/groups", selectedGroup, "wishlist"],
    enabled: !!selectedGroup,
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: z.infer<typeof createGroupSchema>) => {
      return await apiRequest("/api/social/groups", "POST", groupData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/groups"] });
      toast({
        title: "Success",
        description: "Shopping group created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create shopping group.",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ groupId, message }: { groupId: number; message: string }) => {
      return await apiRequest(`/api/social/groups/${groupId}/messages`, "POST", {
        userId: currentUserId,
        message,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/groups", selectedGroup, "messages"] });
      setNewMessage("");
    },
  });

  // Share product mutation
  const shareProductMutation = useMutation({
    mutationFn: async ({ productId, groupId, message }: { productId: number; groupId: number; message?: string }) => {
      return await apiRequest("/api/social/shares", "POST", {
        productId,
        sharedBy: currentUserId,
        groupId,
        shareType: "group",
        message,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/groups", selectedGroup, "messages"] });
      toast({
        title: "Success",
        description: "Product shared with group!",
      });
    },
  });

  const form = useForm<z.infer<typeof createGroupSchema>>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      creatorId: currentUserId,
      maxMembers: 10,
    },
  });

  const onSubmit = (values: z.infer<typeof createGroupSchema>) => {
    createGroupMutation.mutate(values);
  };

  const handleSendMessage = () => {
    if (!selectedGroup || !newMessage.trim()) return;
    sendMessageMutation.mutate({
      groupId: selectedGroup,
      message: newMessage,
    });
  };

  const unreadNotifications = notifications.filter((n: any) => !n.isRead).length;

  const handleJoinGroupWithProduct = (groupId: number) => {
    if (pendingProduct) {
      // Add product to group buy cart
      addToGroupBuyCart(pendingProduct);
      
      toast({
        title: "Added to Group Buy!",
        description: `${pendingProduct.name} has been added to your group buy cart. Redirecting to checkout...`,
      });
      
      // Clear pending product and navigate to checkout
      setPendingProduct(null);
      setShowGroupSelection(false);
      setTimeout(() => setLocation("/vyronasocial"), 1500);
    }
  };

  const handleCreateNewGroupForProduct = () => {
    if (pendingProduct) {
      // For demo, create a group and add product
      const newGroupId = Date.now(); // Mock group ID
      handleJoinGroupWithProduct(newGroupId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Group Selection for Pending Product */}
        {showGroupSelection && pendingProduct && (
          <Card className="mb-8 border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Select Group for Group Buy
              </CardTitle>
              <CardDescription>
                Choose a group to buy {pendingProduct.name} with, or create a new group
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg">
                <img
                  src={pendingProduct.imageUrl}
                  alt={pendingProduct.name}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{pendingProduct.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-lg font-bold text-green-600">
                      ₹{pendingProduct.discountedPrice}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      ₹{pendingProduct.price}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {pendingProduct.groupBuyDiscount}% OFF
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Join existing group:</h4>
                <div className="grid gap-3">
                  {(userGroups as any[]).length > 0 ? (userGroups as any[]).map((group: any) => (
                    <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{group.name}</div>
                        <div className="text-sm text-gray-500">{group.memberCount || 0} members</div>
                      </div>
                      <Button
                        onClick={() => handleJoinGroupWithProduct(group.id)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Join & Buy
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-center py-4">No existing groups found</p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <Button
                    onClick={handleCreateNewGroupForProduct}
                    variant="outline"
                    className="w-full border-purple-500 text-purple-600 hover:bg-purple-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Group & Buy
                  </Button>
                </div>

                <Button
                  onClick={() => {
                    setPendingProduct(null);
                    setShowGroupSelection(false);
                  }}
                  variant="ghost"
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">VyronaSocial</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Shop together, share discoveries, and connect with friends</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="relative">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
              {unreadNotifications > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {unreadNotifications}
                </Badge>
              )}
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Shopping Group</DialogTitle>
                  <DialogDescription>
                    Create a new group to shop together with friends and family.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Family Shopping Squad" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="What's this group for?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxMembers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Members</FormLabel>
                          <FormControl>
                            <Input type="number" min="2" max="20" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={createGroupMutation.isPending}>
                      {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Groups Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  My Shopping Groups
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groupsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : userGroups.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No groups yet</p>
                    <p className="text-sm">Create your first shopping group!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userGroups.map((group: any) => (
                      <div
                        key={group.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedGroup === group.id
                            ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                        onClick={() => setSelectedGroup(group.id)}
                      >
                        <h3 className="font-medium">{group.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {group.description || "No description"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {group.memberCount || 1} members
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedGroup ? (
              <Tabs defaultValue="chat" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="chat" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="wishlist" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Wishlist
                  </TabsTrigger>
                  <TabsTrigger value="members" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Members
                  </TabsTrigger>
                </TabsList>

                {/* Chat Tab */}
                <TabsContent value="chat">
                  <Card>
                    <CardHeader>
                      <CardTitle>Group Chat</CardTitle>
                      <CardDescription>Chat with your shopping group members</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Messages */}
                        <div className="h-64 overflow-y-auto border rounded-lg p-4 space-y-3">
                          {groupMessages.length === 0 ? (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                              <p>No messages yet</p>
                              <p className="text-sm">Start the conversation!</p>
                            </div>
                          ) : (
                            groupMessages.map((message: any) => (
                              <div key={message.id} className="flex gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">User {message.userId}</span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(message.sentAt).toLocaleTimeString()}
                                    </span>
                                  </div>
                                  <p className="text-sm bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                                    {message.message}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Message Input */}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                          />
                          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Wishlist Tab */}
                <TabsContent value="wishlist">
                  <Card>
                    <CardHeader>
                      <CardTitle>Group Wishlist</CardTitle>
                      <CardDescription>Products your group wants to buy</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {groupWishlist.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No items in wishlist</p>
                          <p className="text-sm">Add products from VyronaHub!</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {groupWishlist.map((item: any) => (
                            <div key={item.id} className="border rounded-lg p-4">
                              <h3 className="font-medium">Product {item.productId}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {item.notes || "No notes"}
                              </p>
                              <div className="flex items-center justify-between mt-3">
                                <Badge
                                  variant={
                                    item.priority === 3 ? "destructive" :
                                    item.priority === 2 ? "default" : "secondary"
                                  }
                                >
                                  {item.priority === 3 ? "High" : item.priority === 2 ? "Medium" : "Low"} Priority
                                </Badge>
                                <Button variant="outline" size="sm">
                                  <Share2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Members Tab */}
                <TabsContent value="members">
                  <Card>
                    <CardHeader>
                      <CardTitle>Group Members</CardTitle>
                      <CardDescription>People in this shopping group</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {groupMembers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No members found</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {groupMembers.map((member: any) => (
                            <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                  <p className="font-medium">User {member.userId}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={member.role === "creator" ? "default" : "secondary"}>
                                {member.role}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                  <h3 className="text-lg font-medium mb-2">Select a Shopping Group</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose a group from the sidebar to start chatting and shopping together.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}