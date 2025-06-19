import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Truck, 
  Users, 
  CreditCard, 
  Wallet, 
  Store,
  Gift,
  ShieldCheck,
  Coins
} from "lucide-react";

export default function MallCartCheckout() {
  const [, setLocation] = useLocation();
  const [deliveryAddress, setDeliveryAddress] = useState({
    name: "",
    phone: "",
    street: "",
    landmark: "",
    city: "Chennai",
    pincode: ""
  });
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [deliveryOption, setDeliveryOption] = useState("express");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get mall cart from localStorage or state management
  const mallCart = JSON.parse(localStorage.getItem('mallCart') || '[]');
  
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const { data: walletBalance } = useQuery({
    queryKey: ["/api/wallet/balance", user?.id],
    enabled: !!user?.id,
  });

  // Calculate delivery fee based on selected option
  const getDeliveryFee = () => {
    switch (deliveryOption) {
      case "express": return 80; // VyronaExpress 30-min delivery
      case "standard": return 45; // Standard 60-min delivery
      case "pickup": return 0; // Store pickup
      default: return 80;
    }
  };

  // Calculate totals (convert from cents to rupees)
  const subtotal = mallCart.reduce((total: number, item: any) => total + ((item.price * item.quantity) / 100), 0);
  const deliveryFee = getDeliveryFee();
  const vyronaCoinsEarned = Math.floor(subtotal / 100);
  const total = subtotal + deliveryFee;

  // Group items by store
  const groupedItems = mallCart.reduce((grouped: any, item: any) => {
    if (!grouped[item.storeId]) {
      grouped[item.storeId] = [];
    }
    grouped[item.storeId].push(item);
    return grouped;
  }, {});

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return apiRequest("POST", "/api/mallcart/orders", orderData);
    },
    onSuccess: (response) => {
      // Clear cart
      localStorage.removeItem('mallCart');
      toast({
        title: "Order Placed Successfully!",
        description: "Your VyronaMallConnect order has been confirmed. You'll receive updates via email.",
      });
      // Redirect to live order tracking
      setLocation(`/track-order/${response.orderId}`);
    },
    onError: (error) => {
      toast({
        title: "Order Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.name || !deliveryAddress.phone || !deliveryAddress.street || !deliveryAddress.pincode) {
      toast({
        title: "Complete Address Required",
        description: "Please fill in all delivery address fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const orderData = {
      items: mallCart,
      deliveryAddress,
      paymentMethod,
      deliveryInstructions,
      subtotal,
      deliveryFee,
      total,
      vyronaCoinsEarned,
      orderType: "mallcart"
    };

    createOrderMutation.mutate(orderData);
    setIsLoading(false);
  };

  if (mallCart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Your MallCart is Empty</h2>
            <p className="text-gray-600 mb-6">Add items from VyronaMallConnect to continue</p>
            <Button onClick={() => setLocation("/vyronamallconnect")}>
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button
          variant="outline"
          onClick={() => setLocation("/vyronamallconnect")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Mall
        </Button>
        <div>
          <h1 className="text-3xl font-bold">MallCart Checkout</h1>
          <p className="text-gray-600">Complete your VyronaMallConnect order</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Details & Address */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Store className="h-5 w-5" />
                <span>Order Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(groupedItems).map(([storeId, items]: [string, any]) => (
                <div key={storeId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Store className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold">{items[0].storeName}</h3>
                    <Badge variant="outline" className="text-xs">
                      {items.length} item{items.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-bold">₹{Math.round((item.price * item.quantity) / 100).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Delivery Address</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={deliveryAddress.name}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, name: e.target.value})}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={deliveryAddress.phone}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, phone: e.target.value})}
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="street">Street Address *</Label>
                <Textarea
                  id="street"
                  value={deliveryAddress.street}
                  onChange={(e) => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
                  placeholder="House/Flat no., Building name, Street name"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="landmark">Landmark</Label>
                  <Input
                    id="landmark"
                    value={deliveryAddress.landmark}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, landmark: e.target.value})}
                    placeholder="Nearby landmark"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Select value={deliveryAddress.city} onValueChange={(value) => setDeliveryAddress({...deliveryAddress, city: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Chennai">Chennai</SelectItem>
                      <SelectItem value="Bangalore">Bangalore</SelectItem>
                      <SelectItem value="Mumbai">Mumbai</SelectItem>
                      <SelectItem value="Delhi">Delhi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    value={deliveryAddress.pincode}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, pincode: e.target.value})}
                    placeholder="6-digit pincode"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
                <Textarea
                  id="instructions"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="Any specific delivery instructions for our partner"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Delivery Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="h-5 w-5" />
                <span>Delivery Options</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={deliveryOption} onValueChange={setDeliveryOption} className="space-y-4">
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-purple-50 transition-colors">
                  <RadioGroupItem value="express" id="express" />
                  <div className="flex-1">
                    <Label htmlFor="express" className="cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">VyronaExpress Delivery</div>
                          <div className="text-sm text-gray-600">30-minute hyperlocal delivery</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium">₹80</span>
                        </div>
                      </div>
                    </Label>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-purple-50 transition-colors">
                  <RadioGroupItem value="standard" id="standard" />
                  <div className="flex-1">
                    <Label htmlFor="standard" className="cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Standard Delivery</div>
                          <div className="text-sm text-gray-600">60-minute delivery</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">₹45</span>
                        </div>
                      </div>
                    </Label>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-purple-50 transition-colors">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <div className="flex-1">
                    <Label htmlFor="pickup" className="cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Store Pickup</div>
                          <div className="text-sm text-gray-600">Collect from nearest mall store</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Store className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-green-600">FREE</span>
                        </div>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Payment Method</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">UPI Payment</p>
                          <p className="text-sm text-gray-600">Pay using PhonePe, GPay, Paytm, or any UPI app</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Recommended</Badge>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <RadioGroupItem value="wallet" id="wallet" />
                    <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">VyronaWallet</p>
                          <p className="text-sm text-gray-600">
                            Balance: ₹{Math.round((walletBalance?.balance || 0) / 100).toLocaleString()}
                          </p>
                        </div>
                        <Wallet className="h-5 w-5 text-blue-600" />
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium">Credit/Debit Card</p>
                        <p className="text-sm text-gray-600">Visa, Mastercard, RuPay cards accepted</p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium">Cash on Delivery</p>
                        <p className="text-sm text-gray-600">Pay when your order arrives</p>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        {/* Order Total & Place Order */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Total</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal ({mallCart.reduce((total: number, item: any) => total + item.quantity, 0)} items)</span>
                  <span>₹{Math.round(subtotal).toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="flex items-center space-x-1">
                    <Truck className="h-4 w-4" />
                    <span>VyronaExpress Delivery</span>
                  </span>
                  <span>₹{deliveryFee}</span>
                </div>

                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{Math.round(total).toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Coins className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">VyronaCoins Earned</span>
                  </div>
                  <span className="font-bold text-yellow-600">+{vyronaCoinsEarned}</span>
                </div>
              </div>

              <Button 
                onClick={handlePlaceOrder}
                disabled={isLoading || createOrderMutation.isPending}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold py-3"
              >
                {isLoading || createOrderMutation.isPending ? "Processing..." : "Place Order"}
              </Button>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <span>100% Secure Payment</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>Expected delivery: 90-120 minutes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Gift className="h-4 w-4 text-purple-600" />
                  <span>Free returns within 7 days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* VyronSocial Group Option */}
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <h3 className="font-semibold mb-2">Want to save on delivery?</h3>
                <p className="text-sm text-gray-600 mb-3">Create a VyronSocial group and split delivery costs with friends</p>
                <Button variant="outline" className="w-full" onClick={() => setLocation("/vyronasocial")}>
                  <Users className="h-4 w-4 mr-2" />
                  Create Group Order
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}