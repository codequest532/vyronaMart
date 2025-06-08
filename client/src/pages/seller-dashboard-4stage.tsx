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

  // Fetch analytics
  const { data: analytics = {} } = useQuery({
    queryKey: ["/api/seller/analytics"],
    queryFn: () => apiRequest("/api/seller/analytics").then(res => res.json())
  });

  // Fetch VyronaRead data
  const { data: eBooks = [] } = useQuery({
    queryKey: ["/api/vyronaread/ebooks"],
    queryFn: () => apiRequest("/api/vyronaread/ebooks").then(res => res.json())
  });

  const { data: sellerBooks = [] } = useQuery({
    queryKey: ["/api/vyronaread/seller-books"],
    queryFn: () => apiRequest("/api/vyronaread/seller-books").then(res => res.json())
  });

  const { data: libraryBooks = [] } = useQuery({
    queryKey: ["/api/vyronaread/library-books"],
    queryFn: () => apiRequest("/api/vyronaread/library-books").then(res => res.json())
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="vyronaread">VyronaRead</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Overview dashboard cards */}
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
                  <CardTitle className="text-sm font-medium">Processing Orders</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {sellerOrders?.filter((order: any) => 
                      order.status === 'processing' || order.order_status === 'processing'
                    ).length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Awaiting shipment</p>
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
                <CardTitle>Recent Orders - 4-Stage Email Workflow</CardTitle>
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
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            order.order_status === 'delivered' || order.status === 'delivered' ? 'default' :
                            order.order_status === 'out_for_delivery' || order.status === 'out_for_delivery' ? 'secondary' :
                            order.order_status === 'shipped' || order.status === 'shipped' ? 'outline' : 
                            order.order_status === 'processing' || order.status === 'processing' ? 'secondary' : 'destructive'
                          }>
                            {(order.order_status === 'out_for_delivery' || order.status === 'out_for_delivery') ? 'Out for Delivery' : 
                             (order.order_status || order.status || 'Processing')?.charAt(0).toUpperCase() + 
                             (order.order_status || order.status || 'Processing')?.slice(1)}
                          </Badge>
                        </div>
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
                      <div key={order.order_id || order.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
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
                            <p className="text-sm font-medium text-green-600">
                              ₹{((order.total_amount || order.totalAmount) / 100).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              Ordered: {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <select 
                              value={order.order_status || order.status || 'processing'}
                              onChange={(e) => updateOrderStatusMutation.mutate({
                                orderId: order.order_id || order.id,
                                status: e.target.value
                              })}
                              className="text-sm border rounded px-2 py-1"
                            >
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="out_for_delivery">Out for Delivery</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
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

          <TabsContent value="vyronaread" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">VyronaRead Management</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Book className="h-5 w-5" />
                    E-Books
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{eBooks?.length || 0}</div>
                  <p className="text-sm text-gray-600">Digital books available</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Your Books
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{sellerBooks?.length || 0}</div>
                  <p className="text-sm text-gray-600">Books you've listed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Library className="h-5 w-5" />
                    Library Books
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{libraryBooks?.length || 0}</div>
                  <p className="text-sm text-gray-600">Library collection</p>
                </CardContent>
              </Card>
            </div>
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

          <TabsContent value="settings" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your seller account preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input id="storeName" placeholder="Your store name" />
                  </div>
                  <div>
                    <Label htmlFor="storeDescription">Store Description</Label>
                    <Textarea id="storeDescription" placeholder="Describe your store" />
                  </div>
                  <Button>Save Settings</Button>
                </div>
              </CardContent>
            </Card>
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
                  <p className="text-sm text-gray-600">Status: {selectedOrder.order_status || selectedOrder.status || 'Processing'}</p>
                </div>
              </div>

              {selectedOrder.metadata?.items && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Order Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.metadata.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name} x {item.quantity}</span>
                        <span>₹{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Change Order Status</h4>
                <select 
                  value={selectedOrder.order_status || selectedOrder.status || 'processing'}
                  onChange={(e) => {
                    updateOrderStatusMutation.mutate({
                      orderId: selectedOrder.order_id || selectedOrder.id,
                      status: e.target.value
                    });
                    setShowOrderDetails(false);
                  }}
                  className="w-full text-sm border rounded px-3 py-2"
                >
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}