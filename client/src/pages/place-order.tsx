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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    addresses: []
  });
  const [currentStep, setCurrentStep] = useState<'address' | 'payment' | 'review'>('address');

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

  // Initialize address system with fallback
  useEffect(() => {
    // Initialize with default if room data is not available yet
    const memberCount = room?.memberCount ? parseInt(room.memberCount.toString()) : 2;
    const initialAddresses: DeliveryAddress[] = [];
    
    // Create address entries based on member count
    for (let i = 0; i < memberCount; i++) {
      initialAddresses.push({
        id: `member-${i + 1}`,
        memberName: i === 0 ? 'You' : `Member ${i + 1}`,
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
      addresses: initialAddresses
    });
  }, [room?.memberCount, roomId]); // Add roomId as dependency to ensure initialization

  // Calculate total
  const orderTotal = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const deliveryFee = deliveryMode.type === 'single' ? 50 : deliveryMode.addresses.length * 50;
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

    if (selectedPayment === "wallet" && walletData?.balance < finalTotal) {
      toast({
        title: "Insufficient Balance",
        description: "Please add funds to your VyronaWallet or choose a different payment method.",
        variant: "destructive",
      });
      return;
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

  // Address management functions
  const updateAddress = (addressId: string, field: keyof DeliveryAddress, value: string) => {
    setDeliveryMode(prev => ({
      ...prev,
      addresses: prev.addresses.map(addr =>
        addr.id === addressId ? { ...addr, [field]: value } : addr
      )
    }));
  };

  const validateAddresses = () => {
    const requiredFields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];
    return deliveryMode.addresses.every(addr =>
      requiredFields.every(field => addr[field as keyof DeliveryAddress])
    );
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
              {deliveryMode.addresses.map((address, index) => (
                <div key={address.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {address.memberName}
                      {address.isDefault && <Badge variant="outline">Primary</Badge>}
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
              ))}
              
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
                      <h4 className="font-medium">VyronaWallet</h4>
                      <p className="text-sm text-muted-foreground">
                        Balance: ₹{walletData?.balance?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                    {selectedPayment === "wallet" && <CheckCircle className="h-5 w-5 text-primary" />}
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPayment === "card" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  onClick={() => setSelectedPayment("card")}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5" />
                    <div className="flex-1">
                      <h4 className="font-medium">Credit/Debit Card</h4>
                      <p className="text-sm text-muted-foreground">Visa, MasterCard, RuPay</p>
                    </div>
                    {selectedPayment === "card" && <CheckCircle className="h-5 w-5 text-primary" />}
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
                      <h4 className="font-medium">UPI</h4>
                      <p className="text-sm text-muted-foreground">Pay using your UPI app</p>
                    </div>
                    {selectedPayment === "upi" && <CheckCircle className="h-5 w-5 text-primary" />}
                  </div>
                </div>
              </div>
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
    </div>
  );
}