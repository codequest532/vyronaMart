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
    if (!orderData) {
      setLocation('/vyronahub');
      return;
    }
    
    switch (orderData.module) {
      case 'vyronasocial':
        setLocation('/social');
        break;
      case 'vyronaread':
        setLocation('/vyronaread');
        break;
      case 'vyronahub':
      default:
        setLocation('/vyronahub');
        break;
    }
  };

  const getModuleDisplayName = (module: string) => {
    switch (module) {
      case 'vyronasocial': return 'VyronaSocial';
      case 'vyronaread': return 'VyronaRead';
      case 'vyronahub': return 'VyronaHub';
      default: return 'Vyrona';
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'vyronasocial': return '👥';
      case 'vyronaread': return '📚';
      case 'vyronahub': return '🛍️';
      default: return '🏪';
    }
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
                Your {getModuleDisplayName(orderData.module)} order has been placed successfully!
              </h2>
              <p className="text-green-700 dark:text-green-300">
                Order #{orderData.orderId} • Placed on {new Date(orderData.orderDate || orderData.timestamp || new Date().toISOString()).toLocaleDateString()}
              </p>
              <div className="flex items-center justify-center mt-3">
                <span className="text-2xl mr-2">{getModuleIcon(orderData.module)}</span>
                <Badge className="bg-green-600 text-white">
                  {getModuleDisplayName(orderData.module)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* VyronaHub Order Items */}
            {orderData.module === 'vyronahub' && orderData.items && (
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
                            ₹{Math.round(item.price * item.quantity}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            ₹{item.price} each
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ₹{Math.round(orderData.totalAmount || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* VyronaSocial Group Order */}
            {orderData.module === 'vyronasocial' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Group Order Details
                  </CardTitle>
                  <CardDescription>
                    Collaborative shopping order from {orderData.roomDetails?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <h4 className="font-medium text-purple-900 dark:text-purple-100">Room Information</h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Room: {orderData.roomDetails?.name} • Code: {orderData.roomDetails?.roomCode}
                      </p>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Members: {orderData.roomDetails?.memberCount || 1}
                      </p>
                    </div>
                    
                    {orderData.items && orderData.items.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Items Ordered</h4>
                        {orderData.items.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 border rounded">
                            <span>{item.name}</span>
                            <span>₹{Math.round(item.price * (item.quantity || 1)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <Separator className="my-4" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount</span>
                      <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        ₹{Math.round(orderData.totalAmount || orderData.amount || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* VyronaRead Book Order */}
            {orderData.module === 'vyronaread' && orderData.bookDetails && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Book Order Details
                  </CardTitle>
                  <CardDescription>
                    {orderData.orderType === 'rent' ? 'Book Rental' : 
                     orderData.orderType === 'borrow' ? 'Library Borrowing' : 'Book Purchase'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">{orderData.bookDetails.name}</h4>
                      {orderData.bookDetails.author && (
                        <p className="text-sm text-blue-700 dark:text-blue-300">by {orderData.bookDetails.author}</p>
                      )}
                      <Badge className="mt-2 bg-blue-600 text-white">
                        {orderData.bookDetails.type.toUpperCase()}
                      </Badge>
                    </div>
                    
                    {orderData.orderType === 'rent' && orderData.rentalDuration && (
                      <div className="p-3 border rounded">
                        <h5 className="font-medium">Rental Duration</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{orderData.rentalDuration} days</p>
                      </div>
                    )}
                    
                    {orderData.customerInfo && (
                      <div className="p-3 border rounded">
                        <h5 className="font-medium">Customer Information</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{orderData.customerInfo.fullName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{orderData.customerInfo.email}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{orderData.customerInfo.phone}</p>
                      </div>
                    )}
                    
                    <Separator className="my-4" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount</span>
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        ₹{Math.round(orderData.amount || orderData.totalAmount || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Details Sidebar */}
          <div className="space-y-6">
            {/* Delivery Information - VyronaHub */}
            {orderData.module === 'vyronahub' && orderData.shippingAddress && (
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
            )}

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

            {/* Processing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  {orderData.module === 'vyronaread' ? 'Processing Time' : 'Estimated Delivery'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {orderData.module === 'vyronaread' 
                    ? (orderData.orderType === 'rent' ? '1-2 hours for rental activation' : 
                       orderData.orderType === 'borrow' ? '24 hours for library processing' : '3-5 business days')
                    : orderData.module === 'vyronasocial'
                    ? '2-5 business days for group orders'
                    : (orderData.paymentMethod === 'cod' ? '5-7 business days' : '3-5 business days')
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {orderData.module === 'vyronaread' 
                    ? 'You will receive access information via email'
                    : 'You will receive tracking information via email'
                  }
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