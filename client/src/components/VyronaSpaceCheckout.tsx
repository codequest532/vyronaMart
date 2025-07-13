import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { VyronaSpaceCheckout as RazorpayCheckout } from "@/lib/razorpay";
import { MapPin, CreditCard, Clock, Package, Zap, ArrowRight } from 'lucide-react';
import { useLocation } from 'wouter';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  storeId: number;
  storeName: string;
}

interface CheckoutProps {
  userId: number;
  user: any;
  cartItems: CartItem[];
  totalAmount: number;
  storeId: number;
  storeName: string;
  onSuccess?: (orderId: string) => void;
}

export default function VyronaSpaceCheckout({ 
  userId, 
  user, 
  cartItems, 
  totalAmount, 
  storeId, 
  storeName, 
  onSuccess 
}: CheckoutProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [deliveryTime, setDeliveryTime] = useState('10min');
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: user?.username || '',
    phone: '',
    addressLine1: '',
    city: '',
    pincode: '',
    landmark: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddressChange = (field: string, value: string) => {
    setDeliveryAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getDeliveryFee = () => {
    switch (deliveryTime) {
      case '5min': return 25;
      case '10min': return 15;
      case '15min': return 10;
      default: return 15;
    }
  };

  const handleRazorpayPayment = async () => {
    setIsProcessing(true);
    
    try {
      const grandTotal = totalAmount + getDeliveryFee();
      const paymentResponse = await RazorpayCheckout.processPayment(
        grandTotal,
        userId,
        storeId,
        deliveryTime,
        cartItems,
        user
      );

      if (paymentResponse.success) {
        toast({
          title: "Payment Successful!",
          description: `Order #${paymentResponse.orderId} placed successfully. Expected delivery in ${deliveryTime}.`,
          variant: "default",
        });
        
        localStorage.removeItem('vyronaspace_cart');
        
        if (onSuccess) {
          onSuccess(paymentResponse.orderId);
        } else {
          setLocation(`/track-order/${paymentResponse.orderId}`);
        }
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Payment processing failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWalletPayment = async () => {
    setIsProcessing(true);
    
    try {
      const grandTotal = totalAmount + getDeliveryFee();
      const response = await fetch('/api/vyronaspace/wallet-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          amount: grandTotal,
          cartItems,
          storeId,
          deliveryTime
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Payment Successful!",
          description: `Order #${result.orderId} placed using VyronaWallet. Expected delivery in ${deliveryTime}.`,
          variant: "default",
        });
        
        localStorage.removeItem('vyronaspace_cart');
        
        if (onSuccess) {
          onSuccess(result.orderId);
        } else {
          setLocation(`/track-order/${result.orderId}`);
        }
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Wallet payment failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.fullName || !deliveryAddress.phone || !deliveryAddress.addressLine1 || !deliveryAddress.city) {
      toast({
        title: "Incomplete Address",
        description: "Please fill in all required address fields.",
        variant: "destructive",
      });
      return;
    }

    switch (paymentMethod) {
      case 'razorpay':
        await handleRazorpayPayment();
        break;
      case 'wallet':
        await handleWalletPayment();
        break;
      default:
        toast({
          title: "Invalid Payment Method",
          description: "Please select a valid payment method.",
          variant: "destructive",
        });
    }
  };

  const grandTotal = totalAmount + getDeliveryFee();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">VyronaSpace Quick Checkout</h1>
          <p className="text-gray-600">Hyperlocal delivery in {deliveryTime} from {storeName}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Address & Payment */}
          <div className="space-y-6">
            {/* Delivery Time Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  Delivery Speed
                </CardTitle>
                <CardDescription>
                  Choose your preferred delivery time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={deliveryTime} onValueChange={setDeliveryTime}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-orange-50">
                    <RadioGroupItem value="5min" id="5min" />
                    <Label htmlFor="5min" className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Express (5 min)</p>
                          <p className="text-sm text-gray-600">Lightning fast delivery</p>
                        </div>
                        <span className="text-sm font-medium text-orange-600">₹25</span>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-orange-50">
                    <RadioGroupItem value="10min" id="10min" />
                    <Label htmlFor="10min" className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Standard (10 min)</p>
                          <p className="text-sm text-gray-600">Quick delivery</p>
                        </div>
                        <span className="text-sm font-medium text-orange-600">₹15</span>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-orange-50">
                    <RadioGroupItem value="15min" id="15min" />
                    <Label htmlFor="15min" className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Economy (15 min)</p>
                          <p className="text-sm text-gray-600">Affordable delivery</p>
                        </div>
                        <span className="text-sm font-medium text-orange-600">₹10</span>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Address
                </CardTitle>
                <CardDescription>
                  Where should we deliver your order?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={deliveryAddress.fullName}
                      onChange={(e) => handleAddressChange('fullName', e.target.value)}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={deliveryAddress.phone}
                      onChange={(e) => handleAddressChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="addressLine1">Address *</Label>
                  <Input
                    id="addressLine1"
                    value={deliveryAddress.addressLine1}
                    onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                    placeholder="House/Flat/Building number and street"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={deliveryAddress.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      value={deliveryAddress.pincode}
                      onChange={(e) => handleAddressChange('pincode', e.target.value)}
                      placeholder="Enter pincode"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="landmark">Landmark</Label>
                  <Input
                    id="landmark"
                    value={deliveryAddress.landmark}
                    onChange={(e) => handleAddressChange('landmark', e.target.value)}
                    placeholder="Nearby landmark (optional)"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
                <CardDescription>
                  Choose your preferred payment method
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-orange-50">
                    <RadioGroupItem value="razorpay" id="razorpay" />
                    <Label htmlFor="razorpay" className="flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Credit/Debit Card, UPI, Net Banking</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Secure payment via Razorpay</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-orange-50">
                    <RadioGroupItem value="wallet" id="wallet" />
                    <Label htmlFor="wallet" className="flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>VyronaWallet</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Pay using your wallet balance</p>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            {/* Store Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-500" />
                  Order from {storeName}
                </CardTitle>
                <CardDescription>
                  Hyperlocal delivery in {deliveryTime}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-sm font-medium text-orange-600">₹{Math.round(item.price)}</p>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Items Total</span>
                    <span>₹{Math.round(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee ({deliveryTime})</span>
                    <span>₹{getDeliveryFee()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Amount</span>
                    <span>₹{Math.round(grandTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-orange-500" />
                    Super fast delivery in {deliveryTime}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    Live tracking available
                  </p>
                  <p className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-orange-500" />
                    Fresh products guaranteed
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Place Order Button */}
            <Button 
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Place Order - ₹{Math.round(grandTotal)}</span>
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}