import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, Users, MapPin, Clock, ShoppingCart, CreditCard, 
  Wallet, Smartphone, Gift, Coins, Star, CheckCircle, Package,
  Crown, Zap, Timer, Share2, Bell, Award, Calculator, Truck
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
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed';
  paymentId?: string;
  paidAt?: Date;
}

interface GroupCheckoutData {
  items: GroupCartItem[];
  shippingAddress: AddressData;
  memberAddresses?: {[key: string]: AddressData};
  useCommonAddress: boolean;
  paymentMethod: string; // Fallback payment method
  deliveryOption: string;
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
  
  // 15-minute checkout timer (900 seconds)
  const [timeLeft, setTimeLeft] = useState(900);
  const [timerExpired, setTimerExpired] = useState(false);
  
  const [groupCart, setGroupCart] = useState<GroupCartItem[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [deliveryOption, setDeliveryOption] = useState("express");
  const [enableSubscription, setEnableSubscription] = useState(false);
  const [subscriptionFrequency, setSubscriptionFrequency] = useState("weekly");
  const [subscriptionDayOfWeek, setSubscriptionDayOfWeek] = useState("monday");
  const [subscriptionTime, setSubscriptionTime] = useState("10:00");
  const [subscriptionStartDate, setSubscriptionStartDate] = useState("");
  const [useCommonAddress, setUseCommonAddress] = useState(true);
  const [memberContributions, setMemberContributions] = useState<MemberContribution[]>([]);
  const [selectedMemberPayment, setSelectedMemberPayment] = useState<string | null>(null);

  
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

  // 15-minute checkout timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          setTimerExpired(true);
          toast({
            title: "Checkout Timer Expired",
            description: "Your checkout session has expired. Please restart the process.",
            variant: "destructive",
          });
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [toast]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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

  // Calculate delivery fee based on selected option
  const getDeliveryFee = () => {
    let baseFee;
    switch (deliveryOption) {
      case "express": baseFee = 80; break; // VyronaExpress 30-min delivery
      case "standard": baseFee = 45; break; // Standard 60-min delivery
      case "pickup": baseFee = 0; break; // Store pickup
      default: baseFee = 80;
    }
    // Split delivery fee among group members
    return selectedRoom && selectedRoom.memberCount > 1 ? Math.round(baseFee / selectedRoom.memberCount) : baseFee;
  };

  // Calculate totals
  const subtotal = Math.round(groupCart.reduce((sum, item) => sum + ((item.price / 100) * item.quantity), 0));
  const deliveryFee = getDeliveryFee();
  const vyronaCoinsEarned = Math.round(subtotal * 0.05);
  const total = Math.round(subtotal + deliveryFee);

  // Initialize member addresses when room is selected and common address is disabled
  useEffect(() => {
    if (selectedRoom && !useCommonAddress && selectedRoom.memberCount > 0) {
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
  }, [selectedRoom, useCommonAddress, user]);

  // Initialize member contributions when room or total changes
  useEffect(() => {
    if (selectedRoom && selectedRoom.memberCount > 0 && total > 0) {
      const newContributions: MemberContribution[] = [];
      const contributionPerMember = Math.round(total / selectedRoom.memberCount);
      
      for (let i = 1; i <= selectedRoom.memberCount; i++) {
        const memberKey = `member_${i}`;
        
        newContributions.push({
          memberId: memberKey,
          memberName: i === 1 ? (user?.username || `Member ${i}`) : `Member ${i}`,
          contributionAmount: contributionPerMember,
          paymentMethod: "upi",
          contributionItems: [],
          paymentStatus: 'pending'
        });
      }
      
      setMemberContributions(newContributions);
    }
  }, [selectedRoom, total, user]);

  // Member payment mutation
  const memberPaymentMutation = useMutation({
    mutationFn: async ({ memberId, paymentMethod, amount }: { memberId: string, paymentMethod: string, amount: number }) => {
      return await apiRequest("POST", "/api/group-member-payment", {
        memberId,
        paymentMethod,
        amount,
        roomId: selectedRoom?.id,
        memberEmail: memberContributions.find(m => m.memberId === memberId)?.memberName === user?.username ? user?.email : `${memberId}@example.com`
      });
    },
    onSuccess: (response, variables) => {
      // Update member payment status
      setMemberContributions(prev => 
        prev.map(member => 
          member.memberId === variables.memberId 
            ? { ...member, paymentStatus: 'completed', paymentId: response.paymentId, paidAt: new Date() }
            : member
        )
      );
      
      toast({
        title: "Payment Successful!",
        description: `Payment of ₹${variables.amount} completed successfully`,
      });
      
      setSelectedMemberPayment(null);
    },
    onError: (error: any, variables) => {
      // Update member payment status to failed
      setMemberContributions(prev => 
        prev.map(member => 
          member.memberId === variables.memberId 
            ? { ...member, paymentStatus: 'failed' }
            : member
        )
      );
      
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    },
  });

  // Check if all members have paid
  const allMembersPaid = memberContributions.length > 0 && memberContributions.every(member => member.paymentStatus === 'completed');

  // Handle member payment
  const handleMemberPayment = (memberId: string, paymentMethod: string) => {
    const member = memberContributions.find(m => m.memberId === memberId);
    if (!member) return;

    // Update payment status to processing
    setMemberContributions(prev => 
      prev.map(m => 
        m.memberId === memberId 
          ? { ...m, paymentStatus: 'processing', paymentMethod }
          : m
      )
    );

    memberPaymentMutation.mutate({
      memberId,
      paymentMethod,
      amount: member.contributionAmount
    });
  };

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
      
      // Navigate to group order confirmation
      setLocation(`/group-order-confirmation/${response.orderId}`);
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
    if (timerExpired) {
      toast({
        title: "Checkout Timer Expired",
        description: "Your checkout session has expired. Please restart the process.",
        variant: "destructive",
      });
      return;
    }

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
      deliveryOption,
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/vyronamallconnect")}
                className="text-gray-600 hover:text-gray-900"
                disabled={timerExpired}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to VyronaMallConnect
              </Button>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Group MallCart Checkout</h1>
              </div>
            </div>
            
            {/* Checkout Timer */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              timeLeft <= 300 ? 'bg-red-100 text-red-700' : 
              timeLeft <= 600 ? 'bg-yellow-100 text-yellow-700' : 
              'bg-green-100 text-green-700'
            }`}>
              <Timer className="h-5 w-5" />
              <div className="text-center">
                <div className="text-sm font-medium">Time Remaining</div>
                <div className="text-lg font-bold">{formatTime(timeLeft)}</div>
              </div>
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

            {/* Delivery Options */}
            <Card className="border-green-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="h-5 w-5 text-green-600" />
                  <span>Delivery Options</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <RadioGroup value={deliveryOption} onValueChange={setDeliveryOption} className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors">
                      <RadioGroupItem value="express" id="express" />
                      <div className="flex-1">
                        <Label htmlFor="express" className="font-medium text-green-800 cursor-pointer">
                          VyronaExpress - 30 Min Delivery
                        </Label>
                        <p className="text-sm text-green-600 mt-1">
                          Lightning-fast hyperlocal delivery • ₹80 total ({selectedRoom ? `₹${Math.round(80 / selectedRoom.memberCount)}` : '₹80'} per member)
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-700">Most Popular for Groups</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <RadioGroupItem value="standard" id="standard" />
                      <div className="flex-1">
                        <Label htmlFor="standard" className="font-medium text-gray-800 cursor-pointer">
                          Standard Delivery - 60 Min
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Regular delivery within one hour • ₹45 total ({selectedRoom ? `₹${Math.round(45 / selectedRoom.memberCount)}` : '₹45'} per member)
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-xs text-gray-700">Budget-Friendly Option</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 transition-colors">
                      <RadioGroupItem value="pickup" id="pickup" />
                      <div className="flex-1">
                        <Label htmlFor="pickup" className="font-medium text-orange-800 cursor-pointer">
                          Store Pickup - Free
                        </Label>
                        <p className="text-sm text-orange-600 mt-1">
                          Collect from nearest VyronaMall store • No delivery charges
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-xs text-orange-700">Save on Delivery Costs</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </RadioGroup>

                {selectedRoom && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Group Delivery Benefits</span>
                    </div>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Delivery cost split equally among {selectedRoom.memberCount} members</li>
                      <li>• Single delivery saves environment and reduces individual costs</li>
                      <li>• Coordinated delivery time for the entire group</li>
                    </ul>
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
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 mb-3">Member Payment Status</h4>
                      {memberContributions.map((contribution, index) => (
                        <div key={contribution.memberId} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-purple-700">{index + 1}</span>
                              </div>
                              <div>
                                <p className="font-medium">{contribution.memberName}</p>
                                <div className="flex items-center space-x-2">
                                  {contribution.paymentStatus === 'completed' && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                      ✓ Paid
                                    </span>
                                  )}
                                  {contribution.paymentStatus === 'processing' && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                      Processing...
                                    </span>
                                  )}
                                  {contribution.paymentStatus === 'failed' && (
                                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                      Failed
                                    </span>
                                  )}
                                  {contribution.paymentStatus === 'pending' && (
                                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                                      Pending
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-purple-600">₹{contribution.contributionAmount}</p>
                              {contribution.paidAt && (
                                <p className="text-xs text-gray-500">
                                  Paid {new Date(contribution.paidAt).toLocaleTimeString()}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Payment button for pending payments */}
                          {contribution.paymentStatus === 'pending' && (
                            <div className="mt-3">
                              {selectedMemberPayment === contribution.memberId ? (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium text-gray-700">Choose Payment Method:</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleMemberPayment(contribution.memberId, 'upi')}
                                      disabled={memberPaymentMutation.isPending}
                                      className="flex items-center space-x-2"
                                    >
                                      <Smartphone className="h-4 w-4" />
                                      <span>UPI</span>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleMemberPayment(contribution.memberId, 'wallet')}
                                      disabled={memberPaymentMutation.isPending}
                                      className="flex items-center space-x-2"
                                    >
                                      <Wallet className="h-4 w-4" />
                                      <span>Wallet</span>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleMemberPayment(contribution.memberId, 'card')}
                                      disabled={memberPaymentMutation.isPending}
                                      className="flex items-center space-x-2"
                                    >
                                      <CreditCard className="h-4 w-4" />
                                      <span>Card</span>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleMemberPayment(contribution.memberId, 'cod')}
                                      disabled={memberPaymentMutation.isPending}
                                      className="flex items-center space-x-2"
                                    >
                                      <Package className="h-4 w-4" />
                                      <span>COD</span>
                                    </Button>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedMemberPayment(null)}
                                    className="w-full text-gray-600"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedMemberPayment(contribution.memberId)}
                                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                                >
                                  Pay Now ₹{contribution.contributionAmount}
                                </Button>
                              )}
                            </div>
                          )}

                          {/* Retry payment for failed payments */}
                          {contribution.paymentStatus === 'failed' && (
                            <div className="mt-3">
                              <Button
                                size="sm"
                                onClick={() => setSelectedMemberPayment(contribution.memberId)}
                                variant="outline"
                                className="w-full border-red-300 text-red-600 hover:bg-red-50"
                              >
                                Retry Payment ₹{contribution.contributionAmount}
                              </Button>
                            </div>
                          )}
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

            {/* Timer Expired Warning */}
            {timerExpired && (
              <Card className="border-red-300 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 text-red-700">
                    <Timer className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Checkout Session Expired</p>
                      <p className="text-sm">Your 15-minute checkout window has expired. Please restart the process.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Place Order Button */}
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handlePlaceOrder}
              disabled={timerExpired || placeOrderMutation.isPending || groupCart.length === 0 || (selectedRoom && selectedRoom.memberCount > 1 && !allMembersPaid)}
            >
              {placeOrderMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Placing Group Order...</span>
                </div>
              ) : timerExpired ? (
                <div className="flex items-center space-x-2">
                  <Timer className="h-5 w-5" />
                  <span>Checkout Session Expired</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>
                    {selectedRoom && selectedRoom.memberCount > 1 
                      ? `Place Group Order (₹${Math.round(total)})` 
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