import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Instagram, ShoppingBag, TrendingUp, Users, Link2, AlertTriangle, CheckCircle, Eye, Heart, MessageCircle, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/mock-data";

const connectInstagramSchema = z.object({
  instagramUsername: z.string().min(1, "Instagram username is required"),
  storeName: z.string().min(1, "Store name is required"),
  storeDescription: z.string().optional(),
});

export default function VyronaInstaShop() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  
  // Mock user ID for demo - in real app this would come from auth
  const currentUserId = 1;

  // Fetch user's connected Instagram stores
  const { data: instagramStores = [], isLoading: storesLoading } = useQuery({
    queryKey: ["/api/instashop/stores", currentUserId],
  });

  // Fetch products for selected store
  const { data: storeProducts = [] } = useQuery({
    queryKey: ["/api/instashop/products", selectedStore],
    enabled: !!selectedStore,
  });

  // Fetch orders for selected store
  const { data: storeOrders = [] } = useQuery({
    queryKey: ["/api/instashop/orders", selectedStore],
    enabled: !!selectedStore,
  });

  // Fetch analytics for selected store
  const { data: storeAnalytics = [] } = useQuery({
    queryKey: ["/api/instashop/analytics", selectedStore],
    enabled: !!selectedStore,
  });

  // Connect Instagram store mutation
  const connectStoreMutation = useMutation({
    mutationFn: async (storeData: z.infer<typeof connectInstagramSchema>) => {
      return await apiRequest("/api/instashop/connect", "POST", {
        ...storeData,
        userId: currentUserId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instashop/stores"] });
      toast({
        title: "Instagram Store Connected",
        description: "Your Instagram store has been successfully connected to VyronaMart!",
      });
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Failed to connect Instagram store. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Sync products mutation
  const syncProductsMutation = useMutation({
    mutationFn: async (storeId: number) => {
      return await apiRequest(`/api/instashop/stores/${storeId}/sync`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instashop/products"] });
      toast({
        title: "Products Synced",
        description: "Your Instagram products have been synced successfully!",
      });
    },
  });

  const form = useForm<z.infer<typeof connectInstagramSchema>>({
    resolver: zodResolver(connectInstagramSchema),
    defaultValues: {
      instagramUsername: "",
      storeName: "",
      storeDescription: "",
    },
  });

  const onSubmit = (values: z.infer<typeof connectInstagramSchema>) => {
    connectStoreMutation.mutate(values);
  };

  // Mock data for demonstration
  const mockStores = [
    {
      id: 1,
      instagramUsername: "@fashionboutique_delhi",
      storeName: "Fashion Boutique Delhi",
      storeDescription: "Trendy fashion for modern women",
      followersCount: 15420,
      isActive: true,
      profilePictureUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&h=150&fit=crop&crop=face",
      connectedAt: new Date().toISOString(),
    }
  ];

  const mockProducts = [
    {
      id: 1,
      productName: "Elegant Summer Dress",
      description: "Perfect for summer occasions",
      price: 2999,
      imageUrl: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&h=300&fit=crop",
      likesCount: 234,
      commentsCount: 45,
      isAvailable: true,
      categoryTag: "Dresses",
    },
    {
      id: 2,
      productName: "Designer Handbag",
      description: "Luxury leather handbag",
      price: 4599,
      imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop",
      likesCount: 156,
      commentsCount: 23,
      isAvailable: true,
      categoryTag: "Accessories",
    }
  ];

  const mockOrders = [
    {
      id: 1,
      productId: 1,
      quantity: 1,
      totalAmount: 2999,
      status: "pending",
      createdAt: new Date().toISOString(),
    }
  ];

  const selectedStoreData = mockStores.find(s => s.id === selectedStore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Instagram className="h-10 w-10 text-pink-500" />
              VyronaInstaShop
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Connect and manage your Instagram stores seamlessly</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                <Link2 className="h-4 w-4 mr-2" />
                Connect Instagram Store
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect Instagram Store</DialogTitle>
                <DialogDescription>
                  Connect your Instagram business account to start selling on VyronaMart.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="instagramUsername"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram Username</FormLabel>
                        <FormControl>
                          <Input placeholder="@your_store_name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
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
                    control={form.control}
                    name="storeDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Description (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief description of your store" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        <p className="font-medium mb-1">Instagram Business Account Required</p>
                        <p>Make sure your Instagram account is set up as a business account to enable shopping features and product tagging.</p>
                      </div>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={connectStoreMutation.isPending}>
                    {connectStoreMutation.isPending ? "Connecting..." : "Connect Store"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stores Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Connected Stores
                </CardTitle>
              </CardHeader>
              <CardContent>
                {storesLoading ? (
                  <div className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : mockStores.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Instagram className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No stores connected</p>
                    <p className="text-sm">Connect your first Instagram store!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mockStores.map((store: any) => (
                      <div
                        key={store.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedStore === store.id
                            ? "bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-700"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                        onClick={() => setSelectedStore(store.id)}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <img
                            src={store.profilePictureUrl}
                            alt={store.storeName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{store.storeName}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{store.instagramUsername}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant={store.isActive ? "default" : "secondary"} className="text-xs">
                            {store.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Users className="h-3 w-3" />
                            {store.followersCount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedStore ? (
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="products">Products</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          Store Overview
                          <Button 
                            onClick={() => selectedStore && syncProductsMutation.mutate(selectedStore)}
                            disabled={syncProductsMutation.isPending}
                            size="sm"
                          >
                            {syncProductsMutation.isPending ? "Syncing..." : "Sync Products"}
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedStoreData && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                              <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                              <p className="text-2xl font-bold text-blue-600">{selectedStoreData.followersCount.toLocaleString()}</p>
                              <p className="text-sm text-blue-600/80">Followers</p>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                              <ShoppingBag className="h-6 w-6 mx-auto mb-2 text-green-600" />
                              <p className="text-2xl font-bold text-green-600">{mockProducts.length}</p>
                              <p className="text-sm text-green-600/80">Products</p>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                              <p className="text-2xl font-bold text-purple-600">{mockOrders.length}</p>
                              <p className="text-sm text-purple-600/80">Orders</p>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-lg">
                              <DollarSign className="h-6 w-6 mx-auto mb-2 text-pink-600" />
                              <p className="text-2xl font-bold text-pink-600">₹{mockOrders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}</p>
                              <p className="text-sm text-pink-600/80">Revenue</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Connection Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800 dark:text-green-200">Instagram Store Connected</p>
                            <p className="text-sm text-green-600 dark:text-green-300">
                              Last synced: {new Date().toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Products Tab */}
                <TabsContent value="products">
                  <Card>
                    <CardHeader>
                      <CardTitle>Instagram Products</CardTitle>
                      <CardDescription>Products synced from your Instagram account</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mockProducts.map((product: any) => (
                          <div key={product.id} className="border rounded-lg p-4 space-y-3">
                            <img
                              src={product.imageUrl}
                              alt={product.productName}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <div>
                              <h3 className="font-medium">{product.productName}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {product.description}
                              </p>
                              <div className="flex items-center justify-between mt-3">
                                <p className="text-lg font-bold text-green-600">
                                  {formatCurrency(product.price)}
                                </p>
                                <Badge variant={product.isAvailable ? "default" : "secondary"}>
                                  {product.isAvailable ? "Available" : "Out of Stock"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Heart className="h-4 w-4" />
                                  {product.likesCount}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="h-4 w-4" />
                                  {product.commentsCount}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {product.categoryTag}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Orders</CardTitle>
                      <CardDescription>Orders from your Instagram store</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {mockOrders.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No orders yet</p>
                          <p className="text-sm">Orders will appear here when customers make purchases</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {mockOrders.map((order: any) => (
                            <div key={order.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">Order #{order.id}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">{formatCurrency(order.totalAmount)}</p>
                                  <Badge 
                                    variant={
                                      order.status === "pending" ? "secondary" :
                                      order.status === "confirmed" ? "default" :
                                      order.status === "shipped" ? "default" : "destructive"
                                    }
                                  >
                                    {order.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Performance Analytics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 border rounded-lg">
                            <Eye className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                            <p className="text-2xl font-bold">12.5K</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Impressions</p>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <Users className="h-6 w-6 mx-auto mb-2 text-green-600" />
                            <p className="text-2xl font-bold">8.2K</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Reach</p>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                            <p className="text-2xl font-bold">347</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Profile Views</p>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <Heart className="h-6 w-6 mx-auto mb-2 text-pink-600" />
                            <p className="text-2xl font-bold">1.2K</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Likes</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Sales Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>Analytics dashboard</p>
                          <p className="text-sm">Detailed analytics will be available once you have more data</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Instagram className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                  <h3 className="text-lg font-medium mb-2">Select an Instagram Store</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose a connected store from the sidebar to view details and manage your Instagram business.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}