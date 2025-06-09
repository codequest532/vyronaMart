import { useState } from "react";
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

export default function VyronaInstaShop() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Video call states
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [callStatus, setCallStatus] = useState("idle"); // idle, connecting, connected, ended
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [callMessages, setCallMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [callProducts, setCallProducts] = useState([]);

  // Fetch Instagram products for customers
  const { data: instagramProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/instashop/products"],
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (productData) => {
      return await apiRequest("/api/cart/add", "POST", productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to Cart",
        description: "Product added to your cart successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add product to cart. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Video call functions
  const startVideoCall = (seller: any) => {
    setSelectedSeller(seller);
    setCallStatus("connecting");
    setIsVideoCallOpen(true);
    setCallMessages([]);
    setCallProducts(seller.products || []);
    
    // Simulate connection after 2 seconds
    setTimeout(() => {
      setCallStatus("connected");
      setCallMessages([{
        id: 1,
        sender: "seller",
        message: `Hi! I'm ${seller.name}. How can I help you today?`,
        timestamp: new Date()
      }]);
    }, 2000);
  };

  const endVideoCall = () => {
    setCallStatus("ended");
    setTimeout(() => {
      setIsVideoCallOpen(false);
      setSelectedSeller(null);
      setCallStatus("idle");
      setCallMessages([]);
      setCallProducts([]);
    }, 1000);
  };

  const sendMessage = () => {
    if (!messageInput.trim()) return;
    
    const newMessage = {
      id: callMessages.length + 1,
      sender: "customer",
      message: messageInput,
      timestamp: new Date()
    };
    
    setCallMessages([...callMessages, newMessage]);
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
        id: callMessages.length + 2,
        sender: "seller",
        message: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };
      
      setCallMessages(prev => [...prev, sellerResponse]);
    }, 1500);
  };

  const addToCartFromCall = async (product: any) => {
    try {
      await addToCartMutation.mutateAsync({
        productId: product.id,
        quantity: 1,
        price: product.price
      });
      
      const orderMessage = {
        id: callMessages.length + 1,
        sender: "system",
        message: `✅ ${product.name} added to cart during call`,
        timestamp: new Date()
      };
      
      setCallMessages([...callMessages, orderMessage]);
    } catch (error) {
      console.error('Failed to add to cart from call:', error);
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

  const filteredProducts = mockInstagramProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.seller.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesPrice = priceRange === "all" || (
      priceRange === "0-500" ? product.price <= 500 :
      priceRange === "500-1000" ? product.price > 500 && product.price <= 1000 :
      priceRange === "1000-2000" ? product.price > 1000 && product.price <= 2000 :
      priceRange === "2000+" ? product.price > 2000 : true
    );
    
    return matchesSearch && matchesCategory && matchesPrice;
  }).sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.rating - a.rating;
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "newest":
        return b.id - a.id;
      default: // popular
        return b.reviews - a.reviews;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
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
              <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-gray-200 hover:border-purple-300">
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
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                      <div className="flex items-center space-x-2">
                        <Instagram className="h-3 w-3 text-purple-600" />
                        <span className="text-sm text-purple-600">{product.seller}</span>
                        {product.verified && <Verified className="h-3 w-3 text-blue-500" />}
                      </div>
                    </div>

                    {/* Price and Rating */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
                        <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="text-amber-400 h-4 w-4 fill-current" />
                        <span className="text-sm font-medium">{product.rating}</span>
                        <span className="text-xs text-gray-500">({product.reviews})</span>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="mb-3">
                      <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700">
                        {product.category}
                      </Badge>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                        onClick={() => addToCartMutation.mutate({
                          productId: product.id,
                          quantity: 1,
                          price: product.price
                        })}
                        disabled={addToCartMutation.isPending}
                      >
                        <ShoppingCart className="mr-1 h-3 w-3" />
                        {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-green-200 text-green-600 hover:bg-green-50"
                        onClick={() => startVideoCall({
                          name: product.seller,
                          id: product.sellerId || `seller_${product.id}`,
                          products: [product],
                          avatar: product.sellerAvatar,
                          verified: product.verified
                        })}
                      >
                        <Video className="h-3 w-3" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{product.name}</DialogTitle>
                            <DialogDescription>
                              Product details from {product.seller}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="h-16 w-16 text-gray-400" />
                            </div>
                            <div className="space-y-4">
                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-2xl font-bold">₹{product.price}</span>
                                  <span className="text-lg text-gray-500 line-through">₹{product.originalPrice}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center">
                                    <Star className="text-amber-400 h-4 w-4 fill-current" />
                                    <span className="ml-1 font-medium">{product.rating}</span>
                                  </div>
                                  <span className="text-gray-500">({product.reviews} reviews)</span>
                                </div>
                              </div>
                              <p className="text-gray-600">{product.description}</p>
                              <Button 
                                className="w-full bg-purple-600 hover:bg-purple-700"
                                onClick={() => addToCartMutation.mutate({
                                  productId: product.id,
                                  quantity: 1,
                                  price: product.price
                                })}
                              >
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Add to Cart - ₹{product.price}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
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

      {/* Video Call Modal */}
      {isVideoCallOpen && selectedSeller && (
        <Dialog open={isVideoCallOpen} onOpenChange={() => endVideoCall()}>
          <DialogContent className="max-w-6xl h-[80vh] p-0">
            <div className="flex h-full">
              {/* Video Call Area */}
              <div className="flex-1 bg-gray-900 relative">
                {/* Call Header */}
                <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm p-4">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                        <Instagram className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{selectedSeller.name}</h3>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${callStatus === 'connected' ? 'bg-green-400' : callStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'}`}></div>
                          <span className="text-sm capitalize">{callStatus === 'connected' ? 'Connected' : callStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}</span>
                          {selectedSeller.verified && <Verified className="h-4 w-4 text-blue-400" />}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm">
                      {callStatus === 'connected' && new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Video Area */}
                <div className="h-full flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
                  {callStatus === 'connecting' && (
                    <div className="text-center text-white">
                      <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-lg">Connecting to {selectedSeller.name}...</p>
                    </div>
                  )}
                  
                  {callStatus === 'connected' && (
                    <div className="relative w-full h-full">
                      {/* Simulated seller video */}
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Instagram className="h-16 w-16" />
                          </div>
                          <h3 className="text-2xl font-bold">{selectedSeller.name}</h3>
                          <p className="text-purple-200">Instagram Seller</p>
                        </div>
                      </div>
                      
                      {/* Customer video (small) */}
                      <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg border-2 border-white flex items-center justify-center">
                        <div className="text-white text-xs text-center">
                          <div className="w-8 h-8 bg-purple-600 rounded-full mx-auto mb-1 flex items-center justify-center">
                            <span className="text-xs font-bold">You</span>
                          </div>
                          <span>Customer</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {callStatus === 'ended' && (
                    <div className="text-center text-white">
                      <PhoneOff className="w-16 h-16 mx-auto mb-4 text-red-400" />
                      <p className="text-lg">Call ended</p>
                    </div>
                  )}
                </div>

                {/* Call Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/50 backdrop-blur-sm">
                  <div className="flex items-center justify-center space-x-4">
                    <Button
                      size="sm"
                      variant={isAudioEnabled ? "default" : "destructive"}
                      className="w-12 h-12 rounded-full"
                      onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                    >
                      {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant={isVideoEnabled ? "default" : "destructive"}
                      className="w-12 h-12 rounded-full"
                      onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                    >
                      {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-12 h-12 rounded-full"
                      onClick={endVideoCall}
                    >
                      <PhoneOff className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Chat & Products Sidebar */}
              <div className="w-80 bg-white border-l flex flex-col">
                {/* Sidebar Header */}
                <div className="p-4 border-b bg-purple-50">
                  <h3 className="font-semibold text-purple-900">Chat & Products</h3>
                </div>

                {/* Products Section */}
                <div className="p-4 border-b">
                  <h4 className="font-medium text-gray-900 mb-3">Seller's Products</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {callProducts.map((product: any) => (
                      <div key={product.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                          <Package className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs text-purple-600">₹{product.price}</p>
                        </div>
                        <Button
                          size="sm"
                          className="h-6 px-2 text-xs bg-purple-600 hover:bg-purple-700"
                          onClick={() => addToCartFromCall(product)}
                        >
                          <ShoppingBag className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {callMessages.map((message: any) => (
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
                  {callStatus === 'connected' && (
                    <div className="p-4 border-t">
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
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}