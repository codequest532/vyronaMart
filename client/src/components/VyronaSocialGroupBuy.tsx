import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  Plus, 
  ShoppingCart, 
  MessageCircle, 
  Clock, 
  Percent, 
  Store,
  Send,
  UserPlus,
  Building,
  MapPin,
  Timer,
  Crown,
  Group,
  Trash2,
  UserX,
  Settings,
  MoreVertical
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

  // Fetch user's groups
  const { data: myGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/vyrona-social/my-groups"],
  });

  // Fetch stores with group buying enabled
  const { data: groupStores = [], isLoading: storesLoading } = useQuery({
    queryKey: ["/api/vyrona-social/stores"],
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
                  <Button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600">
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
                  <Button variant="outline">
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
            ) : myGroups.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <Group className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Groups Yet</h3>
                  <p className="text-gray-600 mb-4">Create or join a group to start group buying with your neighbors</p>
                </CardContent>
              </Card>
            ) : (
              myGroups.map((group: VyronaSocialGroup) => (
                <Card key={group.id} className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {group.name}
                          {group.role === 'admin' && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              <Crown className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {group.locality}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {group.current_members}/{group.max_members} members
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {group.group_code}
                        </Badge>
                        {group.role === 'admin' ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedGroup(group);
                                  setShowManageMembersDialog(true);
                                }}
                                className="flex items-center gap-2"
                              >
                                <Settings className="h-4 w-4" />
                                Manage Members
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedGroupForAction(group);
                                  setShowDeleteConfirm(true);
                                }}
                                className="flex items-center gap-2 text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete Group
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedGroupForAction(group);
                              setShowExitConfirm(true);
                            }}
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                            disabled={exitGroupMutation.isPending}
                          >
                            {exitGroupMutation.isPending ? "Leaving..." : "Exit Group"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Start group shopping sessions with nearby stores
                      </span>
                      <Dialog open={showStartSessionDialog} onOpenChange={setShowStartSessionDialog}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm"
                            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                            onClick={() => setSelectedGroup(group)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Start Shopping
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Start Group Shopping Session</DialogTitle>
                            <DialogDescription>
                              Choose a store and set the order window for {selectedGroup?.name}
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
                                <option value="">Choose a store...</option>
                                {groupStores.map((store: GroupStore) => (
                                  <option key={store.id} value={store.id}>
                                    {store.name} - Min ₹{store.min_order_value}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label htmlFor="orderWindow">Order Window (minutes)</Label>
                              <select
                                id="orderWindow"
                                name="orderWindow"
                                className="w-full p-2 border rounded-md"
                                required
                              >
                                <option value="30">30 minutes</option>
                                <option value="60">1 hour</option>
                                <option value="90">1.5 hours</option>
                                <option value="120">2 hours</option>
                              </select>
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
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="stores" className="space-y-6">
          <h2 className="text-xl font-semibold">Stores with Group Buying</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {storesLoading ? (
              <div className="col-span-2 text-center py-8">Loading stores...</div>
            ) : (
              groupStores.map((store: GroupStore) => (
                <Card key={store.id} className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {store.name}
                      <Badge className="bg-green-100 text-green-800">
                        ⭐ {(store.rating / 100).toFixed(1)}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{store.address}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Min Order: {formatCurrency(store.min_order_value)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Order Window: {store.group_order_window} mins</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Group Discounts:</h4>
                        <div className="space-y-1">
                          {store.discount_tiers?.map((tier: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <Percent className="h-3 w-3 text-green-600" />
                              <span>{formatCurrency(tier.threshold)}+ → {tier.discount}% off</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Delivery Slots:</h4>
                        <div className="flex flex-wrap gap-1">
                          {store.delivery_slots?.map((slot: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {slot}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="group-cart" className="space-y-6">
          {selectedSession ? (
            <GroupCartView sessionId={selectedSession.id} />
          ) : (
            <Card className="text-center py-8">
              <CardContent>
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
                <p className="text-gray-600">Start a group shopping session from your groups to begin</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          {selectedSession ? (
            <GroupChatView sessionId={selectedSession.id} />
          ) : (
            <Card className="text-center py-8">
              <CardContent>
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No Active Chat</h3>
                <p className="text-gray-600">Start a group shopping session to chat with group members</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Manage Members Dialog */}
      <Dialog open={showManageMembersDialog} onOpenChange={setShowManageMembersDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Group Members</DialogTitle>
            <DialogDescription>
              {selectedGroup?.name} • {selectedGroup?.current_members} members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <ManageMembersContent 
              groupId={selectedGroup?.id} 
              onMemberRemoved={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/vyrona-social/my-groups"] });
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedGroupForAction?.name}"? This action cannot be undone and will remove all group data.
            </DialogDescription>
          </DialogHeader>
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
              Are you sure you want to leave "{selectedGroupForAction?.name}"? You'll need to be re-invited to join again.
            </DialogDescription>
          </DialogHeader>
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
              disabled={exitGroupMutation.isPending}
            >
              {exitGroupMutation.isPending ? "Leaving..." : "Exit Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Group Cart Component
function GroupCartView({ sessionId }: { sessionId: number }) {
  const { data: sessionData, isLoading } = useQuery({
    queryKey: [`/api/vyrona-social/sessions/${sessionId}`],
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading group cart...</div>;
  }

  if (!sessionData) {
    return <div className="text-center py-8">Session not found</div>;
  }

  const { session, cartItems } = sessionData;
  const formatCurrency = (amount: number) => `₹${Math.round(amount)}`;

  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {session.group_name} × {session.store_name}
            <Badge className={session.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {session.status}
            </Badge>
          </CardTitle>
          <CardDescription>
            Session Code: {session.session_code} • Order window closes at {new Date(session.order_window).toLocaleTimeString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(session.total_amount)}</div>
              <div className="text-sm text-gray-600">Total Amount</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{session.discount_percent}%</div>
              <div className="text-sm text-gray-600">Group Discount</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(session.total_amount * (1 - session.discount_percent / 100))}</div>
              <div className="text-sm text-gray-600">Final Amount</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Group Cart Items</CardTitle>
        </CardHeader>
        <CardContent>
          {cartItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No items in cart yet. Start adding items to unlock group discounts!
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item: GroupCartItem) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{item.product_name}</div>
                    <div className="text-sm text-gray-600">Added by {item.username}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(item.price * item.quantity)}</div>
                    <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Group Chat Component
function GroupChatView({ sessionId }: { sessionId: number }) {
  const [message, setMessage] = useState("");
  const { data: sessionData } = useQuery({
    queryKey: [`/api/vyrona-social/sessions/${sessionId}`],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/vyrona-social/chat", data);
    },
    onSuccess: () => {
      setMessage("");
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

  if (!sessionData) {
    return <div className="text-center py-8">Loading chat...</div>;
  }

  const { chatMessages } = sessionData;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Group Chat</CardTitle>
          <CardDescription>Coordinate with your group members</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full border rounded-lg p-4">
            <div className="space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                chatMessages.map((msg: ChatMessage) => (
                  <div key={msg.id} className="flex items-start gap-2">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-xs font-semibold">
                      {msg.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{msg.username}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm">{msg.message}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          <div className="flex gap-2 mt-4">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
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

// Manage Members Component
function ManageMembersContent({ groupId, onMemberRemoved }: { 
  groupId?: number; 
  onMemberRemoved: () => void;
}) {
  const [showRemoveMemberConfirm, setShowRemoveMemberConfirm] = useState(false);
  const [selectedMemberForRemoval, setSelectedMemberForRemoval] = useState<any>(null);
  const { toast } = useToast();
  
  const { data: members, isLoading } = useQuery({
    queryKey: [`/api/vyrona-social/groups/${groupId}/members`],
    enabled: !!groupId,
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      return apiRequest("DELETE", `/api/vyrona-social/groups/${groupId}/members/${memberId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Member removed successfully",
      });
      onMemberRemoved();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading members...</div>;
  }

  if (!members || members.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">No Members Found</h3>
        <p className="text-gray-600">This group has no members yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {members.map((member: any) => (
          <div 
            key={member.id} 
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                {member.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-medium">{member.username}</div>
                <div className="text-sm text-gray-500">{member.email}</div>
                {member.role === 'admin' && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 mt-1">
                    <Crown className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
            </div>
            
            {member.role !== 'admin' && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  setSelectedMemberForRemoval(member);
                  setShowRemoveMemberConfirm(true);
                }}
                disabled={removeMemberMutation.isPending}
              >
                <UserX className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>
      
      <div className="bg-orange-50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Crown className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-orange-900">Admin Privileges</h4>
            <p className="text-sm text-orange-700 mt-1">
              As a group admin, you can remove members from the group. Admin accounts cannot be removed by other admins.
            </p>
          </div>
        </div>
      </div>

      {/* Remove Member Confirmation Dialog */}
      <Dialog open={showRemoveMemberConfirm} onOpenChange={setShowRemoveMemberConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedMemberForRemoval?.username} from the group? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRemoveMemberConfirm(false);
                setSelectedMemberForRemoval(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedMemberForRemoval) {
                  removeMemberMutation.mutate(selectedMemberForRemoval.id);
                }
                setShowRemoveMemberConfirm(false);
                setSelectedMemberForRemoval(null);
              }}
              disabled={removeMemberMutation.isPending}
            >
              {removeMemberMutation.isPending ? "Removing..." : "Remove Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}