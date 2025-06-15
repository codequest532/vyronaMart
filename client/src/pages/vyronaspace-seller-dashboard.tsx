import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Store, Package, ShoppingCart, DollarSign, Users, BarChart3, 
  Settings, Bell, MessageCircle, Clock, MapPin, Camera, 
  Upload, Plus, Minus, Edit, Trash2, Eye, EyeOff, 
  CheckCircle, XCircle, Truck, User, ArrowLeft, Star,
  TrendingUp, Calendar, AlertCircle, Phone, Mail,
  FileText, Download, RefreshCw, Award, Target,
  Zap, Shield, Crown, Home, Activity, Wallet
} from "lucide-react";

interface SellerStore {
  id: number;
  name: string;
  description: string;
  type: string;
  address: string;
  latitude: string;
  longitude: string;
  isOpen: boolean;
  rating: number;
  reviewCount: number;
  coverImageUrl?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  businessHours?: string;
  badges: string[];
  deliveryTime: string;
  deliveryFee: number;
}

interface SellerProduct {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  isActive: boolean;
  stockQuantity: number;
  imageUrl?: string;
  variants?: any[];
  storeId: number;
}

interface Order {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  items: any[];
  total: number;
  status: string;
  paymentMethod: string;
  orderDate: string;
  deliveryAddress: string;
  preparationTime?: number;
  deliveryType: string;
}

export default function VyronaSpaceSellerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showStoreEdit, setShowStoreEdit] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch seller store data
  const { data: store, isLoading: storeLoading } = useQuery<SellerStore>({
    queryKey: ["/api/vyronaspace/seller/store"]
  });

  // Fetch seller products
  const { data: products = [], isLoading: productsLoading } = useQuery<SellerProduct[]>({
    queryKey: ["/api/vyronaspace/seller/products"]
  });

  // Fetch seller orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/vyronaspace/seller/orders"]
  });

  // Store profile form
  const [storeForm, setStoreForm] = useState({
    name: "",
    description: "",
    type: "kirana",
    address: "",
    phone: "",
    email: "",
    businessHours: "7:00 AM - 10:00 PM",
    deliveryTime: "15-30 min",
    deliveryFee: 0
  });

  // Product form
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    category: "Grocery",
    price: 0,
    stockQuantity: 100,
    isActive: true
  });

  // Update store mutation
  const updateStoreMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", "/api/vyronaspace/seller/store", data);
    },
    onSuccess: () => {
      toast({ title: "Store updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/vyronaspace/seller/store"] });
      setShowStoreEdit(false);
    },
    onError: () => {
      toast({ title: "Failed to update store", variant: "destructive" });
    }
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/vyronaspace/seller/products", data);
    },
    onSuccess: () => {
      toast({ title: "Product added successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/vyronaspace/seller/products"] });
      setShowAddProduct(false);
      setProductForm({
        name: "",
        description: "",
        category: "Grocery",
        price: 0,
        stockQuantity: 100,
        isActive: true
      });
    }
  });

  // Toggle product status mutation
  const toggleProductMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/vyronaspace/seller/products/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vyronaspace/seller/products"] });
    }
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      return apiRequest("PATCH", `/api/vyronaspace/seller/orders/${orderId}`, { status });
    },
    onSuccess: () => {
      toast({ title: "Order status updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/vyronaspace/seller/orders"] });
    }
  });

  // Toggle store status mutation
  const toggleStoreStatusMutation = useMutation({
    mutationFn: async (isOpen: boolean) => {
      return apiRequest("PATCH", "/api/vyronaspace/seller/store/status", { isOpen });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vyronaspace/seller/store"] });
    }
  });

  useEffect(() => {
    if (store) {
      setStoreForm({
        name: store?.name || "",
        description: store?.description || "",
        type: store?.type || "kirana",
        address: store?.address || "",
        phone: store?.phone || "",
        email: store?.email || "",
        businessHours: store?.businessHours || "7:00 AM - 10:00 PM",
        deliveryTime: store?.deliveryTime || "15-30 min",
        deliveryFee: store?.deliveryFee || 0
      });
    }
  }, [store]);

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-blue-100 text-blue-700";
      case "packed": return "bg-yellow-100 text-yellow-700";
      case "out_for_delivery": return "bg-purple-100 text-purple-700";
      case "delivered": return "bg-green-100 text-green-700";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const formatCurrency = (amount: number) => `₹${Math.round(amount)}`;

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" className="rounded-xl border-orange-200 hover:bg-orange-50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">VyronaSpace Seller Dashboard</h1>
              <p className="text-gray-600">{store?.name || "Your Store"}</p>
            </div>
          </div>

          {/* Store Status Toggle */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="store-status">Store Status:</Label>
              <Switch
                id="store-status"
                checked={store?.isOpen || false}
                onCheckedChange={(checked) => toggleStoreStatusMutation.mutate(checked)}
              />
              <Badge className={store?.isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                {store?.isOpen ? "Open" : "Closed"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-8 bg-white/80 backdrop-blur-sm rounded-2xl p-2 h-auto border border-orange-200/50">
            <TabsTrigger value="overview" className="rounded-xl py-3 data-[state=active]:bg-orange-100">
              <Home className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-xl py-3 data-[state=active]:bg-orange-100">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="products" className="rounded-xl py-3 data-[state=active]:bg-orange-100">
              <Package className="h-4 w-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl py-3 data-[state=active]:bg-orange-100">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="customers" className="rounded-xl py-3 data-[state=active]:bg-orange-100">
              <Users className="h-4 w-4 mr-2" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="payments" className="rounded-xl py-3 data-[state=active]:bg-orange-100">
              <Wallet className="h-4 w-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="store" className="rounded-xl py-3 data-[state=active]:bg-orange-100">
              <Store className="h-4 w-4 mr-2" />
              Store Profile
            </TabsTrigger>
            <TabsTrigger value="support" className="rounded-xl py-3 data-[state=active]:bg-orange-100">
              <MessageCircle className="h-4 w-4 mr-2" />
              Support
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-orange-200/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Today's Orders</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {orders.filter((order: Order) => 
                          new Date(order.orderDate).toDateString() === new Date().toDateString()
                        ).length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-orange-200/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Today's Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(
                          orders
                            .filter((order: Order) => 
                              new Date(order.orderDate).toDateString() === new Date().toDateString()
                            )
                            .reduce((sum: number, order: Order) => sum + order.total, 0)
                        )}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-orange-200/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Products</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {products.filter((product: SellerProduct) => product.isActive).length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-orange-200/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Store Rating</p>
                      <p className="text-2xl font-bold text-gray-900">{store?.rating || 0}/5.0</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <Star className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Recent Orders
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("orders")}
                    className="rounded-xl border-orange-200 hover:bg-orange-50"
                  >
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order: Order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                          <ShoppingCart className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">Order #{order.id}</p>
                          <p className="text-sm text-gray-600">{order.customerName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(order.total)}</p>
                        <Badge className={getOrderStatusColor(order.status)}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200/50">
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order: Order) => (
                    <div key={order.id} className="border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg">Order #{order.id}</h3>
                          <p className="text-gray-600">{order.customerName} • {order.customerPhone}</p>
                          <p className="text-sm text-gray-500">{new Date(order.orderDate).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xl">{formatCurrency(order.total)}</p>
                          <Badge className={getOrderStatusColor(order.status)}>
                            {order.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="font-medium text-gray-900">Items:</p>
                          <ul className="text-sm text-gray-600">
                            {order.items.map((item: any, index: number) => (
                              <li key={index}>{item.quantity}x {item.name} - {formatCurrency(item.price)}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Delivery Address:</p>
                          <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                          <p className="text-sm text-gray-600">Payment: {order.paymentMethod}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Select 
                          value={order.status} 
                          onValueChange={(value) => updateOrderMutation.mutate({ orderId: order.id, status: value })}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="packed">Packed</SelectItem>
                            <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="rounded-xl border-blue-200 hover:bg-blue-50"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message Customer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Product Catalog Management
                  <Button 
                    onClick={() => setShowAddProduct(true)}
                    className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 rounded-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product: SellerProduct) => (
                    <Card key={product.id} className={`border-2 ${product.isActive ? 'border-green-200' : 'border-gray-200'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Badge className={product.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Switch
                            checked={product.isActive}
                            onCheckedChange={(checked) => toggleProductMutation.mutate({ id: product.id, isActive: checked })}
                          />
                        </div>
                        <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-xl">{formatCurrency(product.price)}</span>
                          <Badge variant="outline">{product.category}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">Stock: {product.stockQuantity} units</p>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" className="flex-1 rounded-xl">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 rounded-xl">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Store Profile Tab */}
          <TabsContent value="store" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Store Profile & Settings
                  <Button 
                    onClick={() => setShowStoreEdit(true)}
                    className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 rounded-xl"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Store
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-lg mb-4">Store Information</h3>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Store Name</Label>
                          <p className="text-gray-900">{store?.name || "Not set"}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Description</Label>
                          <p className="text-gray-900">{store?.description || "Not set"}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Store Type</Label>
                          <p className="text-gray-900 capitalize">{store?.type || "Not set"}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Address</Label>
                          <p className="text-gray-900">{store?.address || "Not set"}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg mb-4">Contact Information</h3>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Phone</Label>
                          <p className="text-gray-900">{store?.phone || "Not set"}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Email</Label>
                          <p className="text-gray-900">{store?.email || "Not set"}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Business Hours</Label>
                          <p className="text-gray-900">{store?.businessHours || "Not set"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-lg mb-4">Delivery Settings</h3>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Delivery Time</Label>
                          <p className="text-gray-900">{store?.deliveryTime || "Not set"}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Delivery Fee</Label>
                          <p className="text-gray-900">{formatCurrency(store?.deliveryFee || 0)}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg mb-4">Store Badges</h3>
                      <div className="flex flex-wrap gap-2">
                        {store?.badges?.map((badge: string, index: number) => (
                          <Badge key={index} className="bg-blue-100 text-blue-700">
                            {badge}
                          </Badge>
                        )) || <p className="text-gray-500">No badges earned yet</p>}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg mb-4">Performance</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Rating</span>
                          <span className="font-medium">{store?.rating || 0}/5.0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Reviews</span>
                          <span className="font-medium">{store?.reviewCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200/50">
              <CardHeader>
                <CardTitle>Analytics & Performance Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Orders</p>
                          <p className="text-2xl font-bold">{orders.length}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Revenue</p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(orders.reduce((sum: number, order: Order) => sum + order.total, 0))}
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Avg Order Value</p>
                          <p className="text-2xl font-bold">
                            {orders.length > 0 
                              ? formatCurrency(orders.reduce((sum: number, order: Order) => sum + order.total, 0) / orders.length)
                              : "₹0"
                            }
                          </p>
                        </div>
                        <Target className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-8">
                  <h3 className="font-bold text-lg mb-4">Sales by Category</h3>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <p className="text-gray-600">Detailed analytics charts coming soon...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs content would go here... */}
          <TabsContent value="customers" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200/50">
              <CardHeader>
                <CardTitle>Customer Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Customer management features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200/50">
              <CardHeader>
                <CardTitle>Payments & Settlements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Payment management features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200/50">
              <CardHeader>
                <CardTitle>Support & Help Center</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-3">Contact Support</h3>
                      <div className="space-y-3">
                        <Button className="w-full bg-green-600 hover:bg-green-700 rounded-xl">
                          <Phone className="h-4 w-4 mr-2" />
                          Call Support: 1800-XXX-XXXX
                        </Button>
                        <Button variant="outline" className="w-full rounded-xl">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Live Chat
                        </Button>
                        <Button variant="outline" className="w-full rounded-xl">
                          <Mail className="h-4 w-4 mr-2" />
                          Email Support
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-3">Resources</h3>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start rounded-xl">
                          <FileText className="h-4 w-4 mr-2" />
                          Seller Guidelines
                        </Button>
                        <Button variant="outline" className="w-full justify-start rounded-xl">
                          <Download className="h-4 w-4 mr-2" />
                          Tutorial Videos
                        </Button>
                        <Button variant="outline" className="w-full justify-start rounded-xl">
                          <Users className="h-4 w-4 mr-2" />
                          Seller Community
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Product Modal */}
        <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="product-name">Product Name</Label>
                <Input
                  id="product-name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <Label htmlFor="product-description">Description</Label>
                <Textarea
                  id="product-description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Enter product description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product-category">Category</Label>
                  <Select value={productForm.category} onValueChange={(value) => setProductForm({ ...productForm, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Grocery">Grocery</SelectItem>
                      <SelectItem value="Fruits">Fruits</SelectItem>
                      <SelectItem value="Vegetables">Vegetables</SelectItem>
                      <SelectItem value="Dairy">Dairy</SelectItem>
                      <SelectItem value="Snacks">Snacks</SelectItem>
                      <SelectItem value="Beverages">Beverages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="product-price">Price (₹)</Label>
                  <Input
                    id="product-price"
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="product-stock">Stock Quantity</Label>
                <Input
                  id="product-stock"
                  type="number"
                  value={productForm.stockQuantity}
                  onChange={(e) => setProductForm({ ...productForm, stockQuantity: Number(e.target.value) })}
                  placeholder="100"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={productForm.isActive}
                  onCheckedChange={(checked) => setProductForm({ ...productForm, isActive: checked })}
                />
                <Label>Set as active product</Label>
              </div>
            </div>
            <div className="flex space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddProduct(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => addProductMutation.mutate(productForm)}
                disabled={addProductMutation.isPending}
                className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
              >
                {addProductMutation.isPending ? "Adding..." : "Add Product"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Store Modal */}
        <Dialog open={showStoreEdit} onOpenChange={setShowStoreEdit}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Store Profile</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="store-name">Store Name</Label>
                <Input
                  id="store-name"
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  placeholder="Enter store name"
                />
              </div>
              <div>
                <Label htmlFor="store-type">Store Type</Label>
                <Select value={storeForm.type} onValueChange={(value) => setStoreForm({ ...storeForm, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kirana">Kirana Store</SelectItem>
                    <SelectItem value="pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="fashion">Fashion</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="books">Books</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="store-description">Description</Label>
                <Textarea
                  id="store-description"
                  value={storeForm.description}
                  onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                  placeholder="Enter store description"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="store-address">Address</Label>
                <Textarea
                  id="store-address"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                  placeholder="Enter store address"
                />
              </div>
              <div>
                <Label htmlFor="store-phone">Phone</Label>
                <Input
                  id="store-phone"
                  value={storeForm.phone}
                  onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="store-email">Email</Label>
                <Input
                  id="store-email"
                  value={storeForm.email}
                  onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="business-hours">Business Hours</Label>
                <Input
                  id="business-hours"
                  value={storeForm.businessHours}
                  onChange={(e) => setStoreForm({ ...storeForm, businessHours: e.target.value })}
                  placeholder="e.g., 7:00 AM - 10:00 PM"
                />
              </div>
              <div>
                <Label htmlFor="delivery-time">Delivery Time</Label>
                <Input
                  id="delivery-time"
                  value={storeForm.deliveryTime}
                  onChange={(e) => setStoreForm({ ...storeForm, deliveryTime: e.target.value })}
                  placeholder="e.g., 15-30 min"
                />
              </div>
            </div>
            <div className="flex space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowStoreEdit(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => updateStoreMutation.mutate(storeForm)}
                disabled={updateStoreMutation.isPending}
                className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
              >
                {updateStoreMutation.isPending ? "Updating..." : "Update Store"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}