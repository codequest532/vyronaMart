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

interface GroupCheckoutData {
  items: GroupCartItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    email: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: string;
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
  
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: ""
  });

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

    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.addressLine1) {
      toast({
        title: "Incomplete Address",
        description: "Please fill in all required shipping address fields",
        variant: "destructive",
      });
      return;
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
      shippingAddress,
      paymentMethod,
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
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="Enter state"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pin Code</Label>
                    <Input
                      id="pincode"
                      value={shippingAddress.pincode}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, pincode: e.target.value }))}
                      placeholder="Enter pin code"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
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
                  <span>Place Group Order (₹{Math.round(total)})</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}