import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  CheckCircle, ArrowLeft, Package, MapPin, Users, Clock, 
  CreditCard, Star, Gift, Coins, Truck, Bell 
} from "lucide-react";

interface GroupOrderConfirmationProps {
  params: {
    orderId: string;
  };
}

export default function GroupOrderConfirmation({ params }: GroupOrderConfirmationProps) {
  const [, setLocation] = useLocation();
  const orderId = params?.orderId;

  // Fetch order details
  const { data: orderData, isLoading } = useQuery({
    queryKey: ["/api/orders", orderId],
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-lg font-medium text-gray-700">Loading order details...</span>
        </div>
      </div>
    );
  }

  const order = orderData || {};
  const orderItems = order.items || [];
  const totalAmount = order.totalAmount || 0;
  const memberCount = order.memberCount || 1;
  const estimatedDelivery = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/vyronamallconnect")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Mall
              </Button>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Order #{orderId}</p>
              <p className="text-xs text-gray-400">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Group Order Placed Successfully!</h1>
          <p className="text-lg text-gray-600">
            Your group order has been confirmed and is being processed
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Summary */}
          <Card className="border-green-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-green-600" />
                <span>Order Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Order ID</span>
                  <span className="text-blue-600 font-mono">#{orderId}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Order Date</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Group Members</span>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{memberCount} members</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="text-lg font-bold text-green-600">₹{Math.round(totalAmount)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">VyronaCoins Earned</span>
                  <div className="flex items-center space-x-1 text-orange-600">
                    <Coins className="h-4 w-4" />
                    <span className="font-medium">+{Math.round(totalAmount * 0.05)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card className="border-blue-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-blue-600" />
                <span>Delivery Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Order Confirmed</p>
                    <p className="text-sm text-gray-500">Your group order is being prepared</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Estimated Delivery</p>
                    <p className="text-sm text-gray-500">{estimatedDelivery}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Bell className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Notifications</p>
                    <p className="text-sm text-gray-500">All group members will be notified</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="border-orange-200 shadow-sm lg:col-span-2">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-pink-50">
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-orange-600" />
                <span>Order Items ({orderItems.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {orderItems.length > 0 ? (
                  orderItems.map((item: any, index: number) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Package className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        <p className="text-sm text-gray-500">{item.storeName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-lg">₹{Math.round((item.price / 100) * item.quantity)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Order items will be displayed here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Group Benefits */}
          <Card className="border-purple-200 shadow-sm lg:col-span-2">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center space-x-2">
                <Gift className="h-5 w-5 text-purple-600" />
                <span>Group Shopping Benefits Applied</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Shared Delivery Cost</p>
                    <p className="text-sm text-green-700">Split among {memberCount} members</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Star className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">5% VyronaCoins Cashback</p>
                    <p className="text-sm text-blue-700">Earned on group orders</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <Truck className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-purple-900">Priority Delivery</p>
                    <p className="text-sm text-purple-700">Faster processing for groups</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                  <Bell className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-900">Group Notifications</p>
                    <p className="text-sm text-orange-700">All members updated</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button
            size="lg"
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={() => setLocation(`/order-tracking/${orderId}`)}
          >
            <Truck className="h-5 w-5 mr-2" />
            Track Your Order
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => setLocation("/vyronamallconnect")}
          >
            Continue Shopping
          </Button>
        </div>

        {/* Next Steps */}
        <Card className="mt-6 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">What happens next?</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• All group members will receive email confirmations</p>
              <p>• Your order will be prepared and packed within 2-4 hours</p>
              <p>• You'll receive tracking updates via SMS and email</p>
              <p>• VyronaCoins will be credited to your wallet after delivery</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}