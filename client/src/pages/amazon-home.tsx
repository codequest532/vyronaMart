import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Star, ShoppingCart, Truck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/header";
import CartButton from "@/components/shopping/cart-button";
import { useUserData } from "@/hooks/use-user-data";
import type { Product } from "@shared/schema";

export default function AmazonHome() {
  const [, setLocation] = useLocation();
  const { user } = useUserData();

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  if (!user) {
    setLocation("/");
    return null;
  }

  if (productsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  const handleProductClick = (productId: number) => {
    setLocation(`/product/${productId}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header user={user} />
      <CartButton />

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to VyronaMart</h1>
          <p className="text-xl opacity-90 mb-6">Shop, Play, Earn Rewards</p>
          <div className="flex justify-center space-x-4">
            <Badge variant="secondary" className="bg-white text-blue-600 px-4 py-2">
              Free Delivery
            </Badge>
            <Badge variant="secondary" className="bg-white text-blue-600 px-4 py-2">
              Earn VyronaCoins
            </Badge>
            <Badge variant="secondary" className="bg-white text-blue-600 px-4 py-2">
              Gaming Rewards
            </Badge>
          </div>
        </div>
      </div>

      {/* Product Categories */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { name: "Electronics", color: "blue" },
            { name: "Fashion", color: "pink" },
            { name: "Home & Garden", color: "green" },
            { name: "Books", color: "purple" },
          ].map((category) => (
            <Card key={category.name} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 bg-${category.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <div className={`w-8 h-8 bg-${category.color}-500 rounded`}></div>
                </div>
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Featured Products Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card
                key={product.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleProductClick(product.id)}
              >
                <CardContent className="p-0">
                  <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                    <img
                      src={product.imageUrl || "/api/placeholder/300/300"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600">
                      {product.name}
                    </h3>
                    
                    {/* Rating */}
                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">(1,234)</span>
                    </div>

                    {/* Price */}
                    <div className="mb-3">
                      <div className="flex items-baseline space-x-1">
                        <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
                        <span className="text-sm text-gray-500 line-through">₹{Math.round(product.price * 1.2)}</span>
                      </div>
                      <p className="text-xs text-green-600">Free delivery</p>
                    </div>

                    {/* Features */}
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center text-xs text-gray-600">
                        <Truck className="h-3 w-3 mr-1" />
                        Fast delivery
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Easy returns
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <Button
                      size="sm"
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle add to cart
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Today's Deals */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Today's Deals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.slice(0, 3).map((product) => (
              <Card
                key={`deal-${product.id}`}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleProductClick(product.id)}
              >
                <CardContent className="p-4">
                  <div className="flex space-x-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={product.imageUrl || "/api/placeholder/100/100"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg font-bold text-red-600">₹{Math.round(product.price * 0.8)}</span>
                        <span className="text-sm text-gray-500 line-through">₹{product.price}</span>
                        <Badge variant="destructive" className="text-xs">20% off</Badge>
                      </div>
                      <p className="text-xs text-gray-600">Limited time offer</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recently Viewed */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recently Viewed</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {products.slice(3, 9).map((product) => (
              <Card
                key={`recent-${product.id}`}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleProductClick(product.id)}
              >
                <CardContent className="p-3">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                    <img
                      src={product.imageUrl || "/api/placeholder/200/200"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{product.name}</h3>
                  <p className="text-sm font-bold text-gray-900">₹{product.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}