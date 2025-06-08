import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Search, Star, Heart, MapPin, Gamepad2, BookOpen, Building2, Menu, Users, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Product, Store } from "@shared/schema";
import AuthModal from "@/components/AuthModal";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "customer" | "seller">("login");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch products and stores to display
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: stores } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  // Get products by category
  const electronicsProducts = products?.filter(p => p.category === "electronics") || [];
  const fashionProducts = products?.filter(p => p.category === "fashion") || [];
  const homeProducts = products?.filter(p => p.category === "home") || [];
  const booksProducts = products?.filter(p => p.module === "vyronaread") || [];
  const localStores = stores?.filter(s => s.type === "kirana") || [];

  // Filter products based on search and category
  const getFilteredProducts = () => {
    let filtered = products || [];
    
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  const handleProductClick = (productId: number) => {
    setLocation(`/product/${productId}`);
  };

  const handleStoreClick = (storeId: number) => {
    setLocation(`/store/${storeId}`);
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">VyronaMart</h1>
              <span className="text-sm text-blue-200">Everything Store</span>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search VyronaMart"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 text-black rounded-md border-0 focus:ring-2 focus:ring-orange-500"
                />
                <Button
                  size="sm"
                  className="absolute right-1 top-1 bottom-1 bg-orange-500 hover:bg-orange-600 px-4"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setAuthTab("login");
                  setShowAuthModal(true);
                }}
                className="text-white hover:bg-blue-800"
              >
                Log In
              </Button>
              <Button
                onClick={() => {
                  setAuthTab("customer");
                  setShowAuthModal(true);
                }}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* VyronaMart Modules Navigation */}
      <nav className="bg-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 text-sm">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className={`text-white hover:bg-blue-700 ${selectedCategory === "all" ? "bg-blue-700" : ""}`}
              >
                <Menu className="h-4 w-4 mr-1" />
                All Products
              </Button>
              <span className="cursor-pointer hover:underline font-medium">VyronaHub</span>
              <span className="cursor-pointer hover:underline">VyronaSpace</span>
              <span className="cursor-pointer hover:underline">VyronaSocial</span>
              <span className="cursor-pointer hover:underline">VyronaRead</span>
              <span className="cursor-pointer hover:underline">MallConnect</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="cursor-pointer hover:underline">Sell on VyronaMart</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAuthTab("seller");
                  setShowAuthModal(true);
                }}
                className="text-white hover:bg-blue-700"
              >
                <Building2 className="h-4 w-4 mr-1" />
                Seller Center
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 mb-8 text-white">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-4">Welcome to VyronaMart</h2>
              <p className="text-xl mb-6">Your one-stop social commerce platform where shopping meets community</p>
              <div className="flex space-x-4">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  onClick={() => {
                    setAuthTab("customer");
                    setShowAuthModal(true);
                  }}
                >
                  Start Shopping
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-blue-600"
                  onClick={() => {
                    setAuthTab("seller");
                    setShowAuthModal(true);
                  }}
                >
                  Become a Seller
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-4 text-center">
                  <ShoppingBag className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-semibold">Social Shopping</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-semibold">Group Buying</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-4 text-center">
                  <BookOpen className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-semibold">VyronaRead</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-4 text-center">
                  <Gamepad2 className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-semibold">Gaming Hub</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Featured Categories Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Explore VyronaMart Universe</h2>
          
          {/* Module Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-6 text-center">
                <div className="bg-blue-500 rounded-full p-4 w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">VyronaMart</h3>
                <p className="text-sm text-gray-600 mb-3">Everything you need in one place</p>
                <Badge variant="secondary" className="text-xs">
                  {electronicsProducts.length + fashionProducts.length + homeProducts.length} Products
                </Badge>
              </CardContent>
            </Card>

            <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-6 text-center">
                <div className="bg-green-500 rounded-full p-4 w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">VyronaRead</h3>
                <p className="text-sm text-gray-600 mb-3">Digital library & bookstore</p>
                <Badge variant="secondary" className="text-xs">
                  {booksProducts.length} Books
                </Badge>
              </CardContent>
            </Card>

            <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-6 text-center">
                <div className="bg-purple-500 rounded-full p-4 w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">VyronaSocial</h3>
                <p className="text-sm text-gray-600 mb-3">Social shopping & groups</p>
                <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
              </CardContent>
            </Card>

            <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="p-6 text-center">
                <div className="bg-orange-500 rounded-full p-4 w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Gamepad2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">VyronaHub</h3>
                <p className="text-sm text-gray-600 mb-3">Gaming & entertainment</p>
                <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
              </CardContent>
            </Card>
          </div>

          {/* Category Filter Tabs */}
          <div className="bg-white rounded-xl shadow-sm p-2 mb-8">
            <div className="flex flex-wrap gap-1">
              <Button
                variant={selectedCategory === "all" ? "default" : "ghost"}
                onClick={() => setSelectedCategory("all")}
                className={`px-6 py-3 rounded-lg transition-all ${
                  selectedCategory === "all" 
                    ? "bg-blue-600 text-white shadow-lg" 
                    : "hover:bg-gray-100"
                }`}
              >
                <Menu className="h-4 w-4 mr-2" />
                All Products ({products?.length || 0})
              </Button>
              <Button
                variant={selectedCategory === "electronics" ? "default" : "ghost"}
                onClick={() => setSelectedCategory("electronics")}
                className={`px-6 py-3 rounded-lg transition-all ${
                  selectedCategory === "electronics" 
                    ? "bg-blue-600 text-white shadow-lg" 
                    : "hover:bg-gray-100"
                }`}
              >
                📱 Electronics ({electronicsProducts.length})
              </Button>
              <Button
                variant={selectedCategory === "fashion" ? "default" : "ghost"}
                onClick={() => setSelectedCategory("fashion")}
                className={`px-6 py-3 rounded-lg transition-all ${
                  selectedCategory === "fashion" 
                    ? "bg-blue-600 text-white shadow-lg" 
                    : "hover:bg-gray-100"
                }`}
              >
                👕 Fashion ({fashionProducts.length})
              </Button>
              <Button
                variant={selectedCategory === "home" ? "default" : "ghost"}
                onClick={() => setSelectedCategory("home")}
                className={`px-6 py-3 rounded-lg transition-all ${
                  selectedCategory === "home" 
                    ? "bg-blue-600 text-white shadow-lg" 
                    : "hover:bg-gray-100"
                }`}
              >
                🏠 Home & Garden ({homeProducts.length})
              </Button>
              <Button
                variant={selectedCategory === "books" ? "default" : "ghost"}
                onClick={() => setSelectedCategory("books")}
                className={`px-6 py-3 rounded-lg transition-all ${
                  selectedCategory === "books" 
                    ? "bg-blue-600 text-white shadow-lg" 
                    : "hover:bg-gray-100"
                }`}
              >
                📚 Books ({booksProducts.length})
              </Button>
            </div>
          </div>
        </div>

        {/* Featured Products Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedCategory === "all" ? "Trending Products" : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Collection`}
            </h2>
            <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
              View All Products
            </Button>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="group cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-0 bg-white rounded-2xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative">
                      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="text-center">
                            <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                            <span className="text-sm text-gray-500">
                              {product.module === "vyronaread" ? "📚" : product.category === "electronics" ? "📱" : product.category === "fashion" ? "👕" : "🏠"}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Module Badge */}
                      <div className="absolute top-3 left-3">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            product.module === "vyronaread" 
                              ? "bg-green-100 text-green-700" 
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {product.module === "vyronaread" ? "VyronaRead" : "VyronaMart"}
                        </Badge>
                      </div>

                      {/* Quick Actions */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex flex-col gap-2">
                          <Button variant="ghost" size="sm" className="bg-white/90 hover:bg-white text-gray-600 hover:text-red-500 p-2 rounded-full shadow-md">
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="bg-white/90 hover:bg-white text-gray-600 hover:text-blue-500 p-2 rounded-full shadow-md">
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Discount Badge */}
                      {product.enableGroupBuy && (
                        <div className="absolute bottom-3 left-3">
                          <Badge className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                            Group Buy Available
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="mb-3">
                        <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1 text-base">
                          {product.name}
                        </h3>
                        <p className="text-gray-500 text-sm line-clamp-2">{product.description}</p>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center mb-3">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500 ml-2">(4.5) • 128 reviews</span>
                      </div>

                      {/* Price and Category */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-2xl font-bold text-gray-800">{formatPrice(product.price)}</span>
                          {product.enableGroupBuy && (
                            <div className="text-xs text-green-600 font-medium">
                              Save more with {product.groupBuyMinQuantity}+ people
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs capitalize px-2 py-1">
                          {product.category}
                        </Badge>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium py-2.5" 
                          onClick={() => handleProductClick(product.id)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                        {product.enableGroupBuy && (
                          <Button 
                            variant="outline" 
                            className="px-4 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl"
                            onClick={() => handleProductClick(product.id)}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Additional Info */}
                      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          Fast delivery
                        </span>
                        <span className="flex items-center">
                          {product.enableIndividualBuy && (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              In Stock
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
              <div className="max-w-md mx-auto">
                <div className="bg-white rounded-full p-6 w-24 h-24 mx-auto mb-6 shadow-lg">
                  <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-3">No products found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your search or explore different categories</p>
                <div className="flex justify-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedCategory("all");
                      setSearchQuery("");
                    }}
                    className="rounded-full"
                  >
                    View All Products
                  </Button>
                  <Button 
                    onClick={() => {
                      setAuthTab("customer");
                      setShowAuthModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 rounded-full"
                  >
                    Join VyronaMart
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Special Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="bg-blue-500 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-blue-900">Group Buying Power</h3>
              <p className="text-blue-700 text-sm">Team up with friends and save more on bulk purchases</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="bg-green-500 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-green-900">Local & Global</h3>
              <p className="text-green-700 text-sm">Shop from local stores and international brands</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="bg-purple-500 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-purple-900">Digital Library</h3>
              <p className="text-purple-700 text-sm">Access thousands of books and educational content</p>
            </CardContent>
          </Card>
        </div>

        {/* Local Stores Section */}
        {localStores.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center">
                <MapPin className="h-8 w-8 mr-3 text-blue-600" />
                Local Stores Near You
              </h2>
              <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                View All Stores
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {localStores.map((store) => (
                <Card key={store.id} className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white rounded-2xl overflow-hidden border-0">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32 flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-white" />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">
                          {store.name}
                        </h3>
                        <Badge variant="outline" className="capitalize text-xs">
                          {store.type}
                        </Badge>
                      </div>
                      <div className="flex items-center mb-4">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500 ml-2">(4.8) • Open now</span>
                      </div>
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                        onClick={() => handleStoreClick(store.id)}
                      >
                        Visit Store
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab={authTab}
      />
    </div>
  );
}