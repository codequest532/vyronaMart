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
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
        price: Math.round(data.price * 100), // Convert to cents
        originalPrice: data.originalPrice ? Math.round(data.originalPrice * 100) : undefined,
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

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { data: users } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: orders } = useQuery({
    queryKey: ["/api/admin/orders"],
  });

  const { data: libraryRequests } = useQuery({
    queryKey: ["/api/admin/library-requests"],
  });

  const updateLibraryRequestMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: number; status: string; adminNotes?: string }) => {
      return await apiRequest(`/api/admin/library-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, adminNotes }),
        headers: {
          "Content-Type": "application/json",
        },
      });
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

  const handleLogout = () => {
    setLocation("/login");
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
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
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
              User Management
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
              variant={activeTab === "orders" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("orders")}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Order Management
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
                  <Card key={index}>
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

          {activeTab === "users" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h2>
                <p className="text-gray-600 dark:text-gray-300">Manage customers, sellers, and their accounts</p>
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
                            <Badge variant={user.role === 'seller' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                            <Badge variant={user.isActive ? 'default' : 'destructive'}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button variant="outline" size="sm">
                              Manage
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
                                    <FormLabel>Original Price (USD)</FormLabel>
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
                                    <span className="font-bold text-xl text-green-600">₹{(product.price / 100).toLocaleString()}</span>
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
                    {!users || users.filter((user: any) => user.role === 'seller').length === 0 ? (
                      <div className="text-center py-8">
                        <Store className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No sellers registered yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {users?.filter((user: any) => user.role === 'seller').map((seller: any) => (
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
                              <Badge variant={seller.isActive ? 'default' : 'secondary'}>
                                {seller.isActive ? 'Active' : 'Pending'}
                              </Badge>
                              <Button variant="outline" size="sm">
                                <Edit className="h-3 w-3" />
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

                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation('/seller-dashboard')}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Seller Dashboard</h3>
                        <p className="text-sm text-gray-500">Seller panel access</p>
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
                        <p className="text-2xl font-bold text-green-600">₹{orders?.reduce((sum: number, order: any) => sum + order.totalAmount, 0)?.toLocaleString() || 0}</p>
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
                              <p className="font-semibold">₹{order.totalAmount.toLocaleString()}</p>
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
                        <p className="text-3xl font-bold text-green-600">₹{orders?.reduce((sum: number, order: any) => sum + (order.totalAmount * 0.15), 0)?.toLocaleString() || '0'}</p>
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
        </main>
      </div>
    </div>
  );
}