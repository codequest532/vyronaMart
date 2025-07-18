import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Grid, 
  List, 
  ArrowLeft, 
  ShoppingCart, 
  Heart,
  Star,
  Plus,
  Minus,
  Eye,
  Bell,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import LoginModal from "@/components/auth/login-modal";

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
  { value: "pets", label: "Pet Care" },
  { value: "books", label: "Books" }
];

export default function VyronaHub() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const { requireAuth, showLoginModal, setShowLoginModal } = useAuthGuard();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  
  // Cart query for item count
  const { data: rawCartItems = [] } = useQuery({
    queryKey: ["/api/cart"],
    retry: false,
  });
  
  const cartItems = Array.isArray(rawCartItems) ? rawCartItems : [];
  const cartItemCount = cartItems.length;

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });



  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      return apiRequest("POST", "/api/cart/add", { productId, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to Cart",
        description: "Item has been added to your cart successfully!",
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

  const { data: rawProducts = [], isLoading } = useQuery({
    queryKey: ["/api/products", "vyronahub"],
    queryFn: () => apiRequest("GET", "/api/products?module=vyronahub"),
  });

  const { data: rawGroupBuyProducts = [] } = useQuery({
    queryKey: ["/api/group-buy/products"],
  });

  const { data: rawGroupBuyCampaigns = [] } = useQuery({
    queryKey: ["/api/group-buy/campaigns"],
  });

  // Ensure all data is always an array
  const products = Array.isArray(rawProducts) ? rawProducts : [];
  const groupBuyProducts = Array.isArray(rawGroupBuyProducts) ? rawGroupBuyProducts : [];
  const groupBuyCampaigns = Array.isArray(rawGroupBuyCampaigns) ? rawGroupBuyCampaigns : [];

  const handleAddToCart = (product: any, isGroupBuy = false) => {
    requireAuth("add items to cart", () => {
      if (isGroupBuy) {
        setLocation(`/social?groupBuy=true&productId=${product.id}`);
      } else {
        addToCartMutation.mutate({
          productId: product.id,
          quantity: quantity,
        });
        setQuantity(1);
        setIsProductModalOpen(false);
      }
    });
  };

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



  const openProductModal = (product: any) => {
    setSelectedProduct(product);
    setQuantity(1);
    setIsProductModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Modern Hero Header */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 rounded-3xl p-10 mb-12 text-white shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <ShoppingBag className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold">Welcome to VyronaHub</h1>
                <p className="text-xl opacity-90 mt-2">Discover millions of products from trusted sellers worldwide</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => setLocation("/")}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
              <Button
                variant="secondary"
                onClick={() => requireAuth("view cart", () => setLocation("/cart"))}
                className="flex items-center gap-2 relative bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30"
              >
                <ShoppingCart className="h-4 w-4" />
                Cart
                {cartItemCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
          
          <div className="flex justify-center items-center space-x-8 text-lg">
            <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <div className="p-2 bg-white/20 rounded-lg mr-3">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <span>Secure Shopping</span>
            </div>
            <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <div className="p-2 bg-white/20 rounded-lg mr-3">
                <Users className="h-5 w-5" />
              </div>
              <span>Trusted Community</span>
            </div>
            <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <div className="p-2 bg-white/20 rounded-lg mr-3">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <span>Fast Delivery</span>
            </div>
          </div>
        </div>



        {/* Modern Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-8 shadow-lg border-0">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48 h-12 rounded-xl border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-600">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value} className="rounded-lg">
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 h-5 w-5" />
                <Input
                  placeholder="Search amazing products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 rounded-xl border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-600 text-base"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-44 h-12 rounded-xl border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="newest" className="rounded-lg">Newest First</SelectItem>
                  <SelectItem value="oldest" className="rounded-lg">Oldest First</SelectItem>
                  <SelectItem value="price-low" className="rounded-lg">Price: Low to High</SelectItem>
                  <SelectItem value="price-high" className="rounded-lg">Price: High to Low</SelectItem>
                  <SelectItem value="name" className="rounded-lg">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`h-10 w-10 rounded-lg ${viewMode === "grid" ? "bg-purple-500 hover:bg-purple-600 text-white shadow-lg" : "hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`h-10 w-10 rounded-lg ${viewMode === "list" ? "bg-purple-500 hover:bg-purple-600 text-white shadow-lg" : "hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* VyronaSocial Group Purchase Section */}
        {(groupBuyProducts as any[]).length > 0 && (
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                VyronaSocial Group Purchase
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Two ways to save: Single Product (4+ same items) or Multi-Product (4+ different items). Join VyronaSocial circles to unlock exclusive group discounts.
              </p>
              
              {/* Group Buy Type Tabs */}
              <div className="flex justify-center gap-4 mt-6">
                <Badge variant="outline" className="px-4 py-2">
                  <Users className="w-4 h-4 mr-2" />
                  Single Product: 4+ Same Items
                </Badge>
                <Badge variant="outline" className="px-4 py-2">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Multi-Product: 4+ Different Items
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {(groupBuyProducts as any[]).map((groupProduct: any) => (
                <Card key={groupProduct.id} className="relative overflow-hidden border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => setLocation(`/social/product/${groupProduct.id}`)}>
                  <CardContent className="p-3">
                    <div className="absolute top-2 left-2 z-10">
                      <Badge variant="outline" className="text-xs bg-white/80">
                        {groupProduct.type === "single_product" ? "Single" : "Multi"}
                      </Badge>
                    </div>
                    <img
                      src={groupProduct.imageUrl || "/api/placeholder/150/150"}
                      alt={groupProduct.name}
                      className="w-full h-24 object-cover rounded-md mb-2"
                    />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1 line-clamp-2 h-8">
                      {groupProduct.name}
                    </h3>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Group:</span>
                        <span className="text-sm font-bold text-purple-600">₹{groupProduct.groupBuyPrice || groupProduct.price}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Regular:</span>
                        <span className="text-xs text-gray-500 line-through">₹{groupProduct.originalPrice || (groupProduct.price * 1.2)}</span>
                      </div>
                      <div className="text-center">
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(((groupProduct.originalPrice - groupProduct.groupBuyPrice) / groupProduct.originalPrice) * 100)}% OFF
                        </Badge>
                      </div>
                      <div className="text-center mt-2">
                        <p className="text-xs text-gray-500">
                          Min: {groupProduct.minQuantity || 4} {groupProduct.type === "single_product" ? "same items" : "total items"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center">
              <Button 
                size="lg"
                onClick={() => requireAuth("access group shopping", () => setLocation("/social"))}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold shadow-lg transform hover:scale-105 transition-all"
              >
                <Users className="w-6 h-6 mr-3" />
                Join VyronaSocial Circle
              </Button>
              <p className="text-sm text-gray-500 mt-3 max-w-md mx-auto">
                Connect with friends and unlock group discounts on these seller-approved products
              </p>
            </div>
          </div>
        )}

        {/* Regular Products Grid/List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {selectedCategory === "all" ? "All Products" : categories.find(c => c.value === selectedCategory)?.label}
            </h2>
            <Badge variant="secondary" className="text-sm">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
            </Badge>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card className="p-12 text-center">
              <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Products Found</h3>
              <p className="text-gray-500">Try adjusting your search criteria or browse different categories</p>
            </Card>
          ) : (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" 
              : "space-y-4"
            }>
              {filteredProducts.map((product: any) => (
                <Card key={product.id} className="hover:shadow-lg transition-all duration-300 cursor-pointer group hover:scale-[1.02] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="relative overflow-hidden rounded-t-lg" onClick={() => {
                    // Route to appropriate detail page based on product module
                    if (product.module === 'vyronasocial' || product.enableGroupBuy) {
                      setLocation(`/social/product/${product.id}`);
                    } else if (product.module === 'vyronaread' || product.category === 'books' || product.category === 'library-books') {
                      setLocation(`/read/product/${product.id}`);
                    } else {
                      setLocation(`/product/${product.id}`);
                    }
                  }}>
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                        <div className="text-center">
                          <ShoppingBag className="h-12 w-12 text-purple-400 mx-auto mb-1" />
                          <span className="text-xs text-purple-600 font-medium">Product Image</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-purple-500 text-white border-0 text-xs">NEW</Badge>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="text-gray-400 hover:text-red-500 bg-white/90 hover:bg-white shadow-lg h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) showLogin();
                        }}
                      >
                        <Heart className="h-3 w-3" />
                      </Button>
                    </div>
                    {product.enableGroupBuy && (
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="secondary" className="bg-green-500 text-white border-0 text-xs">
                          <Users className="h-2 w-2 mr-1" />
                          Group
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <div className="mb-3" onClick={() => {
                      // Route to appropriate detail page based on product module
                      if (product.module === 'vyronasocial' || product.enableGroupBuy) {
                        setLocation(`/social/product/${product.id}`);
                      } else if (product.module === 'vyronaread' || product.category === 'books' || product.category === 'library-books') {
                        setLocation(`/read/product/${product.id}`);
                      } else {
                        setLocation(`/product/${product.id}`);
                      }
                    }}>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1">
                        {product.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="border-purple-200 text-purple-700 text-xs">{product.category}</Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-600">4.2</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-purple-600">₹{product.price}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-xs text-gray-500 line-through">₹{product.originalPrice}</span>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-3 py-1 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-xs"
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Product Detail Modal */}
        <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedProduct?.name}</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-6">
                <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="h-24 w-24 text-gray-400" />
                </div>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">{selectedProduct.description}</p>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{selectedProduct.category}</Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600">4.5 (123 reviews)</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-blue-600">₹{selectedProduct.price}</span>
                      {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                        <span className="text-lg text-gray-500 line-through ml-2">₹{selectedProduct.originalPrice}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center">{quantity}</span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setQuantity(quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button 
                        onClick={() => handleAddToCart(selectedProduct)}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Login Modal */}
        <LoginModal 
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </div>
    </div>
  );
}