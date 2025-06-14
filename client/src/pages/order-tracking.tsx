import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.9716, 77.6412]); // Bangalore coordinates
  const [route, setRoute] = useState<[number, number][]>([]);

  const { data: orderTracking, isLoading } = useQuery({
    queryKey: ["/api/orders/track", orderId],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  // Custom icons for map markers
  const storeIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/>
        <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.79 1.1L21 9"/>
        <path d="M12 3v6"/>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });

  const deliveryIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
        <path d="M15 18H9"/>
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
        <circle cx="17" cy="18" r="2"/>
        <circle cx="7" cy="18" r="2"/>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });

  const customerIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });

  // Calculate route when delivery partner data is available
  useEffect(() => {
    if (orderTracking && 'deliveryPartner' in orderTracking && orderTracking.deliveryPartner) {
      const storeCoords: [number, number] = [12.9352, 77.6245]; // FreshMart Express
      const deliveryCoords: [number, number] = [orderTracking.deliveryPartner.currentLat, orderTracking.deliveryPartner.currentLng];
      const customerCoords: [number, number] = [12.9667, 77.6378]; // Customer location
      
      // Create route path
      setRoute([storeCoords, deliveryCoords, customerCoords]);
      
      // Center map on delivery partner location
      setMapCenter(deliveryCoords);
    }
  }, [orderTracking]);

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
              <div className="rounded-xl h-64 overflow-hidden mb-4">
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  className="rounded-xl"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Store Location */}
                  <Marker position={[12.9352, 77.6245]} icon={storeIcon}>
                    <Popup>
                      <div className="text-center">
                        <strong>{tracking.storeName}</strong><br/>
                        <span className="text-sm text-gray-600">Pickup Location</span>
                      </div>
                    </Popup>
                  </Marker>
                  
                  {/* Delivery Partner Location */}
                  <Marker 
                    position={[tracking.deliveryPartner.currentLat, tracking.deliveryPartner.currentLng]} 
                    icon={deliveryIcon}
                  >
                    <Popup>
                      <div className="text-center">
                        <strong>{tracking.deliveryPartner.name}</strong><br/>
                        <span className="text-sm text-gray-600">{tracking.deliveryPartner.vehicleType}</span><br/>
                        <span className="text-xs text-gray-500">{tracking.deliveryPartner.vehicleNumber}</span>
                      </div>
                    </Popup>
                  </Marker>
                  
                  {/* Customer Location */}
                  <Marker position={[12.9667, 77.6378]} icon={customerIcon}>
                    <Popup>
                      <div className="text-center">
                        <strong>Delivery Address</strong><br/>
                        <span className="text-sm text-gray-600">{tracking.deliveryAddress}</span>
                      </div>
                    </Popup>
                  </Marker>
                  
                  {/* Route Path */}
                  {route.length > 0 && (
                    <Polyline
                      positions={route}
                      pathOptions={{
                        color: '#059669',
                        weight: 4,
                        opacity: 0.8,
                        dashArray: '10, 10'
                      }}
                    />
                  )}
                </MapContainer>
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