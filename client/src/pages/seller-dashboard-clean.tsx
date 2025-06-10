import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings, 
  Plus, 
  Eye,
  Trash2,
  TrendingUp,
  DollarSign,
  Star
} from "lucide-react";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  stock_quantity: number;
  enableGroupBuy: boolean;
  seller_id: number;
  created_at: string;
};

type Order = {
  order_id: number;
  user_id: number;
  total_amount: number;
  order_status: string;
  created_at: string;
  module: string;
  items: any[];
  shipping_address?: any;
  customer_email?: string;
  customer_phone?: string;
  metadata?: any;
};

export default function SellerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock_quantity: "",
    enableGroupBuy: false
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch seller products
  const { data: sellerProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/seller/products"],
  });

  // Fetch seller orders
  const { data: sellerOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/seller/orders"],
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      return apiRequest("/api/products", {
        method: "POST",
        body: JSON.stringify({
          ...productData,
          price: Math.round(parseFloat(productData.price) * 100),
          stock_quantity: parseInt(productData.stock_quantity),
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seller/products"] });
      setShowAddProductDialog(false);
      setNewProduct({
        name: "",
        description: "",
        price: "",
        category: "",
        stock_quantity: "",
        enableGroupBuy: false
      });
      toast({
        title: "Success",
        description: "Product added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive",
      });
    },
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      return apiRequest(`/api/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seller/orders"] });
      toast({
        title: "Success",
        description: "Order status updated successfully",
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

  const handleInputChange = (field: string, value: string | boolean) => {
    setNewProduct(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    addProductMutation.mutate(newProduct);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  // Calculate dashboard stats
  const totalProducts = Array.isArray(sellerProducts) ? sellerProducts.length : 0;
  const totalOrders = Array.isArray(sellerOrders) ? sellerOrders.length : 0;
  const totalRevenue = Array.isArray(sellerOrders) ? 
    sellerOrders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) / 100 : 0;
  const pendingOrders = Array.isArray(sellerOrders) ? 
    sellerOrders.filter((order: any) => order.order_status === 'pending').length : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">VyronaHub Seller</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Seller Dashboard</p>
          </div>
          
          <nav className="space-y-2 px-4">
            <Button
              onClick={() => setActiveTab("overview")}
              variant={activeTab === "overview" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </Button>
            <Button
              onClick={() => setActiveTab("products")}
              variant={activeTab === "products" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Package className="h-4 w-4 mr-2" />
              Products
            </Button>
            <Button
              onClick={() => setActiveTab("orders")}
              variant={activeTab === "orders" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Orders
            </Button>
            <Button
              onClick={() => setActiveTab("analytics")}
              variant={activeTab === "analytics" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button
              onClick={() => setActiveTab("customers")}
              variant={activeTab === "customers" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Users className="h-4 w-4 mr-2" />
              Customers
            </Button>
            <Button
              onClick={() => setActiveTab("settings")}
              variant={activeTab === "settings" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Store Overview</h2>
                <p className="text-gray-600 dark:text-gray-300">Monitor your store performance and metrics</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalProducts}</div>
                    <p className="text-xs text-muted-foreground">Active listings</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalOrders}</div>
                    <p className="text-xs text-muted-foreground">All time orders</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Total earnings</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{pendingOrders}</div>
                    <p className="text-xs text-muted-foreground">Needs attention</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest orders from your customers</CardDescription>
                </CardHeader>
                <CardContent>
                  {Array.isArray(sellerOrders) && sellerOrders.length > 0 ? (
                    <div className="space-y-4">
                      {sellerOrders.slice(0, 5).map((order: any) => (
                        <div key={order.order_id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Order #{order.order_id}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ₹{(order.total_amount / 100).toFixed(2)} • {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              order.order_status === 'delivered' ? 'default' :
                              order.order_status === 'shipped' ? 'secondary' :
                              order.order_status === 'processing' ? 'outline' : 'destructive'
                            }>
                              {order.order_status || 'pending'}
                            </Badge>
                            <Button size="sm" onClick={() => handleViewOrder(order)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">No orders yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h2>
                  <p className="text-gray-600 dark:text-gray-300">Manage your product inventory</p>
                </div>
                <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
                      <DialogDescription>
                        Add a new product to your VyronaHub store
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                          id="name"
                          value={newProduct.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="Enter product name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select value={newProduct.category} onValueChange={(value) => handleInputChange("category", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="electronics">Electronics</SelectItem>
                            <SelectItem value="clothing">Clothing</SelectItem>
                            <SelectItem value="home">Home & Garden</SelectItem>
                            <SelectItem value="sports">Sports</SelectItem>
                            <SelectItem value="books">Books</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (₹) *</Label>
                        <Input
                          id="price"
                          type="number"
                          value={newProduct.price}
                          onChange={(e) => handleInputChange("price", e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="stock">Stock Quantity *</Label>
                        <Input
                          id="stock"
                          type="number"
                          value={newProduct.stock_quantity}
                          onChange={(e) => handleInputChange("stock_quantity", e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newProduct.description}
                          onChange={(e) => handleInputChange("description", e.target.value)}
                          placeholder="Enter product description"
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddProductDialog(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddProduct}
                        disabled={addProductMutation.isPending}
                      >
                        {addProductMutation.isPending ? "Adding..." : "Add Product"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Products List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(sellerProducts) && sellerProducts.map((product: Product) => (
                  <Card key={product.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription>{product.category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-2xl font-bold">₹{(product.price / 100).toFixed(2)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Stock: {product.stock_quantity}</p>
                        <p className="text-sm">{product.description}</p>
                        <div className="flex justify-between items-center pt-2">
                          <Badge variant={product.enableGroupBuy ? "secondary" : "outline"}>
                            {product.enableGroupBuy ? "Group Buy" : "Individual"}
                          </Badge>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {(!Array.isArray(sellerProducts) || sellerProducts.length === 0) && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No Products Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400">Add your first product to get started</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Orders</h2>
                <p className="text-gray-600 dark:text-gray-300">Manage customer orders and fulfillment</p>
              </div>

              {Array.isArray(sellerOrders) && sellerOrders.length > 0 ? (
                <div className="space-y-4">
                  {sellerOrders.map((order: Order) => (
                    <Card key={order.order_id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">Order #{order.order_id}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ₹{(order.total_amount / 100).toFixed(2)} • {new Date(order.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Module: {order.module}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <Select
                              value={order.order_status || 'pending'}
                              onValueChange={(status) => updateOrderStatusMutation.mutate({ 
                                orderId: order.order_id, 
                                status 
                              })}
                              disabled={updateOrderStatusMutation.isPending}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="sm" onClick={() => handleViewOrder(order)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No Orders Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400">Orders will appear here once customers start purchasing</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h2>
                <p className="text-gray-600 dark:text-gray-300">Track your store performance and insights</p>
              </div>
              <Card>
                <CardContent className="p-12 text-center">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">Analytics Coming Soon</h3>
                  <p className="text-gray-500 dark:text-gray-400">Detailed sales analytics will be available once you have sales data</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "customers" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Customer Management</h2>
                <p className="text-gray-600 dark:text-gray-300">View and manage your customers</p>
              </div>
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">Customer Data Coming Soon</h3>
                  <p className="text-gray-500 dark:text-gray-400">Customer insights will be available once you start receiving orders</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Store Settings</h2>
                <p className="text-gray-600 dark:text-gray-300">Configure your store preferences</p>
              </div>
              <Card>
                <CardContent className="p-12 text-center">
                  <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">Settings Panel Coming Soon</h3>
                  <p className="text-gray-500 dark:text-gray-400">Store configuration options will be available soon</p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Order Details Modal */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Order Details #{selectedOrder?.order_id}</DialogTitle>
            <DialogDescription>
              Complete order information and management options
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="overflow-y-auto flex-1 px-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                {/* Order Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Order Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Order ID:</span>
                      <span>#{selectedOrder.order_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <Badge variant={
                        selectedOrder.order_status === 'delivered' ? 'default' :
                        selectedOrder.order_status === 'shipped' ? 'secondary' :
                        selectedOrder.order_status === 'processing' ? 'outline' : 'destructive'
                      }>
                        {selectedOrder.order_status || 'pending'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Module:</span>
                      <span className="capitalize">{selectedOrder.module}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Total Amount:</span>
                      <span className="font-semibold">₹{(selectedOrder.total_amount / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Order Type:</span>
                      <span className="capitalize">{selectedOrder.metadata?.type || 'Standard'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Created:</span>
                      <span>{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Customer Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Customer ID:</span>
                      <span>#{selectedOrder.user_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Email:</span>
                      <span>{selectedOrder.customer_email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Phone:</span>
                      <span>{selectedOrder.customer_phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Address:</span>
                      <span className="text-right max-w-48">
                        {selectedOrder.shipping_address ? (
                          <div className="text-sm">
                            <div>{selectedOrder.shipping_address.street}</div>
                            <div>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}</div>
                            <div>{selectedOrder.shipping_address.zipCode}</div>
                          </div>
                        ) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Quantity: {item.quantity}</div>
                      </div>
                      <div className="font-semibold">₹{((item.price * item.quantity) / 100).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Status Update */}
              <div className="mt-6 flex gap-4">
                <Select
                  value={selectedOrder.order_status || 'pending'}
                  onValueChange={(status) => updateOrderStatusMutation.mutate({ 
                    orderId: selectedOrder.order_id, 
                    status 
                  })}
                  disabled={updateOrderStatusMutation.isPending}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                {updateOrderStatusMutation.isPending && (
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}