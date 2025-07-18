import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Instagram, 
  ShoppingCart, 
  Heart, 
  Star, 
  Filter, 
  Search, 
  Package, 
  Eye, 
  Shield, 
  Truck, 
  CreditCard, 
  Verified,
  ArrowLeft,
  Grid3X3,
  List,
  SlidersHorizontal,
  Video,
  Phone,
  MessageCircle,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Send,
  ShoppingBag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import LoginModal from "@/components/auth/login-modal";

export default function VyronaInstaShop() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { requireAuth, showLoginModal, setShowLoginModal } = useAuthGuard();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // Chat states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatProducts, setChatProducts] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");

  // Fetch Instagram products for customers
  const { data: instagramProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/instagram/products"],
  });

  // Fetch Instagram stores
  const { data: instagramStores = [], isLoading: storesLoading } = useQuery({
    queryKey: ["/api/instagram/stores"],
  });

  // Fetch Instagram cart items
  const { data: cartItems = [] } = useQuery({
    queryKey: ["/api/instacart"],
  });

  // Type-safe cart items
  const safeCartItems = Array.isArray(cartItems) ? cartItems : [];

  // Add to Instagram cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (productData: any) => {
      return await apiRequest("POST", "/api/instacart/add", productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instacart"] });
      toast({
        title: "Added to Instagram Cart",
        description: "Product added to your Instagram cart successfully!",
      });
    },
    onError: (error: any) => {
      if (error.message?.includes("Authentication required") || error.message?.includes("401")) {
        toast({
          title: "Login Required",
          description: "Please log in to add items to your cart",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation('/login');
        }, 1500);
      } else {
        toast({
          title: "Error",
          description: "Failed to add product to Instagram cart. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Chat functions
  const startChat = (seller: any) => {
    setSelectedSeller(seller);
    setIsChatOpen(true);
    setChatMessages([]);
    setChatProducts(seller.products || []);
    
    // Add initial greeting message
    setTimeout(() => {
      setChatMessages([{
        id: 1,
        sender: "seller",
        message: `Hi! I'm ${seller.name} from Instagram. How can I help you with our products today?`,
        timestamp: new Date()
      }]);
    }, 500);
  };

  const endChat = () => {
    setIsChatOpen(false);
    setSelectedSeller(null);
    setChatMessages([]);
    setChatProducts([]);
  };

  const sendMessage = () => {
    if (!messageInput.trim()) return;
    
    const newMessage = {
      id: chatMessages.length + 1,
      sender: "customer",
      message: messageInput,
      timestamp: new Date()
    };
    
    setChatMessages([...chatMessages, newMessage]);
    setMessageInput("");
    
    // Simulate seller response
    setTimeout(() => {
      const responses = [
        "That's a great choice! Would you like to know more about this product?",
        "I can offer you a special discount on this item!",
        "This product is very popular among our customers.",
        "Let me show you some similar products that might interest you."
      ];
      
      const sellerResponse = {
        id: chatMessages.length + 2,
        sender: "seller",
        message: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, sellerResponse]);
    }, 1500);
  };

  const addToCartFromChat = async (product: any) => {
    try {
      await addToCartMutation.mutateAsync({
        productId: product.id,
        quantity: 1,
        price: product.price
      });
      
      const orderMessage = {
        id: chatMessages.length + 1,
        sender: "system",
        message: `✅ ${product.name} added to cart during chat`,
        timestamp: new Date()
      };
      
      setChatMessages([...chatMessages, orderMessage]);
    } catch (error) {
      console.error('Failed to add to cart from chat:', error);
    }
  };

  // Mock data for demonstration - in production this would come from API
  const mockInstagramProducts = [
    {
      id: 1,
      name: "Trendy Oversized Hoodie",
      seller: "@trendy_fashion_tn",
      price: 1299,
      originalPrice: 1899,
      rating: 4.8,
      reviews: 156,
      category: "Fashion",
      image: "/api/placeholder/300/300",
      badge: "Trending",
      verified: true,
      description: "Premium quality oversized hoodie made from 100% cotton. Perfect for casual wear and street style."
    },
    {
      id: 2,
      name: "Wireless Bluetooth Earbuds",
      seller: "@chennai_electronics",
      price: 2499,
      originalPrice: 3999,
      rating: 4.9,
      reviews: 89,
      category: "Electronics",
      image: "/api/placeholder/300/300",
      badge: "Best Seller",
      verified: true,
      description: "High-quality wireless earbuds with noise cancellation and 24-hour battery life."
    },
    {
      id: 3,
      name: "Boho Wall Hanging Set",
      seller: "@homestyle_decor",
      price: 899,
      originalPrice: 1299,
      rating: 4.7,
      reviews: 234,
      category: "Home Decor",
      image: "/api/placeholder/300/300",
      badge: "New",
      verified: false,
      description: "Beautiful handcrafted wall hanging set to enhance your home decor with boho vibes."
    },
    {
      id: 4,
      name: "Natural Skincare Set",
      seller: "@beauty_naturals",
      price: 1599,
      originalPrice: 2299,
      rating: 4.6,
      reviews: 112,
      category: "Beauty",
      image: "/api/placeholder/300/300",
      badge: "Organic",
      verified: true,
      description: "Complete natural skincare routine with organic ingredients for healthy glowing skin."
    },
    {
      id: 5,
      name: "Minimalist Watch",
      seller: "@time_pieces_chennai",
      price: 3499,
      originalPrice: 4999,
      rating: 4.8,
      reviews: 67,
      category: "Accessories",
      image: "/api/placeholder/300/300",
      badge: "Limited",
      verified: true,
      description: "Elegant minimalist watch with genuine leather strap and precision movement."
    },
    {
      id: 6,
      name: "Handmade Ceramic Mugs",
      seller: "@pottery_paradise",
      price: 799,
      originalPrice: 1199,
      rating: 4.5,
      reviews: 145,
      category: "Home Decor",
      image: "/api/placeholder/300/300",
      badge: "Handmade",
      verified: false,
      description: "Set of 2 handcrafted ceramic mugs perfect for your morning coffee or tea."
    }
  ];

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "Fashion", label: "Fashion" },
    { value: "Electronics", label: "Electronics" },
    { value: "Beauty", label: "Beauty & Care" },
    { value: "Home Decor", label: "Home & Decor" },
    { value: "Accessories", label: "Accessories" }
  ];

  const priceRanges = [
    { value: "all", label: "All Prices" },
    { value: "0-500", label: "Under ₹500" },
    { value: "500-1000", label: "₹500 - ₹1000" },
    { value: "1000-2000", label: "₹1000 - ₹2000" },
    { value: "2000+", label: "Above ₹2000" }
  ];

  const sortOptions = [
    { value: "popular", label: "Most Popular" },
    { value: "rating", label: "Highest Rated" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "newest", label: "Newest First" }
  ];

  // Use only real data from API - no fallback to mock data
  const productsToShow = Array.isArray(instagramProducts) ? instagramProducts : [];

  const filteredProducts = productsToShow.filter(product => {
    const productName = product.productName || product.name || '';
    const productSeller = product.instagramUsername || product.seller || '';
    const productCategory = product.categoryTag || product.category || '';
    const productPrice = product.price || 0;

    const matchesSearch = productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         productSeller.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || productCategory === selectedCategory;
    const matchesPrice = priceRange === "all" || (
      priceRange === "0-500" ? productPrice <= 500 :
      priceRange === "500-1000" ? productPrice > 500 && productPrice <= 1000 :
      priceRange === "1000-2000" ? productPrice > 1000 && productPrice <= 2000 :
      priceRange === "2000+" ? productPrice > 2000 : true
    );
    
    return matchesSearch && matchesCategory && matchesPrice;
  }).sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "price-low":
        return (a.price || 0) - (b.price || 0);
      case "price-high":
        return (b.price || 0) - (a.price || 0);
      case "newest":
        return (b.id || 0) - (a.id || 0);
      default: // popular
        return (b.reviews || b.likesCount || 0) - (a.reviews || a.likesCount || 0);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => setLocation('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Instagram className="text-white h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">VyronaInstashop</h1>
                  <p className="text-gray-600">Shop from verified Instagram sellers</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-purple-600 border-purple-200">
                {filteredProducts.length} Products
              </Badge>
              
              {/* Instagram Cart Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => requireAuth("view cart", () => setLocation('/instacart'))}
                className="relative text-pink-600 border-pink-300 hover:bg-pink-50 hover:text-pink-700 hover:border-pink-400"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Insta Cart
                {safeCartItems.length > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-pink-500 hover:bg-pink-600 flex items-center justify-center"
                  >
                    {safeCartItems.length}
                  </Badge>
                )}
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={() => window.open('/vyronainstastore-dashboard', '_blank')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Instagram className="h-4 w-4 mr-2" />
                Sell on Instagram
              </Button>
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search products or sellers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Price Filter */}
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  {priceRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-4 text-center">
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Verified Sellers</h3>
              <p className="text-sm text-gray-600">All sellers verified by VyronaMart</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <Truck className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Fast Delivery</h3>
              <p className="text-sm text-gray-600">Same-day delivery available</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <CardContent className="p-4 text-center">
              <CreditCard className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Secure Payments</h3>
              <p className="text-sm text-gray-600">Protected transactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Products Grid */}
        {productsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading products...</p>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === "grid" 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "grid-cols-1"
          }`}>
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-gray-200 hover:border-purple-300"
                onClick={() => setSelectedProduct(product)}
              >
                <CardContent className="p-0">
                  {/* Product Image */}
                  <div className="relative overflow-hidden rounded-t-lg">
                    <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                    {product.badge && (
                      <Badge className="absolute top-2 left-2 bg-purple-600 text-white">
                        {product.badge}
                      </Badge>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Product Details */}
                  <div className="p-4">
                    <div className="mb-2">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                        {product.productName || product.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Instagram className="h-3 w-3 text-purple-600" />
                        <span className="text-sm text-purple-600">@{product.instagramUsername || product.seller}</span>
                        {product.verified && <Verified className="h-3 w-3 text-blue-500" />}
                      </div>
                    </div>

                    {/* Price and Rating */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-900">
                          ₹{Math.round(product.price || 0)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            ₹{Math.round(product.originalPrice || 0)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="text-amber-400 h-4 w-4 fill-current" />
                        <span className="text-sm font-medium">{product.rating || 4.5}</span>
                        <span className="text-xs text-gray-500">({product.reviews || product.likesCount || 0})</span>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="mb-3">
                      <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700">
                        {product.categoryTag || product.category || 'General'}
                      </Badge>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {/* Main Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            requireAuth("add items to cart", () => {
                              addToCartMutation.mutate({
                                productId: product.id,
                                quantity: 1,
                                price: product.price // Price already in rupees
                              });
                            });
                          }}
                          disabled={addToCartMutation.isPending}
                        >
                          <ShoppingCart className="mr-1 h-3 w-3" />
                          {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Create checkout URL with product details
                            const checkoutData = {
                              items: [{
                                id: product.id,
                                name: product.productName || product.name,
                                price: product.price / 100, // Convert from cents to rupees
                                quantity: 1,
                                image: product.imageUrl,
                                seller: product.instagramUsername || product.seller
                              }],
                              total: product.price / 100, // Convert from cents to rupees
                              source: 'instagram'
                            };
                            // Navigate to Instagram checkout with product data
                            setLocation(`/instagram-checkout?data=${encodeURIComponent(JSON.stringify(checkoutData))}`);
                          }}
                        >
                          <CreditCard className="mr-1 h-3 w-3" />
                          Buy Now
                        </Button>
                      </div>
                      {/* Secondary Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 border-green-200 text-green-600 hover:bg-green-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            startChat({
                              name: product.seller,
                              id: product.sellerId || `seller_${product.id}`,
                              products: [product],
                              avatar: product.sellerAvatar,
                              verified: product.verified
                            });
                          }}
                        >
                          <MessageCircle className="mr-1 h-3 w-3" />
                          Chat
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 border-purple-200 text-purple-600 hover:bg-purple-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(product);
                          }}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                      </div>
                    </div>

                    {/* Seller Info */}
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-gray-500">Free shipping</span>
                      <Badge variant="outline" className="border-green-200 text-green-700">
                        VyronaMart Verified
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 && !productsLoading && (
          <div className="text-center py-12">
            <Instagram className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your search or filters to find more products.</p>
          </div>
        )}
      </div>

      {/* Product Details Page */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          {/* Header */}
          <div className="bg-white border-b sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedProduct(null)}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to InstShop</span>
                  </Button>
                  <div className="text-sm text-gray-500">
                    <span className="text-purple-600 font-medium">VyronaInstashop</span> › {selectedProduct.category} › {selectedProduct.name}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Heart className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => startChat({
                      name: selectedProduct.seller,
                      id: selectedProduct.sellerId || `seller_${selectedProduct.id}`,
                      products: [selectedProduct],
                      avatar: selectedProduct.sellerAvatar,
                      verified: selectedProduct.verified
                    })}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat with Seller
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Product Images */}
              <div className="space-y-4">
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                  <Package className="h-32 w-32 text-gray-400" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Information */}
              <div className="space-y-8">
                {/* Seller Info */}
                <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                    <Instagram className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-purple-900">{selectedProduct.seller}</h3>
                      {selectedProduct.verified && <Verified className="h-4 w-4 text-blue-500" />}
                    </div>
                    <p className="text-sm text-purple-600">Instagram Seller</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-purple-200 text-purple-600"
                    onClick={() => startChat({
                      name: selectedProduct.seller,
                      id: selectedProduct.seller || `seller_${selectedProduct.id}`,
                      products: [selectedProduct],
                      avatar: selectedProduct.seller,
                      verified: selectedProduct.verified
                    })}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat Now
                  </Button>
                </div>

                {/* Product Title and Badge */}
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{selectedProduct.name}</h1>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      {selectedProduct.badge}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="text-purple-600 border-purple-200">
                    {selectedProduct.category}
                  </Badge>
                </div>

                {/* Price and Rating */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-4xl font-bold text-gray-900">₹{selectedProduct.price}</span>
                    <span className="text-2xl text-gray-500 line-through">₹{selectedProduct.originalPrice}</span>
                    <Badge variant="destructive" className="text-sm">
                      {Math.round(((selectedProduct.originalPrice - selectedProduct.price) / selectedProduct.originalPrice) * 100)}% OFF
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`h-5 w-5 ${star <= selectedProduct.rating ? 'text-amber-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-lg font-medium">{selectedProduct.rating}</span>
                      <span className="text-gray-500">({selectedProduct.reviews} reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Description</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedProduct.description}</p>
                  
                  {/* Additional Details */}
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span>Authentic Product</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Truck className="h-4 w-4 text-blue-500" />
                      <span>Fast Delivery</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <CreditCard className="h-4 w-4 text-purple-500" />
                      <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Instagram className="h-4 w-4 text-pink-500" />
                      <span>Instagram Verified</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  {/* Primary Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      size="lg" 
                      className="bg-purple-600 hover:bg-purple-700 h-14 text-lg"
                      onClick={() => requireAuth("add items to cart", () => {
                        addToCartMutation.mutate({
                          productId: selectedProduct.id,
                          quantity: 1,
                          price: selectedProduct.price
                        });
                        setSelectedProduct(null);
                      })}
                      disabled={addToCartMutation.isPending}
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                    </Button>
                    <Button 
                      size="lg" 
                      className="bg-green-600 hover:bg-green-700 h-14 text-lg text-white"
                      onClick={() => {
                        const checkoutData = {
                          items: [{
                            id: selectedProduct.id,
                            name: selectedProduct.name || selectedProduct.productName,
                            price: selectedProduct.price,
                            quantity: 1,
                            image: selectedProduct.imageUrl,
                            seller: selectedProduct.seller
                          }],
                          total: selectedProduct.price,
                          source: 'instagram'
                        };
                        setLocation(`/instagram-checkout?data=${encodeURIComponent(JSON.stringify(checkoutData))}`);
                      }}
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      Buy Now
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="border-purple-200 text-purple-600 hover:bg-purple-50"
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      Save for Later
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="border-green-200 text-green-600 hover:bg-green-50"
                      onClick={() => startChat({
                        name: selectedProduct.seller,
                        id: selectedProduct.seller || `seller_${selectedProduct.id}`,
                        products: [selectedProduct],
                        avatar: selectedProduct.seller,
                        verified: selectedProduct.verified
                      })}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Ask Seller
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-16 border-t pt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Customer Reviews</h2>
              <div className="space-y-6">
                {[
                  { name: "Priya K.", rating: 5, comment: "Amazing quality! Exactly as shown in the Instagram post. Fast delivery too.", date: "2 days ago" },
                  { name: "Rahul M.", rating: 4, comment: "Good product but took a bit longer to deliver. Overall satisfied with the purchase.", date: "1 week ago" },
                  { name: "Sneha R.", rating: 5, comment: "Loved it! The seller was very responsive and helpful. Will buy again.", date: "2 weeks ago" }
                ].map((review, index) => (
                  <div key={index} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-medium">{review.name[0]}</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{review.name}</h4>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`h-4 w-4 ${star <= review.rating ? 'text-amber-400 fill-current' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{review.date}</span>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {isChatOpen && selectedSeller && (
        <Dialog open={isChatOpen} onOpenChange={() => endChat()}>
          <DialogContent className="max-w-4xl h-[85vh] p-0 flex flex-col">
            <DialogHeader className="sr-only">
              <DialogTitle>Chat with {selectedSeller.name}</DialogTitle>
              <DialogDescription>
                Chat interface for communicating with Instagram seller
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-1 min-h-0">
              {/* Chat Area */}
              <div className="flex-1 bg-white flex flex-col">
                {/* Chat Header */}
                <div className="border-b p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                        <Instagram className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{selectedSeller.name}</h3>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                          <span className="text-sm text-gray-600">Online</span>
                          {selectedSeller.verified && <Verified className="h-4 w-4 text-blue-400" />}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Products Section */}
                <div className="p-4 border-b flex-shrink-0">
                  <h4 className="font-medium text-gray-900 mb-3">Seller's Products</h4>
                  <div className="space-y-2 max-h-24 overflow-y-auto">
                    {chatProducts.map((product: any) => (
                      <div key={product.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                          <Package className="h-3 w-3 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs text-purple-600">₹{product.price}</p>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            className="h-6 px-2 text-xs bg-purple-600 hover:bg-purple-700"
                            onClick={() => addToCartFromChat(product)}
                          >
                            <ShoppingBag className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              const checkoutData = {
                                items: [{
                                  id: product.id,
                                  name: product.name || product.productName,
                                  price: product.price,
                                  quantity: 1,
                                  image: product.imageUrl,
                                  seller: product.seller
                                }],
                                total: product.price,
                                source: 'instagram'
                              };
                              window.location.href = `/checkout-simple?data=${encodeURIComponent(JSON.stringify(checkoutData))}`;
                            }}
                          >
                            <CreditCard className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.map((message: any) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                            message.sender === 'customer'
                              ? 'bg-purple-600 text-white'
                              : message.sender === 'system'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {message.sender === 'seller' && (
                            <div className="flex items-center space-x-1 mb-1">
                              <Instagram className="h-3 w-3 text-purple-600" />
                              <span className="text-xs font-medium text-purple-600">
                                {selectedSeller.name}
                              </span>
                            </div>
                          )}
                          <p>{message.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t flex-shrink-0 bg-white">
                    <div className="flex space-x-2">
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <Button size="sm" onClick={sendMessage} className="bg-purple-600 hover:bg-purple-700">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}