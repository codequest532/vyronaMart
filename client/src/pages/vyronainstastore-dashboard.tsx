import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { 
  Instagram, Store, Package, TrendingUp, Eye, Heart, MessageCircle, Users, 
  DollarSign, BarChart3, Calendar, Zap, Link, Camera, Hash, ShoppingBag, User, MapPin,
  Clock, CheckCircle, XCircle, Truck, AlertTriangle, Plus, Edit, Trash2, LogOut
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserData } from "@/hooks/use-user-data";
import { useLocation } from "wouter";

// Schemas for form validation
const instagramConnectSchema = z.object({
  instagramUsername: z.string().min(1, "Instagram username is required"),
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  storeDescription: z.string().optional(),
  demoMode: z.boolean().optional(),
});

const productSchema = z.object({
  productName: z.string().min(2, "Product name is required"),
  description: z.string().optional(),
  price: z.number().min(1, "Price must be greater than 0"),
  categoryTag: z.string().optional(),
  hashtags: z.string().optional(),
  productUrl: z.string().url("Must be a valid URL").optional(),
  imageUrl: z.string().url("Must be a valid URL").optional(),
});

const bulkImportSchema = z.object({
  csvData: z.string().min(1, "CSV data is required"),
});

const profileImportSchema = z.object({
  profileUrl: z.string().url("Must be a valid Instagram profile URL"),
  maxProducts: z.number().min(1).max(50).default(20),
});

const orderStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]),
  orderNotes: z.string().optional(),
});

type InstagramConnectFormData = z.infer<typeof instagramConnectSchema>;
type ProductFormData = z.infer<typeof productSchema>;
type BulkImportFormData = z.infer<typeof bulkImportSchema>;
type ProfileImportFormData = z.infer<typeof profileImportSchema>;
type OrderStatusFormData = z.infer<typeof orderStatusSchema>;

export default function VyronaInstaStoreDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user: currentUser, isLoading: userLoading } = useUserData();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!userLoading && currentUser) {
      if (currentUser.role !== 'seller') {
        setLocation('/login');
        toast({
          title: "Authentication Required",
          description: "Please log in as a seller to access this dashboard.",
          variant: "destructive",
        });
        return;
      }
      
      if (currentUser.sellerType !== 'vyronainstastore') {
        // Redirect to appropriate dashboard based on seller type
        if (currentUser.sellerType === 'vyronaread') {
          setLocation('/vyronaread-dashboard');
        } else {
          setLocation('/vyronahub-dashboard');
        }
        return;
      }
    } else if (!userLoading && !currentUser) {
      setLocation('/login');
      toast({
        title: "Authentication Required",
        description: "Please log in as a VyronaInstaStore seller to access this dashboard.",
        variant: "destructive",
      });
      return;
    }
  }, [currentUser, userLoading, setLocation, toast]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading VyronaInstaStore...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "seller" || currentUser.sellerType !== "vyronainstastore") {
    return null;
  }

  // Form hooks
  const connectForm = useForm<InstagramConnectFormData>({
    resolver: zodResolver(instagramConnectSchema),
    defaultValues: {
      instagramUsername: "",
      storeName: "",
      storeDescription: "",
      demoMode: true, // Default to demo mode for easier onboarding
    },
  });

  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productName: "",
      description: "",
      price: 0,
      categoryTag: "",
      hashtags: "",
      productUrl: "",
      imageUrl: "",
    },
  });

  const bulkImportForm = useForm<BulkImportFormData>({
    resolver: zodResolver(bulkImportSchema),
    defaultValues: {
      csvData: "",
    },
  });

  const profileImportForm = useForm<ProfileImportFormData>({
    resolver: zodResolver(profileImportSchema),
    defaultValues: {
      profileUrl: "",
      maxProducts: 20,
    },
  });

  const orderStatusForm = useForm<OrderStatusFormData>({
    resolver: zodResolver(orderStatusSchema),
    defaultValues: {
      status: "pending",
      orderNotes: "",
    },
  });

  // Data fetching queries
  const { data: instagramStore, isLoading: storeLoading } = useQuery({
    queryKey: ["/api/vyronainstastore/store"],
  });

  const { data: instagramProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/vyronainstastore/products"],
    enabled: !!instagramStore,
  });

  const { data: instagramOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/vyronainstastore/orders"],
    enabled: !!instagramStore,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/vyronainstastore/analytics"],
    enabled: !!instagramStore,
  });

  // Mutations
  const connectInstagramMutation = useMutation({
    mutationFn: async (data: InstagramConnectFormData) => {
      return apiRequest("POST", "/api/vyronainstastore/connect", data);
    },
    onSuccess: (response: any) => {
      toast({
        title: "Instagram Connected",
        description: response.message || `Successfully connected and synced ${response.syncedProducts || 0} products`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vyronainstastore/store"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vyronainstastore/products"] });
      setIsConnectDialogOpen(false);
      connectForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect Instagram account",
        variant: "destructive",
      });
    },
  });

  const syncInstagramMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/vyronainstastore/sync", {});
    },
    onSuccess: (response: any) => {
      toast({
        title: "Sync Complete",
        description: response.message || "Instagram data synced successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vyronainstastore/store"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vyronainstastore/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync Instagram data",
        variant: "destructive",
      });
    },
  });

  const addProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      return apiRequest("POST", "/api/vyronainstastore/products", data);
    },
    onSuccess: () => {
      toast({
        title: "Product Added",
        description: "Product has been added to your Instagram store!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vyronainstastore/products"] });
      setIsProductDialogOpen(false);
      productForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, data }: { orderId: number; data: OrderStatusFormData }) => {
      return apiRequest("PUT", `/api/vyronainstastore/orders/${orderId}/status`, data);
    },
    onSuccess: () => {
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vyronainstastore/orders"] });
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (data: BulkImportFormData) => {
      // Parse CSV data into products array
      const lines = data.csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const products = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const product: any = {};
        
        headers.forEach((header, index) => {
          product[header] = values[index] || '';
        });
        
        products.push(product);
      }

      return apiRequest("POST", "/api/vyronainstastore/products/bulk-import", { products });
    },
    onSuccess: (response: any) => {
      toast({
        title: "Bulk Import Complete",
        description: response.message || `Successfully imported ${response.importedCount} products`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vyronainstastore/products"] });
      bulkImportForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Bulk Import Failed",
        description: error.message || "Failed to import products",
        variant: "destructive",
      });
    },
  });

  const profileImportMutation = useMutation({
    mutationFn: async (data: ProfileImportFormData) => {
      return apiRequest("POST", "/api/vyronainstastore/import-from-profile", data);
    },
    onSuccess: (response: any) => {
      toast({
        title: "Profile Import Complete",
        description: response.message || `Successfully imported ${response.importedCount} products from Instagram profile`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vyronainstastore/products"] });
      profileImportForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Profile Import Failed",
        description: error.message || "Failed to import from Instagram profile",
        variant: "destructive",
      });
    },
  });



  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'shipped': return 'secondary';
      case 'confirmed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'confirmed': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Show connection setup if no Instagram store
  if (!storeLoading && !instagramStore) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Instagram className="h-12 w-12 text-pink-500 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">VyronaInstaStore</h1>
            </div>
            <p className="text-xl text-gray-600">Connect your Instagram account to start selling</p>
          </div>

          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center">
                <Instagram className="h-6 w-6 mr-2 text-pink-500" />
                Setup Your VyronaInstaStore
              </CardTitle>
              <CardDescription>
                Get started quickly with demo mode or connect your real Instagram Business API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">🚀 Quick Start Recommended</h4>
                <p className="text-sm text-green-700">
                  Enable demo mode below to start immediately with sample products. Perfect for testing and getting familiar with the platform!
                </p>
              </div>
              <Form {...connectForm}>
                <form onSubmit={connectForm.handleSubmit((data) => connectInstagramMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={connectForm.control}
                    name="instagramUsername"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram Username</FormLabel>
                        <FormControl>
                          <Input placeholder="@yourinstagram" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={connectForm.control}
                    name="storeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Store Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={connectForm.control}
                    name="storeDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Description (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Describe your store..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={connectForm.control}
                    name="demoMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border-2 border-green-200 bg-green-50 p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-green-600"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-green-900 font-medium">
                            ✨ Demo Mode (Recommended)
                          </FormLabel>
                          <FormDescription className="text-green-700">
                            Start immediately with sample products. Perfect for testing and learning the platform without needing Instagram Business API tokens.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                    disabled={connectInstagramMutation.isPending}
                  >
                    {connectInstagramMutation.isPending ? "Connecting..." : "Connect Instagram"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Instagram className="h-8 w-8 text-pink-500 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">VyronaInstaStore Dashboard</h1>
                <p className="text-gray-600">
                  @{instagramStore?.instagramUsername} • {instagramStore?.storeName}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => syncInstagramMutation.mutate()}
                disabled={syncInstagramMutation.isPending}
                variant="outline"
              >
                <Zap className="h-4 w-4 mr-2" />
                {syncInstagramMutation.isPending ? "Syncing..." : "Sync Instagram"}
              </Button>
              <Button
                onClick={async () => {
                  try {
                    // Call logout API endpoint first (method, url)
                    await apiRequest('POST', '/api/auth/logout');
                  } catch (error) {
                    // Even if API call fails, continue with logout
                    console.log('Logout API error:', error);
                  }
                  // Clear local storage
                  localStorage.removeItem('user');
                  // Force page reload to landing page
                  window.location.href = '/';
                }}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:border-red-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
              <div className="flex gap-2">
                <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                </Dialog>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Package className="h-4 w-4 mr-2" />
                      Bulk Import
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Bulk Product Import</DialogTitle>
                      <DialogDescription>
                        Import multiple products using CSV data or Instagram profile scraping
                      </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="csv" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="csv">CSV Upload</TabsTrigger>
                        <TabsTrigger value="profile">Instagram Profile</TabsTrigger>
                        <TabsTrigger value="template">CSV Template</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="csv" className="space-y-4">
                        <div className="p-4 border rounded-lg bg-blue-50">
                          <h4 className="font-medium text-blue-900 mb-2">CSV Format Instructions</h4>
                          <p className="text-sm text-blue-700 mb-2">
                            Use the following headers: productName, description, price, categoryTag, hashtags, productUrl, imageUrl
                          </p>
                          <p className="text-xs text-blue-600">
                            Example: Handmade Jewelry, Beautiful handcrafted necklace, 45.99, accessories, #jewelry #handmade, https://instagram.com/p/example, https://example.com/image.jpg
                          </p>
                        </div>
                        <Form {...bulkImportForm}>
                          <form onSubmit={bulkImportForm.handleSubmit((data) => bulkImportMutation.mutate(data))} className="space-y-4">
                            <FormField
                              control={bulkImportForm.control}
                              name="csvData"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>CSV Data</FormLabel>
                                  <FormControl>
                                    <textarea
                                      placeholder="Paste your CSV data here..."
                                      className="min-h-[200px] w-full p-3 border rounded-md resize-y"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button 
                              type="submit" 
                              disabled={bulkImportMutation.isPending}
                              className="w-full"
                            >
                              {bulkImportMutation.isPending ? "Importing..." : "Import Products"}
                            </Button>
                          </form>
                        </Form>
                      </TabsContent>
                      
                      <TabsContent value="profile" className="space-y-4">
                        <div className="p-4 border rounded-lg bg-green-50">
                          <h4 className="font-medium text-green-900 mb-2">Instagram Profile Import</h4>
                          <p className="text-sm text-green-700 mb-2">
                            Import products by analyzing your Instagram profile posts
                          </p>
                          <p className="text-xs text-green-600">
                            Note: This simulates profile scraping and creates sample products for demonstration
                          </p>
                        </div>
                        <Form {...profileImportForm}>
                          <form onSubmit={profileImportForm.handleSubmit((data) => profileImportMutation.mutate(data))} className="space-y-4">
                            <FormField
                              control={profileImportForm.control}
                              name="profileUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Instagram Profile URL</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="https://instagram.com/your_username"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={profileImportForm.control}
                              name="maxProducts"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Maximum Products to Import</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number"
                                      min="1"
                                      max="50"
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button 
                              type="submit" 
                              disabled={profileImportMutation.isPending}
                              className="w-full"
                            >
                              {profileImportMutation.isPending ? "Importing..." : "Import from Profile"}
                            </Button>
                          </form>
                        </Form>
                      </TabsContent>
                      
                      <TabsContent value="template" className="space-y-4">
                        <div className="p-4 border rounded-lg bg-purple-50">
                          <h4 className="font-medium text-purple-900 mb-4">CSV Template</h4>
                          <div className="bg-white p-4 border rounded text-sm font-mono">
                            <div className="border-b pb-2 mb-2 font-semibold">
                              productName,description,price,categoryTag,hashtags,productUrl,imageUrl
                            </div>
                            <div className="space-y-1 text-gray-600">
                              <div>Handmade Jewelry,Beautiful handcrafted necklace,45.99,accessories,#jewelry #handmade,https://instagram.com/p/example1,https://example.com/image1.jpg</div>
                              <div>Vintage Sunglasses,Classic retro style sunglasses,25.50,fashion,#vintage #sunglasses,https://instagram.com/p/example2,https://example.com/image2.jpg</div>
                              <div>Organic Skincare,Natural organic face cream,35.00,beauty,#organic #skincare,https://instagram.com/p/example3,https://example.com/image3.jpg</div>
                            </div>
                          </div>
                          <Button 
                            onClick={() => {
                              const csvTemplate = `productName,description,price,categoryTag,hashtags,productUrl,imageUrl
Handmade Jewelry,Beautiful handcrafted necklace,45.99,accessories,#jewelry #handmade,https://instagram.com/p/example1,https://example.com/image1.jpg
Vintage Sunglasses,Classic retro style sunglasses,25.50,fashion,#vintage #sunglasses,https://instagram.com/p/example2,https://example.com/image2.jpg
Organic Skincare,Natural organic face cream,35.00,beauty,#organic #skincare,https://instagram.com/p/example3,https://example.com/image3.jpg`;
                              navigator.clipboard.writeText(csvTemplate);
                              toast({
                                title: "Template Copied",
                                description: "CSV template has been copied to clipboard",
                              });
                            }}
                            className="mt-4 w-full"
                            variant="outline"
                          >
                            Copy Template to Clipboard
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </div>
              
              <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>
                      Add a new product to your Instagram store
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...productForm}>
                    <form onSubmit={productForm.handleSubmit((data) => addProductMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={productForm.control}
                        name="productName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter product name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={productForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input placeholder="Product description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={productForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (₹)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={productForm.control}
                        name="categoryTag"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., fashion, electronics" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={productForm.control}
                        name="hashtags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hashtags</FormLabel>
                            <FormControl>
                              <Input placeholder="#fashion #style #trending" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={productForm.control}
                        name="productUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product URL (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={addProductMutation.isPending}
                      >
                        {addProductMutation.isPending ? "Adding..." : "Add Product"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {instagramOrders?.length || 0}
                  </p>
                </div>
                <ShoppingBag className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics?.revenue || 0)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Products</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {instagramProducts?.length || 0}
                  </p>
                </div>
                <Package className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Followers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {instagramStore?.followersCount?.toLocaleString() || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Instagram Orders
                </CardTitle>
                <CardDescription>
                  Manage orders from your Instagram store
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-8">Loading orders...</div>
                ) : instagramOrders?.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Orders Yet</h3>
                    <p className="text-gray-500">Orders from your Instagram store will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {instagramOrders?.map((order: any) => (
                      <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="font-medium">Order #{order.id}</p>
                              <p className="text-sm text-gray-600">
                                {(() => {
                                  try {
                                    // Check if this is a multi-item order
                                    if (order.orderNotes && order.orderNotes.includes('Multi-item Instagram order')) {
                                      const itemsMatch = order.orderNotes.match(/Items: (\[.*\])/);
                                      if (itemsMatch) {
                                        const items = JSON.parse(itemsMatch[1]);
                                        return `${items.length} items (Total: ${order.quantity} qty)`;
                                      }
                                    }
                                    // Single item order
                                    return `${order.productName} × ${order.quantity}`;
                                  } catch (e) {
                                    return `${order.productName} × ${order.quantity}`;
                                  }
                                })()}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                              <Badge variant={getStatusBadgeVariant(order.status)}>
                                {getStatusIcon(order.status)}
                                <span className="ml-1">{order.status}</span>
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedOrder(order)}
                            >
                              Manage
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

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Instagram Products
                </CardTitle>
                <CardDescription>
                  Manage products synced from your Instagram account
                </CardDescription>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="text-center py-8">Loading products...</div>
                ) : instagramProducts?.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Products Found</h3>
                    <p className="text-gray-500">Add products or sync from Instagram to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {instagramProducts?.map((product: any) => (
                      <Card key={product.id} className="overflow-hidden">
                        <div className="aspect-square bg-gray-100 relative">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Camera className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                          <Badge 
                            className="absolute top-2 right-2"
                            variant={product.isAvailable ? "default" : "secondary"}
                          >
                            {product.isAvailable ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-medium mb-2 line-clamp-2">{product.productName}</h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-lg">{formatCurrency(product.price)}</span>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Heart className="h-4 w-4" />
                              <span>{product.likesCount || 0}</span>
                            </div>
                          </div>
                          {product.hashtags && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {product.hashtags.slice(0, 3).map((tag: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  <Hash className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Instagram Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <Eye className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="font-medium">Profile Views</span>
                      </div>
                      <span className="font-bold">{analytics?.profileViews?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                        <span className="font-medium">Reach</span>
                      </div>
                      <span className="font-bold">{analytics?.reach?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center">
                        <Link className="h-5 w-5 text-purple-500 mr-2" />
                        <span className="font-medium">Website Clicks</span>
                      </div>
                      <span className="font-bold">{analytics?.websiteClicks?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Sales Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center">
                        <ShoppingBag className="h-5 w-5 text-yellow-500 mr-2" />
                        <span className="font-medium">Total Orders</span>
                      </div>
                      <span className="font-bold">{analytics?.ordersCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                        <span className="font-medium">Total Revenue</span>
                      </div>
                      <span className="font-bold">{formatCurrency(analytics?.revenue || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <Package className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="font-medium">Active Products</span>
                      </div>
                      <span className="font-bold">
                        {instagramProducts?.filter((p: any) => p.isAvailable).length || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Instagram className="h-5 w-5 mr-2" />
                  Instagram Store Settings
                </CardTitle>
                <CardDescription>
                  Manage your Instagram store configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Instagram Account</h3>
                      <p className="text-sm text-gray-600">@{instagramStore?.instagramUsername}</p>
                    </div>
                    <Badge variant="secondary">Connected</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Store Name</h3>
                      <p className="text-sm text-gray-600">{instagramStore?.storeName}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Last Sync</h3>
                      <p className="text-sm text-gray-600">
                        {instagramStore?.lastSyncAt 
                          ? new Date(instagramStore.lastSyncAt).toLocaleString()
                          : "Never"
                        }
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => syncInstagramMutation.mutate()}
                      disabled={syncInstagramMutation.isPending}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Sync Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Order Management Modal */}
        {selectedOrder && (
          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Order #{selectedOrder.id} Details
                </DialogTitle>
                <DialogDescription>
                  Complete order information and management
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Order Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3">Order Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Order ID</label>
                      <p className="font-medium">#{selectedOrder.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <Badge variant={getStatusBadgeVariant(selectedOrder.status)} className="mt-1">
                        {getStatusIcon(selectedOrder.status)}
                        <span className="ml-1">{selectedOrder.status}</span>
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Order Date</label>
                      <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Total Amount</label>
                      <p className="font-medium text-green-600 text-lg">{formatCurrency(selectedOrder.totalAmount)}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Customer Name</label>
                      <p className="font-medium">{selectedOrder.shippingAddress?.name || "Not provided"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="font-medium">{selectedOrder.shippingAddress?.email || selectedOrder.contactInfo?.email || "Not provided"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="font-medium">{selectedOrder.shippingAddress?.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Payment Method</label>
                      <p className="font-medium capitalize">{selectedOrder.contactInfo?.paymentMethod || "Not specified"}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Items
                  </h3>
                  {(() => {
                    try {
                      // Check if this is a multi-item order
                      if (selectedOrder.orderNotes && selectedOrder.orderNotes.includes('Multi-item Instagram order')) {
                        const itemsMatch = selectedOrder.orderNotes.match(/Items: (\[.*\])/);
                        if (itemsMatch) {
                          const items = JSON.parse(itemsMatch[1]);
                          return (
                            <div className="space-y-3">
                              {items.map((item: any, index: number) => (
                                <div key={index} className="bg-white p-3 rounded border flex justify-between items-center">
                                  <div>
                                    <p className="font-medium">{item.productName}</p>
                                    <p className="text-sm text-gray-600">Quantity: {item.quantity} × ₹{item.price}</p>
                                  </div>
                                  <p className="font-medium text-green-600">₹{item.total}</p>
                                </div>
                              ))}
                              <div className="bg-white p-3 rounded border border-green-200">
                                <div className="flex justify-between items-center font-semibold">
                                  <span>Total ({items.length} items)</span>
                                  <span className="text-green-600 text-lg">₹{selectedOrder.totalAmount}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      }
                      // Single item order
                      return (
                        <div className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{selectedOrder.productName}</p>
                              <p className="text-sm text-gray-600">Quantity: {selectedOrder.quantity}</p>
                            </div>
                            <p className="font-medium text-green-600">₹{selectedOrder.totalAmount}</p>
                          </div>
                        </div>
                      );
                    } catch (e) {
                      return (
                        <div className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{selectedOrder.productName}</p>
                              <p className="text-sm text-gray-600">Quantity: {selectedOrder.quantity}</p>
                            </div>
                            <p className="font-medium text-green-600">₹{selectedOrder.totalAmount}</p>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* Shipping Address */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </h3>
                  {selectedOrder.shippingAddress ? (
                    <div className="bg-white p-3 rounded border">
                      <p className="font-medium">{selectedOrder.shippingAddress.name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedOrder.shippingAddress.addressLine1}
                        {selectedOrder.shippingAddress.addressLine2 && (
                          <><br />{selectedOrder.shippingAddress.addressLine2}</>
                        )}
                        <br />
                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}
                        <br />
                        Phone: {selectedOrder.shippingAddress.phone}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">No shipping address provided</p>
                  )}
                </div>

                <Form {...orderStatusForm}>
                  <form onSubmit={orderStatusForm.handleSubmit((data) => updateOrderStatusMutation.mutate({ orderId: selectedOrder.id, data }))} className="space-y-4">
                    <FormField
                      control={orderStatusForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={selectedOrder.status}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={orderStatusForm.control}
                      name="orderNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Notes</FormLabel>
                          <FormControl>
                            <Input placeholder="Add notes for this order..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={updateOrderStatusMutation.isPending}
                      >
                        {updateOrderStatusMutation.isPending ? "Updating..." : "Update Order"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}