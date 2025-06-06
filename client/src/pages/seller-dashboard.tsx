import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Package, MapPin, Phone, Mail, Calendar, Truck, CheckCircle, Clock } from 'lucide-react';

interface Order {
  id: number;
  userId: number;
  totalAmount: number;
  status: string;
  module: string;
  createdAt: string;
  metadata: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    deliveryAddresses: any[];
    products: Array<{
      productId: number;
      productName: string;
      quantity: number;
      price: number;
      totalPrice: number;
    }>;
    fulfillmentStatus: string;
    orderDate: string;
    trackingNumber?: string;
  };
}

export default function SellerDashboard() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/seller/orders'],
    queryFn: () => apiRequest('GET', '/api/seller/orders')
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status, trackingNumber }: { orderId: number; status: string; trackingNumber?: string }) =>
      apiRequest('PATCH', `/api/seller/orders/${orderId}/status`, { status, trackingNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/seller/orders'] });
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully.",
      });
      setSelectedOrder(null);
      setTrackingNumber('');
      setNewStatus('');
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'shipped':
        return <Badge className="bg-purple-100 text-purple-800">Shipped</Badge>;
      case 'delivered':
        return <Badge className="bg-gray-100 text-gray-800">Delivered</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFulfillmentIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-purple-600" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your orders and fulfillment operations</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders.filter((order: Order) => order.metadata?.fulfillmentStatus === 'processing').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shipped</CardTitle>
              <Truck className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders.filter((order: Order) => order.metadata?.fulfillmentStatus === 'shipped').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders.filter((order: Order) => order.metadata?.fulfillmentStatus === 'delivered').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Order Management</CardTitle>
            <CardDescription>
              View and manage customer orders requiring fulfillment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No orders found. Orders will appear here once customers complete their purchases.
                </div>
              ) : (
                orders.map((order: Order) => (
                  <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getFulfillmentIcon(order.metadata?.fulfillmentStatus || 'processing')}
                        <div>
                          <h3 className="font-semibold">Order #{order.id}</h3>
                          <p className="text-sm text-gray-600">
                            {order.metadata?.customerName} • ₹{order.totalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(order.status)}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Order #{order.id} Details</DialogTitle>
                              <DialogDescription>
                                Complete order information for fulfillment
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedOrder && (
                              <div className="space-y-6">
                                {/* Customer Information */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                      <Mail className="h-4 w-4" />
                                      Customer Details
                                    </Label>
                                    <div className="text-sm space-y-1">
                                      <p><strong>Name:</strong> {selectedOrder.metadata?.customerName}</p>
                                      <p><strong>Email:</strong> {selectedOrder.metadata?.customerEmail}</p>
                                      <p><strong>Phone:</strong> {selectedOrder.metadata?.customerPhone}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                      <Calendar className="h-4 w-4" />
                                      Order Information
                                    </Label>
                                    <div className="text-sm space-y-1">
                                      <p><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                                      <p><strong>Total:</strong> ₹{selectedOrder.totalAmount.toFixed(2)}</p>
                                      <p><strong>Status:</strong> {selectedOrder.status}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Delivery Address */}
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Delivery Address
                                  </Label>
                                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                                    {selectedOrder.metadata?.deliveryAddresses?.length > 0 ? (
                                      selectedOrder.metadata.deliveryAddresses.map((address: any, index: number) => (
                                        <div key={index} className="space-y-1">
                                          <p>{address.name}</p>
                                          <p>{address.street}</p>
                                          <p>{address.city}, {address.state} {address.pincode}</p>
                                          <p>{address.phone}</p>
                                        </div>
                                      ))
                                    ) : (
                                      <p>No delivery address provided</p>
                                    )}
                                  </div>
                                </div>

                                {/* Product Details */}
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Products to Dispatch
                                  </Label>
                                  <div className="space-y-2">
                                    {selectedOrder.metadata?.products?.map((product: any, index: number) => (
                                      <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                        <div>
                                          <p className="font-medium">{product.productName}</p>
                                          <p className="text-sm text-gray-600">Quantity: {product.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-medium">₹{product.totalPrice.toFixed(2)}</p>
                                          <p className="text-sm text-gray-600">₹{product.price.toFixed(2)} each</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Order Status Update */}
                                <div className="space-y-4 border-t pt-4">
                                  <Label className="text-sm font-medium">Update Order Status</Label>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="status">New Status</Label>
                                      <Select value={newStatus} onValueChange={setNewStatus}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="processing">Processing</SelectItem>
                                          <SelectItem value="shipped">Shipped</SelectItem>
                                          <SelectItem value="delivered">Delivered</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label htmlFor="tracking">Tracking Number (Optional)</Label>
                                      <Input
                                        id="tracking"
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                        placeholder="Enter tracking number"
                                      />
                                    </div>
                                  </div>
                                  
                                  <Button 
                                    onClick={() => {
                                      if (newStatus) {
                                        updateStatusMutation.mutate({
                                          orderId: selectedOrder.id,
                                          status: newStatus,
                                          trackingNumber: trackingNumber || undefined
                                        });
                                      }
                                    }}
                                    disabled={!newStatus || updateStatusMutation.isPending}
                                    className="w-full"
                                  >
                                    {updateStatusMutation.isPending ? 'Updating...' : 'Update Order Status'}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                      <span>Products: {order.metadata?.products?.length || 0}</span>
                      <span>•</span>
                      <span>Ordered: {new Date(order.createdAt).toLocaleDateString()}</span>
                      {order.metadata?.trackingNumber && (
                        <>
                          <span>•</span>
                          <span>Tracking: {order.metadata.trackingNumber}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}