import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, MapPin, Clock, Phone, MessageCircle, 
  Truck, CheckCircle, Package, User, Star
} from "lucide-react";

interface DeliveryPartner {
  id: number;
  name: string;
  phone: string;
  rating: number;
  vehicleType: string;
  vehicleNumber: string;
  currentLat: number;
  currentLng: number;
  profileImage?: string;
}

interface OrderTracking {
  id: number;
  status: string;
  estimatedDelivery: string;
  trackingNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  deliveryAddress: string;
  storeName: string;
  storeAddress: string;
  deliveryPartner?: DeliveryPartner;
  timeline: Array<{
    status: string;
    timestamp: string;
    description: string;
    completed: boolean;
  }>;
}

export default function OrderTracking() {
  const [, params] = useRoute("/track-order/:orderId");
  const orderId = params?.orderId;
  const [mapInitialized, setMapInitialized] = useState(false);

  const { data: orderTracking, isLoading } = useQuery({
    queryKey: ["/api/orders/track", orderId],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  // Initialize map when delivery partner is assigned
  useEffect(() => {
    if (orderTracking?.deliveryPartner && !mapInitialized) {
      initializeMap();
      setMapInitialized(true);
    }
  }, [orderTracking?.deliveryPartner, mapInitialized]);

  const initializeMap = () => {
    // Initialize Google Maps or Mapbox for real-time tracking
    // This would integrate with actual mapping service
    console.log("Initializing map for delivery tracking");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'preparing': return 'bg-yellow-100 text-yellow-700';
      case 'ready': return 'bg-purple-100 text-purple-700';
      case 'picked up': return 'bg-orange-100 text-orange-700';
      case 'out for delivery': return 'bg-emerald-100 text-emerald-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return <CheckCircle className="h-5 w-5" />;
      case 'preparing': return <Package className="h-5 w-5" />;
      case 'ready': return <Clock className="h-5 w-5" />;
      case 'picked up': return <Truck className="h-5 w-5" />;
      case 'out for delivery': return <MapPin className="h-5 w-5" />;
      case 'delivered': return <CheckCircle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded-2xl"></div>
            <div className="h-32 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const tracking = orderTracking as OrderTracking;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              className="rounded-xl border-emerald-200 hover:bg-emerald-50"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Track Order</h1>
              <p className="text-gray-600">Order #{tracking?.trackingNumber}</p>
            </div>
          </div>
          <Badge className={`px-3 py-1 text-sm ${getStatusColor(tracking?.status || '')}`}>
            {getStatusIcon(tracking?.status || '')}
            <span className="ml-2">{tracking?.status}</span>
          </Badge>
        </div>

        {/* Live Map Tracking - Only show when delivery partner is assigned */}
        {tracking?.deliveryPartner && (
          <Card className="rounded-2xl border-0 bg-white/90 backdrop-blur-sm shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Live Tracking</h3>
              <div className="bg-gray-100 rounded-xl h-64 flex items-center justify-center mb-4">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-emerald-600 mx-auto mb-2" />
                  <p className="text-gray-600 mb-2">Real-time map tracking</p>
                  <p className="text-sm text-gray-500">Your delivery partner is on the way!</p>
                </div>
              </div>
              
              {/* Delivery Partner Info */}
              <div className="bg-emerald-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{tracking.deliveryPartner.name}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>{tracking.deliveryPartner.vehicleType}</span>
                        <span>•</span>
                        <span>{tracking.deliveryPartner.vehicleNumber}</span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{tracking.deliveryPartner.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="border-emerald-200 hover:bg-emerald-50 rounded-lg">
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                    <Button size="sm" variant="outline" className="border-emerald-200 hover:bg-emerald-50 rounded-lg">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Chat
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Timeline */}
        <Card className="rounded-2xl border-0 bg-white/90 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Order Timeline</h3>
            <div className="space-y-4">
              {tracking?.timeline?.map((step, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.completed ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {getStatusIcon(step.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-semibold ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                        {step.status}
                      </h4>
                      <span className="text-sm text-gray-500">{step.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Items */}
          <Card className="rounded-2xl border-0 bg-white/90 backdrop-blur-sm shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-3">
                {tracking?.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">{item.name}</span>
                      <span className="text-gray-500 ml-2">x{item.quantity}</span>
                    </div>
                    <span className="font-semibold text-gray-900">₹{Math.round(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{Math.round(tracking?.total || 0)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card className="rounded-2xl border-0 bg-white/90 backdrop-blur-sm shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Delivery Information</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Estimated Delivery</h4>
                  <p className="text-emerald-600 font-medium">{tracking?.estimatedDelivery}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Store</h4>
                  <p className="text-gray-600">{tracking?.storeName}</p>
                  <p className="text-sm text-gray-500">{tracking?.storeAddress}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Delivery Address</h4>
                  <p className="text-gray-600">{tracking?.deliveryAddress}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <Card className="rounded-2xl border-0 bg-white/90 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Need Help?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="p-4 h-auto flex-col rounded-xl border-emerald-200 hover:bg-emerald-50">
                <Phone className="h-6 w-6 mb-2 text-emerald-600" />
                <span className="text-sm">Call Support</span>
              </Button>
              <Button variant="outline" className="p-4 h-auto flex-col rounded-xl border-emerald-200 hover:bg-emerald-50">
                <MessageCircle className="h-6 w-6 mb-2 text-emerald-600" />
                <span className="text-sm">Live Chat</span>
              </Button>
              <Button variant="outline" className="p-4 h-auto flex-col rounded-xl border-emerald-200 hover:bg-emerald-50">
                <Package className="h-6 w-6 mb-2 text-emerald-600" />
                <span className="text-sm">Report Issue</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}