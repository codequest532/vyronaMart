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

  // Fetch wallet balance
  const { data: walletData } = useQuery({
    queryKey: ["/api/wallet/1"], // Default user ID
    queryFn: async () => {
      const response = await fetch("/api/wallet/1");
      if (!response.ok) throw new Error("Failed to fetch wallet");
      return response.json();
    }
  });

  // Calculate total
  const orderTotal = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 50;
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
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Place Order</h1>
          <p className="text-muted-foreground">Complete your group purchase</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Room Details */}
          {room && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Shopping Room
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{room.name}</h3>
                    <p className="text-sm text-muted-foreground">Room Code: {room.roomCode}</p>
                  </div>
                  <Badge variant="secondary">
                    {room.memberCount} member{room.memberCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cartItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No items in cart</p>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{item.name || "Product"}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity || 1}</p>
                        </div>
                      </div>
                      <p className="font-semibold">₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-muted">
                  <input
                    type="radio"
                    name="payment"
                    value="wallet"
                    checked={selectedPayment === "wallet"}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 border-2 rounded-full ${selectedPayment === "wallet" ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                    {selectedPayment === "wallet" && (
                      <div className="w-full h-full bg-white rounded-full scale-50"></div>
                    )}
                  </div>
                  <Wallet className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium">VyronaWallet</p>
                    <p className="text-sm text-muted-foreground">
                      Balance: ₹{walletData?.balance?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-muted">
                  <input
                    type="radio"
                    name="payment"
                    value="upi"
                    checked={selectedPayment === "upi"}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 border-2 rounded-full ${selectedPayment === "upi" ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                    {selectedPayment === "upi" && (
                      <div className="w-full h-full bg-white rounded-full scale-50"></div>
                    )}
                  </div>
                  <Smartphone className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">UPI Payment</p>
                    <p className="text-sm text-muted-foreground">Pay using UPI apps</p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-muted">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={selectedPayment === "card"}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 border-2 rounded-full ${selectedPayment === "card" ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                    {selectedPayment === "card" && (
                      <div className="w-full h-full bg-white rounded-full scale-50"></div>
                    )}
                  </div>
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Credit/Debit Card</p>
                    <p className="text-sm text-muted-foreground">Pay using cards</p>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Total */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{orderTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>₹{deliveryFee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={handlePlaceOrder}
                disabled={isProcessing || cartItems.length === 0}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Place Order
                  </div>
                )}
              </Button>

              {selectedPayment === "wallet" && walletData?.balance < finalTotal && (
                <p className="text-sm text-destructive text-center">
                  Insufficient wallet balance. Please add funds or choose another payment method.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}