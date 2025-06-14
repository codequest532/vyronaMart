import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  ShoppingBag, 
  Shirt, 
  Laptop, 
  Heart, 
  Store, 
  Star,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

export default function VyronaSpace() {
  const { data: stores = [] } = useQuery({
    queryKey: ["/api/stores"],
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">VyronaSpace</h1>
                <p className="text-gray-600 dark:text-gray-300">Discover local stores and unlock geo-rewards!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        
        {/* Hero Section */}
        <Card className="vyrona-gradient-space text-white">
          <CardContent className="p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">VyronaSpace - Local Store Connect</h2>
              <p className="text-xl opacity-90 mb-6">Connecting you to local neighborhood stores with lightning-fast delivery</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="font-semibold">15-30 Min</div>
                  <div className="text-sm opacity-80">Delivery</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-2xl mb-2">🏪</div>
                  <div className="font-semibold">{stores.length}+ Stores</div>
                  <div className="text-sm opacity-80">Nearby</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-2xl mb-2">📍</div>
                  <div className="font-semibold">2KM Radius</div>
                  <div className="text-sm opacity-80">Coverage</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-2xl mb-2">🎁</div>
                  <div className="font-semibold">Geo-Rewards</div>
                  <div className="text-sm opacity-80">Earn Points</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Your Location</h3>
              <Button variant="ghost" className="text-green-600">
                <MapPin className="mr-2 h-4 w-4" />
                Update Location
              </Button>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-lg p-6 mb-4 relative overflow-hidden">
              <div className="flex items-center space-x-3 mb-3">
                <MapPin className="text-green-600 h-6 w-6" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">T. Nagar, Chennai</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Tamil Nadu, India</p>
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {stores.length} local stores within 2km radius
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Categories */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Store Categories</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { 
                  name: "Kirana Stores", 
                  icon: ShoppingBag, 
                  color: "orange", 
                  count: stores.filter((s: any) => s.type === "kirana").length,
                  description: "Groceries & Daily Essentials"
                },
                { 
                  name: "Fashion", 
                  icon: Shirt, 
                  color: "pink", 
                  count: stores.filter((s: any) => s.type === "fashion").length,
                  description: "Clothing & Accessories"
                },
                { 
                  name: "Electronics", 
                  icon: Laptop, 
                  color: "blue", 
                  count: stores.filter((s: any) => s.type === "electronics").length,
                  description: "Gadgets & Appliances"
                },
                { 
                  name: "Lifestyle", 
                  icon: Heart, 
                  color: "green", 
                  count: stores.filter((s: any) => s.type === "lifestyle").length,
                  description: "Health & Beauty"
                },
              ].map((category) => (
                <Card 
                  key={category.name} 
                  className="border-2 border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600 cursor-pointer hover:shadow-lg transition-all duration-300 group"
                >
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-${category.color}-100 dark:bg-${category.color}-900/30 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <category.icon className={`h-8 w-8 text-${category.color}-600 dark:text-${category.color}-400`} />
                    </div>
                    <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">{category.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{category.description}</p>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{category.count}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">stores nearby</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Nearby Stores */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nearby Stores</h3>
              <Button variant="outline">View All Stores</Button>
            </div>
            
            {stores.length === 0 ? (
              <div className="text-center py-12">
                <Store className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Local Stores Yet</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Local stores will appear here once they register with VyronaSpace</p>
                <Button variant="outline">Invite Local Stores</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.slice(0, 6).map((store: any) => (
                  <Card key={store.id} className="border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Store className="text-orange-600 dark:text-orange-400 h-8 w-8" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">{store.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 capitalize">{store.type} • 0.3km away</p>
                          <div className="flex items-center">
                            <div className="flex text-yellow-400 text-sm">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-current" />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                              {store.rating ? (store.rating / 100).toFixed(1) : "4.8"} ({store.reviewCount || "124"} reviews)
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Open
                        </Badge>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Closes at 10 PM</div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                          Book Slot
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          View Products
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Section */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">VyronaSpace Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Hyperlocal Discovery</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Find stores within walking distance from your location</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Quick Commerce</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Order and get delivery in 15-30 minutes</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Geo-Rewards</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Earn points and rewards based on your location and shopping</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}