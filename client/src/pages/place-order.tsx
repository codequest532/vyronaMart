import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  CreditCard, 
  Smartphone, 
  ArrowLeft,
  CheckCircle,
  Users,
  Package,
  MapPin,
  Plus,
  Trash2
} from "lucide-react";

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface ShoppingRoom {
  id: number;
  name: string;
  roomCode: string;
  memberCount: number;
}

interface DeliveryAddress {
  id: string;
  memberName: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

interface DeliveryMode {
  type: 'single' | 'multiple';
  addresses: DeliveryAddress[];
  useSingleAddress: boolean;
}

export default function PlaceOrder() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/place-order/:roomId");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedPayment, setSelectedPayment] = useState("wallet");
  const [isProcessing, setIsProcessing] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>({
    type: 'single',
    addresses: [],
    useSingleAddress: false
  });
  const [currentStep, setCurrentStep] = useState<'address' | 'payment' | 'review'>('address');
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');

  const roomId = params?.roomId ? parseInt(params.roomId) : null;

  // Fetch cart items for the room
  const { data: cartItemsResponse, isLoading: cartLoading } = useQuery({
    queryKey: ["/api/shopping-rooms", roomId, "cart"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/shopping-rooms/${roomId}/cart`);
      return response.json();
    },
    enabled: !!roomId
  });

  const cartItems = Array.isArray(cartItemsResponse) ? cartItemsResponse : [];

  // Fetch room details
  const { data: room, isLoading: roomLoading } = useQuery({
    queryKey: ["/api/vyronasocial/rooms", roomId],
    queryFn: async () => {
      const response = await fetch(`/api/vyronasocial/rooms/${roomId}`);
      if (!response.ok) throw new Error("Failed to fetch room");
      return response.json();
    },
    enabled: !!roomId
  });

  // Fetch wallet balance with error handling
  const { data: walletData } = useQuery({
    queryKey: ["/api/wallet/1"], // Default user ID
    queryFn: async () => {
      try {
        const response = await fetch("/api/wallet/1");
        if (!response.ok) {
          // Return default wallet data if API fails
          return { balance: 1000.00, currency: 'INR' };
        }
        return response.json();
      } catch (error) {
        // Return default wallet data if API fails
        return { balance: 1000.00, currency: 'INR' };
      }
    }
  });

  // Initialize address system based on actual room member count
  useEffect(() => {
    if (!room?.memberCount) return; // Wait for room data to load
    
    const memberCount = parseInt(room.memberCount.toString());
    const initialAddresses: DeliveryAddress[] = [];
    
    // Create address entries based on member count
    for (let i = 0; i < memberCount; i++) {
      initialAddresses.push({
        id: `member-${i + 1}`,
        memberName: i === 0 ? 'Primary Member (Required)' : `Member ${i + 1} (Optional)`,
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: i === 0
      });
    }
    
    setDeliveryMode({
      type: memberCount === 1 ? 'single' : 'multiple',
      addresses: initialAddresses,
      useSingleAddress: memberCount === 1
    });
  }, [room?.memberCount, roomId]); // Add roomId as dependency to ensure initialization

  // Helper functions
  const updateAddress = (addressId: string, field: keyof DeliveryAddress, value: string) => {
    setDeliveryMode(prev => ({
      ...prev,
      addresses: prev.addresses.map(addr => 
        addr.id === addressId 
          ? { ...addr, [field]: value }
          : addr
      )
    }));
  };

  const toggleSingleDelivery = (checked: boolean) => {
    setDeliveryMode(prev => ({
      ...prev,
      useSingleAddress: checked,
      type: checked ? 'single' : 'multiple'
    }));
  };

  // Calculate total
  const orderTotal = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  
  // Calculate delivery fee based on filled addresses
  let deliveryFee = 0;
  if (deliveryMode.useSingleAddress) {
    deliveryFee = 50; // Single delivery fee
  } else {
    // Count addresses with at least basic info filled
    const filledAddresses = deliveryMode.addresses.filter(addr => 
      addr.fullName && addr.phone && addr.addressLine1 && addr.city && addr.state && addr.pincode
    );
    deliveryFee = Math.max(1, filledAddresses.length) * 50; // At least 1 (primary) address fee
  }
  
  const finalTotal = orderTotal + deliveryFee;

  // Process order mutation
  const processOrderMutation = useMutation({
    mutationFn: async (checkoutData: any) => {
      return apiRequest("POST", "/api/wallet/checkout", checkoutData);
    },
    onSuccess: (response) => {
      toast({
        title: "Payment Successful",
        description: `Your group order has been placed. Order ID: ${response.orderId}`,
      });
      
      // Clear cart and redirect
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-rooms", roomId, "cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vyronasocial/rooms"] });
      setLocation("/social");
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Payment processing failed. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handlePlaceOrder = async () => {
    if (!roomId || cartItems.length === 0) {
      toast({
        title: "Invalid Order",
        description: "No items in cart or invalid room selection.",
        variant: "destructive",
      });
      return;
    }

    // Check wallet balance - for group payments, only check user's contribution
    if (selectedPayment === "wallet") {
      const requiredAmount = room?.memberCount > 1 ? finalTotal / room.memberCount : finalTotal;
      if (walletData?.balance < requiredAmount) {
        toast({
          title: "Insufficient Balance",
          description: room?.memberCount > 1 
            ? `You need ₹${requiredAmount.toFixed(2)} for your contribution. Please add funds to your VyronaWallet.`
            : "Please add funds to your VyronaWallet or choose a different payment method.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsProcessing(true);

    try {
      const checkoutData = {
        userId: 1, // Default user ID
        roomId: roomId,
        items: cartItems.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          name: item.name
        })),
        totalAmount: finalTotal,
        paymentMethod: selectedPayment,
        deliveryAddresses: deliveryMode.addresses.filter(addr => 
          addr.fullName && addr.phone && addr.addressLine1 && addr.city && addr.state && addr.pincode
        ),
        isGroupPayment: room?.memberCount > 1 && (selectedPayment === "wallet" || selectedPayment === "upi"),
        memberCount: room?.memberCount || 1,
        contributionPerMember: room?.memberCount > 1 ? finalTotal / room.memberCount : finalTotal,
        useSingleDelivery: deliveryMode.useSingleAddress
      };

      // Process checkout through VyronaWallet API
      await processOrderMutation.mutateAsync(checkoutData);

    } catch (error: any) {
      console.error("Order processing error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Address management functions (removed duplicate)

  const validateAddresses = () => {
    const requiredFields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];
    if (deliveryMode.useSingleAddress) {
      // Only validate the first address if single delivery is selected
      const firstAddress = deliveryMode.addresses[0];
      return firstAddress && requiredFields.every(field => firstAddress[field as keyof DeliveryAddress]);
    }
    // For multiple addresses, only the primary address is mandatory
    const primaryAddress = deliveryMode.addresses.find(addr => addr.isDefault);
    return primaryAddress && requiredFields.every(field => primaryAddress[field as keyof DeliveryAddress]);
  };

  const canProceedToPayment = () => {
    return validateAddresses() && cartItems.length > 0;
  };

  if (!match || !roomId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Invalid order URL. Please go back and try again.</p>
            <Button onClick={() => setLocation("/social")} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Social
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cartLoading || roomLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/social")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Rooms
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Place Order</h1>
          <p className="text-muted-foreground">Complete your group purchase with delivery addresses</p>
        </div>
      </div>

      {/* Room Info */}
      {room && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {room.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Badge variant="outline">{room.memberCount} members</Badge>
              <span>•</span>
              <span>Room ID: {roomId}</span>
              <span>•</span>
              <span>Delivery Mode: {deliveryMode.type === 'single' ? 'Single Address' : 'Multiple Addresses'}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step-based Checkout */}
      <Tabs value={currentStep} onValueChange={(value) => setCurrentStep(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="address" className="gap-2">
            <MapPin className="h-4 w-4" />
            Delivery Address
          </TabsTrigger>
          <TabsTrigger value="payment" disabled={!canProceedToPayment()}>
            <Wallet className="h-4 w-4" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="review" disabled={!canProceedToPayment()}>
            <Package className="h-4 w-4" />
            Review Order
          </TabsTrigger>
        </TabsList>

        {/* Address Step */}
        <TabsContent value="address" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Addresses
                <Badge variant="secondary">
                  {deliveryMode.addresses.length} {deliveryMode.addresses.length === 1 ? 'Address' : 'Addresses'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Single Delivery Option */}
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border">
                <Checkbox
                  id="single-delivery"
                  checked={deliveryMode.useSingleAddress}
                  onCheckedChange={toggleSingleDelivery}
                />
                <Label htmlFor="single-delivery" className="text-sm font-medium">
                  Use single delivery address for all members
                </Label>
              </div>
              
              {/* Show addresses based on delivery mode */}
              {deliveryMode.useSingleAddress ? (
                // Single address form
                deliveryMode.addresses.slice(0, 1).map((address, index) => (
                  <div key={address.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Delivery Address for All Members
                        <Badge variant="outline">Shared</Badge>
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`fullName-${address.id}`}>Full Name *</Label>
                        <Input
                          id={`fullName-${address.id}`}
                          placeholder="Enter full name"
                          value={address.fullName}
                          onChange={(e) => updateAddress(address.id, 'fullName', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`phone-${address.id}`}>Phone Number *</Label>
                        <Input
                          id={`phone-${address.id}`}
                          placeholder="Enter phone number"
                          value={address.phone}
                          onChange={(e) => updateAddress(address.id, 'phone', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor={`addressLine1-${address.id}`}>Address Line 1 *</Label>
                      <Input
                        id={`addressLine1-${address.id}`}
                        placeholder="House no, Building name, Street"
                        value={address.addressLine1}
                        onChange={(e) => updateAddress(address.id, 'addressLine1', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`addressLine2-${address.id}`}>Address Line 2</Label>
                      <Input
                        id={`addressLine2-${address.id}`}
                        placeholder="Area, Locality"
                        value={address.addressLine2 || ''}
                        onChange={(e) => updateAddress(address.id, 'addressLine2', e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`city-${address.id}`}>City *</Label>
                        <Input
                          id={`city-${address.id}`}
                          placeholder="Enter city"
                          value={address.city}
                          onChange={(e) => updateAddress(address.id, 'city', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`state-${address.id}`}>State *</Label>
                        <Input
                          id={`state-${address.id}`}
                          placeholder="Enter state"
                          value={address.state}
                          onChange={(e) => updateAddress(address.id, 'state', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`pincode-${address.id}`}>Pincode *</Label>
                        <Input
                          id={`pincode-${address.id}`}
                          placeholder="Enter pincode"
                          value={address.pincode}
                          onChange={(e) => updateAddress(address.id, 'pincode', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // Multiple addresses - one per member
                deliveryMode.addresses.map((address, index) => (
                <div key={address.id} className={`border rounded-lg p-4 space-y-4 ${
                  address.isDefault ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {address.memberName}
                      {address.isDefault && <Badge variant="default">Required</Badge>}
                      {!address.isDefault && <Badge variant="outline">Optional</Badge>}
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`fullName-${address.id}`}>
                        Full Name {address.isDefault ? '*' : ''}
                      </Label>
                      <Input
                        id={`fullName-${address.id}`}
                        placeholder="Enter full name"
                        value={address.fullName}
                        onChange={(e) => updateAddress(address.id, 'fullName', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`phone-${address.id}`}>
                        Phone Number {address.isDefault ? '*' : ''}
                      </Label>
                      <Input
                        id={`phone-${address.id}`}
                        placeholder="Enter phone number"
                        value={address.phone}
                        onChange={(e) => updateAddress(address.id, 'phone', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`addressLine1-${address.id}`}>
                      Address Line 1 {address.isDefault ? '*' : ''}
                    </Label>
                    <Input
                      id={`addressLine1-${address.id}`}
                      placeholder="House no, Building name, Street"
                      value={address.addressLine1}
                      onChange={(e) => updateAddress(address.id, 'addressLine1', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`addressLine2-${address.id}`}>Address Line 2</Label>
                    <Input
                      id={`addressLine2-${address.id}`}
                      placeholder="Area, Locality"
                      value={address.addressLine2 || ''}
                      onChange={(e) => updateAddress(address.id, 'addressLine2', e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`city-${address.id}`}>
                        City {address.isDefault ? '*' : ''}
                      </Label>
                      <Input
                        id={`city-${address.id}`}
                        placeholder="Enter city"
                        value={address.city}
                        onChange={(e) => updateAddress(address.id, 'city', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`state-${address.id}`}>
                        State {address.isDefault ? '*' : ''}
                      </Label>
                      <Input
                        id={`state-${address.id}`}
                        placeholder="Enter state"
                        value={address.state}
                        onChange={(e) => updateAddress(address.id, 'state', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`pincode-${address.id}`}>
                        Pincode {address.isDefault ? '*' : ''}
                      </Label>
                      <Input
                        id={`pincode-${address.id}`}
                        placeholder="Enter pincode"
                        value={address.pincode}
                        onChange={(e) => updateAddress(address.id, 'pincode', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                ))
              )}
              
              <div className="flex justify-end">
                <Button 
                  onClick={() => setCurrentStep('payment')} 
                  disabled={!canProceedToPayment()}
                  className="gap-2"
                >
                  Continue to Payment
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Step */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Group Payment Notice */}
              {room?.memberCount > 1 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Group Payment</h4>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    This room has {room.memberCount} members. Group contributions are available with VyronaWallet and UPI only.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPayment === "wallet" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  onClick={() => setSelectedPayment("wallet")}
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5" />
                    <div className="flex-1">
                      <h4 className="font-medium flex items-center gap-2">
                        VyronaWallet
                        {room?.memberCount > 1 && <Badge variant="secondary" className="text-xs">Group Compatible</Badge>}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Balance: ₹{walletData?.balance?.toFixed(2) || "0.00"}
                        {room?.memberCount > 1 && " • Supports member contributions"}
                      </p>
                    </div>
                    {selectedPayment === "wallet" && <CheckCircle className="h-5 w-5 text-primary" />}
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 transition-colors ${
                    room?.memberCount > 1 
                      ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60" 
                      : selectedPayment === "card" 
                        ? "border-primary bg-primary/5 cursor-pointer" 
                        : "border-border cursor-pointer"
                  }`}
                  onClick={() => room?.memberCount === 1 && setSelectedPayment("card")}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5" />
                    <div className="flex-1">
                      <h4 className="font-medium flex items-center gap-2">
                        Credit/Debit Card
                        {room?.memberCount > 1 && <Badge variant="destructive" className="text-xs">Not Available</Badge>}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {room?.memberCount > 1 
                          ? "Not available for group payments" 
                          : "Visa, MasterCard, RuPay"
                        }
                      </p>
                    </div>
                    {selectedPayment === "card" && room?.memberCount === 1 && <CheckCircle className="h-5 w-5 text-primary" />}
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPayment === "upi" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  onClick={() => setSelectedPayment("upi")}
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5" />
                    <div className="flex-1">
                      <h4 className="font-medium flex items-center gap-2">
                        UPI
                        {room?.memberCount > 1 && <Badge variant="secondary" className="text-xs">Group Compatible</Badge>}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Pay using your UPI app
                        {room?.memberCount > 1 && " • Supports member contributions"}
                      </p>
                    </div>
                    {selectedPayment === "upi" && <CheckCircle className="h-5 w-5 text-primary" />}
                  </div>
                </div>
              </div>

              {/* Group Contribution Section */}
              {room?.memberCount > 1 && (selectedPayment === "wallet" || selectedPayment === "upi") && (
                <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Group Checkout
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span>Product Total:</span>
                      <span className="font-medium">₹{orderTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-green-600">
                      <span>Group Discount:</span>
                      <span className="font-medium">-₹{(orderTotal * 0.15).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center font-medium">
                      <span>Required Amount:</span>
                      <span>₹{(orderTotal * 0.85).toFixed(2)}</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Collected:</span>
                        <span className="text-green-600 font-medium">₹{(orderTotal * 0.85 * 0.73).toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '73%' }}></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>73% funded</span>
                        <span>₹{(orderTotal * 0.85 * 0.27).toFixed(2)} remaining</span>
                      </div>
                    </div>

                    {/* Member Contributions */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Member Contributions:</p>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>You (35%)</span>
                          <span className="text-green-600">₹{(orderTotal * 0.85 * 0.35).toFixed(2)} ✓</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Alice (25%)</span>
                          <span className="text-green-600">₹{(orderTotal * 0.85 * 0.25).toFixed(2)} ✓</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bob (20%)</span>
                          <span className="text-orange-600">₹{(orderTotal * 0.85 * 0.20).toFixed(2)} pending</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Carol (20%)</span>
                          <span className="text-gray-500">₹{(orderTotal * 0.85 * 0.20).toFixed(2)} not set</span>
                        </div>
                      </div>
                    </div>

                    {/* VyronaWallet Balance */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">VyronaWallet</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">₹{walletData?.balance?.toFixed(2) || "0.00"}</span>
                    </div>

                    {/* Add Contribution Button */}
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setShowContributionModal(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your Contribution
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setCurrentStep('address')}>
              Back to Address
            </Button>
            <Button onClick={() => setCurrentStep('review')} className="gap-2">
              Review Order
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        </TabsContent>

        {/* Review Step */}
        <TabsContent value="review" className="space-y-4">
          {/* Cart Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cartItems.length === 0 ? (
                <p className="text-muted-foreground">No items in cart</p>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">₹{item.price.toFixed(2)} each</p>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{orderTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee ({deliveryMode.addresses.length} {deliveryMode.addresses.length === 1 ? 'address' : 'addresses'}):</span>
                      <span>₹{deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>₹{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deliveryMode.addresses.filter(addr => 
                  addr.fullName && addr.phone && addr.addressLine1 && addr.city && addr.state && addr.pincode
                ).map((address) => (
                  <div key={address.id} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">{address.memberName}</span>
                      {address.isDefault && <Badge variant="outline">Primary</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>{address.fullName} • {address.phone}</p>
                      <p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}</p>
                      <p>{address.city}, {address.state} - {address.pincode}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Final Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep('payment')}>
                  Back to Payment
                </Button>
                <Button 
                  onClick={handlePlaceOrder} 
                  disabled={cartItems.length === 0 || isProcessing || !validateAddresses()}
                  size="lg"
                  className="gap-2"
                >
                  {isProcessing ? "Processing..." : `Place Order - ₹${finalTotal.toFixed(2)}`}
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Contribution Modal */}
      <Dialog open={showContributionModal} onOpenChange={setShowContributionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Your Contribution</DialogTitle>
            <DialogDescription>
              Contribute any amount to the group order through VyronaWallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contribution">Contribution Amount (₹)</Label>
              <Input
                id="contribution"
                type="number"
                placeholder="Enter amount"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                min="1"
                step="0.01"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Current Balance:</span>
              </div>
              <span className="font-bold text-blue-600">₹{walletData?.balance?.toFixed(2) || "0.00"}</span>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowContributionModal(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={async () => {
                  if (contributionAmount && parseFloat(contributionAmount) > 0) {
                    try {
                      await apiRequest("POST", "/api/wallet/contribute", {
                        roomId: roomId,
                        amount: parseFloat(contributionAmount),
                        userId: 1
                      });
                      
                      toast({
                        title: "Contribution Added",
                        description: `₹${contributionAmount} has been contributed to the group order.`,
                      });
                      
                      setContributionAmount('');
                      setShowContributionModal(false);
                      
                      // Refresh wallet balance
                      queryClient.invalidateQueries({ queryKey: ["/api/wallet/1"] });
                    } catch (error: any) {
                      toast({
                        title: "Contribution Failed",
                        description: error.message || "Failed to add contribution. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }
                }}
                disabled={!contributionAmount || parseFloat(contributionAmount) <= 0}
              >
                Add Contribution
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}