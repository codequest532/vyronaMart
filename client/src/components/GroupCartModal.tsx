import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Users, ShoppingCart, MessageCircle, Wallet, MapPin, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Product, GroupCart, GroupCartContribution } from "@shared/schema";

interface GroupCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSuccess?: () => void;
}

interface DeliveryAddress {
  fullName: string;
  address: string;
  city: string;
  zipCode: string;
  phone: string;
}

export function GroupCartModal({ isOpen, onClose, product, onSuccess }: GroupCartModalProps) {
  const [selectedGroupCart, setSelectedGroupCart] = useState<GroupCart | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    fullName: "",
    address: "",
    city: "",
    zipCode: "",
    phone: ""
  });
  const [notes, setNotes] = useState("");
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newGroupSettings, setNewGroupSettings] = useState({
    minThreshold: 4,
    maxCapacity: 50,
    targetPrice: product ? Math.floor(product.price * 0.85) : 0, // 15% group discount
    expiresIn: 7 // days
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing group carts for this product
  const { data: groupCarts = [], isLoading } = useQuery({
    queryKey: ["/api/group-carts/product", product?.id],
    enabled: isOpen && !!product?.id,
  });

  // Fetch contributions for selected group cart
  const { data: contributions = [] } = useQuery({
    queryKey: ["/api/group-carts", selectedGroupCart?.id, "contributions"],
    enabled: !!selectedGroupCart?.id,
  });

  // Create new group cart mutation
  const createGroupCartMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/group-carts", data);
      return response.json();
    },
    onSuccess: (newGroupCart) => {
      setSelectedGroupCart(newGroupCart);
      setShowCreateNew(false);
      queryClient.invalidateQueries({ queryKey: ["/api/group-carts/product", product.id] });
      toast({
        title: "Group Cart Created!",
        description: "Your new group cart is ready for others to join."
      });
    }
  });

  // Join group cart mutation
  const joinGroupCartMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/group-carts/${selectedGroupCart?.id}/join`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/group-carts", selectedGroupCart?.id, "contributions"] });
      toast({
        title: "Successfully Joined!",
        description: "You've joined the group cart. Track progress in your dashboard."
      });
      onSuccess?.();
      onClose();
    }
  });

  const handleCreateGroupCart = () => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + newGroupSettings.expiresIn);

    createGroupCartMutation.mutate({
      groupId: 1, // Default group for now
      productId: product.id,
      minThreshold: newGroupSettings.minThreshold,
      maxCapacity: newGroupSettings.maxCapacity,
      targetPrice: newGroupSettings.targetPrice * 100, // Convert to cents
      currentPrice: product.price * 100,
      createdBy: 1, // Current user ID
      expiresAt: expiryDate.toISOString()
    });
  };

  const handleJoinGroupCart = () => {
    if (!selectedGroupCart || !deliveryAddress.fullName || !deliveryAddress.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in your delivery address.",
        variant: "destructive"
      });
      return;
    }

    const contributionAmount = Math.floor((selectedGroupCart.targetPrice || selectedGroupCart.currentPrice) * quantity);

    joinGroupCartMutation.mutate({
      userId: 1, // Current user ID
      quantity,
      contributionAmount,
      deliveryAddress,
      notes
    });
  };

  const getProgressPercentage = (groupCart: GroupCart) => {
    return Math.min((groupCart.totalQuantity / groupCart.minThreshold) * 100, 100);
  };

  const getTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return "No expiry";
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days left` : "Expired";
  };

  // Don't render if product is null
  if (!product) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Add to Group Cart - {product.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 pb-6">
            {/* Left Panel - Group Cart Selection */}
            <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Available Group Carts</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateNew(!showCreateNew)}
              >
                Create New
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">Loading group carts...</div>
            ) : (
              <ScrollArea className="h-60">
                <div className="space-y-3">
                  {groupCarts.map((groupCart: GroupCart) => (
                    <div
                      key={groupCart.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedGroupCart?.id === groupCart.id
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-950"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedGroupCart(groupCart)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {groupCart.totalQuantity}/{groupCart.minThreshold} joined
                        </Badge>
                        <span className="text-sm text-gray-500">
                          <Clock className="h-4 w-4 inline mr-1" />
                          {getTimeRemaining(groupCart.expiresAt)}
                        </span>
                      </div>
                      
                      <Progress 
                        value={getProgressPercentage(groupCart)} 
                        className="mb-2 h-2"
                      />
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          ₹{(groupCart.targetPrice || groupCart.currentPrice) / 100}
                        </span>
                        <span className="text-gray-500">
                          {groupCart.maxCapacity - groupCart.totalQuantity} spots left
                        </span>
                      </div>
                    </div>
                  ))}

                  {groupCarts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No active group carts. Create the first one!
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}

            {/* Create New Group Cart */}
            {showCreateNew && (
              <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
                <h4 className="font-medium mb-3">Create New Group Cart</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Min. People</label>
                      <Input
                        type="number"
                        value={newGroupSettings.minThreshold}
                        onChange={(e) => setNewGroupSettings(prev => ({
                          ...prev,
                          minThreshold: parseInt(e.target.value) || 4
                        }))}
                        min="2"
                        max="20"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Max. Capacity</label>
                      <Input
                        type="number"
                        value={newGroupSettings.maxCapacity}
                        onChange={(e) => setNewGroupSettings(prev => ({
                          ...prev,
                          maxCapacity: parseInt(e.target.value) || 50
                        }))}
                        min="10"
                        max="100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Target Price (₹)</label>
                    <Input
                      type="number"
                      value={newGroupSettings.targetPrice}
                      onChange={(e) => setNewGroupSettings(prev => ({
                        ...prev,
                        targetPrice: parseInt(e.target.value) || 0
                      }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Original: ₹{product.price} | Savings: ₹{product.price - newGroupSettings.targetPrice}
                    </p>
                  </div>
                  <Button
                    onClick={handleCreateGroupCart}
                    disabled={createGroupCartMutation.isPending}
                    className="w-full"
                  >
                    {createGroupCartMutation.isPending ? "Creating..." : "Create Group Cart"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Join Details */}
          <div className="space-y-4">
            {selectedGroupCart ? (
              <>
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                  <h4 className="font-medium mb-2">Selected Group Cart</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Group Price:</span>
                      <span className="font-medium">₹{(selectedGroupCart.targetPrice || selectedGroupCart.currentPrice) / 100}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Progress:</span>
                      <span>{selectedGroupCart.totalQuantity}/{selectedGroupCart.minThreshold} joined</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Your Savings:</span>
                      <span className="text-green-600 font-medium">
                        ₹{((product.price * 100) - (selectedGroupCart.targetPrice || selectedGroupCart.currentPrice)) / 100}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Current Participants */}
                {contributions.length > 0 && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Current Participants ({contributions.length})
                    </h4>
                    <div className="space-y-2">
                      {contributions.slice(0, 3).map((contribution: GroupCartContribution, index: number) => (
                        <div key={contribution.id} className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>U{index + 1}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">User {contribution.userId}</p>
                            <p className="text-xs text-gray-500">
                              Qty: {contribution.quantity} • ₹{contribution.contributionAmount / 100}
                            </p>
                          </div>
                        </div>
                      ))}
                      {contributions.length > 3 && (
                        <p className="text-xs text-gray-500">+{contributions.length - 3} more participants</p>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Join Form */}
                <div className="space-y-4">
                  <h4 className="font-medium">Join This Group Cart</h4>
                  
                  <div>
                    <label className="text-sm font-medium">Quantity</label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      min="1"
                      max="5"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Delivery Address
                    </label>
                    <Input
                      placeholder="Full Name"
                      value={deliveryAddress.fullName}
                      onChange={(e) => setDeliveryAddress(prev => ({ ...prev, fullName: e.target.value }))}
                    />
                    <Input
                      placeholder="Address"
                      value={deliveryAddress.address}
                      onChange={(e) => setDeliveryAddress(prev => ({ ...prev, address: e.target.value }))}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="City"
                        value={deliveryAddress.city}
                        onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                      />
                      <Input
                        placeholder="ZIP Code"
                        value={deliveryAddress.zipCode}
                        onChange={(e) => setDeliveryAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                      />
                    </div>
                    <Input
                      placeholder="Phone Number"
                      value={deliveryAddress.phone}
                      onChange={(e) => setDeliveryAddress(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Notes (Optional)</label>
                    <Textarea
                      placeholder="Any special instructions..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span>Your Total:</span>
                      <span className="font-bold text-lg">
                        ₹{((selectedGroupCart.targetPrice || selectedGroupCart.currentPrice) * quantity) / 100}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Payment via VyronaWallet at checkout
                    </p>
                  </div>

                  <Button
                    onClick={handleJoinGroupCart}
                    disabled={joinGroupCartMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {joinGroupCartMutation.isPending ? "Joining..." : `Join Group Cart - ₹${((selectedGroupCart.targetPrice || selectedGroupCart.currentPrice) * quantity) / 100}`}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Select a group cart to continue
              </div>
            )}
          </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}