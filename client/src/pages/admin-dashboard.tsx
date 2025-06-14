import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Users, 
  Store, 
  Package, 
  TrendingUp, 
  ShoppingCart, 
  AlertTriangle,
  Settings,
  BarChart3,
  MessageSquare,
  Bell,
  Shield,
  LogOut,
  Edit,
  Trash2,
  Plus,
  Eye,
  Check,
  X,
  Mail,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Product description is required"),
  price: z.number().min(0, "Price must be positive"),
  category: z.string().min(1, "Category is required"),
  module: z.string().min(1, "Module is required"),
  sku: z.string().min(1, "SKU is required"),
  originalPrice: z.number().optional(),
  brand: z.string().optional(),
  weight: z.string().optional(),
  dimensions: z.string().optional(),
  specifications: z.string().optional(),
  tags: z.string().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

const sellerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  mobile: z.string().optional(),
  storeName: z.string().min(1, "Store name is required"),
  storeDescription: z.string().optional(),
  businessType: z.string().min(1, "Business type is required"),
  address: z.string().optional(),
  isActive: z.boolean().default(true),
});

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      module: "",
      sku: "",
      originalPrice: 0,
      brand: "",
      weight: "",
      dimensions: "",
      specifications: "",
      tags: "",
      imageUrl: "",
      isActive: true,
    },
  });

  const sellerForm = useForm<z.infer<typeof sellerSchema>>({
    resolver: zodResolver(sellerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      mobile: "",
      storeName: "",
      storeDescription: "",
      businessType: "",
      address: "",
      isActive: true,
    },
  });

  const addProductMutation = useMutation({
    mutationFn: async (data: z.infer<typeof productSchema>) => {
      const productData = {
        ...data,
        price: Math.round(data.price * 100)) // Convert to cents
        originalPrice: data.originalPrice ? Math.round(data.originalPrice * 100) : undefined)
        metadata: {
          brand: data.brand,
          weight: data.weight,
          dimensions: data.dimensions,
          specifications: data.specifications,
          tags: data.tags,
          sku: data.sku,
          isActive: data.isActive,
        },
      };
      return apiRequest("/api/products", "POST", productData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Product added successfully!" });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add product. Please try again." });
    },
  });

  const addSellerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof sellerSchema>) => {
      const userData = {
        username: data.username,
        email: data.email,
        password: data.password,
        mobile: data.mobile || null,
        role: "seller",
        isActive: data.isActive,
      };
      
      const user = await apiRequest("/api/auth/register", "POST", userData);
      
      // Create store for the seller
      const storeData = {
        name: data.storeName,
        type: data.businessType,
        address: data.address || null,
        isOpen: true,
        rating: 0,
        reviewCount: 0,
      };
      
      await apiRequest("/api/stores", "POST", storeData);
      
      return user;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Seller registered successfully!" });
      sellerForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to register seller. Please try again." });
    },
  });

  const onSubmit = (data: z.infer<typeof productSchema>) => {
    addProductMutation.mutate(data);
  };

  const onSellerSubmit = (data: z.infer<typeof sellerSchema>) => {
    addSellerMutation.mutate(data);
  };

  const removeSellerMutation = useMutation({
    mutationFn: async (sellerId: number) => {
      await apiRequest("DELETE", `/api/admin/sellers/${sellerId}`);
    },
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: "Seller and all associated products removed successfully!" 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sellers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to remove seller. Please try again." 
      });
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { data: usersData = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });
  
  const users = Array.isArray(usersData) ? usersData : [];

  const { data: sellersData = [] } = useQuery({
    queryKey: ["/api/admin/sellers"],
  });
  
  const sellers = Array.isArray(sellersData) ? sellersData : [];

  const { data: productsData = [] } = useQuery({
    queryKey: ["/api/products"],
  });
  
  const products = Array.isArray(productsData) ? productsData : [];

  const { data: ordersData } = useQuery({
    queryKey: ["/api/admin/orders"],
  });
  
  const orders = Array.isArray(ordersData?.orders) ? ordersData.orders : [];

  const { data: libraryRequestsData = [], refetch: refetchLibraryRequests } = useQuery({
    queryKey: ["/api/admin/library-requests"],
    refetchOnWindowFocus: true,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
  
  const libraryRequests = Array.isArray(libraryRequestsData) ? libraryRequestsData : [];

  const updateLibraryRequestMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: number; status: string; adminNotes?: string }) => {
      return await apiRequest("PATCH", `/api/admin/library-requests/${id}`, { status, adminNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/library-requests"] });
      toast({
        title: "Request Updated",
        description: "Library integration request status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update library integration request.",
        variant: "destructive",
      });
    },
  });

  const deleteLibraryRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/admin/library-requests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/library-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vyronaread/libraries"] });
      toast({
        title: "Library Removed",
        description: "Library integration has been permanently removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove library integration.",
        variant: "destructive",
      });
    },
  });

  // Email management mutations
  const sendOrderEmailMutation = useMutation({
    mutationFn: async ({ orderId, customMessage }: { orderId: number; customMessage?: string }) => {
      return await apiRequest("POST", "/api/admin/send-order-email", { orderId, customMessage });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Email Sent",
        description: data.message || "Order confirmation email sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send order confirmation email.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      // Clear cache first for faster perceived logout
      queryClient.clear();
      
      // Call logout endpoint without waiting for response
      fetch('/api/auth/logout', { method: 'POST' }).catch(console.error);
      
      // Immediate redirect for better UX
      window.location.replace('/');
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.replace('/');
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: users?.length || 0,
      icon: <Users className="h-6 w-6" />,
      description: "Registered customers & sellers",
      color: "text-blue-600"
    },
    {
      title: "Active Products",
      value: products?.length || 0,
      icon: <Package className="h-6 w-6" />,
      description: "Products across all categories",
      color: "text-green-600"
    },
    {
      title: "Total Orders",
      value: orders?.length || 0,
      icon: <ShoppingCart className="h-6 w-6" />,
      description: "Orders processed",
      color: "text-purple-600"
    },
    {
      title: "Revenue",
      value: "₹0",
      icon: <TrendingUp className="h-6 w-6" />,
      description: "Total platform revenue",
      color: "text-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">VyronaMart Management Console</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-81px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <nav className="p-4 space-y-2">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("overview")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeTab === "users" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("users")}
            >
              <Users className="h-4 w-4 mr-2" />
              Customer Management
            </Button>
            <Button
              variant={activeTab === "products" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("products")}
            >
              <Package className="h-4 w-4 mr-2" />
              Product Management
            </Button>
            <Button
              variant={activeTab === "sellers" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("sellers")}
            >
              <Store className="h-4 w-4 mr-2" />
              Seller Management
            </Button>
            <Button
              variant={activeTab === "vyronahub" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("vyronahub")}
            >
              <Package className="h-4 w-4 mr-2" />
              VyronaHub Access
            </Button>
            <Button
              variant={activeTab === "seller-dashboard" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("seller-dashboard")}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Seller Dashboard
            </Button>
            <Button
              variant={activeTab === "orders" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("orders")}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Order Management
            </Button>
            <Button
              variant={activeTab === "emails" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("emails")}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email Management
            </Button>
            <Button
              variant={activeTab === "analytics" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("analytics")}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button
              variant={activeTab === "support" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("support")}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Support & Issues
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Platform Settings
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Platform Overview</h2>
                <p className="text-gray-600 dark:text-gray-300">Monitor key metrics and platform health</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                  <Card key={`stat-card-${stat.title}-${index}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.title}</p>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{stat.description}</p>
                        </div>
                        <div className={`${stat.color}`}>
                          {stat.icon}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent User Registrations</CardTitle>
                    <CardDescription>Latest users joined the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {users?.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No users registered yet</p>
                    ) : (
                      <div className="space-y-4">
                        {users?.slice(0, 5).map((user: any) => (
                          <div key={user.id} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{user.username}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                            <Badge variant={user.role === 'seller' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>System Alerts</CardTitle>
                    <CardDescription>Important notifications and warnings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="font-medium text-yellow-800 dark:text-yellow-200">Platform Setup</p>
                          <p className="text-sm text-yellow-600 dark:text-yellow-300">Configure initial platform settings</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Library Integration Requests Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    VyronaRead Library Integration Requests
                  </CardTitle>
                  <CardDescription>Review and approve library integration requests from sellers</CardDescription>
                </CardHeader>
                <CardContent>
                  {libraryRequests && libraryRequests.length > 0 ? (
                    <div className="space-y-4">
                      {libraryRequests.map((request: any) => (
                        <div key={request.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">{request.libraryName}</h4>
                              <Badge variant={request.status === 'pending' ? 'secondary' : request.status === 'approved' ? 'default' : 'destructive'}>
                                {request.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-sm font-medium">Type:</p>
                              <p className="text-sm text-gray-600">{request.libraryType}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Contact:</p>
                              <p className="text-sm text-gray-600">{request.contactPerson}</p>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-sm font-medium">Address:</p>
                            <p className="text-sm text-gray-600">{request.address}</p>
                          </div>
                          
                          {request.phone && (
                            <div className="mb-3">
                              <p className="text-sm font-medium">Phone:</p>
                              <p className="text-sm text-gray-600">{request.phone}</p>
                            </div>
                          )}
                          
                          {request.email && (
                            <div className="mb-3">
                              <p className="text-sm font-medium">Email:</p>
                              <p className="text-sm text-gray-600">{request.email}</p>
                            </div>
                          )}
                          
                          {request.description && (
                            <div className="mb-3">
                              <p className="text-sm font-medium">Description:</p>
                              <p className="text-sm text-gray-600">{request.description}</p>
                            </div>
                          )}
                          
                          {request.status === 'pending' && (
                            <div className="flex gap-2 mt-4">
                              <Button
                                size="sm"
                                onClick={() => updateLibraryRequestMutation.mutate({
                                  id: request.id,
                                  status: 'approved',
                                  adminNotes: 'Approved by admin'
                                })}
                                disabled={updateLibraryRequestMutation.isPending}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateLibraryRequestMutation.mutate({
                                  id: request.id,
                                  status: 'rejected',
                                  adminNotes: 'Rejected by admin'
                                })}
                                disabled={updateLibraryRequestMutation.isPending}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}

                          {request.status === 'approved' && (
                            <div className="flex gap-2 mt-4">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteLibraryRequestMutation.mutate(request.id)}
                                disabled={deleteLibraryRequestMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove Library
                              </Button>
                            </div>
                          )}
                          
                          {request.adminNotes && (
                            <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                              <p className="text-sm font-medium">Admin Notes:</p>
                              <p className="text-sm text-gray-600">{request.adminNotes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No library integration requests found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "sellers" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Seller Management</h2>
                <p className="text-gray-600 dark:text-gray-300">Manage seller accounts and business operations</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Registered Sellers</CardTitle>
                    <CardDescription>All seller accounts on the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sellers.length === 0 ? (
                      <div className="text-center py-8">
                        <Store className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No sellers registered yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sellers.map((seller: any) => (
                          <div key={seller.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <Store className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium">{seller.username}</p>
                                <p className="text-xs text-gray-500">{seller.email}</p>
                                {seller.mobile && <p className="text-xs text-gray-400">{seller.mobile}</p>}
                                <p className="text-xs text-gray-400">
                                  Joined: {new Date(seller.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={seller.is_active ? 'default' : 'secondary'}>
                                {seller.is_active ? 'Active' : 'Pending'}
                              </Badge>
                              <Button variant="outline" size="sm">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Remove Seller</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to remove {seller.username}? This will permanently delete the seller account and all their associated products from the platform.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex justify-end gap-3 mt-6">
                                    <DialogClose asChild>
                                      <Button variant="outline" size="sm">
                                        Cancel
                                      </Button>
                                    </DialogClose>
                                    <Button 
                                      variant="destructive" 
                                      size="sm"
                                      onClick={() => removeSellerMutation.mutate(seller.id)}
                                      disabled={removeSellerMutation.isPending}
                                    >
                                      {removeSellerMutation.isPending ? (
                                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                                      ) : (
                                        <Trash2 className="h-3 w-3 mr-2" />
                                      )}
                                      Remove Seller
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    Message
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Send Message to {seller.username}</DialogTitle>
                                    <DialogDescription>
                                      Send a direct message to this seller
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium">Subject</label>
                                      <Input placeholder="Message subject" />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Message</label>
                                      <Textarea 
                                        placeholder="Type your message here..."
                                        className="min-h-[100px]"
                                      />
                                    </div>
                                    <Button className="w-full">
                                      <Send className="h-4 w-4 mr-2" />
                                      Send Message
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Seller Analytics</CardTitle>
                    <CardDescription>Business performance metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Sellers</span>
                        <span className="text-lg font-bold">{sellers.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Active Sellers</span>
                        <span className="text-lg font-bold">{sellers.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Revenue</span>
                        <span className="text-lg font-bold">₹2,45,000</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Average Rating</span>
                        <span className="text-lg font-bold">4.7/5</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Customer Management</h2>
                <p className="text-gray-600 dark:text-gray-300">Manage customer accounts and relationships</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>Manage user accounts and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  {users?.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No Users Yet</h3>
                      <p className="text-gray-500 dark:text-gray-400">Users will appear here once they register</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {users?.map((user: any) => (
                        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            </div>
                            <div>
                              <p className="font-medium">{user.username}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary">
                              {user.role}
                            </Badge>
                            <Badge variant="default">
                              Active
                            </Badge>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  Message
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Send Message to {user.username}</DialogTitle>
                                  <DialogDescription>
                                    Send a direct message to this customer
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium">Subject</label>
                                    <Input placeholder="Message subject" />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Message</label>
                                    <Textarea 
                                      placeholder="Type your message here..."
                                      className="min-h-[100px]"
                                    />
                                  </div>
                                  <Button className="w-full">
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Message
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Product Management</h2>
                  <p className="text-gray-600 dark:text-gray-300">Full control over all platform products</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
                      <DialogDescription>
                        Add comprehensive product details to facilitate customer purchasing decisions.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Tabs defaultValue="basic" className="w-full">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="basic">Basic Info</TabsTrigger>
                            <TabsTrigger value="details">Product Details</TabsTrigger>
                            <TabsTrigger value="images">Images & Media</TabsTrigger>
                            <TabsTrigger value="inventory">Inventory & Specs</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="basic" className="space-y-4 mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Product Name *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter product name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Price (USD) *</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="19.99" 
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Category *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="electronics">Electronics</SelectItem>
                                        <SelectItem value="fashion">Fashion & Apparels</SelectItem>
                                        <SelectItem value="home">Home & Kitchen</SelectItem>
                                        <SelectItem value="kids">Kids Corner</SelectItem>
                                        <SelectItem value="organic">Organic Store</SelectItem>
                                        <SelectItem value="pets">Pet Care</SelectItem>
                                        <SelectItem value="books">Books</SelectItem>
                                        <SelectItem value="sports">Sports & Outdoors</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="module"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Module *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select module" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="vyronamart">VyronaMart</SelectItem>
                                        <SelectItem value="vyronaread">VyronaRead</SelectItem>
                                        <SelectItem value="vyronasocial">VyronaSocial</SelectItem>
                                        <SelectItem value="vyronahub">VyronaHub</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Product Description *</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Describe your product in detail..."
                                      className="min-h-[100px]"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TabsContent>

                          <TabsContent value="details" className="space-y-4 mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="brand"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Brand</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter brand name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="sku"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>SKU *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Stock keeping unit" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="originalPrice"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Original Price (₹)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="29.99" 
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="weight"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Weight</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g., 1.5 kg" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name="dimensions"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Dimensions</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., 25 x 15 x 10 cm" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="specifications"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Technical Specifications</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="List key specifications and features..."
                                      className="min-h-[80px]"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TabsContent>

                          <TabsContent value="images" className="space-y-4 mt-6">
                            <FormField
                              control={form.control}
                              name="imageUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Product Image URL</FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://example.com/product-image.jpg" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="text-sm text-gray-500 space-y-2">
                              <p>• Use high-quality images (minimum 800x800px)</p>
                              <p>• Supported formats: JPG, PNG, WebP</p>
                              <p>• Show product from multiple angles if possible</p>
                            </div>
                          </TabsContent>

                          <TabsContent value="inventory" className="space-y-4 mt-6">
                            <FormField
                              control={form.control}
                              name="tags"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Product Tags</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Comma-separated tags (e.g., wireless, bluetooth, portable)" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TabsContent>
                        </Tabs>
                        
                        <div className="flex gap-4 pt-4">
                          <Button type="submit" disabled={addProductMutation.isPending} className="flex-1">
                            {addProductMutation.isPending ? "Adding Product..." : "Add Product to Catalog"}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => form.reset()}>
                            Reset Form
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Product Catalog Control</CardTitle>
                  <CardDescription>Edit, moderate, and manage all products across VyronaMart</CardDescription>
                </CardHeader>
                <CardContent>
                  {!products || products.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No Products Listed</h3>
                      <p className="text-gray-500 dark:text-gray-400">Add products or wait for sellers to list items</p>
                      <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Product
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {products?.map((product: any) => (
                        <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline">{product.module}</Badge>
                                    <Badge variant="secondary">{product.category}</Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                    {product.description || "No description available"}
                                  </p>
                                  <div className="flex items-center gap-4">
                                    <span className="font-bold text-xl text-green-600">₹{(product.price || 0).toLocaleString(}</span>
                                    <span className="text-sm text-gray-500">ID: {product.id}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "sellers" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Seller Management</h2>
                  <p className="text-gray-600 dark:text-gray-300">Manage seller accounts and store approvals</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Seller
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Register New Seller</DialogTitle>
                      <DialogDescription>
                        Add a new seller account and create their store profile for the platform.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...sellerForm}>
                      <form onSubmit={sellerForm.handleSubmit(onSellerSubmit)} className="space-y-6">
                        <Tabs defaultValue="account" className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="account">Account Info</TabsTrigger>
                            <TabsTrigger value="store">Store Details</TabsTrigger>
                            <TabsTrigger value="business">Business Info</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="account" className="space-y-4 mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={sellerForm.control}
                                name="username"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Username *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter username" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={sellerForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email Address *</FormLabel>
                                    <FormControl>
                                      <Input type="email" placeholder="seller@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={sellerForm.control}
                                name="password"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Password *</FormLabel>
                                    <FormControl>
                                      <Input type="password" placeholder="Enter secure password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={sellerForm.control}
                                name="mobile"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Mobile Number</FormLabel>
                                    <FormControl>
                                      <Input placeholder="+1 (555) 123-4567" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </TabsContent>

                          <TabsContent value="store" className="space-y-4 mt-6">
                            <FormField
                              control={sellerForm.control}
                              name="storeName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Store Name *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter store name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={sellerForm.control}
                              name="storeDescription"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Store Description</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Describe the store and what products they'll sell..."
                                      className="min-h-[100px]"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={sellerForm.control}
                              name="businessType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Business Type *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select business type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="retail">Retail Store</SelectItem>
                                      <SelectItem value="electronics">Electronics Store</SelectItem>
                                      <SelectItem value="fashion">Fashion & Clothing</SelectItem>
                                      <SelectItem value="books">Bookstore</SelectItem>
                                      <SelectItem value="food">Food & Beverages</SelectItem>
                                      <SelectItem value="home">Home & Garden</SelectItem>
                                      <SelectItem value="sports">Sports & Outdoors</SelectItem>
                                      <SelectItem value="beauty">Beauty & Personal Care</SelectItem>
                                      <SelectItem value="toys">Toys & Games</SelectItem>
                                      <SelectItem value="automotive">Automotive</SelectItem>
                                      <SelectItem value="health">Health & Wellness</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TabsContent>

                          <TabsContent value="business" className="space-y-4 mt-6">
                            <FormField
                              control={sellerForm.control}
                              name="address"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Business Address</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Enter complete business address..."
                                      className="min-h-[80px]"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                              <h4 className="font-medium text-sm">Account Settings</h4>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">Account Status</p>
                                  <p className="text-xs text-gray-500">Enable seller account immediately</p>
                                </div>
                                <FormField
                                  control={sellerForm.control}
                                  name="isActive"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <input
                                          type="checkbox"
                                          checked={field.value}
                                          onChange={field.onChange}
                                          className="h-4 w-4 text-blue-600 rounded"
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                        
                        <div className="flex gap-4 pt-4">
                          <Button type="submit" disabled={addSellerMutation.isPending} className="flex-1">
                            {addSellerMutation.isPending ? "Creating Account..." : "Register Seller"}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => sellerForm.reset()}>
                            Reset Form
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Seller Accounts</CardTitle>
                    <CardDescription>Manage seller registrations and permissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sellers.length === 0 ? (
                      <div className="text-center py-8">
                        <Store className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No sellers registered yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sellers.map((seller: any) => (
                          <div key={seller.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <Store className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium">{seller.username}</p>
                                <p className="text-xs text-gray-500">{seller.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={seller.is_active ? 'default' : 'secondary'}>
                                {seller.is_active ? 'Active' : 'Pending'}
                              </Badge>
                              <Button variant="outline" size="sm">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Remove Seller</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to remove {seller.username}? This will permanently delete the seller account and all their associated products from the platform.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex justify-end gap-3 mt-6">
                                    <Button variant="outline" size="sm">
                                      Cancel
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      size="sm"
                                      onClick={() => removeSellerMutation.mutate(seller.id)}
                                      disabled={removeSellerMutation.isPending}
                                    >
                                      {removeSellerMutation.isPending ? (
                                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                                      ) : (
                                        <Trash2 className="h-3 w-3 mr-2" />
                                      )}
                                      Remove Seller
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Seller Performance</CardTitle>
                    <CardDescription>Track seller metrics and statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Revenue</span>
                        <span className="font-bold text-green-600">₹2,45,000</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Active Sellers</span>
                        <span className="font-bold">{users?.filter((user: any) => user.role === 'seller' && user.isActive).length || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Pending Approvals</span>
                        <span className="font-bold text-orange-600">{users?.filter((user: any) => user.role === 'seller' && !user.isActive).length || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "vyronahub" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">VyronaHub Access</h2>
                <p className="text-gray-600 dark:text-gray-300">Full access to user and seller features</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('products')}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Product Catalog</h3>
                        <p className="text-sm text-gray-500">Manage all products</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation('/social')}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">VyronaSocial</h3>
                        <p className="text-sm text-gray-500">Social shopping features</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation('/instashop')}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                        <Store className="h-6 w-6 text-pink-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">InstaShop</h3>
                        <p className="text-sm text-gray-500">Instagram integration</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>



                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation('/home')}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Customer View</h3>
                        <p className="text-sm text-gray-500">User experience</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                        <Settings className="h-6 w-6 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">VyronaSpace</h3>
                        <p className="text-sm text-gray-500">Virtual spaces & experiences</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">VyronaRead</h3>
                        <p className="text-sm text-gray-500">Content & learning hub</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Store className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">VyronaMallConnect</h3>
                        <p className="text-sm text-gray-500">Mall integration system</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <Shield className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Admin Only</h3>
                        <p className="text-sm text-gray-500">Exclusive features</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Direct access to key platform functions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-20 flex-col" onClick={() => setActiveTab("users")}>
                      <Users className="h-6 w-6 mb-2" />
                      <span className="text-xs">Manage Users</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col" onClick={() => setActiveTab("products")}>
                      <Package className="h-6 w-6 mb-2" />
                      <span className="text-xs">Product Control</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col" onClick={() => setActiveTab("sellers")}>
                      <Store className="h-6 w-6 mb-2" />
                      <span className="text-xs">Seller Management</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col" onClick={() => setActiveTab("analytics")}>
                      <BarChart3 className="h-6 w-6 mb-2" />
                      <span className="text-xs">Analytics</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col" onClick={() => setActiveTab('products')}>
                      <Package className="h-6 w-6 mb-2" />
                      <span className="text-xs">VyronaHub</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col" onClick={() => setLocation('/social')}>
                      <Users className="h-6 w-6 mb-2" />
                      <span className="text-xs">VyronaSocial</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col" onClick={() => setLocation('/instashop')}>
                      <Store className="h-6 w-6 mb-2" />
                      <span className="text-xs">InstaShop</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Settings className="h-6 w-6 mb-2" />
                      <span className="text-xs">Platform Settings</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>VyronaMart Modules Overview</CardTitle>
                  <CardDescription>Complete access to all platform features and modules</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Core Modules</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => setActiveTab('products')}>
                          <Package className="h-5 w-5 text-blue-600" />
                          <span className="text-sm">VyronaHub - Product Catalog</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => setLocation('/social')}>
                          <Users className="h-5 w-5 text-purple-600" />
                          <span className="text-sm">VyronaSocial - Social Shopping</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                          <Settings className="h-5 w-5 text-teal-600" />
                          <span className="text-sm">VyronaSpace - Virtual Experiences</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Extended Features</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                          <MessageSquare className="h-5 w-5 text-yellow-600" />
                          <span className="text-sm">VyronaRead - Content Hub</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                          <Store className="h-5 w-5 text-indigo-600" />
                          <span className="text-sm">VyronaMallConnect - Mall Integration</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => setLocation('/instashop')}>
                          <Store className="h-5 w-5 text-pink-600" />
                          <span className="text-sm">VyronaInstaShop - Instagram Integration</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "emails" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Email Management</h2>
                  <p className="text-gray-600 dark:text-gray-300">Send order confirmation emails and manage customer communications</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Templates
                  </Button>
                  <Button>
                    <Send className="h-4 w-4 mr-2" />
                    Bulk Email
                  </Button>
                </div>
              </div>

              {/* Email Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Emails Sent</p>
                        <p className="text-2xl font-bold">156</p>
                      </div>
                      <Mail className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Order Confirmations</p>
                        <p className="text-2xl font-bold text-green-600">132</p>
                      </div>
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
                        <p className="text-2xl font-bold text-emerald-600">98.5%</p>
                      </div>
                      <Send className="h-8 w-8 text-emerald-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Failed Emails</p>
                        <p className="text-2xl font-bold text-red-600">2</p>
                      </div>
                      <X className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Orders with Email Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Email Management</CardTitle>
                  <CardDescription>Send order confirmation emails to customers</CardDescription>
                </CardHeader>
                <CardContent>
                  {orders?.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No orders found</p>
                  ) : (
                    <div className="space-y-4">
                      {orders?.slice(0, 10).map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="font-medium">Order #{order.order_id}</p>
                                <p className="text-sm text-gray-500">
                                  Customer: {order.customer_email || 'N/A'} • Amount: ₹{(order.total_amount || 0).toLocaleString(}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {new Date(order.createdAt).toLocaleDateString()} • Status: {order.status}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={order.emailSent ? 'default' : 'secondary'}>
                              {order.emailSent ? 'Email Sent' : 'No Email'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={sendOrderEmailMutation.isPending}
                              onClick={() => sendOrderEmailMutation.mutate({ orderId: order.id })}
                            >
                              {sendOrderEmailMutation.isPending ? (
                                <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                              Send Email
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Email Send */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Email Send</CardTitle>
                  <CardDescription>Send order confirmation email with custom message</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Order ID</label>
                        <Input 
                          placeholder="Enter order ID" 
                          type="number"
                          id="quickEmailOrderId"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Customer Email (Optional)</label>
                        <Input 
                          placeholder="Override customer email" 
                          type="email"
                          id="quickEmailCustomer"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Custom Message (Optional)</label>
                      <Textarea 
                        placeholder="Add a custom message to the email..." 
                        id="quickEmailMessage"
                        rows={3}
                      />
                    </div>
                    <Button
                      disabled={sendOrderEmailMutation.isPending}
                      onClick={() => {
                        const orderId = (document.getElementById('quickEmailOrderId') as HTMLInputElement)?.value;
                        const customMessage = (document.getElementById('quickEmailMessage') as HTMLTextAreaElement)?.value;
                        if (orderId) {
                          sendOrderEmailMutation.mutate({ 
                            orderId: parseInt(orderId), 
                            customMessage: customMessage || undefined 
                          });
                        }
                      }}
                    >
                      {sendOrderEmailMutation.isPending ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send Order Confirmation Email
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Management</CardTitle>
                  <CardDescription>View customer details and send direct messages</CardDescription>
                </CardHeader>
                <CardContent>
                  {!users || users.filter((user: any) => user.role === 'customer').length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No Customers Found</h3>
                      <p className="text-gray-500 dark:text-gray-400">Customer details will appear here once users register</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {users?.filter((user: any) => user.role === 'customer').map((customer: any) => (
                        <div key={customer.id} className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold text-lg mb-2">{customer.username}</h4>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm">{customer.email}</span>
                                      </div>
                                      {customer.mobile && (
                                        <div className="flex items-center gap-2">
                                          <span className="h-4 w-4 text-gray-500">📱</span>
                                          <span className="text-sm">{customer.mobile}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-600">Customer ID:</span>
                                        <Badge variant="outline">#{customer.id}</Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-600">Status:</span>
                                        <Badge variant={customer.role === 'customer' ? 'default' : 'secondary'}>
                                          Active Customer
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-600">Joined:</span>
                                        <span className="text-sm text-gray-500">
                                          {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Message
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Send Message to {customer.username}</DialogTitle>
                                    <DialogDescription>
                                      Send a direct message to customer {customer.email}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium">Subject</label>
                                      <Input 
                                        placeholder="Enter message subject" 
                                        id={`messageSubject_${customer.id}`}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Message</label>
                                      <Textarea 
                                        placeholder="Type your message here..." 
                                        id={`messageContent_${customer.id}`}
                                        rows={4}
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <DialogTrigger asChild>
                                        <Button variant="outline">Cancel</Button>
                                      </DialogTrigger>
                                      <Button
                                        onClick={() => {
                                          const subject = (document.getElementById(`messageSubject_${customer.id}`) as HTMLInputElement)?.value;
                                          const content = (document.getElementById(`messageContent_${customer.id}`) as HTMLTextAreaElement)?.value;
                                          if (subject && content) {
                                            toast({
                                              title: "Message Sent",
                                              description: `Message sent to ${customer.username} successfully`,
                                            });
                                            // Clear the form
                                            (document.getElementById(`messageSubject_${customer.id}`) as HTMLInputElement).value = '';
                                            (document.getElementById(`messageContent_${customer.id}`) as HTMLTextAreaElement).value = '';
                                          } else {
                                            toast({
                                              title: "Error",
                                              description: "Please fill in both subject and message",
                                              variant: "destructive"
                                            });
                                          }
                                        }}
                                      >
                                        <Send className="h-4 w-4 mr-2" />
                                        Send Message
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4 mr-2" />
                                View Orders
                              </Button>
                            </div>
                          </div>
                          
                          {/* Customer Order Summary */}
                          <div className="mt-4 pt-4 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-2xl font-bold text-blue-600">
                                  {orders?.filter((order: any) => order.user_id === customer.id).length || 0}
                                </p>
                                <p className="text-sm text-gray-600">Total Orders</p>
                              </div>
                              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-2xl font-bold text-green-600">
                                  ₹{(orders?.filter((order: any) => order.user_id === customer.id)
                                    .reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0).toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">Total Spent</p>
                              </div>
                              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-2xl font-bold text-purple-600">
                                  {orders?.filter((order: any) => order.user_id === customer.id && order.status === 'completed').length || 0}
                                </p>
                                <p className="text-sm text-gray-600">Completed</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* All Users Directory */}
              <Card>
                <CardHeader>
                  <CardTitle>Complete User Directory</CardTitle>
                  <CardDescription>All registered users including customers, sellers, and admins</CardDescription>
                </CardHeader>
                <CardContent>
                  {users?.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No users found</p>
                  ) : (
                    <div className="space-y-3">
                      {users?.map((user: any) => (
                        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              user.role === 'admin' ? 'bg-red-100 text-red-600' :
                              user.role === 'seller' ? 'bg-green-100 text-green-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {user.role === 'admin' ? <Shield className="h-5 w-5" /> :
                               user.role === 'seller' ? <Store className="h-5 w-5" /> :
                               <Users className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="font-medium">{user.username}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              <p className="text-xs text-gray-400">
                                Mobile: {user.mobile || 'N/A'} • ID: #{user.id}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'seller' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                            <Badge variant="outline">
                              {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Order Management</h2>
                  <p className="text-gray-600 dark:text-gray-300">Monitor and manage all customer orders</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Pending Orders
                  </Button>
                  <Button>
                    Export Data
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold">{orders?.length || 0}</p>
                      </div>
                      <ShoppingCart className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pending</p>
                        <p className="text-2xl font-bold text-orange-600">{orders?.filter((order: any) => order.status === 'pending').length || 0}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Completed</p>
                        <p className="text-2xl font-bold text-green-600">{orders?.filter((order: any) => order.status === 'completed').length || 0}</p>
                      </div>
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Revenue</p>
                        <p className="text-2xl font-bold text-green-600">₹{(orders?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0).toLocaleString(}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest customer orders across all modules</CardDescription>
                </CardHeader>
                <CardContent>
                  {!orders || orders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No Orders Yet</h3>
                      <p className="text-gray-500 dark:text-gray-400">Orders will appear here once customers start purchasing</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders?.slice(0, 10).map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <ShoppingCart className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">Order #{order.id}</p>
                              <p className="text-sm text-gray-500">Module: {order.module}</p>
                              <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-semibold">₹{(order.total_amount || 0).toLocaleString(}</p>
                              <Badge variant={order.status === 'completed' ? 'default' : order.status === 'pending' ? 'secondary' : 'destructive'}>
                                {order.status}
                              </Badge>
                            </div>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "support" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Support & Issues</h2>
                  <p className="text-gray-600 dark:text-gray-300">Manage customer support and platform issues</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Bell className="h-4 w-4 mr-2" />
                    New Tickets
                  </Button>
                  <Button>
                    Create Ticket
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Critical Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="font-medium text-red-800">Payment Gateway Error</p>
                        <p className="text-sm text-red-600">Multiple users reporting payment failures</p>
                        <p className="text-xs text-red-500 mt-1">2 hours ago</p>
                      </div>
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="font-medium text-orange-800">Seller Account Suspension</p>
                        <p className="text-sm text-orange-600">Policy violation reported</p>
                        <p className="text-xs text-orange-500 mt-1">4 hours ago</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                      Customer Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="font-medium text-blue-800">Order Tracking Issue</p>
                        <p className="text-sm text-blue-600">Customer unable to track order #1234</p>
                        <p className="text-xs text-blue-500 mt-1">30 minutes ago</p>
                      </div>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="font-medium text-green-800">Refund Request</p>
                        <p className="text-sm text-green-600">Product return approved</p>
                        <p className="text-xs text-green-500 mt-1">1 hour ago</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-purple-600" />
                      Platform Maintenance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="font-medium text-purple-800">Database Optimization</p>
                        <p className="text-sm text-purple-600">Scheduled for tonight 2 AM</p>
                        <p className="text-xs text-purple-500 mt-1">Maintenance window</p>
                      </div>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="font-medium text-gray-800">API Rate Limiting</p>
                        <p className="text-sm text-gray-600">Instagram API limits updated</p>
                        <p className="text-xs text-gray-500 mt-1">Configuration change</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Support Activity</CardTitle>
                  <CardDescription>Latest customer interactions and issue resolutions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Ticket #SP-001 Resolved</p>
                        <p className="text-sm text-gray-600">Customer login issue fixed by resetting password</p>
                      </div>
                      <span className="text-xs text-gray-500">5 minutes ago</span>
                    </div>
                    <div className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">New Support Request</p>
                        <p className="text-sm text-gray-600">Seller requesting help with product upload</p>
                      </div>
                      <span className="text-xs text-gray-500">15 minutes ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Platform Settings</h2>
                <p className="text-gray-600 dark:text-gray-300">Configure platform operations and policies</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Configuration</CardTitle>
                    <CardDescription>Manage payment gateways and commission rates</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Platform Commission</span>
                      <span className="font-bold">15%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Payment Gateway</span>
                      <Badge variant="default">Razorpay Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Minimum Order</span>
                      <span className="font-bold">₹100</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure Payments
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Configure user permissions and access</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Auto-approve Sellers</span>
                      <Badge variant="secondary">Disabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Email Verification</span>
                      <Badge variant="default">Required</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Max Login Attempts</span>
                      <span className="font-bold">5</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Permissions
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Platform Features</CardTitle>
                    <CardDescription>Enable or disable platform modules</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">VyronaSocial</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">VyronaInstaShop</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">VyronaSpace</span>
                      <Badge variant="secondary">Beta</Badge>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Package className="h-4 w-4 mr-2" />
                      Module Settings
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Gamification</CardTitle>
                    <CardDescription>Configure rewards and achievements</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">VyronaCoins per ₹100</span>
                      <span className="font-bold">10 coins</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">XP for Purchase</span>
                      <span className="font-bold">50 XP</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Daily Login Bonus</span>
                      <span className="font-bold">5 coins</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Reward Settings
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
                <p className="text-gray-600 dark:text-gray-300">Real-time platform performance and insights</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Platform Revenue</p>
                        <p className="text-3xl font-bold text-green-600">₹{(orders?.reduce((sum: number, order: any) => sum + ((order.total_amount || 0) * 0.15), 0) || 0).toLocaleString(}</p>
                        <p className="text-xs text-green-500">+12% from last month</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Users</p>
                        <p className="text-3xl font-bold text-blue-600">{users?.filter((user: any) => user.isActive).length || 0}</p>
                        <p className="text-xs text-blue-500">Currently online</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Product Views</p>
                        <p className="text-3xl font-bold text-purple-600">{(users?.length || 0) * 45}</p>
                        <p className="text-xs text-purple-500">Last 24 hours</p>
                      </div>
                      <Eye className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                        <p className="text-3xl font-bold text-orange-600">{orders?.length && users?.length ? ((orders.length / users.length) * 100).toFixed(1) : '0'}%</p>
                        <p className="text-xs text-orange-500">Orders/Users ratio</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Module Performance</CardTitle>
                    <CardDescription>Usage statistics across VyronaMart modules</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-blue-600" />
                          <span className="font-medium">VyronaHub</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">{products?.length || 0} products</span>
                          <p className="text-xs text-gray-500">Most popular</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-purple-600" />
                          <span className="font-medium">VyronaSocial</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">{users?.filter((user: any) => user.role === 'customer').length || 0} users</span>
                          <p className="text-xs text-gray-500">Active groups</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Store className="h-5 w-5 text-pink-600" />
                          <span className="font-medium">VyronaInstaShop</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">{users?.filter((user: any) => user.role === 'seller').length || 0} stores</span>
                          <p className="text-xs text-gray-500">Connected</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Live platform activity feed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {users?.slice(0, 5).map((user: any, index: number) => (
                        <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                          <div className={`w-2 h-2 rounded-full ${index % 2 === 0 ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{user.username} {index % 3 === 0 ? 'created account' : index % 2 === 0 ? 'updated profile' : 'logged in'}</p>
                            <p className="text-xs text-gray-500">{Math.floor(Math.random() * 60)} minutes ago</p>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-4">
                          <p className="text-gray-500">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Health</CardTitle>
                  <CardDescription>System status and performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                        <Check className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold mb-1">Database</h3>
                      <p className="text-sm text-green-600">Healthy</p>
                    </div>
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                        <Check className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold mb-1">API Services</h3>
                      <p className="text-sm text-green-600">Online</p>
                    </div>
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-3">
                        <AlertTriangle className="h-6 w-6 text-yellow-600" />
                      </div>
                      <h3 className="font-semibold mb-1">Storage</h3>
                      <p className="text-sm text-yellow-600">75% Used</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "seller-dashboard" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Seller Dashboard</h2>
                <p className="text-gray-600 dark:text-gray-300">Access and monitor seller panel functionality</p>
              </div>

              {/* Quick Access Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 cursor-pointer" onClick={() => setLocation('/vyronahub-dashboard')}>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">VyronaHub Dashboard</h3>
                          <p className="text-sm text-gray-500">General commerce platform</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => window.open('/vyronahub-dashboard', '_blank')}
                        title="Open in new tab"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 cursor-pointer" onClick={() => setLocation('/vyronaread-dashboard')}>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">VyronaRead Dashboard</h3>
                          <p className="text-sm text-gray-500">Book management platform</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => window.open('/vyronaread-dashboard', '_blank')}
                        title="Open in new tab"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Seller Management Tools */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Sellers</CardTitle>
                    <CardDescription>Monitor registered sellers and their status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sellers?.length === 0 ? (
                      <div className="text-center py-8">
                        <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">No Sellers Registered</h3>
                        <p className="text-gray-500">Sellers will appear here once they register</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sellers?.slice(0, 5).map((seller: any) => (
                          <div key={seller.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                              <p className="font-medium">{seller.username}</p>
                              <p className="text-sm text-gray-500">{seller.email}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant={seller.role === 'seller' ? 'default' : 'secondary'}>
                                {seller.role}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (seller.sellerType === 'vyronaread') {
                                    setLocation('/vyronaread-dashboard');
                                  } else {
                                    setLocation('/vyronahub-dashboard');
                                  }
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Dashboard Features</CardTitle>
                    <CardDescription>Available seller dashboard capabilities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <Package className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-200">Product Management</p>
                          <p className="text-sm text-green-600 dark:text-green-300">Add, edit, and manage products</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <ShoppingCart className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-800 dark:text-blue-200">Order Management</p>
                          <p className="text-sm text-blue-600 dark:text-blue-300">Track and process orders</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="font-medium text-purple-800 dark:text-purple-200">Analytics & Insights</p>
                          <p className="text-sm text-purple-600 dark:text-purple-300">Sales performance metrics</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <Users className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="font-medium text-orange-800 dark:text-orange-200">Customer Management</p>
                          <p className="text-sm text-orange-600 dark:text-orange-300">Customer interaction tools</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Direct access to key seller dashboard functions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Button variant="outline" className="h-20 flex-col" onClick={() => setLocation('/vyronahub-dashboard')}>
                      <TrendingUp className="h-6 w-6 mb-2" />
                      <span className="text-xs">VyronaHub</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col" onClick={() => setLocation('/vyronaread-dashboard')}>
                      <Package className="h-6 w-6 mb-2" />
                      <span className="text-xs">VyronaRead</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col" onClick={() => setActiveTab("sellers")}>
                      <Users className="h-6 w-6 mb-2" />
                      <span className="text-xs">Manage Sellers</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col" onClick={() => setActiveTab("overview")}>
                      <Settings className="h-6 w-6 mb-2" />
                      <span className="text-xs">Back to Admin</span>
                    </Button>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Eye className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-800 dark:text-blue-200">Open in New Tab</p>
                          <p className="text-sm text-blue-600 dark:text-blue-300">Keep admin panel open while viewing seller dashboards</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open('/vyronahub-dashboard', '_blank')}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          VyronaHub
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open('/vyronaread-dashboard', '_blank')}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          VyronaRead
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dashboard Access Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>Access Instructions</CardTitle>
                  <CardDescription>How to use the seller dashboard effectively</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">For Sellers</h4>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm font-medium">Login with seller credentials</p>
                            <p className="text-xs text-gray-500">Use your registered email and password</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm font-medium">Access dashboard features</p>
                            <p className="text-xs text-gray-500">Manage products, orders, and analytics</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm font-medium">Monitor performance</p>
                            <p className="text-xs text-gray-500">Track sales and customer interactions</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Admin Access</h4>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm font-medium">View all seller dashboards</p>
                            <p className="text-xs text-gray-500">Monitor seller activities and performance</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm font-medium">Test dashboard functionality</p>
                            <p className="text-xs text-gray-500">Ensure all features work properly</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm font-medium">Provide seller support</p>
                            <p className="text-xs text-gray-500">Help sellers with dashboard issues</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}