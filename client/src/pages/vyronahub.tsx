import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { useCartStore, useGroupBuyCartStore } from "@/lib/cart-store";

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
  const { addItem, getTotalItems } = useCartStore();
  const groupBuyCart = useGroupBuyCartStore();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  
  const cartItemCount = getTotalItems();

  const { data: user } = useQuery({
    queryKey: ["/api/current-user"],
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: groupBuyProducts = [] } = useQuery({
    queryKey: ["/api/group-buy/products"],
  });

  const { data: groupBuyCampaigns = [] } = useQuery({
    queryKey: ["/api/group-buy/campaigns"],
  });

  const handleAddToCart = (product: any, isGroupBuy = false) => {
    try {
      const cartItem = {
        productId: product.id,
        name: product.name,
        price: product.price,
        discountedPrice: isGroupBuy ? product.price * 0.75 : undefined,
        quantity: quantity,
        imageUrl: product.imageUrl || "/api/placeholder/300/200",
        isGroupBuy,
        groupBuyDiscount: isGroupBuy ? 25 : undefined,
        category: product.category
      };

      addItem(cartItem);
      
      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart successfully!`,
      });
      
      setQuantity(1);
      setIsProductModalOpen(false);
    } catch (error) {
      console.error("Add to cart error:", error);
      toast({
        title: "Error",
        description: "Failed to add product to cart. Please try again.",
        variant: "destructive",
      });
    }
  };



  const filteredProducts = (products as any[])
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <ShoppingBag className="h-10 w-10 text-blue-500" />
              VyronaHub
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Discover amazing products from our sellers</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/cart")}
              className="flex items-center gap-2 relative"
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

        {/* Search and Filter Bar */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 flex gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
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
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                <Card key={groupProduct.id} className="relative overflow-hidden border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:shadow-lg transition-shadow">
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
                        <span className="text-sm font-bold text-purple-600">₹{groupProduct.groupBuyPrice}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Regular:</span>
                        <span className="text-xs text-gray-500 line-through">₹{groupProduct.originalPrice}</span>
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
                onClick={() => setLocation("/social")}
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
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "space-y-4"
            }>
              {filteredProducts.map((product: any) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="relative overflow-hidden">
                    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <ShoppingBag className="h-16 w-16 text-gray-400" />
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="secondary" onClick={() => openProductModal(product)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                        {product.name}
                      </h3>
                      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-500">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">{product.category}</Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-600">4.5</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-blue-600">₹{(product.price / 100).toLocaleString()}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-sm text-gray-500 line-through">₹{(product.originalPrice / 100).toLocaleString()}</span>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleAddToCart(product)}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
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
      </div>
    </div>
  );
}