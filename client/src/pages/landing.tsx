import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShoppingBag, Search, Star, Building2, MapPin, BookOpen, Users, Gamepad2 } from "lucide-react";
import AuthModal from "@/components/AuthModal";

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  module: string;
  price: number;
  imageUrl?: string;
  enableGroupBuy?: boolean;
  groupBuyMinQuantity?: number;
  groupBuyDiscount?: number;
}

interface Store {
  id: number;
  name: string;
  type: string;
  address?: string;
  isOpen?: boolean;
  rating?: number;
}

export default function Landing() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "customer" | "seller">("login");

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
    
    if (selectedCategory !== "all") {
      if (selectedCategory === "books") {
        filtered = booksProducts;
      } else {
        filtered = filtered.filter(p => p.category === selectedCategory);
      }
    }
    
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  const handleStoreClick = (storeId: number) => {
    console.log("Store clicked:", storeId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ShoppingBag className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">VyronaMart</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  setAuthTab("login");
                  setShowAuthModal(true);
                }}
              >
                Login
              </Button>
              <Button
                onClick={() => {
                  setAuthTab("customer");
                  setShowAuthModal(true);
                }}
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to VyronaMart
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Your one-stop destination for everything you need
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100"
            onClick={() => {
              setAuthTab("customer");
              setShowAuthModal(true);
            }}
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
            >
              All
            </Button>
            <Button
              variant={selectedCategory === "electronics" ? "default" : "outline"}
              onClick={() => setSelectedCategory("electronics")}
            >
              Electronics
            </Button>
            <Button
              variant={selectedCategory === "fashion" ? "default" : "outline"}
              onClick={() => setSelectedCategory("fashion")}
            >
              Fashion
            </Button>
            <Button
              variant={selectedCategory === "home" ? "default" : "outline"}
              onClick={() => setSelectedCategory("home")}
            >
              Home
            </Button>
            <Button
              variant={selectedCategory === "books" ? "default" : "outline"}
              onClick={() => setSelectedCategory("books")}
            >
              Books
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Products</h2>
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <ShoppingBag className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <h3 className="font-semibold mb-2">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-600">{formatPrice(product.price)}</span>
                      <Badge variant="outline">{product.category}</Badge>
                    </div>
                    {product.enableGroupBuy && (
                      <Badge className="mt-2 bg-green-100 text-green-800">
                        Group Buy Available
                      </Badge>
                    )}
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
        </div>

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