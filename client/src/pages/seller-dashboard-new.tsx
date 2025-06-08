import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Package, 
  TrendingUp, 
  ShoppingCart, 
  Plus,
  Store,
  BarChart3,
  Settings,
  Users,
  Star,
  LogOut,
  DollarSign,
  AlertCircle,
  Book,
  BookOpen,
  Library,
  Calendar,
  UserCheck,
  Clock,
  Search,
  Edit,
  Trash2,
  Eye,
  Upload,
  User,
  Printer,
  Download,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";

export default function SellerDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch seller orders
  const { data: sellerOrders = [] } = useQuery({
    queryKey: ["/api/seller/orders"],
    queryFn: () => apiRequest("/api/seller/orders").then(res => res.json())
  });

  // Fetch seller products
  const { data: sellerProducts = [] } = useQuery({
    queryKey: ["/api/seller/products"],
    queryFn: () => apiRequest("/api/seller/products").then(res => res.json())
  });

  // Update order status mutation with email workflow
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const response = await apiRequest(`/api/seller/orders/${orderId}/status`, "PATCH", {
        status
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/seller/orders"] });
      toast({
        title: "Order Updated",
        description: `Order status updated successfully. ${data.emailSent ? 'Email sent to customer.' : 'Email notification failed.'}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  // Progress stage component for 4-stage email workflow
  const OrderStatusWorkflow = ({ order }: { order: any }) => {
    const currentStatus = order.order_status || order.status || 'pending';
    
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={
          currentStatus === 'delivered' ? 'default' :
          currentStatus === 'out_for_delivery' ? 'secondary' :
          currentStatus === 'shipped' ? 'outline' : 
          currentStatus === 'processing' ? 'secondary' : 'destructive'
        }>
          {currentStatus === 'out_for_delivery' ? 'Out for Delivery' : 
           currentStatus?.charAt(0).toUpperCase() + currentStatus?.slice(1) || 'Pending'}
        </Badge>
        
        {/* 4-Stage Email Workflow Buttons */}
        <div className="flex gap-1">
          {(currentStatus === 'pending' || !currentStatus) && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs px-2 py-1 text-blue-600 border-blue-200 hover:bg-blue-50"
              onClick={() => updateOrderStatusMutation.mutate({
                orderId: order.order_id || order.id,
                status: 'processing'
              })}
              disabled={updateOrderStatusMutation.isPending}
              title="Start Processing - Sends 'Order Confirmed' email"
            >
              📧 Process
            </Button>
          )}
          
          {currentStatus === 'processing' && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs px-2 py-1 text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => updateOrderStatusMutation.mutate({
                orderId: order.order_id || order.id,
                status: 'shipped'
              })}
              disabled={updateOrderStatusMutation.isPending}
              title="Mark as Shipped - Sends 'Order Shipped' email"
            >
              📦 Ship
            </Button>
          )}
          
          {currentStatus === 'shipped' && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs px-2 py-1 text-orange-600 border-orange-200 hover:bg-orange-50"
              onClick={() => updateOrderStatusMutation.mutate({
                orderId: order.order_id || order.id,
                status: 'out_for_delivery'
              })}
              disabled={updateOrderStatusMutation.isPending}
              title="Out for Delivery - Sends 'Arriving Today' email"
            >
              🚚 Deliver
            </Button>
          )}
          
          {currentStatus === 'out_for_delivery' && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs px-2 py-1 text-purple-600 border-purple-200 hover:bg-purple-50"
              onClick={() => updateOrderStatusMutation.mutate({
                orderId: order.order_id || order.id,
                status: 'delivered'
              })}
              disabled={updateOrderStatusMutation.isPending}
              title="Mark as Delivered - Sends 'Order Delivered' email"
            >
              ✅ Complete
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Seller Dashboard</h1>
                <p className="text-sm text-gray-500">Manage your products and orders</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
              >
                <Store className="h-4 w-4 mr-2" />
                View Store
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.removeItem("session");
                  setLocation("/");
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sellerOrders?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">All time orders</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {sellerOrders?.filter((order: any) => 
                      order.status === 'pending' || order.order_status === 'pending' || 
                      (!order.status && !order.order_status)
                    ).length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Awaiting processing</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{(sellerOrders?.reduce((sum: number, order: any) => 
                      sum + (order.total_amount || order.totalAmount || 0), 0) / 100)?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Total earnings</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sellerProducts?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Active products</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Orders - Email Workflow</CardTitle>
                <CardDescription>Quick overview with automated email progression</CardDescription>
              </CardHeader>
              <CardContent>
                {!sellerOrders || sellerOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sellerOrders.slice(0, 5).map((order: any) => (
                      <div key={order.order_id || order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">#{order.order_id || order.id}</span>
                            <span className="text-sm text-gray-600">
                              ₹{((order.total_amount || order.totalAmount) / 100).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">Customer: {order.customer_name || order.customer_email || 'N/A'}</p>
                        </div>
                        <OrderStatusWorkflow order={order} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Orders</CardTitle>
                <CardDescription>Manage orders with 4-stage automated email workflow</CardDescription>
              </CardHeader>
              <CardContent>
                {!sellerOrders || sellerOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sellerOrders.map((order: any) => (
                      <div key={order.order_id || order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">#{order.order_id || order.id}</span>
                            <span className="text-sm text-gray-600">
                              ₹{((order.total_amount || order.totalAmount) / 100).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">Customer: {order.customer_name || order.customer_email || 'N/A'}</p>
                          {order.metadata?.product_names && (
                            <p className="text-sm text-gray-600">Products: {order.metadata.product_names}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            Ordered: {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <OrderStatusWorkflow order={order} />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderDetails(true);
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Your Products</CardTitle>
                <CardDescription>Manage your product listings</CardDescription>
              </CardHeader>
              <CardContent>
                {!sellerProducts || sellerProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No products yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sellerProducts.map((product: any) => (
                      <div key={product.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{product.name}</h3>
                          <Badge variant="outline">{product.category}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                        <p className="text-lg font-semibold text-green-600">₹{product.price}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Email Workflow Performance</CardTitle>
                  <CardDescription>Track automated email delivery rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Order Confirmed Emails</span>
                      <span className="font-medium">
                        {sellerOrders?.filter((order: any) => 
                          order.status === 'processing' || order.order_status === 'processing'
                        ).length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipped Notifications</span>
                      <span className="font-medium">
                        {sellerOrders?.filter((order: any) => 
                          order.status === 'shipped' || order.order_status === 'shipped'
                        ).length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Updates</span>
                      <span className="font-medium">
                        {sellerOrders?.filter((order: any) => 
                          order.status === 'out_for_delivery' || order.order_status === 'out_for_delivery'
                        ).length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completion Confirmations</span>
                      <span className="font-medium">
                        {sellerOrders?.filter((order: any) => 
                          order.status === 'delivered' || order.order_status === 'delivered'
                        ).length || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Order Status Distribution</CardTitle>
                  <CardDescription>Current order status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Pending</span>
                      </div>
                      <span>{sellerOrders?.filter((order: any) => 
                        order.status === 'pending' || order.order_status === 'pending' ||
                        (!order.status && !order.order_status)
                      ).length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Processing</span>
                      </div>
                      <span>{sellerOrders?.filter((order: any) => 
                        order.status === 'processing' || order.order_status === 'processing'
                      ).length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Shipped</span>
                      </div>
                      <span>{sellerOrders?.filter((order: any) => 
                        order.status === 'shipped' || order.order_status === 'shipped'
                      ).length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span>Out for Delivery</span>
                      </div>
                      <span>{sellerOrders?.filter((order: any) => 
                        order.status === 'out_for_delivery' || order.order_status === 'out_for_delivery'
                      ).length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span>Delivered</span>
                      </div>
                      <span>{sellerOrders?.filter((order: any) => 
                        order.status === 'delivered' || order.order_status === 'delivered'
                      ).length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order Details #{selectedOrder.order_id || selectedOrder.id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Customer Information</h4>
                  <p className="text-sm text-gray-600">Name: {selectedOrder.customer_name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Email: {selectedOrder.customer_email || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-medium">Order Summary</h4>
                  <p className="text-sm text-gray-600">Total: ₹{((selectedOrder.total_amount || selectedOrder.totalAmount) / 100).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Date: {new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Order Progress & Email Workflow</h4>
                <OrderStatusWorkflow order={selectedOrder} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}