import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Heart, 
  Star, 
  Plus,
  Smartphone,
  Laptop,
  Shirt,
  Home as HomeIcon,
  Utensils,
  BookOpen,
  Gamepad2,
  Car,
  Package,
  TrendingUp,
  Eye,
  ShoppingCart,
  Zap,
  Minus,
  Plus as PlusIcon,
  CreditCard,
  Truck,
  Shield,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/mock-data";
import { useUserData } from "@/hooks/use-user-data";

const addProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().min(0, "Price must be positive"),
  originalPrice: z.number().optional(),
  category: z.string().min(1, "Category is required"),
  module: z.string().min(1, "Module is required"),
  imageUrl: z.string().url("Valid image URL is required"),
  additionalImages: z.string().optional(),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  stockQuantity: z.number().min(0, "Stock quantity cannot be negative"),
  weight: z.number().optional(),
  dimensions: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  material: z.string().optional(),
  warranty: z.string().optional(),
  features: z.string().optional(),
  specifications: z.string().optional(),
  tags: z.string().optional(),
  isActive: z.boolean().default(true),
});

export default function VyronaHub() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUserData();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Fetch products with filtering
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products", selectedCategory, searchQuery],
    queryFn: async () => {
      let url = "/api/products";
      const params = new URLSearchParams();
      
      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      return response.json();
    },
  });

  // Fetch stores for context
  const { data: stores = [] } = useQuery({
    queryKey: ["/api/stores"],
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (productData: z.infer<typeof addProductSchema>) => {
      return await apiRequest("/api/products", "POST", productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product Added",
        description: "New product has been successfully added to VyronaHub!",
      });
    },
    onError: () => {
      toast({
        title: "Add Failed",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      return await apiRequest("/api/cart", "POST", {
        userId: user?.id,
        productId,
        quantity,
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to Cart",
        description: `${quantity} item(s) added to your cart successfully!`,
      });
    },
    onError: () => {
      toast({
        title: "Failed to Add",
        description: "Could not add item to cart. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Buy now action
  const handleBuyNow = (product: any, quantity: number) => {
    // In a real app, this would initiate the checkout process
    toast({
      title: "Redirecting to Checkout",
      description: `Processing purchase of ${quantity} ${product.name}(s) for ${formatCurrency(product.price * quantity)}`,
    });
    // Close the modal
    setIsProductModalOpen(false);
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setQuantity(1);
    setIsProductModalOpen(true);
  };

  const form = useForm<z.infer<typeof addProductSchema>>({
    resolver: zodResolver(addProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      originalPrice: undefined,
      category: "",
      module: "VyronaHub",
      imageUrl: "",
      additionalImages: "",
      brand: "",
      model: "",
      sku: "",
      stockQuantity: 0,
      weight: undefined,
      dimensions: "",
      color: "",
      size: "",
      material: "",
      warranty: "",
      features: "",
      specifications: "",
      tags: "",
      isActive: true,
    },
  });

  const onSubmit = (values: z.infer<typeof addProductSchema>) => {
    addProductMutation.mutate(values);
  };

  // Product categories with icons
  const categories = [
    { id: "all", name: "All Products", icon: Package, count: products.length },
    { id: "electronics", name: "Electronics", icon: Smartphone, count: products.filter((p: any) => p.category === "electronics").length },
    { id: "fashion", name: "Fashion & Apparels", icon: Shirt, count: products.filter((p: any) => p.category === "fashion").length },
    { id: "home", name: "Home & Kitchen", icon: HomeIcon, count: products.filter((p: any) => p.category === "home").length },
    { id: "kids", name: "Kids Corner", icon: Heart, count: products.filter((p: any) => p.category === "kids").length },
    { id: "organic", name: "Organic Store", icon: Utensils, count: products.filter((p: any) => p.category === "organic").length },
    { id: "groceries", name: "Groceries", icon: ShoppingBag, count: products.filter((p: any) => p.category === "groceries").length },
    { id: "automation", name: "Home Automation", icon: Laptop, count: products.filter((p: any) => p.category === "automation").length },
    { id: "office", name: "Office & Stationery", icon: BookOpen, count: products.filter((p: any) => p.category === "office").length },
    { id: "health", name: "Health & Wellness", icon: Plus, count: products.filter((p: any) => p.category === "health").length },
    { id: "pets", name: "Pet Care", icon: Heart, count: products.filter((p: any) => p.category === "pets").length },
  ];

  // Filter and sort products
  const filteredProducts = products
    .filter((product: any) => {
      if (selectedCategory !== "all" && product.category !== selectedCategory) return false;
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "name":
          return a.name.localeCompare(b.name);
        default: // newest
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <ShoppingBag className="h-10 w-10 text-blue-500" />
              VyronaHub
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Your smart shopping destination</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
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
                          name="brand"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Brand *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter brand name" {...field} />
                              </FormControl>
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
                              <textarea 
                                className="w-full min-h-[100px] p-3 border rounded-md resize-none"
                                placeholder="Detailed product description to help customers understand the product benefits and features..." 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                  <SelectItem value="groceries">Groceries</SelectItem>
                                  <SelectItem value="automation">Home Automation</SelectItem>
                                  <SelectItem value="office">Office & Stationery</SelectItem>
                                  <SelectItem value="health">Health & Wellness</SelectItem>
                                  <SelectItem value="pets">Pet Care</SelectItem>
                                </SelectContent>
                              </Select>
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
                                <Input placeholder="Product SKU/Code" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="details" className="space-y-4 mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Selling Price (₹) *</FormLabel>
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
                          control={form.control}
                          name="originalPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Original Price (₹)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="model"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Model Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Model number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="color"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Color</FormLabel>
                              <FormControl>
                                <Input placeholder="Product color" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="size"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Size</FormLabel>
                              <FormControl>
                                <Input placeholder="Product size" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="material"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Material</FormLabel>
                              <FormControl>
                                <Input placeholder="Material used" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="warranty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Warranty Information</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 1 year manufacturer warranty" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="features"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Key Features</FormLabel>
                            <FormControl>
                              <textarea 
                                className="w-full min-h-[80px] p-3 border rounded-md resize-none"
                                placeholder="List key features separated by commas or new lines..." 
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
                            <FormLabel>Main Product Image URL *</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/main-image.jpg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="additionalImages"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Images</FormLabel>
                            <FormControl>
                              <textarea 
                                className="w-full min-h-[80px] p-3 border rounded-md resize-none"
                                placeholder="Additional image URLs, one per line..." 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Search Tags</FormLabel>
                            <FormControl>
                              <Input placeholder="trending, bestseller, premium, eco-friendly..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    
                    <TabsContent value="inventory" className="space-y-4 mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="stockQuantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stock Quantity *</FormLabel>
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
                          control={form.control}
                          name="weight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Weight (kg)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  placeholder="0.00" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                />
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
                              <Input placeholder="Length x Width x Height (cm)" {...field} />
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
                              <textarea 
                                className="w-full min-h-[100px] p-3 border rounded-md resize-none"
                                placeholder="Detailed technical specifications that customers need to know..." 
                                {...field} 
                              />
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{products.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <HomeIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stores.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Stores</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{categories.length - 1}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Categories</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">Live</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Real-time Updates</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-between ${
                        selectedCategory === category.id
                          ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <div className="flex items-center gap-3">
                        <category.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {category.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="name">Name: A to Z</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex border rounded-md">
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className="rounded-r-none"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                        className="rounded-l-none"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Grid/List */}
            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                  <h3 className="text-lg font-medium mb-2">No products found</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery || selectedCategory !== "all" 
                      ? "Try adjusting your search or filters" 
                      : "Be the first to add a product to VyronaHub!"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className={
                viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }>
                {filteredProducts.map((product: any) => (
                  <Card key={product.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleProductClick(product)}>
                    <CardContent className={viewMode === "grid" ? "p-4" : "p-4 flex gap-4"}>
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className={
                          viewMode === "grid"
                            ? "w-full h-48 object-cover rounded-lg mb-3"
                            : "w-24 h-24 object-cover rounded-lg flex-shrink-0"
                        }
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg">{product.name}</h3>
                          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-green-600">
                              {formatCurrency(product.price)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {product.category}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                4.5 (124)
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCartMutation.mutate({ productId: product.id, quantity: 1 });
                              }}
                              disabled={addToCartMutation.isPending}
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Detail Modal */}
        <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedProduct && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">{selectedProduct.name}</DialogTitle>
                  <DialogDescription>
                    Product details and purchase options
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Product Image */}
                  <div className="space-y-4">
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="w-full h-96 object-cover rounded-lg border"
                    />
                    <div className="grid grid-cols-4 gap-2">
                      {/* Additional product images would go here */}
                      <img
                        src={selectedProduct.imageUrl}
                        alt="Product view 1"
                        className="w-full h-20 object-cover rounded border cursor-pointer opacity-60 hover:opacity-100"
                      />
                      <img
                        src={selectedProduct.imageUrl}
                        alt="Product view 2"
                        className="w-full h-20 object-cover rounded border cursor-pointer opacity-60 hover:opacity-100"
                      />
                      <img
                        src={selectedProduct.imageUrl}
                        alt="Product view 3"
                        className="w-full h-20 object-cover rounded border cursor-pointer opacity-60 hover:opacity-100"
                      />
                      <img
                        src={selectedProduct.imageUrl}
                        alt="Product view 4"
                        className="w-full h-20 object-cover rounded border cursor-pointer opacity-60 hover:opacity-100"
                      />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{selectedProduct.category}</Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          4.5 (124 reviews)
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-green-600 mb-4">
                        {formatCurrency(selectedProduct.price)}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {selectedProduct.description}
                      </p>
                    </div>

                    <Separator />

                    {/* Product Features */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">Key Features:</h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          High quality materials and construction
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          1 year manufacturer warranty
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Fast and reliable delivery
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          30-day return policy
                        </li>
                      </ul>
                    </div>

                    <Separator />

                    {/* Quantity Selection */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">Quantity:</h4>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">{quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(quantity + 1)}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Total: {formatCurrency(selectedProduct.price * quantity)}
                      </p>
                    </div>

                    <Separator />

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Button
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        size="lg"
                        onClick={() => handleBuyNow(selectedProduct, quantity)}
                      >
                        <CreditCard className="h-5 w-5 mr-2" />
                        Buy Now - {formatCurrency(selectedProduct.price * quantity)}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        size="lg"
                        onClick={() => {
                          addToCartMutation.mutate({ productId: selectedProduct.id, quantity });
                          setIsProductModalOpen(false);
                        }}
                        disabled={addToCartMutation.isPending}
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                      </Button>
                    </div>

                    {/* Delivery Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Free delivery</span>
                        <span className="text-gray-600 dark:text-gray-400">on orders above ₹499</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Secure payments</span>
                        <span className="text-gray-600 dark:text-gray-400">100% secure transactions</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}