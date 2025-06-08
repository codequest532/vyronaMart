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

const categories = [
  { value: "electronics", label: "Electronics" },
  { value: "clothing", label: "Clothing" },
  { value: "books", label: "Books" },
  { value: "home", label: "Home & Garden" },
  { value: "sports", label: "Sports" },
  { value: "toys", label: "Toys & Games" },
  { value: "beauty", label: "Beauty & Personal Care" },
  { value: "automotive", label: "Automotive" },
  { value: "other", label: "Other" }
];

const productFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be positive"),
  category: z.string().min(1, "Category is required"),
  module: z.string().min(1, "Module is required"),
  enableIndividualBuy: z.boolean(),
  enableGroupBuy: z.boolean(),
  groupBuyMinQuantity: z.number().optional(),
  groupBuyDiscount: z.number().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function SellerDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showBookForm, setShowBookForm] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [showLibraryForm, setShowLibraryForm] = useState(false);
  const [editingLibraryBook, setEditingLibraryBook] = useState<any>(null);
  const [showEbookForm, setShowEbookForm] = useState(false);
  const [editingEbook, setEditingEbook] = useState<any>(null);
  const [showPhysicalBookForm, setShowPhysicalBookForm] = useState(false);
  const [editingPhysicalBook, setEditingPhysicalBook] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ["/api/current-user"],
    queryFn: () => apiRequest("/api/current-user").then(res => res.json())
  });

  // Fetch seller products
  const { data: sellerProducts = [] } = useQuery({
    queryKey: ["/api/seller/products"],
    queryFn: () => apiRequest("/api/seller/products").then(res => res.json())
  });

  // Fetch seller orders
  const { data: sellerOrders = [] } = useQuery({
    queryKey: ["/api/seller/orders"],
    queryFn: () => apiRequest("/api/seller/orders").then(res => res.json())
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="vyronaread">VyronaRead</TabsTrigger>
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Manage your customer orders with automated email workflow</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  if (!sellerOrders || sellerOrders.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No orders yet</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {sellerOrders.map((order: any) => (
                        <div key={order.order_id || order.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={
                                order.order_status === 'completed' || order.status === 'completed' ? 'default' :
                                order.order_status === 'processing' || order.status === 'processing' ? 'secondary' :
                                order.order_status === 'shipped' || order.status === 'shipped' ? 'outline' : 'destructive'
                              }>
                                {order.order_status || order.status}
                              </Badge>
                              <span className="text-sm font-medium">#{order.order_id || order.id}</span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium">Order #{order.order_id || order.id}</p>
                                {order.metadata?.product_names && (
                                  <p className="text-sm text-gray-600">Products: {order.metadata.product_names}</p>
                                )}
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
                            <div className="flex items-center gap-2 flex-wrap">
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
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Second Orders Section with Email Workflow */}
              <Card>
                <CardHeader>
                  <CardTitle>All Orders</CardTitle>
                  <CardDescription>Complete order history with 4-stage email automation</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    if (!sellerOrders || sellerOrders.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No orders found</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {sellerOrders.map((order: any) => (
                          <div key={order.order_id || order.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={
                                  order.order_status === 'completed' || order.status === 'completed' ? 'default' :
                                  order.order_status === 'processing' || order.status === 'processing' ? 'secondary' :
                                  order.order_status === 'shipped' || order.status === 'shipped' ? 'outline' : 'destructive'
                                }>
                                  {order.order_status || order.status}
                                </Badge>
                                <span className="text-sm font-medium">#{order.order_id || order.id}</span>
                              </div>
                              <p className="font-medium">Order #{order.order_id || order.id}</p>
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
                            <div className="flex items-center gap-2 flex-wrap">
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
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other tabs content would go here... */}
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
                <div className="flex items-center gap-2">
                  <Badge variant={
                    selectedOrder.order_status === 'completed' || selectedOrder.status === 'completed' ? 'default' :
                    selectedOrder.order_status === 'processing' || selectedOrder.status === 'processing' ? 'secondary' :
                    selectedOrder.order_status === 'shipped' || selectedOrder.status === 'shipped' ? 'outline' : 'destructive'
                  }>
                    {selectedOrder.order_status || selectedOrder.status}
                  </Badge>
                </div>
                
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

                {/* Email Workflow Status */}
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