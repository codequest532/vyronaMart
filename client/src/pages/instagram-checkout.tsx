import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { VyronaInstaStoreCheckout } from "@/lib/razorpay";
import { 
  ArrowLeft, 
  Instagram,
  CreditCard,
  Truck,
  Shield,
  MapPin,
  Phone,
  Mail,
  User,
  Package,
  Clock,
  Star,
  Check,
  Wallet,
  Smartphone,
  DollarSign
} from "lucide-react";

interface CheckoutItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  seller: string;
}

interface CheckoutData {
  items: CheckoutItem[];
  subtotal?: number;
  shipping?: number;
  discount?: number;
  total: number;
  source: string;
}

export default function InstagramCheckout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    landmark: ""
  });
  const [paymentMethod, setPaymentMethod] = useState("credit_debit");
  const [upiId, setUpiId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Get user data for authentication
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    
    if (dataParam) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(dataParam));
        setCheckoutData(parsedData);
      } catch (error) {
        console.error("Error parsing checkout data:", error);
        toast({
          title: "Error",
          description: "Invalid checkout data. Redirecting to Instagram shop.",
          variant: "destructive",
        });
        setLocation('/instashop');
      }
    } else {
      setLocation('/instashop');
    }
  }, [setLocation, toast]);

  // Wallet payment mutation
  const walletPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await apiRequest("POST", "/api/vyronainstastore/wallet-payment", paymentData);
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Wallet payment successful:", data);
      toast({
        title: "Payment Successful!",
        description: "Your Instagram order has been placed successfully.",
      });
      
      // Store order data in session storage for success page
      sessionStorage.setItem('lastOrderData', JSON.stringify({
        orderId: data.orderId,
        items: checkoutData?.items || [],
        total: total,
        paymentMethod: 'VyronaWallet',
        module: 'vyronainstastore'
      }));
      
      // Clear cart and redirect
      if (checkoutData?.source === 'instagram') {
        queryClient.invalidateQueries({ queryKey: ["/api/instacart"] });
      }
      setLocation('/order-success');
    },
    onError: (error: any) => {
      console.error("Wallet payment failed:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Wallet payment failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  // COD order mutation
  const codOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/vyronainstastore/cod-order", orderData);
      return response.json();
    },
    onSuccess: (data) => {
      console.log("COD order successful:", data);
      toast({
        title: "Order Placed Successfully!",
        description: "Your Instagram order has been placed for Cash on Delivery.",
      });
      
      // Store order data in session storage for success page
      sessionStorage.setItem('lastOrderData', JSON.stringify({
        orderId: data.orderId,
        items: checkoutData?.items || [],
        total: total,
        paymentMethod: 'Cash on Delivery',
        module: 'vyronainstastore'
      }));
      
      // Clear cart and redirect
      if (checkoutData?.source === 'instagram') {
        queryClient.invalidateQueries({ queryKey: ["/api/instacart"] });
      }
      setLocation('/order-success');
    },
    onError: (error: any) => {
      console.error("COD order failed:", error);
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place COD order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePlaceOrder = async () => {
    if (!checkoutData || !user) return;

    // Validate required fields
    if (!shippingAddress.name || !shippingAddress.email || !shippingAddress.phone || 
        !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.state || 
        !shippingAddress.pincode) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required shipping details.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "upi" && !upiId) {
      toast({
        title: "Missing Payment Info",
        description: "Please enter your UPI ID.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const orderData = {
        items: checkoutData.items,
        shippingAddress,
        paymentMethod,
        upiId: paymentMethod === "upi" ? upiId : undefined,
        totalAmount: total,
        source: 'instagram'
      };

      if (paymentMethod === "vyronawallet") {
        await walletPaymentMutation.mutateAsync({
          amount: total,
          userId: user.id,
          instagramStoreId: checkoutData.items[0]?.seller || 1,
          productIds: checkoutData.items.map(item => item.id),
          address: shippingAddress
        });
      } else if (paymentMethod === "cod") {
        await codOrderMutation.mutateAsync(orderData);
      } else {
        // Razorpay payment (credit_debit or upi)
        const instagramStoreId = checkoutData.items[0]?.seller || 1;
        const productIds = checkoutData.items.map(item => item.id);
        
        await VyronaInstaStoreCheckout.processPayment(
          total,
          user.id,
          instagramStoreId,
          productIds,
          user
        );
        
        // Store order data for success page
        sessionStorage.setItem('lastOrderData', JSON.stringify({
          orderId: Date.now().toString(),
          items: checkoutData.items,
          total: total,
          paymentMethod: paymentMethod === "credit_debit" ? "Credit/Debit Card via Razorpay" : "UPI Payment via Razorpay",
          module: 'vyronainstastore'
        }));
        
        // Clear cart and redirect
        if (checkoutData?.source === 'instagram') {
          queryClient.invalidateQueries({ queryKey: ["/api/instacart"] });
        }
        setLocation('/order-success');
      }
    } catch (error: any) {
      console.error("Payment processing failed:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Payment processing failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Redirect to login if not authenticated
  if (!isUserLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Instagram className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please log in to complete your Instagram purchase</p>
          <Button onClick={() => setLocation('/login')} className="bg-purple-600 hover:bg-purple-700">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (!checkoutData || isUserLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  const subtotal = checkoutData.subtotal || checkoutData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = checkoutData.shipping || 50;
  const discount = checkoutData.discount || 0;
  const total = checkoutData.total || (subtotal + shipping - discount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => setLocation('/instashop')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Shop
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Instagram className="text-white h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Instagram Checkout</h1>
                  <p className="text-gray-600">Complete your Instagram purchase</p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-purple-600 border-purple-200">
              {checkoutData.items.length} {checkoutData.items.length === 1 ? 'Item' : 'Items'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="h-5 w-5 text-purple-600" />
                  <span>Shipping Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={shippingAddress.name}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={shippingAddress.email}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="+91 XXXXX XXXXX"
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address1">Address Line 1 *</Label>
                  <Input
                    id="address1"
                    placeholder="House/Flat No., Building Name"
                    value={shippingAddress.addressLine1}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, addressLine1: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address2">Address Line 2</Label>
                  <Input
                    id="address2"
                    placeholder="Street, Area, Locality"
                    value={shippingAddress.addressLine2}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, addressLine2: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      placeholder="State"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">PIN Code *</Label>
                    <Input
                      id="pincode"
                      placeholder="XXXXXX"
                      value={shippingAddress.pincode}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, pincode: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landmark">Landmark (Optional)</Label>
                  <Input
                    id="landmark"
                    placeholder="Near landmark for easy delivery"
                    value={shippingAddress.landmark}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, landmark: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  <span>Payment Method</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 relative">
                    <RadioGroupItem value="credit_debit" id="credit_debit" />
                    <Label htmlFor="credit_debit" className="flex items-center space-x-2 cursor-pointer flex-1">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      <div>
                        <div className="font-medium">Credit/Debit Card</div>
                        <div className="text-sm text-gray-500">Pay securely with Razorpay</div>
                      </div>
                    </Label>
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi" className="flex items-center space-x-2 cursor-pointer flex-1">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium">UPI Payment</div>
                        <div className="text-sm text-gray-500">Pay using UPI via Razorpay</div>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="vyronawallet" id="vyronawallet" />
                    <Label htmlFor="vyronawallet" className="flex items-center space-x-2 cursor-pointer">
                      <Wallet className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">VyronaWallet</div>
                        <div className="text-sm text-gray-500">Pay using your wallet balance</div>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex items-center space-x-2 cursor-pointer">
                      <Package className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="font-medium">Cash on Delivery</div>
                        <div className="text-sm text-gray-500">Pay when order arrives</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === "upi" && (
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="upiId">UPI ID *</Label>
                    <Input
                      id="upiId"
                      placeholder="yourname@paytm / yourname@gpay"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Instagram className="h-5 w-5 text-purple-600" />
                  <span>Order Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {checkoutData.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-sm text-gray-600">by {item.seller}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                        <span className="font-medium">₹{item.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>₹{shipping.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-₹{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || placeOrderMutation.isPending}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  size="lg"
                >
                  {isProcessing || placeOrderMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5 mr-2" />
                      Place Order - ₹{total.toLocaleString()}
                    </>
                  )}
                </Button>

                {/* Trust Indicators */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>Secure Payment Processing</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <span>Fast & Reliable Delivery</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-purple-600" />
                    <span>Verified Instagram Sellers</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}