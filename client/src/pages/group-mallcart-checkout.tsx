import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, Users, MapPin, Clock, ShoppingCart, CreditCard, 
  Wallet, Smartphone, Gift, Coins, Star, CheckCircle, Package,
  Crown, Zap, Timer, Share2, Bell, Award, Calculator
} from "lucide-react";
import { useLocation } from "wouter";

interface GroupCartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  storeName?: string;
  storeId?: number;
}

interface AddressData {
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

interface MemberContribution {
  memberId: string;
  memberName: string;
  contributionAmount: number;
  paymentMethod: string;
  contributionItems: GroupCartItem[];
}

interface GroupCheckoutData {
  items: GroupCartItem[];
  shippingAddress: AddressData;
  memberAddresses?: {[key: string]: AddressData};
  useCommonAddress: boolean;
  paymentMethod: string; // Fallback payment method
  memberContributions: MemberContribution[];
  selectedRoom?: any;
  enableSubscription: boolean;
  subscriptionFrequency?: string;
  subscriptionDayOfWeek?: string;
  subscriptionTime?: string;
  subscriptionStartDate?: string;
}

export default function GroupMallCartCheckout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [groupCart, setGroupCart] = useState<GroupCartItem[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [enableSubscription, setEnableSubscription] = useState(false);
  const [subscriptionFrequency, setSubscriptionFrequency] = useState("weekly");
  const [subscriptionDayOfWeek, setSubscriptionDayOfWeek] = useState("monday");
  const [subscriptionTime, setSubscriptionTime] = useState("10:00");
  const [subscriptionStartDate, setSubscriptionStartDate] = useState("");
  const [useCommonAddress, setUseCommonAddress] = useState(true);
  const [memberContributions, setMemberContributions] = useState<MemberContribution[]>([]);

  
  const [shippingAddress, setShippingAddress] = useState<AddressData>({
    fullName: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: ""
  });
  
  const [memberAddresses, setMemberAddresses] = useState<{[key: string]: AddressData}>({});

  // Load group cart from localStorage
  useEffect(() => {
    const storedGroupCart = localStorage.getItem('groupMallCart');
    if (storedGroupCart) {
      setGroupCart(JSON.parse(storedGroupCart));
    }
  }, []);

  // Fetch current user for pre-filling address
  const { data: user } = useQuery({
    queryKey: ["/api/current-user"],
    retry: false,
  });

  // Fetch user wallet balance
  const { data: walletData } = useQuery({
    queryKey: ["/api/wallet"],
    retry: false,
  });

  // Fetch shopping rooms for group selection
  const { data: shoppingRooms } = useQuery({
    queryKey: ["/api/shopping-rooms"],
    retry: false,
  });

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setShippingAddress(prev => ({
        ...prev,
        fullName: user.username || "",
        email: user.email || "",
        phone: user.mobile || ""
      }));
    }
  }, [user]);

  // Initialize member data when room is selected
  useEffect(() => {
    if (selectedRoom && selectedRoom.memberCount > 0) {
      // Initialize member addresses for individual delivery mode
      if (!useCommonAddress) {
        const newMemberAddresses: {[key: string]: AddressData} = {};
        
        for (let i = 1; i <= selectedRoom.memberCount; i++) {
          const memberKey = `member_${i}`;
          if (!memberAddresses[memberKey]) {
            newMemberAddresses[memberKey] = {
              fullName: i === 1 ? (user?.username || "") : "",
              phone: i === 1 ? (user?.mobile || "") : "",
              email: i === 1 ? (user?.email || "") : "",
              addressLine1: "",
              addressLine2: "",
              city: "",
              state: "",
              pincode: ""
            };
          } else {
            newMemberAddresses[memberKey] = memberAddresses[memberKey];
          }
        }
        
        setMemberAddresses(newMemberAddresses);
      }
      
      // Initialize member contributions with equal split
      const newContributions: MemberContribution[] = [];
      const contributionPerMember = Math.round(total / selectedRoom.memberCount);
      
      for (let i = 1; i <= selectedRoom.memberCount; i++) {
        const memberKey = `member_${i}`;
        
        newContributions.push({
          memberId: memberKey,
          memberName: i === 1 ? (user?.username || `Member ${i}`) : `Member ${i}`,
          contributionAmount: contributionPerMember,
          paymentMethod: "upi", // Default to UPI for all members
          contributionItems: []
        });
      }
      
      setMemberContributions(newContributions);
    }
  }, [selectedRoom, useCommonAddress, user, total, memberAddresses]);

  // Calculate totals
  const subtotal = groupCart.reduce((sum, item) => sum + ((item.price / 100) * item.quantity), 0);
  const deliveryFee = selectedRoom && selectedRoom.memberCount > 1 ? Math.round(99 / selectedRoom.memberCount) : 99;
  const vyronaCoinsEarned = Math.round(subtotal * 0.05);
  const total = subtotal + deliveryFee;

  // Place group order mutation
  const placeOrderMutation = useMutation({
    mutationFn: async (orderData: GroupCheckoutData) => {
      return await apiRequest("POST", "/api/group-mallcart-orders", orderData);
    },
    onSuccess: (response) => {
      // Clear group cart
      localStorage.removeItem('groupMallCart');
      setGroupCart([]);
      
      toast({
        title: "Group Order Placed Successfully!",
        description: `Order #${response.orderId} has been placed. Group members will be notified.`,
      });
      
      // Navigate to group order tracking
      setLocation(`/group-order-tracking/${response.orderId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place group order",
        variant: "destructive",
      });
    },
  });

  const handlePlaceOrder = () => {
    if (!selectedRoom) {
      toast({
        title: "Please Select Group",
        description: "Choose a shopping group to place this order with",
        variant: "destructive",
      });
      return;
    }

    // Validate addresses based on selected mode
    if (useCommonAddress) {
      if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
        toast({
          title: "Incomplete Address",
          description: "Please fill in all required shipping address fields",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Validate individual member addresses
      const incompleteAddresses = Object.entries(memberAddresses).some(([_, address]) => 
        !address.fullName || !address.phone || !address.addressLine1 || !address.city || !address.state || !address.pincode
      );
      
      if (incompleteAddresses) {
        toast({
          title: "Incomplete Member Addresses",
          description: "Please fill in all required fields for each member address",
          variant: "destructive",
        });
        return;
      }
    }

    if (paymentMethod === "wallet") {
      const walletBalance = walletData?.balance || 0;
      if (walletBalance < total) {
        toast({
          title: "Insufficient Wallet Balance",
          description: `Your wallet balance is ₹${walletBalance}. Required: ₹${total}`,
          variant: "destructive",
        });
        return;
      }
    }

    const orderData: GroupCheckoutData = {
      items: groupCart,
      shippingAddress: useCommonAddress ? shippingAddress : shippingAddress,
      memberAddresses: useCommonAddress ? undefined : memberAddresses,
      useCommonAddress,
      paymentMethod,
      memberContributions,
      selectedRoom,
      enableSubscription,
      subscriptionFrequency: enableSubscription ? subscriptionFrequency : undefined,
      subscriptionDayOfWeek: enableSubscription ? subscriptionDayOfWeek : undefined,
      subscriptionTime: enableSubscription ? subscriptionTime : undefined,
      subscriptionStartDate: enableSubscription ? subscriptionStartDate : undefined,
    };

    placeOrderMutation.mutate(orderData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/vyronamallconnect")}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to VyronaMallConnect
            </Button>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Group MallCart Checkout</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Order Details & Forms */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Group Selection */}
            <Card className="border-blue-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Select Shopping Group</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Select value={selectedRoom?.id?.toString() || ""} onValueChange={(value) => {
                  const room = shoppingRooms?.find((r: any) => r.id.toString() === value);
                  setSelectedRoom(room);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a shopping group..." />
                  </SelectTrigger>
                  <SelectContent>
                    {shoppingRooms?.map((room: any) => (
                      <SelectItem key={room.id} value={room.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{room.name}</span>
                          <div className="flex items-center space-x-2 ml-4">
                            <Badge variant="secondary">{room.memberCount} members</Badge>
                            <span className="text-xs text-gray-500">#{room.roomCode}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedRoom && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-blue-900">{selectedRoom.name}</p>
                        <p className="text-sm text-blue-700">{selectedRoom.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Users className="h-4 w-4" />
                          <span className="text-sm font-medium">{selectedRoom.memberCount} members</span>
                        </div>
                        <p className="text-xs text-blue-600">Shared delivery: ₹{deliveryFee}/person</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card className="border-orange-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-pink-50">
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  <span>Delivery Address</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Address Type Toggle */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useCommonAddress"
                      checked={useCommonAddress}
                      onChange={(e) => setUseCommonAddress(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="useCommonAddress" className="font-medium text-blue-700">
                      Set as primary address for all group members
                    </Label>
                  </div>
                  <p className="text-sm text-blue-600 mt-2">
                    {useCommonAddress 
                      ? "All group members will receive items at the same address" 
                      : "Each group member can enter their individual delivery address"
                    }
                  </p>
                </div>

                {useCommonAddress ? (
                  /* Common Address Form */
                  <div>
                    <h3 className="font-medium text-gray-700 mb-4">Common Delivery Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          value={shippingAddress.fullName}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, fullName: e.target.value }))}
                          placeholder="Enter full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          value={shippingAddress.phone}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={shippingAddress.email}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter email address"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="addressLine1">Address Line 1 *</Label>
                        <Input
                          id="addressLine1"
                          value={shippingAddress.addressLine1}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, addressLine1: e.target.value }))}
                          placeholder="House number, street name"
                        />
                      </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="addressLine2">Address Line 2</Label>
                    <Input
                      id="addressLine2"
                      value={shippingAddress.addressLine2}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, addressLine2: e.target.value }))}
                      placeholder="Apartment, suite, unit (optional)"
                    />
                      </div>
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Enter city"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          value={shippingAddress.state}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                          placeholder="Enter state"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="pincode">Pincode *</Label>
                        <Input
                          id="pincode"
                          value={shippingAddress.pincode}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, pincode: e.target.value }))}
                          placeholder="Enter pincode"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Individual Member Addresses */
                  <div>
                    <h3 className="font-medium text-gray-700 mb-4">Individual Member Addresses</h3>
                    {selectedRoom && Object.keys(memberAddresses).length > 0 ? (
                      <div className="space-y-6">
                        {Object.entries(memberAddresses).map(([memberKey, address], index) => (
                          <div key={memberKey} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                            <h4 className="font-medium text-gray-600 mb-3">
                              Member {index + 1} {index === 0 ? "(You)" : ""} Address
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`${memberKey}_fullName`}>Full Name *</Label>
                                <Input
                                  id={`${memberKey}_fullName`}
                                  value={address.fullName}
                                  onChange={(e) => setMemberAddresses(prev => ({
                                    ...prev,
                                    [memberKey]: { ...prev[memberKey], fullName: e.target.value }
                                  }))}
                                  placeholder="Enter full name"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`${memberKey}_phone`}>Phone Number *</Label>
                                <Input
                                  id={`${memberKey}_phone`}
                                  value={address.phone}
                                  onChange={(e) => setMemberAddresses(prev => ({
                                    ...prev,
                                    [memberKey]: { ...prev[memberKey], phone: e.target.value }
                                  }))}
                                  placeholder="Enter phone number"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label htmlFor={`${memberKey}_email`}>Email Address</Label>
                                <Input
                                  id={`${memberKey}_email`}
                                  type="email"
                                  value={address.email}
                                  onChange={(e) => setMemberAddresses(prev => ({
                                    ...prev,
                                    [memberKey]: { ...prev[memberKey], email: e.target.value }
                                  }))}
                                  placeholder="Enter email address"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label htmlFor={`${memberKey}_addressLine1`}>Address Line 1 *</Label>
                                <Input
                                  id={`${memberKey}_addressLine1`}
                                  value={address.addressLine1}
                                  onChange={(e) => setMemberAddresses(prev => ({
                                    ...prev,
                                    [memberKey]: { ...prev[memberKey], addressLine1: e.target.value }
                                  }))}
                                  placeholder="House number, street name"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label htmlFor={`${memberKey}_addressLine2`}>Address Line 2</Label>
                                <Input
                                  id={`${memberKey}_addressLine2`}
                                  value={address.addressLine2}
                                  onChange={(e) => setMemberAddresses(prev => ({
                                    ...prev,
                                    [memberKey]: { ...prev[memberKey], addressLine2: e.target.value }
                                  }))}
                                  placeholder="Apartment, suite, unit (optional)"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`${memberKey}_city`}>City *</Label>
                                <Input
                                  id={`${memberKey}_city`}
                                  value={address.city}
                                  onChange={(e) => setMemberAddresses(prev => ({
                                    ...prev,
                                    [memberKey]: { ...prev[memberKey], city: e.target.value }
                                  }))}
                                  placeholder="Enter city"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`${memberKey}_state`}>State *</Label>
                                <Input
                                  id={`${memberKey}_state`}
                                  value={address.state}
                                  onChange={(e) => setMemberAddresses(prev => ({
                                    ...prev,
                                    [memberKey]: { ...prev[memberKey], state: e.target.value }
                                  }))}
                                  placeholder="Enter state"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label htmlFor={`${memberKey}_pincode`}>Pincode *</Label>
                                <Input
                                  id={`${memberKey}_pincode`}
                                  value={address.pincode}
                                  onChange={(e) => setMemberAddresses(prev => ({
                                    ...prev,
                                    [memberKey]: { ...prev[memberKey], pincode: e.target.value }
                                  }))}
                                  placeholder="Enter pincode"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p>Please select a group to enter member addresses</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Member Payment Responsibilities */}
            {selectedRoom && selectedRoom.memberCount > 1 && (
              <Card className="border-purple-200 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span>Group Payment Split</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Simple explanation */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-xs font-bold text-white">i</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900 mb-1">How Group Payment Works</h4>
                          <p className="text-sm text-blue-800">
                            Each member will pay their share directly using their preferred payment method. 
                            The order will be placed once all members have completed their payments.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Split calculation */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Order Amount:</span>
                        <span className="text-xl font-bold text-purple-600">₹{total}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Number of Members:</span>
                        <span className="text-sm font-medium">{selectedRoom.memberCount}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="font-medium">Amount per Member:</span>
                        <span className="text-lg font-bold text-green-600">
                          ₹{Math.round(total / selectedRoom.memberCount)}
                        </span>
                      </div>
                    </div>

                    {/* Member list with payment status */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 mb-3">Member Payment Status</h4>
                      {memberContributions.map((contribution, index) => (
                        <div key={contribution.memberId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-purple-700">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium">{contribution.memberName}</p>
                              <div className="flex items-center space-x-2">
                                {contribution.paymentMethod === "upi" && <Smartphone className="h-4 w-4 text-blue-600" />}
                                {contribution.paymentMethod === "wallet" && <Wallet className="h-4 w-4 text-green-600" />}
                                {contribution.paymentMethod === "card" && <CreditCard className="h-4 w-4 text-purple-600" />}
                                <span className="text-sm text-gray-600 capitalize">{contribution.paymentMethod}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-purple-600">₹{contribution.contributionAmount}</p>
                            <p className="text-xs text-gray-500">Pending Payment</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Method for Individual Orders */}
            {(!selectedRoom || selectedRoom.memberCount <= 1) && (
              <Card className="border-purple-200 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                    <span>Payment Method</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === "upi" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => setPaymentMethod("upi")}
                  >
                    <div className="flex items-center space-x-3">
                      <Smartphone className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">UPI Payment</p>
                        <p className="text-sm text-gray-600">Pay via UPI apps</p>
                      </div>
                    </div>
                  </div>
                  
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === "wallet" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => setPaymentMethod("wallet")}
                  >
                    <div className="flex items-center space-x-3">
                      <Wallet className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">VyronaCoins Wallet</p>
                        <p className="text-sm text-gray-600">Balance: ₹{walletData?.balance || 0}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === "card" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => setPaymentMethod("card")}
                  >
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium">Credit/Debit Card</p>
                        <p className="text-sm text-gray-600">Secure card payment</p>
                      </div>
                    </div>
                  </div>
                  
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === "cod" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => setPaymentMethod("cod")}
                  >
                    <div className="flex items-center space-x-3">
                      <Package className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium">Cash on Delivery</p>
                        <p className="text-sm text-gray-600">Pay when delivered</p>
                      </div>
                    </div>
                  </div>
                </div>
                </CardContent>
              </Card>
            )}

            {/* Subscription Options */}
            <Card className="border-green-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  <span>Regular Group Orders (Optional)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="enableSubscription"
                    checked={enableSubscription}
                    onChange={(e) => setEnableSubscription(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="enableSubscription">Set up regular group orders with the same items</Label>
                </div>
                
                {enableSubscription && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select value={subscriptionFrequency} onValueChange={setSubscriptionFrequency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="dayOfWeek">Day of Week</Label>
                      <Select value={subscriptionDayOfWeek} onValueChange={setSubscriptionDayOfWeek}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday">Monday</SelectItem>
                          <SelectItem value="tuesday">Tuesday</SelectItem>
                          <SelectItem value="wednesday">Wednesday</SelectItem>
                          <SelectItem value="thursday">Thursday</SelectItem>
                          <SelectItem value="friday">Friday</SelectItem>
                          <SelectItem value="saturday">Saturday</SelectItem>
                          <SelectItem value="sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="time">Preferred Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={subscriptionTime}
                        onChange={(e) => setSubscriptionTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            
            {/* Group Cart Items */}
            <Card className="border-blue-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  <span>Group Cart Items ({groupCart.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {groupCart.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Package className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                        <p className="text-sm font-medium text-blue-600">₹{Math.round(item.price / 100)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="border-orange-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-pink-50">
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5 text-orange-600" />
                  <span>Group Order Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{Math.round(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Delivery Fee 
                      {selectedRoom && selectedRoom.memberCount > 1 && (
                        <span className="text-xs text-green-600 block">
                          (₹99 ÷ {selectedRoom.memberCount} members)
                        </span>
                      )}
                    </span>
                    <span className="font-medium">₹{deliveryFee}</span>
                  </div>
                  
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center space-x-1">
                      <Coins className="h-4 w-4" />
                      <span>VyronaCoins Earned</span>
                    </span>
                    <span className="font-medium">+{vyronaCoinsEarned}</span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-blue-600">₹{Math.round(total)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Group Benefits */}
            <Card className="border-purple-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center space-x-2">
                  <Gift className="h-5 w-5 text-purple-600" />
                  <span>Group Shopping Benefits</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Shared delivery costs</span>
                  </div>
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Star className="h-4 w-4" />
                    <span>5% VyronaCoins cashback</span>
                  </div>
                  <div className="flex items-center space-x-2 text-purple-600">
                    <Crown className="h-4 w-4" />
                    <span>Priority delivery for groups</span>
                  </div>
                  <div className="flex items-center space-x-2 text-orange-600">
                    <Bell className="h-4 w-4" />
                    <span>Group order notifications</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Place Order Button */}
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              onClick={handlePlaceOrder}
              disabled={placeOrderMutation.isPending || groupCart.length === 0}
            >
              {placeOrderMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Placing Group Order...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>
                    {selectedRoom && selectedRoom.memberCount > 1 
                      ? `Initiate Group Payment (₹${Math.round(total)})` 
                      : `Place Order (₹${Math.round(total)})`
                    }
                  </span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}