import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Package, Truck, CreditCard, MapPin } from "lucide-react";

export default function OrderConfirmation() {
  const [location, setLocation] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("orderId");
  const source = urlParams.get("source");

  const { data: order, isLoading } = useQuery({
    queryKey: [`/api/order/${orderId}`],
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Order Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We couldn't find your order. Please check your order ID and try again.
            </p>
            <Button onClick={() => setLocation("/")}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price / 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Order Confirmed!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Thank you for your {source === 'instagram' ? 'Instagram' : ''} order. We'll send you updates as your order progresses.
          </p>
        </div>

        {/* Order Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Order ID:</span>
              <span className="font-mono font-semibold">#{order.id}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <Badge className={getStatusColor(order.status)}>
                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
              </Badge>
            </div>

            {order.trackingNumber && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Tracking Number:</span>
                <span className="font-mono font-semibold">{order.trackingNumber}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
              <span className="font-bold text-lg">{formatPrice(order.totalAmount)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
              <span className="capitalize">{order.paymentMethod}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Order Date:</span>
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 dark:text-gray-300">
                {typeof order.shippingAddress === 'string' ? (
                  <pre className="whitespace-pre-wrap font-sans">
                    {JSON.parse(order.shippingAddress).fullName}<br />
                    {JSON.parse(order.shippingAddress).address}<br />
                    {JSON.parse(order.shippingAddress).city}, {JSON.parse(order.shippingAddress).state} {JSON.parse(order.shippingAddress).pincode}<br />
                    Phone: {JSON.parse(order.shippingAddress).phone}
                  </pre>
                ) : (
                  <p>Address information not available</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              What's Next?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-semibold">Order Confirmed</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your order has been received and confirmed.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-gray-300 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-semibold">Processing</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">We're preparing your items for shipment.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-gray-300 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-semibold">Shipped</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your order will be on its way to you.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-gray-300 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-semibold">Delivered</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your order will arrive at your doorstep.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={() => setLocation("/")}
            variant="outline"
            className="flex-1"
          >
            Continue Shopping
          </Button>
          
          {source === 'instagram' && (
            <Button 
              onClick={() => setLocation("/instashop")}
              className="flex-1"
            >
              Browse More Instagram Products
            </Button>
          )}
          
          {source !== 'instagram' && (
            <Button 
              onClick={() => setLocation("/products")}
              className="flex-1"
            >
              Browse More Products
            </Button>
          )}
        </div>

        {/* Support Information */}
        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Need help with your order?</p>
          <p>Contact our support team at <span className="text-purple-600 dark:text-purple-400">support@vyronamart.com</span></p>
        </div>
      </div>
    </div>
  );
}