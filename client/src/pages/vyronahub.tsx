import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Grid, 
  List, 
  Package, 
  ShoppingCart, 
  Heart,
  ArrowLeft,
  Upload,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const categories = [
  { value: "all", label: "All Categories" },
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion & Apparels" },
  { value: "home", label: "Home & Kitchen" },
  { value: "kids", label: "Kids Corner" },
  { value: "organic", label: "Organic Store" },
  { value: "groceries", label: "Groceries" },
  { value: "automation", label: "Home Automation" },
  { value: "office", label: "Office & Stationery" },
  { value: "health", label: "Health & Wellness" },
  { value: "pets", label: "Pet Care" }
];

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Product description is required"),
  price: z.number().min(0, "Price must be positive"),
  category: z.string().min(1, "Category is required"),
  sku: z.string().min(1, "SKU is required"),
  originalPrice: z.number().optional(),
  brand: z.string().optional(),
  weight: z.string().optional(),
  dimensions: z.string().optional(),
  specifications: z.string().optional(),
  tags: z.string().optional(),
  isActive: z.boolean().default(true),
});

export default function VyronaHub() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
    additionalMedia: [],
  });

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      sku: "",
      originalPrice: 0,
      brand: "",
      weight: "",
      dimensions: "",
      specifications: "",
      tags: "",
      isActive: true,
    },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: stores = [] } = useQuery({
    queryKey: ["/api/stores"],
  });

  const addProductMutation = useMutation({
    mutationFn: async (productData: z.infer<typeof productSchema>) => {
      return await apiRequest("/api/products", {
        method: "POST",
        body: JSON.stringify({ ...productData, module: "vyronahub" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product added successfully!",
      });
      form.reset();
      setUploadedFiles({ mainImage: null, additionalMedia: [] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products
    .filter((product: any) => {
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "name":
          return a.name.localeCompare(b.name);
        case "oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

  const onSubmit = (values: z.infer<typeof productSchema>) => {
    addProductMutation.mutate(values);
  };

  const handleFileUpload = (files: FileList | null, type: 'main' | 'additional') => {
    if (!files) return;
    
    if (type === 'main') {
      setUploadedFiles(prev => ({ ...prev, mainImage: files[0] }));
    } else {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => ({
        ...prev,
        additionalMedia: [...prev.additionalMedia, ...newFiles].slice(0, 7)
      }));
    }
  };

  const removeFile = (index: number, type: 'main' | 'additional') => {
    if (type === 'main') {
      setUploadedFiles(prev => ({ ...prev, mainImage: null }));
    } else {
      setUploadedFiles(prev => ({
        ...prev,
        additionalMedia: prev.additionalMedia.filter((_, i) => i !== index)
      }));
    }
  };

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
                                <FormLabel>Brand</FormLabel>
                                <FormControl>
                                  <Input placeholder="Product brand" {...field} />
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
                                  <Input placeholder="e.g., 500g, 1.2kg" {...field} />
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

                      <TabsContent value="images" className="space-y-6 mt-6">
                        {/* Main Product Image */}
                        <div className="space-y-4">
                          <Label className="text-lg font-medium">Main Product Image</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                            {uploadedFiles.mainImage ? (
                              <div className="relative">
                                <img 
                                  src={URL.createObjectURL(uploadedFiles.mainImage)} 
                                  alt="Main product" 
                                  className="w-32 h-32 object-cover rounded-lg mx-auto"
                                />
                                <Button 
                                  type="button"
                                  variant="destructive" 
                                  size="sm"
                                  className="absolute -top-2 -right-2"
                                  onClick={() => removeFile(0, 'main')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="text-center">
                                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <div className="space-y-2">
                                  <Label htmlFor="main-image" className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 inline-block">
                                    Upload Main Image
                                  </Label>
                                  <Input
                                    id="main-image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e.target.files, 'main')}
                                    className="hidden"
                                  />
                                  <p className="text-sm text-gray-500">JPG, PNG up to 10MB</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Additional Media */}
                        <div className="space-y-4">
                          <Label className="text-lg font-medium">Additional Images & Videos (Optional)</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                            <div className="space-y-4">
                              {uploadedFiles.additionalMedia.length > 0 && (
                                <div className="grid grid-cols-3 gap-4">
                                  {uploadedFiles.additionalMedia.map((file, index) => (
                                    <div key={index} className="relative">
                                      {file.type.startsWith('image/') ? (
                                        <img 
                                          src={URL.createObjectURL(file)} 
                                          alt={`Additional ${index + 1}`} 
                                          className="w-full h-24 object-cover rounded-lg"
                                        />
                                      ) : (
                                        <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                                          <span className="text-sm text-gray-600">Video {index + 1}</span>
                                        </div>
                                      )}
                                      <Button 
                                        type="button"
                                        variant="destructive" 
                                        size="sm"
                                        className="absolute -top-2 -right-2"
                                        onClick={() => removeFile(index, 'additional')}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {uploadedFiles.additionalMedia.length < 7 && (
                                <div className="text-center">
                                  <div className="space-y-2">
                                    <Label htmlFor="additional-media" className="cursor-pointer bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 inline-block">
                                      Add More Media
                                    </Label>
                                    <Input
                                      id="additional-media"
                                      type="file"
                                      accept="image/*,video/*"
                                      multiple
                                      onChange={(e) => handleFileUpload(e.target.files, 'additional')}
                                      className="hidden"
                                    />
                                    <p className="text-sm text-gray-500">
                                      Up to {7 - uploadedFiles.additionalMedia.length} more files (Images: JPG, PNG | Videos: MP4, MOV up to 50MB each)
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
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
            {filteredProducts.map((product: any) => (
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