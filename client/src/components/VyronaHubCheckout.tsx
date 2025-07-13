import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { VyronaHubCheckout as RazorpayCheckout } from "@/lib/razorpay";
import { ShoppingCart, CreditCard, MapPin, Package, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { useLocation } from 'wouter';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  description?: string;
}

interface CheckoutProps {
  userId: number;
  user: any;
  cartItems: CartItem[];
  totalAmount: number;
  onSuccess?: (orderId: string) => void;
}

export default function VyronaHubCheckout({ userId, user, cartItems, totalAmount, onSuccess }: CheckoutProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: user?.username || '',
    email: user?.email || '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
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

  const handleRazorpayPayment = async () => {
    setIsProcessing(true);
    
    try {
      const paymentResponse = await RazorpayCheckout.processPayment(
        totalAmount,
        userId,
        cartItems,
        deliveryAddress,
        user
      );

      if (paymentResponse.success) {
        toast({
          title: "Payment Successful!",
          description: `Order #${paymentResponse.orderId} has been placed successfully.`,
          variant: "default",
        });
        
        // Clear cart items from localStorage
        localStorage.removeItem('vyronahub_cart');
        
        if (onSuccess) {
          onSuccess(paymentResponse.orderId);
        } else {
          setLocation(`/order-success/${paymentResponse.orderId}`);
        }
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWalletPayment = async () => {
    setIsProcessing(true);
    
    try {
      // Check wallet balance first
      const walletResponse = await fetch(`/api/wallet/balance/${userId}`);
      const walletData = await walletResponse.json();
      
      if (walletData.balance < totalAmount) {
        toast({
          title: "Insufficient Wallet Balance",
          description: `Your wallet balance is ₹${walletData.balance}. Please add funds or use another payment method.`,
          variant: "destructive",
        });
        return;
      }

      // Process wallet payment
      const response = await fetch('/api/vyronahub/wallet-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          amount: totalAmount,
          cartItems,
          deliveryAddress
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Payment Successful!",
          description: `Order #${result.orderId} has been placed using VyronaWallet.`,
          variant: "default",
        });
        
        localStorage.removeItem('vyronahub_cart');
        
        if (onSuccess) {
          onSuccess(result.orderId);
        } else {
          setLocation(`/order-success/${result.orderId}`);
        }
      } else {
        throw new Error(result.message || 'Payment failed');
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCODPayment = async () => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/vyronahub/cod-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          amount: totalAmount,
          cartItems,
          deliveryAddress
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Order Placed Successfully!",
          description: `Order #${result.orderId} will be delivered with Cash on Delivery.`,
          variant: "default",
        });
        
        localStorage.removeItem('vyronahub_cart');
        
        if (onSuccess) {
          onSuccess(result.orderId);
        } else {
          setLocation(`/order-success/${result.orderId}`);
        }
      } else {
        throw new Error(result.message || 'Order placement failed');
      }
    } catch (error: any) {
      toast({
        title: "Order Failed",
        description: error.message || "There was an issue placing your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = async () => {
    // Validate address
    if (!deliveryAddress.fullName || !deliveryAddress.phone || !deliveryAddress.addressLine1 || !deliveryAddress.city || !deliveryAddress.pincode) {
      toast({
        title: "Incomplete Address",
        description: "Please fill in all required address fields.",
        variant: "destructive",
      });
      return;
    }

    // Process payment based on selected method
    switch (paymentMethod) {
      case 'razorpay':
        await handleRazorpayPayment();
        break;
      case 'wallet':
        await handleWalletPayment();
        break;
      case 'cod':
        await handleCODPayment();
        break;
      default:
        toast({
          title: "Invalid Payment Method",
          description: "Please select a valid payment method.",
          variant: "destructive",
        });
    }
  };

  const deliveryFee = 49;
  const grandTotal = totalAmount + deliveryFee;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">VyronaHub Checkout</h1>
          <p className="text-gray-600">Complete your order with secure payment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Address & Payment */}
          <div className="space-y-6">
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
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={deliveryAddress.email}
                    onChange={(e) => handleAddressChange('email', e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="addressLine1">Address Line 1 *</Label>
                  <Input
                    id="addressLine1"
                    value={deliveryAddress.addressLine1}
                    onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                    placeholder="House/Flat/Building number and street"
                  />
                </div>
                <div>
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    value={deliveryAddress.addressLine2}
                    onChange={(e) => handleAddressChange('addressLine2', e.target.value)}
                    placeholder="Area/Colony/Sector (optional)"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={deliveryAddress.state}
                      onChange={(e) => handleAddressChange('state', e.target.value)}
                      placeholder="Enter state"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode *</Label>
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
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="razorpay" id="razorpay" />
                    <Label htmlFor="razorpay" className="flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Credit/Debit Card, UPI, Net Banking</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Secure payment via Razorpay</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="wallet" id="wallet" />
                    <Label htmlFor="wallet" className="flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>VyronaWallet</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Pay using your wallet balance</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>Cash on Delivery</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Pay when your order arrives</p>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Summary
                </CardTitle>
                <CardDescription>
                  Review your items before checkout
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
                      <p className="text-sm font-medium text-blue-600">₹{Math.round(item.price)}</p>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{Math.round(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>₹{deliveryFee}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{Math.round(grandTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Standard delivery: 2-3 business days
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Free returns within 7 days
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Order tracking available
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Place Order Button */}
            <Button 
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="w-full h-12 text-lg font-semibold"
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