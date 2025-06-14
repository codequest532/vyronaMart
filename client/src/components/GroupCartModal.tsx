import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Users, ShoppingCart, MessageCircle, Wallet, Plus, Clock, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Product, ShoppingRoom, CartItem } from "@shared/schema";

interface GroupCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSuccess?: () => void;
}

interface CreateRoomData {
  name: string;
  description: string;
}

export function GroupCartModal({ isOpen, onClose, product, onSuccess }: GroupCartModalProps) {
  const [, setLocation] = useLocation();
  const [selectedRoom, setSelectedRoom] = useState<ShoppingRoom | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newRoomData, setNewRoomData] = useState<CreateRoomData>({
    name: "",
    description: ""
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing shopping rooms
  const { data: shoppingRooms, isLoading: loadingRooms, refetch: refetchRooms } = useQuery({
    queryKey: ["/api/shopping-rooms"],
    enabled: isOpen,
    staleTime: 0, // Always fetch fresh data
  });

  // Refetch rooms when modal opens
  useEffect(() => {
    if (isOpen) {
      refetchRooms();
    }
  }, [isOpen, refetchRooms]);

  // Fetch users for member selection
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    enabled: showCreateNew,
  });

  // Filter users based on search query
  const filteredUsers = Array.isArray(users) ? users.filter((user: any) =>
    user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  ) : [];

  // Create new room mutation
  const createRoomMutation = useMutation({
    mutationFn: async (data: CreateRoomData) => {
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
    onSuccess: (newRoom) => {
      // Invalidate both shopping rooms and VyronaSocial rooms
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vyronasocial/rooms"] });
      setShowCreateNew(false);
      setSelectedRoom(newRoom);
      setNewRoomData({ name: "", description: "" });
      setSelectedUsers([]);
      setUserSearchQuery("");
      toast({
        title: "Shopping Room Created",
        description: selectedUsers.length > 0 
          ? `Room created with ${selectedUsers.length} members added!`
          : "Your room is ready for shopping together!"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create shopping room. Please try again.",
      });
    },
  });

  // Add product to room mutation
  const addToRoomMutation = useMutation({
    mutationFn: async (data: { roomId: number; productId: number; quantity: number }) => {
      const response = await apiRequest("POST", `/api/shopping-rooms/${data.roomId}/add-cart-item`, {
        productId: data.productId,
        quantity: data.quantity,
        addedAt: new Date().toISOString()
      });
      if (!response.ok) {
        throw new Error("Failed to add product to room");
      }
      return response.json();
    },
    onSuccess: (response, variables) => {
      // Invalidate all related caches
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vyronasocial/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${variables.roomId}`] });
      
      // Force refetch of rooms data
      refetchRooms();
      
      toast({
        title: "Success",
        description: "Product added to shopping room!",
      });
      onSuccess?.();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add product to room. Please try again.",
      });
    },
  });

  const handleCreateRoom = async () => {
    if (!newRoomData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a room name.",
      });
      return;
    }

    await createRoomMutation.mutateAsync(newRoomData);
  };

  const handleAddToRoom = async () => {
    if (!selectedRoom || !product) return;

    await addToRoomMutation.mutateAsync({
      roomId: selectedRoom.id,
      productId: product.id,
      quantity,
    });
  };

  const resetModal = () => {
    setSelectedRoom(null);
    setQuantity(1);
    setShowCreateNew(false);
    setNewRoomData({
      name: "",
      description: ""
    });
  };

  useEffect(() => {
    if (!isOpen) {
      resetModal();
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const rooms = Array.isArray(shoppingRooms) ? shoppingRooms : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Add to Shopping Room - {product.name}
          </DialogTitle>
          <DialogDescription>
            Select an existing shopping room or create a new one to share this product with friends and split costs using VyronaWallet.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
          {/* Left Panel: Product Info */}
          <div className="space-y-4 overflow-y-auto">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-muted-foreground">${(product.price / 100))}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{product.description}</p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Quantity</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            {selectedRoom && (
              <div className="space-y-3">
                <h4 className="font-medium">Selected Room</h4>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium">{selectedRoom.name}</h5>
                      <p className="text-sm text-muted-foreground">
                        {selectedRoom.memberCount} members • ${((selectedRoom.totalCart || 0) / 100))} total
                      </p>
                    </div>
                    <Badge variant="secondary">
                      <Users className="h-3 w-3 mr-1" />
                      {selectedRoom.memberCount}
                    </Badge>
                  </div>
                </div>
                {(selectedRoom?.memberCount || 0) >= 2 ? (
                  <Button 
                    onClick={handleAddToRoom} 
                    className="w-full"
                    disabled={addToRoomMutation.isPending}
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    {addToRoomMutation.isPending ? "Adding..." : "Add to Room & Checkout with VyronaWallet"}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button 
                      disabled
                      className="w-full bg-gray-300 text-gray-500 cursor-not-allowed"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Need 2+ Members for Cost Sharing
                    </Button>
                    <p className="text-sm text-orange-600 text-center">
                      This room needs {2 - (selectedRoom?.memberCount || 0)} more member{2 - (selectedRoom?.memberCount || 0) === 1 ? '' : 's'} to enable VyronaWallet checkout and cost sharing
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel: Room Selection */}
          <div className="space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Choose Shopping Room</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateNew(!showCreateNew)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Room
              </Button>
            </div>

            {showCreateNew && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium">Create New Shopping Room</h4>
                <div className="space-y-3">
                  <Input
                    placeholder="Room name"
                    value={newRoomData.name}
                    onChange={(e) => setNewRoomData({ ...newRoomData, name: e.target.value })}
                  />
                  <Textarea
                    placeholder="Room description (optional)"
                    value={newRoomData.description}
                    onChange={(e) => setNewRoomData({ ...newRoomData, description: e.target.value })}
                    rows={2}
                  />
                  
                  {/* Member Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Add Members (Optional)</label>
                    <Input
                      placeholder="Search users by username or email..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                    />
                    
                    {/* Selected Users */}
                    {selectedUsers.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {selectedUsers.map((userIdentifier) => (
                          <Badge key={userIdentifier} variant="secondary" className="flex items-center gap-1">
                            {userIdentifier}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => setSelectedUsers(prev => prev.filter(u => u !== userIdentifier))}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* User Search Results */}
                    {userSearchQuery && filteredUsers.length > 0 && (
                      <div className="border rounded-md max-h-32 overflow-y-auto">
                        {filteredUsers.slice(0, 5).map((user: any) => (
                          <div
                            key={user.id}
                            className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                            onClick={() => {
                              const userIdentifier = user.username || user.email;
                              if (!selectedUsers.includes(userIdentifier)) {
                                setSelectedUsers(prev => [...prev, userIdentifier]);
                              }
                              setUserSearchQuery("");
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                                <Users className="h-3 w-3" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{user.username}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCreateRoom}
                      disabled={createRoomMutation.isPending || !newRoomData.name.trim()}
                    >
                      {createRoomMutation.isPending ? "Creating..." : "Create Room"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateNew(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="border rounded-lg max-h-[400px] overflow-y-auto">
              <div className="p-3 space-y-3">
                {loadingRooms ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading rooms...
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No shopping rooms available</p>
                    <p className="text-sm">Create a new room to start shopping together!</p>
                  </div>
                ) : (
                  rooms.map((room: any) => {
                    const hasMinimumMembers = (room.memberCount || 0) >= 2;
                    return (
                      <div
                        key={room.id}
                        className={`border rounded-lg p-4 transition-colors ${
                          hasMinimumMembers 
                            ? `cursor-pointer ${selectedRoom?.id === room.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                              }`
                            : "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
                        }`}
                        onClick={() => hasMinimumMembers && setSelectedRoom(room)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{room.name}</h4>
                              {!hasMinimumMembers && (
                                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                  Need {2 - (room.memberCount || 0)} more
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {room.memberCount} members
                              </span>
                              <span className="flex items-center gap-1">
                                <ShoppingCart className="h-3 w-3" />
                                ${((room.totalCart || 0) / 100))}
                              </span>
                              {room.currentGame && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {room.currentGame}
                                </span>
                              )}
                            </div>
                            {!hasMinimumMembers && (
                              <p className="text-xs text-orange-600 mt-1">
                                Cost sharing requires minimum 2 members
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={room.isActive ? "default" : "secondary"}>
                              {room.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer with checkout button */}
            <div className="border-t p-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{quantity}</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="font-semibold">${((product.price / 100) * quantity))}</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  disabled={!selectedRoom || addToRoomMutation.isPending}
                  onClick={handleAddToRoom}
                >
                  {addToRoomMutation.isPending ? "Adding..." : "Add to Room"}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  disabled={!selectedRoom}
                  onClick={() => {
                    if (selectedRoom) {
                      setLocation(`/place-order/${selectedRoom.id}`);
                      onClose();
                    }
                  }}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Checkout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}