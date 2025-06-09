import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Search, Star, Heart, MapPin, Gamepad2, BookOpen, Building2, Menu, Users, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Product, Store } from "@shared/schema";

export default function Landing() {
  const [, setLocation] = useLocation();
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
  const booksProducts = products?.filter(p => p.module === "read") || [];
  const localStores = stores?.filter(s => s.type === "kirana") || [];

  // Filter products based on search and category
  const getFilteredProducts = () => {
    let filtered = products || [];
    
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-orange-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 rounded-lg p-2">
                  <Gamepad2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">VyronaMart</h1>
                  <p className="text-sm opacity-90">Social Commerce Redefined</p>
                </div>
              </div>
              
              <nav className="hidden md:flex space-x-8 ml-8">
                <a href="#" className="hover:text-blue-200 transition-colors">Products</a>
                <a href="#" className="hover:text-blue-200 transition-colors">Social</a>
                <a href="#" className="hover:text-blue-200 transition-colors">Read</a>
                <a href="#" className="hover:text-blue-200 transition-colors">Stores</a>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                className="text-white hover:bg-blue-800"
                onClick={() => setLocation('/login')}
              >
                Log In
              </Button>
              <Button
                className="bg-orange-500 hover:bg-orange-600"
                onClick={() => setLocation('/login')}
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12 bg-white rounded-2xl p-8 shadow-xl">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-red-500 bg-clip-text text-transparent">
              Shop. Play. Connect.
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Experience the future of commerce with gamified shopping, social rooms, and local community connections. 
              Join thousands discovering a new way to shop.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 text-lg"
                onClick={() => setLocation('/login')}
              >
                Start Shopping
                <ShoppingBag className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-4 text-lg"
                onClick={() => setLocation('/login')}
              >
                Join Social Rooms
                <Users className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search products, stores, or books..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  onClick={() => setSelectedCategory("all")}
                  className="h-12"
                >
                  All
                </Button>
                <Button
                  variant={selectedCategory === "electronics" ? "default" : "outline"}
                  onClick={() => setSelectedCategory("electronics")}
                  className="h-12"
                >
                  Electronics
                </Button>
                <Button
                  variant={selectedCategory === "fashion" ? "default" : "outline"}
                  onClick={() => setSelectedCategory("fashion")}
                  className="h-12"
                >
                  Fashion
                </Button>
                <Button
                  variant={selectedCategory === "books" ? "default" : "outline"}
                  onClick={() => setSelectedCategory("books")}
                  className="h-12"
                >
                  Books
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        {filteredProducts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Featured Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.slice(0, 8).map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow duration-300 bg-white">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <ShoppingBag className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-purple-600">
                        ₹{(product.price / 100).toFixed(2)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {product.category}
                      </Badge>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setLocation(`/product/${product.id}`)}
                      >
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Modules Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">Explore VyronaMart Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* VyronaSocial */}
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">VyronaSocial</CardTitle>
                <CardDescription>Shop together in multiplayer rooms</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Create or join shopping rooms with friends. Chat, compare products, and make group purchases with real-time collaboration.
                </p>
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600" onClick={() => setLocation('/social')}>
                  Enter Social Rooms
                </Button>
              </CardContent>
            </Card>

            {/* VyronaRead */}
            <Card className="bg-gradient-to-br from-green-50 to-teal-50 border-green-200 hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-gradient-to-r from-green-500 to-teal-600 rounded-full w-16 h-16 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">VyronaRead</CardTitle>
                <CardDescription>Books, E-books & Library Services</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Discover books, rent from local libraries, purchase e-books, and manage your reading journey all in one place.
                </p>
                <Button className="w-full bg-gradient-to-r from-green-500 to-teal-600" onClick={() => setLocation('/vyronaread')}>
                  Explore Books
                </Button>
              </CardContent>
            </Card>

            {/* VyronaHub */}
            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-full w-16 h-16 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">VyronaHub</CardTitle>
                <CardDescription>Local stores & Mall integration</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Connect with local Kirana stores and mall shops. Support your community while enjoying convenient delivery.
                </p>
                <Button className="w-full bg-gradient-to-r from-orange-500 to-red-600" onClick={() => setLocation('/vyronahub')}>
                  Find Local Stores
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Local Shopping Section */}
        <section className="mb-12 bg-white rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-center mb-8">Hyper-Local Shopping Experience</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-3xl mb-4 text-center">📍</div>
              <h3 className="font-bold text-lg mb-3 text-center">Hyper-Local Focus</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Within 3km radius coverage</li>
                <li>• GPS-based store matching</li>
                <li>• Local inventory management</li>
                <li>• Community-first approach</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-3xl mb-4 text-center">💰</div>
              <h3 className="font-bold text-lg mb-3 text-center">Smart Savings</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Local store competitive pricing</li>
                <li>• No minimum order value</li>
                <li>• Bulk purchase discounts</li>
                <li>• Community loyalty rewards</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-3xl mb-4 text-center">🚀</div>
              <h3 className="font-bold text-lg mb-3 text-center">Quick Delivery</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• 30-minute delivery promise</li>
                <li>• Real-time order tracking</li>
                <li>• Local delivery partners</li>
                <li>• Same-day availability</li>
              </ul>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <Button className="bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white px-8 py-3 text-lg">
              Explore Local Stores
              <MapPin className="ml-2 h-5 w-5" />
            </Button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">Supporting local businesses while serving your neighborhood</p>
          </div>
        </section>

        {/* VyronaMart Unique Features */}
        <section className="mb-12 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Why Choose VyronaMart?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center text-white text-xl">
                🎮
              </div>
              <h3 className="font-bold mb-2">Gamified Shopping</h3>
              <p className="text-sm text-gray-600">Earn coins, XP, and unlock achievements with every purchase</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center text-white text-xl">
                🎯
              </div>
              <h3 className="font-bold mb-2">Social Shopping Rooms</h3>
              <p className="text-sm text-gray-600">Shop together with friends in interactive multiplayer rooms</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center text-white text-xl">
                🏆
              </div>
              <h3 className="font-bold mb-2">Rewards & Levels</h3>
              <p className="text-sm text-gray-600">Level up your profile and unlock exclusive rewards</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center text-white text-xl">
                🏬
              </div>
              <h3 className="font-bold mb-2">MallConnect Integration</h3>
              <p className="text-sm text-gray-600">City mall shops delivering through our e-commerce platform</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}