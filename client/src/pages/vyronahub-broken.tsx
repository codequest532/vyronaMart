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
  CheckCircle,
  Upload,
  X,
  Image,
  Video,
  Cloud,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/mock-data";
import { useUserData } from "@/hooks/use-user-data";
import { useLocation } from "wouter";

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
  const [location, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{
    mainImage: File | null;
    additionalMedia: File[];
  }>({
    mainImage: null,
    additionalMedia: []
  });
  const [isUploading, setIsUploading] = useState(false);

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

  // File upload handlers
  const handleMainImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedFiles(prev => ({ ...prev, mainImage: file }));
      // Create URL for preview
      const imageUrl = URL.createObjectURL(file);
      form.setValue('imageUrl', imageUrl);
    }
  };

  const handleAdditionalMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const mediaFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    const currentImages = uploadedFiles.additionalMedia.filter(file => file.type.startsWith('image/')).length;
    const currentVideos = uploadedFiles.additionalMedia.filter(file => file.type.startsWith('video/')).length;
    const newImages = mediaFiles.filter(file => file.type.startsWith('image/')).length;
    const newVideos = mediaFiles.filter(file => file.type.startsWith('video/')).length;
    
    if (currentImages + newImages > 5) {
      toast({
        title: "Upload Limit",
        description: "You can upload maximum 5 images",
        variant: "destructive",
      });
      return;
    }
    
    if (currentVideos + newVideos > 2) {
      toast({
        title: "Upload Limit",
        description: "You can upload maximum 2 videos",
        variant: "destructive",
      });
      return;
    }
    
    if (uploadedFiles.additionalMedia.length + mediaFiles.length > 7) {
      toast({
        title: "Upload Limit",
        description: "You can upload maximum 7 files total (5 images + 2 videos)",
        variant: "destructive",
      });
      return;
    }
    
    setUploadedFiles(prev => ({
      ...prev,
      additionalMedia: [...prev.additionalMedia, ...mediaFiles]
    }));
  };

  const removeAdditionalMedia = (index: number) => {
    setUploadedFiles(prev => ({
      ...prev,
      additionalMedia: prev.additionalMedia.filter((_, i) => i !== index)
    }));
  };

  const openGoogleDrivePicker = () => {
    // Google Drive picker implementation
    toast({
      title: "Google Drive Integration",
      description: "Google Drive picker will be implemented with proper API keys",
    });
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
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
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
                    
                    <TabsContent value="images" className="space-y-6 mt-6">
                      {/* Main Product Image Upload */}
                      <div className="space-y-4">
                        <FormLabel>Main Product Image *</FormLabel>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                          {uploadedFiles.mainImage ? (
                            <div className="relative">
                              <img
                                src={URL.createObjectURL(uploadedFiles.mainImage)}
                                alt="Main product"
                                className="w-full h-48 object-cover rounded-lg"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => {
                                  setUploadedFiles(prev => ({ ...prev, mainImage: null }));
                                  form.setValue('imageUrl', '');
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Image className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="mt-4">
                                <div className="flex justify-center gap-2">
                                  <Button type="button" variant="outline" className="relative">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload from Device
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleMainImageUpload}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={openGoogleDrivePicker}
                                  >
                                    <Cloud className="h-4 w-4 mr-2" />
                                    Google Drive
                                  </Button>
                                </div>
                                <p className="mt-2 text-sm text-gray-500">
                                  Upload high-quality product images (PNG, JPG, JPEG)
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        <FormField
                          control={form.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem className="hidden">
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Additional Images/Videos Upload */}
                      <div className="space-y-4">
                        <FormLabel>Additional Images/Videos (Max 5 images + 2 videos)</FormLabel>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            {uploadedFiles.additionalMedia.map((file, index) => (
                              <div key={index} className="relative">
                                {file.type.startsWith('image/') ? (
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={`Media ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="relative">
                                    <video
                                      src={URL.createObjectURL(file)}
                                      className="w-full h-24 object-cover rounded-lg"
                                      controls
                                    />
                                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
                                      <Video className="h-3 w-3 inline mr-1" />
                                      Video
                                    </div>
                                  </div>
                                )}
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-1 right-1 h-6 w-6 p-0"
                                  onClick={() => removeAdditionalMedia(index)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          
                          {(() => {
                            const currentImages = uploadedFiles.additionalMedia.filter(file => file.type.startsWith('image/')).length;
                            const currentVideos = uploadedFiles.additionalMedia.filter(file => file.type.startsWith('video/')).length;
                            const canUploadMore = currentImages < 5 || currentVideos < 2;
                            
                            return canUploadMore && (
                              <div className="text-center">
                                <div className="flex justify-center gap-2">
                                  <Button type="button" variant="outline" size="sm" className="relative">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Images/Videos
                                    <input
                                      type="file"
                                      accept="image/*,video/*"
                                      multiple
                                      onChange={handleAdditionalMediaUpload}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={openGoogleDrivePicker}
                                  >
                                    <Cloud className="h-4 w-4 mr-2" />
                                    Google Drive
                                  </Button>
                                </div>
                                <p className="mt-2 text-xs text-gray-500">
                                  {currentImages}/5 images • {currentVideos}/2 videos • Supports JPG, PNG, MP4, MOV
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      
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



        {/* Unified Search and Filter Bar */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Category Dropdown */}
              <div className="w-full lg:w-64">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <Package className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>All Products</span>
                        <Badge variant="secondary" className="ml-2">
                          {products.length}
                        </Badge>
                      </div>
                    </SelectItem>
                    {categories.slice(1).map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <category.icon className="h-4 w-4" />
                          <span>{category.name}</span>
                          <Badge variant="secondary" className="ml-2">
                            {category.count}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products by name, brand, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Controls */}
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
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
            
            {/* Active Filters Display */}
            {(selectedCategory !== "all" || searchQuery) && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
                {selectedCategory !== "all" && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    {categories.find(c => c.id === selectedCategory)?.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setSelectedCategory("all")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Search: "{searchQuery}"
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSearchQuery("");
                  }}
                  className="text-xs"
                >
                  Clear all
                </Button>
              </div>
            )}
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
                              {formatCurrency(product.price}
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
                        {formatCurrency(selectedProduct.price}
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

        {/* Unified Search and Filter Bar */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 flex gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
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

                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <Grid className="h-4 w-4" />
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

        {/* Products Section */}
        {products.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                No Products Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {selectedCategory === "all" 
                  ? "Start building your product catalog by adding your first product."
                  : `No products found in ${categories.find(c => c.value === selectedCategory)?.label} category.`}
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Product
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group cursor-pointer hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-0">
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-t-lg overflow-hidden">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-600">
                        ₹{(product.price / 100).toLocaleString()}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsProductModalOpen(true);
                        }}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Product Details Modal */}
        <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProduct?.name}</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  {selectedProduct.imageUrl ? (
                    <img 
                      src={selectedProduct.imageUrl} 
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-24 w-24 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedProduct.name}</h2>
                    <p className="text-gray-600 dark:text-gray-300">{selectedProduct.description}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-3xl font-bold text-blue-600">
                        ₹{(selectedProduct.price / 100).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="quantity">Quantity:</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(Number(e.target.value))}
                          className="w-20"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Heart className="h-4 w-4 mr-2" />
                        Wishlist
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}