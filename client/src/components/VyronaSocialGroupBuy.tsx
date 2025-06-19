import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import LoginModal from "@/components/auth/login-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, Store, ShoppingCart, MessageCircle, Plus, UserPlus, Play, Settings, 
  Crown, Building, Timer, Percent, UserX, Send, Clock, MapPin, Group, Trash2, MoreVertical
} from "lucide-react";

interface VyronaSocialGroup {
  id: number;
  name: string;
  group_code: string;
  locality: string;
  current_members: number;
  max_members: number;
  role: string;
}

interface GroupStore {
  id: number;
  name: string;
  address: string;
  rating: number;
  min_order_value: number;
  discount_tiers: { threshold: number; discount: number }[];
  delivery_slots: string[];
  group_order_window: number;
}

interface GroupShoppingSession {
  id: number;
  session_code: string;
  store_name: string;
  group_name: string;
  total_amount: number;
  discount_percent: number;
  order_window: string;
  status: string;
}

interface GroupCartItem {
  id: number;
  username: string;
  product_name: string;
  product_description: string;
  quantity: number;
  price: number;
}

interface ChatMessage {
  id: number;
  username: string;
  message: string;
  message_type: string;
  created_at: string;
}

export default function VyronaSocialGroupBuy() {
  const [activeTab, setActiveTab] = useState("my-groups");
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [showJoinGroupDialog, setShowJoinGroupDialog] = useState(false);
  const [showStartSessionDialog, setShowStartSessionDialog] = useState(false);
  const [showManageMembersDialog, setShowManageMembersDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<VyronaSocialGroup | null>(null);
  const [selectedSession, setSelectedSession] = useState<GroupShoppingSession | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [selectedGroupForAction, setSelectedGroupForAction] = useState<VyronaSocialGroup | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { requireAuth, showLoginModal, setShowLoginModal } = useAuthGuard();

  // Fetch user's groups
  const { data: myGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/vyrona-social/my-groups"],
    retry: false,
  });

  // Fetch stores with group buying enabled
  const { data: groupStores = [], isLoading: storesLoading } = useQuery({
    queryKey: ["/api/vyrona-social/stores"],
    retry: false,
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/vyrona-social/groups", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vyrona-social/my-groups"] });
      setShowCreateGroupDialog(false);
      toast({
        title: "Success",
        description: "Group created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create group",
        variant: "destructive",
      });
    },
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/vyrona-social/groups", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vyrona-social/my-groups"] });
      setShowJoinGroupDialog(false);
      toast({
        title: "Success",
        description: "Joined group successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join group",
        variant: "destructive",
      });
    },
  });

  // Start shopping session mutation
  const startSessionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/vyrona-social/shopping-sessions", data);
    },
    onSuccess: (data) => {
      setShowStartSessionDialog(false);
      setSelectedSession(data.session);
      setActiveTab("group-cart");
      toast({
        title: "Success",
        description: "Group shopping session started!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start session",
        variant: "destructive",
      });
    },
  });

  // Send chat message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/vyrona-social/chat", data);
    },
    onSuccess: () => {
      setChatMessage("");
      // Refresh session data to get new messages
      if (selectedSession) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/vyrona-social/sessions/${selectedSession.id}`] 
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      return apiRequest("DELETE", `/api/social/groups/${groupId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vyrona-social/my-groups"] });
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

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({ groupId, memberId }: { groupId: number; memberId: number }) => {
      return apiRequest("DELETE", `/api/social/groups/${groupId}/members/${memberId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vyrona-social/my-groups"] });
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
      return apiRequest("DELETE", `/api/social/groups/${groupId}/members/${currentUser.id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vyrona-social/my-groups"] });
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

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get("name"),
      locality: formData.get("locality"),
      pincode: formData.get("pincode"),
      apartmentName: formData.get("apartmentName"),
      description: formData.get("description"),
    };
    createGroupMutation.mutate(data);
  };

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      groupCode: formData.get("groupCode"),
    };
    joinGroupMutation.mutate(data);
  };

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      groupId: selectedGroup?.id,
      storeId: parseInt(formData.get("storeId") as string),
      orderWindow: parseInt(formData.get("orderWindow") as string),
    };
    startSessionMutation.mutate(data);
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !selectedSession) return;
    
    sendMessageMutation.mutate({
      sessionId: selectedSession.id,
      message: chatMessage,
      messageType: "text",
    });
  };

  const formatCurrency = (amount: number) => `₹${Math.round(amount)}`;

  const calculateNextDiscountThreshold = (currentAmount: number, tiers: any[]) => {
    for (const tier of tiers) {
      if (currentAmount < tier.threshold) {
        return tier;
      }
    }
    return null;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">VyronSocial Group Buying</h1>
        <p className="text-gray-600">Join your neighbors for group orders and unlock exclusive discounts</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="my-groups" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            My Groups
          </TabsTrigger>
          <TabsTrigger value="stores" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Group Stores
          </TabsTrigger>
          <TabsTrigger value="group-cart" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Group Cart
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Group Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-groups" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Groups</h2>
            <div className="flex gap-2">
              <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                    onClick={() => requireAuth("create a group", () => setShowCreateGroupDialog(true))}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Group
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
                    <DialogDescription>
                      Start a new VyronSocial group for your locality
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateGroup} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Group Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Kumarasamy Enclave Residents"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="locality">Locality</Label>
                      <Input
                        id="locality"
                        name="locality"
                        placeholder="BTM 2nd Stage"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="pincode">Pincode</Label>
                      <Input
                        id="pincode"
                        name="pincode"
                        placeholder="560076"
                      />
                    </div>
                    <div>
                      <Label htmlFor="apartmentName">Apartment/Building Name</Label>
                      <Input
                        id="apartmentName"
                        name="apartmentName"
                        placeholder="Kumarasamy Enclave"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Group for residents to coordinate grocery orders"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                      disabled={createGroupMutation.isPending}
                    >
                      {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={showJoinGroupDialog} onOpenChange={setShowJoinGroupDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => requireAuth("join a group", () => setShowJoinGroupDialog(true))}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Join Group
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join Existing Group</DialogTitle>
                    <DialogDescription>
                      Enter the group code to join an existing VyronSocial group
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleJoinGroup} className="space-y-4">
                    <div>
                      <Label htmlFor="groupCode">Group Code</Label>
                      <Input
                        id="groupCode"
                        name="groupCode"
                        placeholder="BTM1234"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                      disabled={joinGroupMutation.isPending}
                    >
                      {joinGroupMutation.isPending ? "Joining..." : "Join Group"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid gap-4">
            {groupsLoading ? (
              <div className="text-center py-8">Loading your groups...</div>
            ) : !myGroups || myGroups.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <Group className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Groups Yet</h3>
                  <p className="text-gray-600 mb-4">Create or join a group to start shopping together</p>
                </CardContent>
              </Card>
            ) : (
              (myGroups || []).map((group: VyronaSocialGroup) => (
                <Card key={group.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-r from-orange-100 to-pink-100 rounded-lg">
                          <Building className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{group.name}</h3>
                          <p className="text-gray-600 flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {group.locality}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {group.current_members}/{group.max_members} members
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Code: {group.group_code}
                            </Badge>
                            {group.role === 'admin' && (
                              <Badge className="text-xs bg-gradient-to-r from-orange-500 to-pink-500">
                                <Crown className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => {
                            setSelectedGroup(group);
                            setShowStartSessionDialog(true);
                          }}
                          className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Session
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {group.role === 'admin' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedGroup(group);
                                    setShowManageMembersDialog(true);
                                  }}
                                >
                                  <Settings className="h-4 w-4 mr-2" />
                                  Manage Members
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    setSelectedGroupForAction(group);
                                    setShowDeleteConfirm(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Group
                                </DropdownMenuItem>
                              </>
                            )}
                            {group.role !== 'admin' && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedGroupForAction(group);
                                  setShowExitConfirm(true);
                                }}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Exit Group
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="stores" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Stores Supporting Group Orders</h2>
          </div>

          <div className="grid gap-4">
            {storesLoading ? (
              <div className="text-center py-8">Loading stores...</div>
            ) : !groupStores || groupStores.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <Store className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Stores Available</h3>
                  <p className="text-gray-600">Group buying stores will appear here when available</p>
                </CardContent>
              </Card>
            ) : (
              groupStores.map((store: GroupStore) => (
                <Card key={store.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
                          <Store className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{store.name}</h3>
                          <p className="text-gray-600">{store.address}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              ⭐ {store.rating}/5
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Min Order: {formatCurrency(store.min_order_value)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Timer className="h-3 w-3 mr-1" />
                              {store.group_order_window}h window
                            </Badge>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              <Percent className="h-3 w-3 inline mr-1" />
                              Discounts: {store.discount_tiers?.map(tier => 
                                `${tier.discount}% off ₹${tier.threshold}+`
                              ).join(', ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="group-cart">
          {selectedSession ? (
            <GroupCartView sessionId={selectedSession.id} />
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No Active Session</h3>
                <p className="text-gray-600 mb-4">Start a group shopping session to begin adding items</p>
                <Button
                  onClick={() => setActiveTab("my-groups")}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                >
                  Go to Groups
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chat">
          {selectedSession ? (
            <GroupChatView sessionId={selectedSession.id} />
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No Active Session</h3>
                <p className="text-gray-600 mb-4">Start a group shopping session to chat with members</p>
                <Button
                  onClick={() => setActiveTab("my-groups")}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                >
                  Go to Groups
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Start Session Dialog */}
      <Dialog open={showStartSessionDialog} onOpenChange={setShowStartSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Group Shopping Session</DialogTitle>
            <DialogDescription>
              Choose a store and set order window for {selectedGroup?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStartSession} className="space-y-4">
            <div>
              <Label htmlFor="storeId">Select Store</Label>
              <select
                id="storeId"
                name="storeId"
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Choose a store</option>
                {groupStores.map((store: GroupStore) => (
                  <option key={store.id} value={store.id}>
                    {store.name} - Min Order: {formatCurrency(store.min_order_value)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="orderWindow">Order Window (hours)</Label>
              <Input
                id="orderWindow"
                name="orderWindow"
                type="number"
                min="1"
                max="24"
                defaultValue="2"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
              disabled={startSessionMutation.isPending}
            >
              {startSessionMutation.isPending ? "Starting..." : "Start Session"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedGroupForAction?.name}"? This action cannot be undone and will remove all members from the group.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (selectedGroupForAction) {
                  deleteGroupMutation.mutate(selectedGroupForAction.id);
                  setShowDeleteConfirm(false);
                  setSelectedGroupForAction(null);
                }
              }}
              disabled={deleteGroupMutation.isPending}
            >
              {deleteGroupMutation.isPending ? "Deleting..." : "Delete Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit Group Confirmation Dialog */}
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exit Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave "{selectedGroupForAction?.name}"? You will need to be re-invited to join again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitConfirm(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (selectedGroupForAction) {
                  exitGroupMutation.mutate(selectedGroupForAction.id);
                  setShowExitConfirm(false);
                  setSelectedGroupForAction(null);
                }
              }}
              disabled={exitGroupMutation.isPending}
            >
              {exitGroupMutation.isPending ? "Leaving..." : "Leave Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  );
}

function GroupCartView({ sessionId }: { sessionId: number }) {
  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: [`/api/vyrona-social/sessions/${sessionId}/cart`],
    retry: false,
  });

  const { data: sessionDetails } = useQuery({
    queryKey: [`/api/vyrona-social/sessions/${sessionId}`],
    retry: false,
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading cart...</div>;
  }

  const totalAmount = cartItems.reduce((sum: number, item: GroupCartItem) => 
    sum + (item.price * item.quantity), 0
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Group Cart</h2>
        <Badge className="bg-gradient-to-r from-orange-500 to-pink-500">
          {sessionDetails?.status || 'Active'}
        </Badge>
      </div>

      {cartItems.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Cart is Empty</h3>
            <p className="text-gray-600">Group members haven't added any items yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {cartItems.map((item: GroupCartItem) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{item.product_name}</h3>
                    <p className="text-sm text-gray-600">{item.product_description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        Added by {item.username}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Qty: {item.quantity}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{Math.round(item.price * item.quantity)}</p>
                    <p className="text-sm text-gray-600">{Math.round(item.price)} each</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="bg-gradient-to-r from-orange-50 to-pink-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Total Amount</h3>
                <p className="text-2xl font-bold text-orange-600">
                  ₹{Math.round(totalAmount)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function GroupChatView({ sessionId }: { sessionId: number }) {
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const { data: chatMessages = [], isLoading } = useQuery({
    queryKey: [`/api/vyrona-social/sessions/${sessionId}/chat`],
    retry: false,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/vyrona-social/chat", data);
    },
    onSuccess: () => {
      setMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    sendMessageMutation.mutate({
      sessionId,
      message,
      messageType: "text",
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading chat...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Group Chat</h2>

      <Card className="h-96">
        <CardContent className="p-4 h-full flex flex-col">
          <ScrollArea className="flex-1 mb-4">
            <div className="space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                chatMessages.map((msg: ChatMessage) => (
                  <div key={msg.id} className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-orange-600">
                        {msg.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm bg-gray-50 p-2 rounded-lg">{msg.message}</p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending}
              className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ManageMembersContent({ groupId, onMemberRemoved }: { 
  groupId: number; 
  onMemberRemoved: () => void; 
}) {
  // This would be implemented with actual member management functionality
  return (
    <div className="space-y-4">
      <p className="text-gray-600">Member management functionality will be implemented here.</p>
    </div>
  );
}