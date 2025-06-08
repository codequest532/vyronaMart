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

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
            className="mb-2"
          >
            All Products ({products?.length || 0})
          </Button>
          <Button
            variant={selectedCategory === "electronics" ? "default" : "outline"}
            onClick={() => setSelectedCategory("electronics")}
            className="mb-2"
          >
            Electronics ({electronicsProducts.length})
          </Button>
          <Button
            variant={selectedCategory === "fashion" ? "default" : "outline"}
            onClick={() => setSelectedCategory("fashion")}
            className="mb-2"
          >
            Fashion ({fashionProducts.length})
          </Button>
          <Button
            variant={selectedCategory === "home" ? "default" : "outline"}
            onClick={() => setSelectedCategory("home")}
            className="mb-2"
          >
            Home ({homeProducts.length})
          </Button>
          <Button
            variant={selectedCategory === "books" ? "default" : "outline"}
            onClick={() => setSelectedCategory("books")}
            className="mb-2"
          >
            Books ({booksProducts.length})
          </Button>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-square bg-gray-200 rounded-t-lg flex items-center justify-center">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    ) : (
                      <ShoppingBag className="h-16 w-16 text-gray-400" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm group-hover:text-blue-600 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-500 p-1">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-gray-600 text-xs mb-2 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-green-600">{formatPrice(product.price)}</span>
                      <Badge variant="secondary" className="text-xs">
                        {product.category}
                      </Badge>
                    </div>
                    <div className="flex items-center mt-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 ml-1">(4.5)</span>
                    </div>
                    <Button 
                      className="w-full mt-3" 
                      size="sm"
                      onClick={() => handleProductClick(product.id)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or category filter</p>
          </div>
        )}

        {/* Local Stores Section */}
        {localStores.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <MapPin className="h-6 w-6 mr-2" />
              Local Stores Near You
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {localStores.map((store) => (
                <Card key={store.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building2 className="h-5 w-5 mr-2" />
                      {store.name}
                    </CardTitle>
                    <CardDescription>{store.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{store.type}</Badge>
                      <Button 
                        size="sm" 
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