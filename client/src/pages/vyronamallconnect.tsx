import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building, Shirt, Laptop, Utensils, Home as HomeIcon, Star, Coins } from "lucide-react";
import { useLocation } from "wouter";

export default function VyronaMallConnect() {
  const [, setLocation] = useLocation();
  const [selectedMall, setSelectedMall] = useState<any>(null);

  const { data: stores = [] } = useQuery({
    queryKey: ["/api/stores"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const handleProductClick = (productName: string) => {
    console.log(`Clicked on ${productName}`);
  };

  const mallStores = Array.isArray(stores) ? stores.filter((s: any) => s.type === "mall") : [];
  const mallProducts = Array.isArray(products) ? products.filter((p: any) => p.module === "mall") : [];

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => setLocation("/")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>

      {/* Header */}
      <Card className="vyrona-gradient-mall text-white">
        <CardContent className="p-6">
          <h1 className="text-3xl font-bold mb-2">VyronaMallConnect</h1>
          <p className="text-lg opacity-90">Mall brands delivered to your doorstep with exclusive pricing</p>
        </CardContent>
      </Card>

      {/* Mall Selection */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Select Your Mall</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {mallStores.map((mall: any, index: number) => (
              <Card 
                key={mall.id} 
                className={`cursor-pointer transition-all duration-300 ${
                  index === 0 
                    ? "border-2 border-amber-500 bg-amber-50 shadow-lg" 
                    : "border border-gray-200 hover:border-amber-300 hover:shadow-md"
                }`}
                onClick={() => setSelectedMall(mall)}
              >
                <CardContent className="p-6">
                  <div className="w-full h-40 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg mb-4 flex items-center justify-center">
                    <Building className="text-amber-600 h-16 w-16" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{mall.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">Chennai • 2.5km away</p>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-green-100 text-green-700">150+ brands</Badge>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">4.8</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {mallStores.length === 0 && (
            <div className="text-center py-12">
              <Building className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Malls Available</h3>
              <p className="text-gray-500">
                Mall partners will be onboarded soon to bring premium brands to your doorstep.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brand Categories */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Brand Categories</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Fashion", icon: Shirt, color: "pink", count: "50+ brands" },
              { name: "Electronics", icon: Laptop, color: "blue", count: "25+ brands" },
              { name: "Food Court", icon: Utensils, color: "green", count: "30+ outlets" },
              { name: "Home & Living", icon: HomeIcon, color: "purple", count: "35+ brands" },
            ].map((category) => (
              <Card 
                key={category.name} 
                className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-amber-300"
              >
                <CardContent className="p-6 text-center">
                  <div className={`mx-auto mb-4 w-16 h-16 rounded-full bg-${category.color}-50 flex items-center justify-center`}>
                    <category.icon className={`text-${category.color}-500 h-8 w-8`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.count}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Featured Products */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Featured Products</h2>
            <Button variant="ghost" className="text-amber-600 hover:text-amber-700">
              View All Products
            </Button>
          </div>
          
          {mallProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {mallProducts.map((product: any) => (
                <div 
                  key={product.id} 
                  className="group cursor-pointer transition-transform hover:scale-105" 
                  onClick={() => handleProductClick(product.name)}
                >
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-amber-600 font-bold text-xl">
                          ₹{Math.round(product.price / 100).toLocaleString()}
                        </p>
                        <div className="flex items-center space-x-1">
                          <Coins className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium text-green-600">
                            +{Math.floor(product.price / 10000)}
                          </span>
                        </div>
                      </div>
                      <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shirt className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Available</h3>
              <p className="text-gray-500">
                Mall products will be available once retail partners are onboarded.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Premium Mall Benefits */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Premium Mall Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Authentic Brands",
                description: "100% genuine products directly from mall stores",
                icon: "🛍️"
              },
              {
                title: "Same Day Delivery",
                description: "Get your mall purchases delivered within hours",
                icon: "🚚"
              },
              {
                title: "Mall Exclusive Offers",
                description: "Special discounts available only through VyronaMallConnect",
                icon: "💎"
              },
              {
                title: "Easy Returns",
                description: "Hassle-free returns to the original mall store",
                icon: "↩️"
              },
              {
                title: "VyronaCoins Rewards",
                description: "Earn coins with every purchase for future discounts",
                icon: "🪙"
              },
              {
                title: "Personal Shopping",
                description: "Get assistance from mall store representatives",
                icon: "👥"
              }
            ].map((benefit, index) => (
              <div key={index} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-200">
                <div className="text-3xl mb-3">{benefit.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}