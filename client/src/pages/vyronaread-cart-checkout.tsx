import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ShoppingCart, CreditCard, Smartphone, Wallet, Truck, Book, Clock, MapPin, User, Phone, Mail } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function VyronaReadCartCheckout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Cart data from session storage
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    landmark: ""
  });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  
  // Rental duration state for each rental item
  const [rentalDurations, setRentalDurations] = useState<{[key: string]: number}>({});

  // Load cart data from session storage
  useEffect(() => {
    try {
      const cartData = sessionStorage.getItem('vyronaread_cart');
      if (cartData) {
        const parsedCart = JSON.parse(cartData);
        setCartItems(parsedCart);
        
        // Initialize rental durations for rental items
        const initialDurations: {[key: string]: number} = {};
        parsedCart.forEach((item: any) => {
          if (item.type === 'rent') {
            const itemKey = `${item.book.id}-${item.type}`;
            initialDurations[itemKey] = 1; // Default to 1 period (15 days)
          }
        });
        setRentalDurations(initialDurations);
      } else {
        toast({
          title: "No Cart Items",
          description: "No items found in cart. Redirecting to VyronaRead.",
          variant: "destructive"
        });
        setLocation('/vyronaread');
      }
    } catch (error) {
      console.error('Error loading cart data:', error);
      toast({
        title: "Error",
        description: "Failed to load cart data. Please try again.",
        variant: "destructive"
      });
      setLocation('/vyronaread');
    } finally {
      setLoading(false);
    }
  }, [setLocation, toast]);

  // Calculate totals
  const calculateItemPrice = (item: any) => {
    if (item.type === 'buy') {
      const price = item.book.price || 29900; // Price in paise
      return Math.floor(price / 100); // Convert to rupees
    } else {
      // For rental, use fixed pricing based on duration
      const itemKey = `${item.book.id}-${item.type}`;
      const periods = rentalDurations[itemKey] || 1;
      
      // Fixed pricing: 1 period (7 days) = ₹99, 2 periods (15 days) = ₹199, 3 periods (30 days) = ₹399
      if (periods === 1) {
        return 99; // 7 days
      } else if (periods === 2) {
        return 199; // 15 days
      } else {
        return 399; // 30 days
      }
    }
  };

  // Function to update rental duration
  const updateRentalDuration = (itemKey: string, duration: number) => {
    setRentalDurations(prev => ({
      ...prev,
      [itemKey]: duration
    }));
  };

  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => total + calculateItemPrice(item), 0);
  }, [cartItems, rentalDurations]);
  
  const total = subtotal;

  // Submit order mutation
  const submitOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (!response.ok) throw new Error('Failed to create order');
      return response.json();
    },
    onSuccess: (data) => {
      // Clear cart from session storage
      sessionStorage.removeItem('vyronaread_cart');
      
      toast({
        title: "Order Placed Successfully!",
        description: `Your order #${data.orderId} has been placed successfully.`
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      
      // Navigate to success page or orders page
      setLocation('/vyronaread');
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmitOrder = () => {
    // Validation
    if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.email || !shippingInfo.address || !shippingInfo.city || !shippingInfo.state || !shippingInfo.pincode) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required shipping details.",
        variant: "destructive"
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method.",
        variant: "destructive"
      });
      return;
    }

    // Prepare order data
    const orderData = {
      items: cartItems.map(item => ({
        bookId: item.book.id,
        bookName: item.book.name || item.book.title,
        type: item.type,
        price: calculateItemPrice(item),
        quantity: 1
      })),
      shippingAddress: shippingInfo,
      paymentMethod,
      totalAmount: total,
      specialInstructions,
      module: 'vyronaread'
    };

    submitOrderMutation.mutate(orderData);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Cart is Empty</h2>
          <p className="text-gray-600 mb-4">No items found in your cart.</p>
          <Button onClick={() => setLocation('/vyronaread')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => setLocation('/vyronaread')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to VyronaRead
        </Button>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Cart Checkout</h1>
        <p className="text-gray-600">Complete your order for {cartItems.length} items</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Cart Items & Shipping */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cart Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Order Items ({cartItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded flex items-center justify-center flex-shrink-0">
                      <Book className="text-purple-600 h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.book.name || item.book.title}</h4>
                      <p className="text-sm text-gray-600">by {item.book.metadata?.author || item.book.author || "Unknown Author"}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={item.type === 'buy' ? 'default' : 'secondary'}>
                          {item.type === 'buy' ? 'Purchase' : 'Rental'}
                        </Badge>
                        {item.type === 'rent' && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="mr-1 h-3 w-3" />
                            {(() => {
                              const itemKey = `${item.book.id}-${item.type}`;
                              const periods = rentalDurations[itemKey] || 2;
                              if (periods === 1) return "7 Days";
                              else if (periods === 2) return "15 Days";
                              else return "30 Days";
                            })()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-purple-600">
                      ₹{calculateItemPrice(item)}
                      {item.type === 'rent' && <span className="text-sm"> total</span>}
                    </div>

                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Rental Duration Selection */}
          {cartItems.some(item => item.type === 'rent') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Rental Duration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {cartItems.filter(item => item.type === 'rent').map((item) => {
                  const itemKey = `${item.book.id}-${item.type}`;
                  const selectedPeriod = rentalDurations[itemKey] || 2;
                  
                  return (
                    <div key={itemKey} className="space-y-3">
                      <h4 className="font-medium text-gray-900">{item.book.name || item.book.title}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { periods: 1, days: '7 days', price: 99 },
                          { periods: 2, days: '15 days', price: 199 },
                          { periods: 3, days: '30 days', price: 399 }
                        ].map(({ periods, days, price }) => (
                          <label
                            key={periods}
                            className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                              selectedPeriod === periods
                                ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500'
                                : 'border-gray-300 bg-white hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`rental-duration-${itemKey}`}
                              value={periods}
                              checked={selectedPeriod === periods}
                              onChange={() => {
                                setRentalDurations(prev => ({
                                  ...prev,
                                  [itemKey]: periods
                                }));
                              }}
                              className="sr-only"
                            />
                            <div className="flex w-full items-center justify-between">
                              <div className="flex items-center">
                                <div className="text-sm">
                                  <div className={`font-medium ${selectedPeriod === periods ? 'text-purple-900' : 'text-gray-900'}`}>
                                    {days}
                                  </div>
                                  <div className={`${selectedPeriod === periods ? 'text-purple-700' : 'text-gray-500'}`}>
                                    ₹{price}
                                  </div>
                                </div>
                              </div>
                              <div className={`h-4 w-4 rounded-full border-2 ${
                                selectedPeriod === periods
                                  ? 'border-purple-500 bg-purple-500'
                                  : 'border-gray-300'
                              }`}>
                                {selectedPeriod === periods && (
                                  <div className="h-2 w-2 rounded-full bg-white m-0.5" />
                                )}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={shippingInfo.fullName}
                    onChange={(e) => setShippingInfo(prev => ({...prev, fullName: e.target.value}))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={shippingInfo.phone}
                    onChange={(e) => setShippingInfo(prev => ({...prev, phone: e.target.value}))}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={shippingInfo.email}
                  onChange={(e) => setShippingInfo(prev => ({...prev, email: e.target.value}))}
                  placeholder="Enter your email address"
                />
              </div>
              
              <div>
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={shippingInfo.address}
                  onChange={(e) => setShippingInfo(prev => ({...prev, address: e.target.value}))}
                  placeholder="Enter your complete address"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={shippingInfo.city}
                    onChange={(e) => setShippingInfo(prev => ({...prev, city: e.target.value}))}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={shippingInfo.state}
                    onChange={(e) => setShippingInfo(prev => ({...prev, state: e.target.value}))}
                    placeholder="State"
                  />
                </div>
                <div>
                  <Label htmlFor="pincode">PIN Code *</Label>
                  <Input
                    id="pincode"
                    value={shippingInfo.pincode}
                    onChange={(e) => setShippingInfo(prev => ({...prev, pincode: e.target.value}))}
                    placeholder="PIN Code"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="landmark">Landmark (Optional)</Label>
                <Input
                  id="landmark"
                  value={shippingInfo.landmark}
                  onChange={(e) => setShippingInfo(prev => ({...prev, landmark: e.target.value}))}
                  placeholder="Nearby landmark"
                />
              </div>
            </CardContent>
          </Card>

          {/* Special Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Special Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any special delivery instructions or notes for the seller..."
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Payment & Summary */}
        <div className="space-y-6">
          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'card' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => setPaymentMethod('card')}
              >
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-gray-600 mr-3" />
                  <div>
                    <div className="font-medium">Credit/Debit Card</div>
                    <div className="text-sm text-gray-500">Visa, Mastercard, RuPay</div>
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'upi' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => setPaymentMethod('upi')}
              >
                <div className="flex items-center">
                  <Smartphone className="h-5 w-5 text-gray-600 mr-3" />
                  <div>
                    <div className="font-medium">UPI Payment</div>
                    <div className="text-sm text-gray-500">GPay, PhonePe, Paytm</div>
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'wallet' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => setPaymentMethod('wallet')}
              >
                <div className="flex items-center">
                  <Wallet className="h-5 w-5 text-gray-600 mr-3" />
                  <div>
                    <div className="font-medium">Digital Wallet</div>
                    <div className="text-sm text-gray-500">Amazon Pay, Mobikwik</div>
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => setPaymentMethod('cod')}
              >
                <div className="flex items-center">
                  <Truck className="h-5 w-5 text-gray-600 mr-3" />
                  <div>
                    <div className="font-medium">Cash on Delivery</div>
                    <div className="text-sm text-gray-500">Pay when you receive</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Items ({cartItems.length})</span>
                <span>₹{subtotal}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount</span>
                <span className="text-purple-600">₹{total}</span>
              </div>
              
              <Button 
                className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
                onClick={handleSubmitOrder}
                disabled={submitOrderMutation.isPending}
              >
                {submitOrderMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Placing Order...
                  </div>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Place Order
                  </>
                )}
              </Button>
              
              <div className="text-xs text-gray-500 text-center mt-2">
                By placing this order, you agree to our terms and conditions
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}