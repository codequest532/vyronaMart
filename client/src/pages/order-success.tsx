import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, Package, CreditCard, MapPin, Clock, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface OrderSuccessData {
  orderId: number;
  module: 'vyronahub' | 'vyronasocial' | 'vyronaread';
  orderType?: string;
  
  // VyronaHub data
  items?: Array<{
    productId: number;
    name: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress?: {
    fullName: string;
    phoneNumber: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  
  // VyronaSocial data
  roomDetails?: {
    id: number;
    name: string;
    roomCode?: string;
    memberCount?: number;
  };
  contributions?: Array<{
    userId: number;
    username: string;
    amount: number;
    paymentMethod: string;
  }>;
  
  // VyronaRead data
  bookDetails?: {
    id: number;
    name: string;
    author?: string;
    type: string;
  };
  customerInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address?: string;
  };
  rentalDuration?: number;
  borrowingInfo?: any;
  userType?: string;
  
  // Common fields
  paymentMethod: string;
  totalAmount?: number;
  amount?: number;
  orderDate?: string;
  timestamp?: string;
}

export default function OrderSuccess() {
  const [, setLocation] = useLocation();
  const [orderData, setOrderData] = useState<OrderSuccessData | null>(null);

  useEffect(() => {
    // Get order data from sessionStorage (set by checkout page)
    const storedOrderData = sessionStorage.getItem('orderData');
    if (storedOrderData) {
      setOrderData(JSON.parse(storedOrderData));
      // Clear the data after using it
      sessionStorage.removeItem('orderData');
    } else {
      // If no order data, redirect to VyronaHub
      setLocation('/vyronahub');
    }
  }, [setLocation]);

  const handleContinueShopping = () => {
    setLocation('/vyronahub');
  };

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cod': return 'Cash on Delivery';
      case 'upi': return 'UPI Payment';
      case 'card': return 'Card Payment';
      default: return method.toUpperCase();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Continue Shopping Button */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order Confirmed!</h1>
          </div>
          <Button 
            onClick={handleContinueShopping}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <ShoppingBag className="h-5 w-5 mr-2" />
            Continue Shopping
          </Button>
        </div>

        {/* Success Message */}
        <Card className="mb-8 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-green-800 dark:text-green-400 mb-2">
                Your order has been placed successfully!
              </h2>
              <p className="text-green-700 dark:text-green-300">
                Order #{orderData.orderId} • Placed on {new Date(orderData.orderDate).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Order Items
                </CardTitle>
                <CardDescription>
                  {orderData.items.length} item{orderData.items.length > 1 ? 's' : ''} in your order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderData.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{item.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          ₹{item.price.toFixed(2)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ₹{orderData.totalAmount.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Details Sidebar */}
          <div className="space-y-6">
            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-gray-900 dark:text-white">{orderData.shippingAddress.fullName}</p>
                  <p className="text-gray-600 dark:text-gray-300">{orderData.shippingAddress.phoneNumber}</p>
                  <p className="text-gray-600 dark:text-gray-300">{orderData.shippingAddress.address}</p>
                  <p className="text-gray-600 dark:text-gray-300">
                    {orderData.shippingAddress.city}, {orderData.shippingAddress.state} - {orderData.shippingAddress.pincode}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-sm">
                  {getPaymentMethodLabel(orderData.paymentMethod)}
                </Badge>
              </CardContent>
            </Card>

            {/* Estimated Delivery */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Estimated Delivery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {orderData.paymentMethod === 'cod' ? '5-7 business days' : '3-5 business days'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  You will receive tracking information via email
                </p>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>What's Next?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-600 dark:text-gray-300">
                      Order confirmation email sent to your registered email
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-600 dark:text-gray-300">
                      Seller will process your order within 24 hours
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-600 dark:text-gray-300">
                      Track your order status in the seller dashboard
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Action */}
        <div className="mt-8 text-center">
          <Button 
            onClick={handleContinueShopping}
            variant="outline"
            size="lg"
            className="min-w-48"
          >
            <ArrowRight className="h-5 w-5 mr-2" />
            Continue Shopping on VyronaHub
          </Button>
        </div>
      </div>
    </div>
  );
}