import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { 
  Store, Package, ShoppingCart, TrendingUp, Users, Settings, 
  Plus, Edit, Trash2, Upload, Camera, Star, MessageSquare, 
  Bell, Gift, Coins, Truck, Clock, BarChart3, FileText,
  Phone, Mail, MapPin, Calendar, DollarSign, Tag,
  Image as ImageIcon, RotateCcw, Save, Eye, Search,
  Download, Filter, RefreshCw, AlertCircle, CheckCircle,
  ArrowLeft, Building, Zap, Target, Crown, Award, Copy, Check, X
} from "lucide-react";

export default function VyronaMallConnectSellerDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [productFormData, setProductFormData] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
    imageUrl: "",
    variants: [],
    tags: [],
    enableGroupBuy: false,
    groupBuyMinQuantity: 2,
    groupBuyDiscount: 10
  });

  // Fetch seller store data
  const { data: storeData, isLoading: storeLoading } = useQuery({
    queryKey: ["/api/mallconnect/seller/store"],
    retry: false,
  });

  // Fetch seller products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/mallconnect/seller/products"],
    retry: false,
  });

  // Fetch seller orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/mallconnect/seller/orders"],
    retry: false,
  });

  // Fetch seller analytics
  const { data: analyticsData } = useQuery({
    queryKey: ["/api/mallconnect/seller/analytics"],
    retry: false,
  });

  // CSV bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: async (csvData: string) => {
      return await apiRequest("POST", "/api/mallconnect/seller/products/bulk-import", { csvData });
    },
    onSuccess: (response: any) => {
      toast({
        title: "Bulk Import Successful",
        description: `${response.imported} products imported successfully!`,
      });
      setShowBulkImportModal(false);
      setCsvData("");
      queryClient.invalidateQueries({ queryKey: ["/api/mallconnect/seller/products"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const store = storeData || {};
  const products = productsData || [];
  const orders = ordersData || [];
  const analytics = analyticsData || {};

  // Store profile update mutation
  const updateStoreMutation = useMutation({
    mutationFn: async (storeData: any) => {
      return await apiRequest("PUT", "/api/mallconnect/seller/store", storeData);
    },
    onSuccess: () => {
      toast({
        title: "Store Updated",
        description: "Your store profile has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mallconnect/seller/store"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update store profile",
        variant: "destructive",
      });
    },
  });

  // Product creation mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      return await apiRequest("POST", "/api/mallconnect/seller/products", productData);
    },
    onSuccess: () => {
      toast({
        title: "Product Added",
        description: "Product has been added to your catalog",
      });
      setShowProductModal(false);
      setProductFormData({
        name: "",
        category: "",
        price: "",
        description: "",
        imageUrl: "",
        variants: [],
        tags: [],
        enableGroupBuy: false,
        groupBuyMinQuantity: 2,
        groupBuyDiscount: 10
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mallconnect/seller/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Product Creation Failed",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  // Order status update mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number, status: string }) => {
      return await apiRequest("PUT", `/api/mallconnect/seller/orders/${orderId}`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mallconnect/seller/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const handleCreateProduct = () => {
    if (!productFormData.name || !productFormData.category || !productFormData.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createProductMutation.mutate({
      ...productFormData,
      price: Math.round(parseFloat(productFormData.price) * 100), // Convert to cents
      module: "VyronaMallConnect",
      storeId: store.id
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'packed': 'bg-purple-100 text-purple-800',
      'shipped': 'bg-orange-100 text-orange-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              <div className="flex items-center space-x-3">
                <Building className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">VyronaMallConnect</h1>
                  <p className="text-sm text-gray-600">Seller Dashboard</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Crown className="h-3 w-3 mr-1" />
                Mall Partner
              </Badge>
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-8 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="store">Store Profile</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Analytics Cards */}
              <Card className="border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Sales</p>
                      <p className="text-2xl font-bold text-gray-900">₹{analytics.totalSales || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Products</p>
                      <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Star className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Store Rating</p>
                      <p className="text-2xl font-bold text-gray-900">{store.rating || "4.8"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span>Recent Orders</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <ShoppingCart className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Order #{order.id}</p>
                          <p className="text-sm text-gray-600">{order.customerName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <p className="font-medium">₹{Math.round(order.totalAmount)}</p>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Store Profile Tab */}
          <TabsContent value="store">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Store className="h-5 w-5 text-blue-600" />
                    <span>Store Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input
                      id="storeName"
                      defaultValue={store.name}
                      placeholder="Enter store name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tagline">Store Tagline</Label>
                    <Input
                      id="tagline"
                      defaultValue={store.tagline}
                      placeholder="Your store's tagline"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Store Category</Label>
                    <Select defaultValue={store.category}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fashion">Fashion & Apparel</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="food">Food & Beverages</SelectItem>
                        <SelectItem value="beauty">Beauty & Personal Care</SelectItem>
                        <SelectItem value="home">Home & Living</SelectItem>
                        <SelectItem value="sports">Sports & Fitness</SelectItem>
                        <SelectItem value="books">Books & Stationery</SelectItem>
                        <SelectItem value="jewelry">Jewelry & Accessories</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="floorNumber">Floor Number</Label>
                    <Input
                      id="floorNumber"
                      defaultValue={store.floorNumber}
                      placeholder="e.g., Ground Floor, 1st Floor"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Store Description</Label>
                    <Textarea
                      id="description"
                      defaultValue={store.description}
                      placeholder="Describe your store and products"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Contact & Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Phone className="h-5 w-5 text-green-600" />
                    <span>Contact & Operating Hours</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Support Number</Label>
                    <Input
                      id="phone"
                      defaultValue={store.phone}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Store Email</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={store.email}
                      placeholder="store@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="manager">Store Manager Name</Label>
                    <Input
                      id="manager"
                      defaultValue={store.managerName}
                      placeholder="Manager's full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hours">Working Hours</Label>
                    <Input
                      id="hours"
                      defaultValue={store.workingHours || "10:00 AM - 10:00 PM"}
                      placeholder="e.g., 10:00 AM - 10:00 PM"
                    />
                  </div>

                  <Button 
                    className="w-full"
                    onClick={() => updateStoreMutation.mutate({
                      name: (document.getElementById('storeName') as HTMLInputElement)?.value,
                      tagline: (document.getElementById('tagline') as HTMLInputElement)?.value,
                      category: store.category,
                      floorNumber: (document.getElementById('floorNumber') as HTMLInputElement)?.value,
                      description: (document.getElementById('description') as HTMLTextAreaElement)?.value,
                      phone: (document.getElementById('phone') as HTMLInputElement)?.value,
                      email: (document.getElementById('email') as HTMLInputElement)?.value,
                      managerName: (document.getElementById('manager') as HTMLInputElement)?.value,
                      workingHours: (document.getElementById('hours') as HTMLInputElement)?.value,
                    })}
                    disabled={updateStoreMutation.isPending}
                  >
                    {updateStoreMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Store Profile
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Store Images & Branding */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ImageIcon className="h-5 w-5 text-purple-600" />
                    <span>Store Images & Branding</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo and Banner Upload */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="storeLogo">Store Logo</Label>
                      <div className="mt-2">
                        {store.logoUrl ? (
                          <div className="relative">
                            <img 
                              src={store.logoUrl} 
                              alt="Store Logo"
                              className="w-full h-32 object-contain bg-gray-50 rounded-lg border-2 border-gray-200"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                // Update store logo URL to empty
                                updateStoreMutation.mutate({ logoUrl: "" });
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 mb-3">Upload store logo</p>
                            <Input
                              type="text"
                              placeholder="Enter image URL (Google Drive or direct link)"
                              value={logoUrl}
                              onChange={(e) => setLogoUrl(e.target.value)}
                              className="mb-3"
                            />
                            <div className="text-xs text-gray-500 mb-3">
                              <p>Google Drive: Right-click → Share → "Anyone with link" → Copy</p>
                              <p>Direct URLs: PNG, JPG, WebP formats</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                if (logoUrl.trim()) {
                                  updateStoreMutation.mutate({ logoUrl: logoUrl.trim() });
                                  setLogoUrl("");
                                }
                              }}
                              disabled={!logoUrl.trim() || updateStoreMutation.isPending}
                            >
                              {updateStoreMutation.isPending ? "Uploading..." : "Set Logo"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="storeBanner">Store Banner</Label>
                      <div className="mt-2">
                        {store.bannerUrl ? (
                          <div className="relative">
                            <img 
                              src={store.bannerUrl} 
                              alt="Store Banner"
                              className="w-full h-32 object-cover bg-gray-50 rounded-lg border-2 border-gray-200"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                updateStoreMutation.mutate({ bannerUrl: "" });
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 mb-3">Upload store banner</p>
                            <Input
                              type="text"
                              placeholder="Enter banner image URL"
                              value={bannerUrl}
                              onChange={(e) => setBannerUrl(e.target.value)}
                              className="mb-3"
                            />
                            <div className="text-xs text-gray-500 mb-3">
                              <p>Recommended: 1200x400px</p>
                              <p>Google Drive or direct image URLs</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                if (bannerUrl.trim()) {
                                  updateStoreMutation.mutate({ bannerUrl: bannerUrl.trim() });
                                  setBannerUrl("");
                                }
                              }}
                              disabled={!bannerUrl.trim() || updateStoreMutation.isPending}
                            >
                              {updateStoreMutation.isPending ? "Uploading..." : "Set Banner"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Brand Colors */}
                  <div>
                    <Label>Brand Colors</Label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="primaryColor" className="text-xs">Primary Color</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Input
                            id="primaryColor"
                            type="color"
                            value={store.primaryColor || "#3B82F6"}
                            onChange={(e) => updateStoreMutation.mutate({ primaryColor: e.target.value })}
                            className="w-12 h-8 p-1 rounded"
                          />
                          <Input
                            type="text"
                            value={store.primaryColor || "#3B82F6"}
                            onChange={(e) => updateStoreMutation.mutate({ primaryColor: e.target.value })}
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="secondaryColor" className="text-xs">Secondary Color</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Input
                            id="secondaryColor"
                            type="color"
                            value={store.secondaryColor || "#8B5CF6"}
                            onChange={(e) => updateStoreMutation.mutate({ secondaryColor: e.target.value })}
                            className="w-12 h-8 p-1 rounded"
                          />
                          <Input
                            type="text"
                            value={store.secondaryColor || "#8B5CF6"}
                            onChange={(e) => updateStoreMutation.mutate({ secondaryColor: e.target.value })}
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Brand Typography */}
                  <div>
                    <Label>Brand Font</Label>
                    <Select 
                      value={store.brandFont || "Inter"} 
                      onValueChange={(value) => updateStoreMutation.mutate({ brandFont: value })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter (Modern)</SelectItem>
                        <SelectItem value="Roboto">Roboto (Clean)</SelectItem>
                        <SelectItem value="Poppins">Poppins (Friendly)</SelectItem>
                        <SelectItem value="Playfair Display">Playfair Display (Elegant)</SelectItem>
                        <SelectItem value="Montserrat">Montserrat (Professional)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Store Theme */}
                  <div>
                    <Label>Store Theme</Label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { name: "Modern", bg: "bg-gradient-to-r from-blue-500 to-purple-600", value: "modern" },
                        { name: "Elegant", bg: "bg-gradient-to-r from-gray-800 to-gray-600", value: "elegant" },
                        { name: "Vibrant", bg: "bg-gradient-to-r from-pink-500 to-orange-500", value: "vibrant" },
                        { name: "Minimalist", bg: "bg-gradient-to-r from-gray-200 to-gray-400", value: "minimalist" },
                        { name: "Luxury", bg: "bg-gradient-to-r from-yellow-600 to-yellow-800", value: "luxury" },
                        { name: "Fresh", bg: "bg-gradient-to-r from-green-400 to-blue-500", value: "fresh" }
                      ].map((theme) => (
                        <div
                          key={theme.value}
                          className={`relative rounded-lg p-4 cursor-pointer border-2 transition-all ${
                            store.theme === theme.value 
                              ? "border-blue-500 ring-2 ring-blue-200" 
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => updateStoreMutation.mutate({ theme: theme.value })}
                        >
                          <div className={`w-full h-8 ${theme.bg} rounded mb-2`}></div>
                          <p className="text-xs font-medium text-center">{theme.name}</p>
                          {store.theme === theme.value && (
                            <div className="absolute top-1 right-1">
                              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="h-2 w-2 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Product Catalog</h2>
                <p className="text-gray-600">Manage your store's product inventory</p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setShowBulkImportModal(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Import CSV
                </Button>
                <Button onClick={() => setShowProductModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: any) => (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-blue-600">
                        ₹{Math.round(product.price / 100)}
                      </span>
                      <Badge variant={product.inStock ? "default" : "secondary"}>
                        {product.inStock ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </div>

                    {product.enableGroupBuy && (
                      <div className="flex items-center space-x-1 text-xs text-purple-600 mb-3">
                        <Users className="h-3 w-3" />
                        <span>Group Buy Available</span>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Add Product Modal */}
            {showProductModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <CardTitle>Add New Product</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="productName">Product Name *</Label>
                        <Input
                          id="productName"
                          value={productFormData.name}
                          onChange={(e) => setProductFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter product name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="productCategory">Category *</Label>
                        <Select 
                          value={productFormData.category}
                          onValueChange={(value) => setProductFormData(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="clothing">Clothing</SelectItem>
                            <SelectItem value="electronics">Electronics</SelectItem>
                            <SelectItem value="accessories">Accessories</SelectItem>
                            <SelectItem value="footwear">Footwear</SelectItem>
                            <SelectItem value="home">Home & Decor</SelectItem>
                            <SelectItem value="beauty">Beauty</SelectItem>
                            <SelectItem value="sports">Sports</SelectItem>
                            <SelectItem value="books">Books</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="productPrice">Price (₹) *</Label>
                      <Input
                        id="productPrice"
                        type="number"
                        value={productFormData.price}
                        onChange={(e) => setProductFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="Enter price"
                      />
                    </div>

                    <div>
                      <Label htmlFor="productDescription">Description</Label>
                      <Textarea
                        id="productDescription"
                        value={productFormData.description}
                        onChange={(e) => setProductFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your product"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="productImageUrl">Image URL</Label>
                      <Input
                        id="productImageUrl"
                        type="text"
                        value={productFormData.imageUrl}
                        onChange={(e) => setProductFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                        placeholder="https://drive.google.com/file/d/your-file-id/view or direct image URL"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter a Google Drive link (make sure file is publicly viewable) or direct image URL (JPG, PNG, WebP)
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        💡 For Google Drive: Right-click image → Share → Change access to "Anyone with the link" → Copy link
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={productFormData.enableGroupBuy}
                        onCheckedChange={(checked) => setProductFormData(prev => ({ ...prev, enableGroupBuy: checked }))}
                      />
                      <Label>Enable Group Buying</Label>
                    </div>

                    {productFormData.enableGroupBuy && (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg">
                        <div>
                          <Label htmlFor="minQuantity">Min Quantity</Label>
                          <Input
                            id="minQuantity"
                            type="number"
                            value={productFormData.groupBuyMinQuantity}
                            onChange={(e) => setProductFormData(prev => ({ ...prev, groupBuyMinQuantity: parseInt(e.target.value) }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="discount">Discount (%)</Label>
                          <Input
                            id="discount"
                            type="number"
                            value={productFormData.groupBuyDiscount}
                            onChange={(e) => setProductFormData(prev => ({ ...prev, groupBuyDiscount: parseInt(e.target.value) }))}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-4">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setShowProductModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={handleCreateProduct}
                        disabled={createProductMutation.isPending}
                      >
                        {createProductMutation.isPending ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Product
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
                <p className="text-gray-600">Track and manage customer orders</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium">Order ID</th>
                        <th className="text-left p-4 font-medium">Customer</th>
                        <th className="text-left p-4 font-medium">Items</th>
                        <th className="text-left p-4 font-medium">Amount</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Date</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order: any) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="p-4 font-mono">#{order.id}</td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{order.customerName}</p>
                              <p className="text-sm text-gray-600">{order.customerEmail}</p>
                            </div>
                          </td>
                          <td className="p-4">{order.itemCount || 1} items</td>
                          <td className="p-4 font-medium">₹{Math.round(order.totalAmount)}</td>
                          <td className="p-4">
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Select
                                value={order.status}
                                onValueChange={(status) => updateOrderMutation.mutate({ orderId: order.id, status })}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="packed">Packed</SelectItem>
                                  <SelectItem value="shipped">Shipped</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Marketing Campaigns</h2>
                <p className="text-gray-600">Participate in mall-wide campaigns and create promotions</p>
              </div>

              {/* Active Campaigns */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    <span>Active Mall Campaigns</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Weekend Flash Sale</h3>
                        <Badge className="bg-yellow-100 text-yellow-800">Active</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Mall-wide 20% off campaign running this weekend
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Ends: Dec 25, 2024</span>
                        <Button size="sm" variant="outline">
                          Join Campaign
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Festival Premium Offers</h3>
                        <Badge className="bg-purple-100 text-purple-800">Coming Soon</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Premium brand collaboration for festival season
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Starts: Jan 1, 2025</span>
                        <Button size="sm" variant="outline">
                          Pre-Register
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Group Buy & Cross-Store Bundles */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span>Group Buy Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch defaultChecked />
                      <Label>Enable Group Buying for Store</Label>
                    </div>
                    
                    <div>
                      <Label>Default Group Size</Label>
                      <Select defaultValue="5">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 people</SelectItem>
                          <SelectItem value="3">3 people</SelectItem>
                          <SelectItem value="5">5 people</SelectItem>
                          <SelectItem value="10">10 people</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Group Discount (%)</Label>
                      <Input type="number" defaultValue="15" placeholder="Enter discount percentage" />
                    </div>

                    <Button className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      Save Group Buy Settings
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Gift className="h-5 w-5 text-green-600" />
                      <span>Cross-Store Bundles</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Create collaborative offers with neighboring stores
                    </p>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">Fastrack + Titan Bundle</p>
                            <p className="text-xs text-gray-600">Watch + Sunglasses = 15% off</p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Bundle
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Loyalty & Coupons */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    <span>Loyalty & Promotions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Coupon Generator</h4>
                      <div className="space-y-3">
                        <Input placeholder="Coupon Code (e.g., VYRONA15)" />
                        <Input type="number" placeholder="Discount %" />
                        <Input type="date" placeholder="Expiry Date" />
                        <Button size="sm" className="w-full">
                          Generate Coupon
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Auto Rewards</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Switch />
                          <Label className="text-sm">3rd purchase = ₹50 coupon</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch />
                          <Label className="text-sm">Buy 2+ = Free Shipping</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch />
                          <Label className="text-sm">₹500+ = 5% VyronaCoins</Label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Active Promotions</h4>
                      <div className="space-y-2">
                        <div className="p-2 bg-blue-50 rounded text-sm">
                          <p className="font-medium">WELCOME10</p>
                          <p className="text-gray-600">10% off first order</p>
                        </div>
                        <div className="p-2 bg-green-50 rounded text-sm">
                          <p className="font-medium">BULK20</p>
                          <p className="text-gray-600">20% off bulk orders</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Payments & Financial Reports</h2>
                <p className="text-gray-600">Track your earnings and payment settlements</p>
              </div>

              {/* Payment Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Earnings</p>
                        <p className="text-2xl font-bold text-gray-900">₹{analytics.totalEarnings || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Pending Payout</p>
                        <p className="text-2xl font-bold text-gray-900">₹{analytics.pendingPayout || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Coins className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">VyronaCoins Used</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.vyronaCoinsUsed || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Avg Order Value</p>
                        <p className="text-2xl font-bold text-gray-900">₹{analytics.avgOrderValue || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Methods Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">45%</p>
                      <p className="text-sm text-gray-600">UPI Payments</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">30%</p>
                      <p className="text-sm text-gray-600">VyronaCoins</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">20%</p>
                      <p className="text-sm text-gray-600">Cards</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">5%</p>
                      <p className="text-sm text-gray-600">Cash on Delivery</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payout Schedule */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payout Schedule</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium">Next Payout</p>
                        <p className="text-sm text-gray-600">Weekly settlement</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">₹2,340</p>
                        <p className="text-xs text-gray-500">Dec 25, 2024</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>UPI Settlements</span>
                        <span className="font-medium">Daily</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>VyronaCoins Reimbursement</span>
                        <span className="font-medium">Weekly</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>COD Collections</span>
                        <span className="font-medium">Weekly</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Download Reports</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Sales Report (This Month)
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Payout Statement
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Tax Summary
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      VyronaCoins Transactions
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Customer Engagement</h2>
                <p className="text-gray-600">Interact with customers and manage relationships</p>
              </div>

              {/* Customer Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Customers</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.totalCustomers || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Repeat Customers</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.repeatCustomers || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Star className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Avg Rating</p>
                        <p className="text-2xl font-bold text-gray-900">{store.rating || "4.8"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Customer Communication */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                      <span>Customer Chat</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">Order #1234 - Size Query</p>
                          <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                        </div>
                        <p className="text-sm text-gray-600">Customer asking about size availability...</p>
                        <p className="text-xs text-gray-500 mt-2">2 min ago</p>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">Order #1230 - Delivery Delay</p>
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pending</Badge>
                        </div>
                        <p className="text-sm text-gray-600">Notification about delivery timing...</p>
                        <p className="text-xs text-gray-500 mt-2">1 hour ago</p>
                      </div>
                    </div>

                    <Button className="w-full mt-4">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Open Chat Center
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="h-5 w-5 text-green-600" />
                      <span>Push Notifications</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Target Audience</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select audience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Customers</SelectItem>
                          <SelectItem value="past">Past Customers</SelectItem>
                          <SelectItem value="cart">Cart Abandoners</SelectItem>
                          <SelectItem value="vip">VIP Customers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Message</Label>
                      <Textarea 
                        placeholder="Enter your promotional message..."
                        rows={3}
                      />
                    </div>

                    <Button className="w-full">
                      <Bell className="h-4 w-4 mr-2" />
                      Send Notification
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Reviews & Ratings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                    <span>Customer Reviews</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex text-yellow-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className="h-4 w-4 fill-current" />
                            ))}
                          </div>
                          <span className="text-sm font-medium">Excellent Service!</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          "Great product quality and fast delivery. Will definitely order again!"
                        </p>
                        <p className="text-xs text-gray-500 mt-1">- Customer #1234 • 2 days ago</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Reply
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex text-yellow-400">
                            {[1, 2, 3, 4].map((star) => (
                              <Star key={star} className="h-4 w-4 fill-current" />
                            ))}
                            <Star className="h-4 w-4 text-gray-300" />
                          </div>
                          <span className="text-sm font-medium">Good but could be better</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          "Product was good but packaging could be improved."
                        </p>
                        <p className="text-xs text-gray-500 mt-1">- Customer #1235 • 1 week ago</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Reply
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-blue-900">Store Badges</h4>
                        <p className="text-sm text-blue-700">Your achievements and certifications</p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge className="bg-blue-100 text-blue-800">
                          <Award className="h-3 w-3 mr-1" />
                          Mall Verified
                        </Badge>
                        <Badge className="bg-green-100 text-green-800">
                          <Star className="h-3 w-3 mr-1" />
                          Customer Favorite
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Support & Help Center</h2>
                <p className="text-gray-600">Get assistance and access resources</p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-blue-200 hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Live Chat Support</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Get instant help from our support team
                    </p>
                    <Button className="w-full">
                      Start Chat
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-green-200 hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Phone className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Call Support</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Speak directly with our support team
                    </p>
                    <Button variant="outline" className="w-full">
                      +91-800-123-4567
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Email Ticket</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Submit a detailed support request
                    </p>
                    <Button variant="outline" className="w-full">
                      Create Ticket
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Mall Manager Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-orange-600" />
                    <span>Mall Manager Contact</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-semibold text-orange-900 mb-2">Phoenix MarketCity Manager</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-orange-600" />
                          <span>+91-987-654-3210</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-orange-600" />
                          <span>manager@phoenixmarketcity.com</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <span>Available: 9 AM - 6 PM</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">VyronaSeller Help Center</h4>
                      <div className="space-y-3">
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <FileText className="h-4 w-4 mr-2" />
                          Seller Guidelines
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <FileText className="h-4 w-4 mr-2" />
                          Payment Policies
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <FileText className="h-4 w-4 mr-2" />
                          Technical Support
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Knowledge Base */}
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-2">How do I update my product inventory?</h4>
                      <p className="text-sm text-gray-600">
                        Go to Products tab, select the product, and click Edit. You can bulk update via Excel upload in the Inventory section.
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-2">When will I receive my payouts?</h4>
                      <p className="text-sm text-gray-600">
                        UPI payments are settled daily, while VyronaCoins reimbursements and COD collections are processed weekly every Monday.
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-2">How do I participate in mall campaigns?</h4>
                      <p className="text-sm text-gray-600">
                        Check the Campaigns tab for active mall-wide promotions. Click "Join Campaign" to participate and set your discount levels.
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-2">Can I offer group buying for my products?</h4>
                      <p className="text-sm text-gray-600">
                        Yes! Enable group buying in your product settings or store preferences. Set minimum quantities and group discounts.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* CSV Bulk Import Modal */}
        {showBulkImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  <span>Bulk Import Products via CSV</span>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Upload multiple products at once using CSV format. Download sample template or paste CSV data directly.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* CSV Format Instructions */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">CSV Format Requirements:</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Required columns:</strong> name, category, price, description</p>
                    <p><strong>Optional columns:</strong> imageUrl, inStock, enableGroupBuy, groupBuyMinQuantity, groupBuyDiscount</p>
                    <p><strong>Price format:</strong> Enter in rupees (e.g., 599 for ₹599)</p>
                    <p><strong>Image URLs:</strong> Use Google Drive links (make file publicly viewable) or direct image URLs</p>
                    <p><strong>Boolean values:</strong> Use true/false for inStock and enableGroupBuy</p>
                  </div>
                  <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                    <p className="text-xs text-blue-700 font-medium mb-1">💡 Google Drive Setup:</p>
                    <p className="text-xs text-blue-700">Right-click image in Drive → Share → Change access to "Anyone with the link" → Copy link</p>
                  </div>
                </div>

                {/* Sample CSV Template */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Sample CSV Template:</h4>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const sampleCSV = `name,category,price,description,imageUrl,inStock,enableGroupBuy,groupBuyMinQuantity,groupBuyDiscount
Wireless Headphones,Electronics,2999,Premium wireless headphones with noise cancellation,https://drive.google.com/file/d/1abc123def456/view,true,true,2,10
Smart Watch,Electronics,8999,Fitness tracking smartwatch with heart rate monitor,https://example.com/smartwatch.jpg,true,false,1,0
Organic Coffee Beans,Food & Beverages,899,Premium organic coffee beans - 500g pack,https://drive.google.com/file/d/1xyz789uvw012/view,true,true,5,15`;
                        navigator.clipboard.writeText(sampleCSV);
                        toast({
                          title: "Template Copied",
                          description: "Sample CSV template copied to clipboard!",
                        });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy Template
                    </Button>
                  </div>
                  <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`name,category,price,description,imageUrl,inStock,enableGroupBuy,groupBuyMinQuantity,groupBuyDiscount
Wireless Headphones,Electronics,2999,Premium wireless headphones with noise cancellation,,true,true,2,10
Smart Watch,Electronics,8999,Fitness tracking smartwatch with heart rate monitor,,true,false,1,0
Organic Coffee Beans,Food & Beverages,899,Premium organic coffee beans - 500g pack,,true,true,5,15`}
                  </pre>
                </div>

                {/* File Upload Section */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Upload CSV File</Label>
                    <div className="mt-2">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const csv = event.target?.result as string;
                              setCsvData(csv);
                            };
                            reader.readAsText(file);
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  </div>

                  <div className="text-center text-gray-500">
                    <span>OR</span>
                  </div>

                  {/* Manual CSV Input */}
                  <div>
                    <Label htmlFor="csvData" className="text-base font-semibold">Paste CSV Data</Label>
                    <textarea
                      id="csvData"
                      value={csvData}
                      onChange={(e) => setCsvData(e.target.value)}
                      placeholder="Paste your CSV data here..."
                      className="mt-2 w-full h-40 p-3 border border-gray-300 rounded-lg text-sm font-mono"
                    />
                  </div>

                  {/* Preview Section */}
                  {csvData && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Preview:</h4>
                      <div className="text-sm text-green-800">
                        <p>CSV data detected - {csvData.split('\n').length - 1} products ready for import</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowBulkImportModal(false);
                      setCsvData("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      if (!csvData.trim()) {
                        toast({
                          title: "No Data",
                          description: "Please upload a CSV file or paste CSV data",
                          variant: "destructive",
                        });
                        return;
                      }
                      bulkImportMutation.mutate(csvData);
                    }}
                    disabled={bulkImportMutation.isPending || !csvData.trim()}
                  >
                    {bulkImportMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Products
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}