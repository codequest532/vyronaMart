import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UPIPaymentModal } from "@/components/UPIPaymentModal";
import {
  ArrowLeft,
  Users,
  Package,
  MapPin,
  CheckCircle,
  Wallet,
  Smartphone,
  Plus,
  Clock,
  Target,
  User,
  Crown,
  QrCode
} from "lucide-react";

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  contributedAmount: number;
  targetAmount: number;
}

interface DeliveryAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isPrimary: boolean;
}

export default function SimpleCheckout() {
  const { roomId: roomIdParam } = useParams();
  const roomId = roomIdParam ? Number(roomIdParam) : null;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Main states
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [totalCartValue, setTotalCartValue] = useState(0);
  const [totalContributed, setTotalContributed] = useState(0);
  const [canProceedToOrder, setCanProceedToOrder] = useState(false);

  // Contribution states
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [contributionAmount, setContributionAmount] = useState("");

  // Payment states
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [upiPaymentDetails, setUpiPaymentDetails] = useState<{
    roomId: number;
    itemId: number;
    amount: number;
    userId: number;
  } | null>(null);

  // Address states
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    isPrimary: false
  });

  // Data fetching
  const { data: cartItemsResponse } = useQuery({
    queryKey: ["/api/room-cart", roomId],
    queryFn: () => fetch(`/api/room-cart/${roomId}`).then(res => res.json()),
    enabled: !!roomId,
  });

  const { data: contributionsResponse } = useQuery({
    queryKey: ["/api/groups", roomId, "contributions"],
    queryFn: () => fetch(`/api/groups/${roomId}/contributions`).then(res => res.json()),
    enabled: !!roomId,
  });

  const { data: currentUser } = useQuery({
    queryKey: ["/api/current-user"],
    queryFn: () => fetch("/api/current-user").then(res => res.json()),
  });

  // Process cart data into order items
  useEffect(() => {
    if (cartItemsResponse && contributionsResponse) {
      const items: OrderItem[] = cartItemsResponse.map((cartItem: any) => {
        const itemContributions = contributionsResponse.filter(
          (contrib: any) => contrib.cartItemId === cartItem.id
        );
        
        const contributedAmount = itemContributions.reduce(
          (sum: number, contrib: any) => sum + contrib.amount,
          0
        );
        
        const targetAmount = cartItem.price * cartItem.quantity * 100; // Convert to paise
        
        return {
          id: cartItem.id,
          name: cartItem.name,
          price: cartItem.price,
          quantity: cartItem.quantity,
          imageUrl: cartItem.imageUrl,
          contributedAmount,
          targetAmount,
        };
      });

      setOrderItems(items);
      
      const totalCart = items.reduce((sum, item) => sum + item.targetAmount, 0);
      const totalContrib = items.reduce((sum, item) => sum + item.contributedAmount, 0);
      
      setTotalCartValue(totalCart);
      setTotalContributed(totalContrib);
      setCanProceedToOrder(totalContrib >= totalCart);
    }
  }, [cartItemsResponse, contributionsResponse]);

  // Handle contribution
  const handleContribute = (item: OrderItem) => {
    setSelectedItem(item);
    setIsContributionModalOpen(true);
  };

  const handleContributionSubmit = () => {
    if (!selectedItem || !currentUser) return;

    const amount = parseInt(contributionAmount) * 100; // Convert to paise
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid contribution amount",
        variant: "destructive",
      });
      return;
    }

    setUpiPaymentDetails({
      roomId: roomId!,
      itemId: selectedItem.id,
      amount,
      userId: currentUser.id,
    });
    
    setIsContributionModalOpen(false);
    setShowUPIModal(true);
  };

  // Handle address saving
  const handleSaveAddress = () => {
    if (!newAddress.fullName || !newAddress.phone || !newAddress.addressLine1 || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      toast({
        title: "Incomplete Address",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const address: DeliveryAddress = {
      id: Date.now().toString(),
      fullName: newAddress.fullName,
      phone: newAddress.phone,
      addressLine1: newAddress.addressLine1,
      addressLine2: newAddress.addressLine2 || '',
      city: newAddress.city,
      state: newAddress.state,
      pincode: newAddress.pincode,
      isPrimary: newAddress.isPrimary
    };

    setDeliveryAddress(address);
    
    // Reset form
    setNewAddress({
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      isPrimary: false
    });
    setShowAddressModal(false);

    toast({
      title: "Address Saved",
      description: newAddress.isPrimary ? "Primary delivery address set for all items" : "Delivery address saved successfully",
    });
  };

  // Handle UPI payment success
  const handleUPIPaymentSuccess = async (referenceId: string) => {
    if (!upiPaymentDetails) return;

    try {
      await apiRequest("POST", "/api/contributions/create", {
        roomId: upiPaymentDetails.roomId,
        cartItemId: upiPaymentDetails.itemId,
        amount: upiPaymentDetails.amount,
        paymentMethod: "upi",
        transactionId: referenceId,
      });

      // Refresh contributions data
      queryClient.invalidateQueries({ queryKey: ["/api/groups", roomId, "contributions"] });

      toast({
        title: "Payment Successful",
        description: "Your contribution has been recorded successfully!",
      });

      setShowUPIModal(false);
      setUpiPaymentDetails(null);
      setContributionAmount("");
    } catch (error) {
      console.error("Payment processing error:", error);
      toast({
        title: "Payment Processing Error",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProceedToOrder = () => {
    if (!deliveryAddress) {
      toast({
        title: "Address Required",
        description: "Please add a delivery address before proceeding",
        variant: "destructive",
      });
      return;
    }

    if (!canProceedToOrder) {
      toast({
        title: "Insufficient Contributions",
        description: "All items must be fully funded before placing the order",
        variant: "destructive",
      });
      return;
    }

    setLocation(`/place-order/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setLocation(`/room/${roomId}`)}
            className="flex items-center gap-2 hover:bg-white/50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Room
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Group Checkout
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-blue-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Package className="h-6 w-6" />
                  Order Items ({orderItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {orderItems.map((item) => {
                  const progress = (item.contributedAmount / item.targetAmount) * 100;
                  const isFullyFunded = item.contributedAmount >= item.targetAmount;
                  
                  return (
                    <div key={item.id} className="p-4 bg-gradient-to-r from-white to-blue-50 rounded-lg border border-blue-200 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-800">{item.name}</h3>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          <p className="text-lg font-bold text-blue-600">₹{item.price}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            {isFullyFunded ? (
                              <Badge className="bg-green-500 text-white">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Fully Funded
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleContribute(item)}
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                              >
                                <Wallet className="h-3 w-3 mr-1" />
                                Contribute
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">
                            ₹{(item.contributedAmount / 100).toFixed(2)} / ₹{(item.targetAmount / 100).toFixed(2)}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-gray-500">{progress.toFixed(1)}% funded</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-green-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <MapPin className="h-6 w-6" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {deliveryAddress ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-lg border-2 border-green-300 shadow-md">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {deliveryAddress.isPrimary && (
                            <>
                              <Crown className="h-4 w-4 text-yellow-600" />
                              <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                                PRIMARY - ALL ITEMS
                              </span>
                            </>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowAddressModal(true)}
                          className="text-xs border-green-300 text-green-600 hover:bg-green-50"
                        >
                          Edit Address
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-800">{deliveryAddress.fullName}</p>
                        <p className="text-sm text-gray-600">{deliveryAddress.phone}</p>
                        <p className="text-sm text-gray-600">
                          {deliveryAddress.addressLine1}
                          {deliveryAddress.addressLine2 && `, ${deliveryAddress.addressLine2}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.pincode}
                        </p>
                      </div>
                    </div>
                    
                    {deliveryAddress.isPrimary && (
                      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-700 font-medium flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          All items will be delivered to this primary address
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 bg-white rounded-lg border-2 border-dashed border-gray-300 text-center">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No delivery address set</p>
                    <Button
                      onClick={() => setShowAddressModal(true)}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Delivery Address
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="bg-white/90 backdrop-blur-sm border-2 border-purple-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                <CardTitle className="text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Cart Value</span>
                    <span className="font-semibold">₹{(totalCartValue / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Contributed</span>
                    <span className="font-semibold text-green-600">₹{(totalContributed / 100).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Remaining</span>
                    <span className={totalContributed >= totalCartValue ? "text-green-600" : "text-red-600"}>
                      ₹{((totalCartValue - totalContributed) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Funding Progress</span>
                    <span>{((totalContributed / totalCartValue) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(totalContributed / totalCartValue) * 100} className="h-3" />
                </div>

                <Button
                  onClick={handleProceedToOrder}
                  disabled={!canProceedToOrder || !deliveryAddress}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3"
                >
                  {!deliveryAddress ? "Add Address First" : !canProceedToOrder ? "Waiting for Full Funding" : "Place Order"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Contribution Modal */}
      <Dialog open={isContributionModalOpen} onOpenChange={setIsContributionModalOpen}>
        <DialogContent className="max-w-md bg-gradient-to-br from-white to-blue-50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              Contribute to {selectedItem?.name}
            </DialogTitle>
            <DialogDescription>
              Enter the amount you want to contribute for this item
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="contribution">Contribution Amount (₹)</Label>
              <Input
                id="contribution"
                type="number"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                placeholder="Enter amount"
                className="border-2 border-blue-200 focus:border-blue-400"
              />
            </div>
            
            {selectedItem && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Item:</strong> {selectedItem.name}<br />
                  <strong>Price:</strong> ₹{selectedItem.price}<br />
                  <strong>Already Contributed:</strong> ₹{(selectedItem.contributedAmount / 100).toFixed(2)}<br />
                  <strong>Remaining:</strong> ₹{((selectedItem.targetAmount - selectedItem.contributedAmount) / 100).toFixed(2)}
                </p>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsContributionModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleContributionSubmit}
                disabled={!contributionAmount || parseInt(contributionAmount) <= 0}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
              >
                Continue to Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* UPI Payment Modal */}
      {showUPIModal && upiPaymentDetails && (
        <UPIPaymentModal
          isOpen={showUPIModal}
          onClose={() => setShowUPIModal(false)}
          amount={upiPaymentDetails.amount / 100}
          roomId={upiPaymentDetails.roomId}
          itemId={upiPaymentDetails.itemId}
          userId={upiPaymentDetails.userId}
          onPaymentSuccess={handleUPIPaymentSuccess}
        />
      )}

      {/* Address Modal */}
      <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-white to-green-50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg text-white">
                <MapPin className="h-6 w-6" />
              </div>
              Add Delivery Address
            </DialogTitle>
            <DialogDescription>
              Enter the delivery address for your order
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={newAddress.fullName}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter full name"
                  className="border-2 border-green-200 focus:border-green-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                  className="border-2 border-green-200 focus:border-green-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1 *</Label>
              <Input
                id="addressLine1"
                value={newAddress.addressLine1}
                onChange={(e) => setNewAddress(prev => ({ ...prev, addressLine1: e.target.value }))}
                placeholder="House/Building number, Street name"
                className="border-2 border-green-200 focus:border-green-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                value={newAddress.addressLine2}
                onChange={(e) => setNewAddress(prev => ({ ...prev, addressLine2: e.target.value }))}
                placeholder="Landmark, Area (optional)"
                className="border-2 border-green-200 focus:border-green-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter city"
                  className="border-2 border-green-200 focus:border-green-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={newAddress.state}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="Enter state"
                  className="border-2 border-green-200 focus:border-green-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  value={newAddress.pincode}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, pincode: e.target.value }))}
                  placeholder="Enter pincode"
                  className="border-2 border-green-200 focus:border-green-400"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <input
                type="checkbox"
                id="isPrimary"
                checked={newAddress.isPrimary}
                onChange={(e) => setNewAddress(prev => ({ ...prev, isPrimary: e.target.checked }))}
                className="w-4 h-4 text-yellow-600 border-yellow-300 rounded focus:ring-yellow-500"
              />
              <label htmlFor="isPrimary" className="text-sm font-medium text-yellow-700 flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Set as primary address (all items will be delivered here)
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddressModal(false)}
                className="flex-1 border-green-300 text-green-600 hover:bg-green-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAddress}
                disabled={!newAddress.fullName || !newAddress.phone || !newAddress.addressLine1 || !newAddress.city || !newAddress.state || !newAddress.pincode}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Address
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}