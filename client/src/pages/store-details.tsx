import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, MapPin, Clock, Phone, ArrowLeft, ShoppingCart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Store, Product } from "@shared/schema";

interface StoreDetailsProps {
  storeId: string;
}

export default function StoreDetails({ storeId }: StoreDetailsProps) {
  const [, setLocation] = useLocation();

  const { data: store, isLoading: storeLoading } = useQuery<Store>({
    queryKey: [`/api/stores/${storeId}`],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Filter products for this store
  const storeProducts = products?.filter(p => p.storeId === parseInt(storeId)) || [];

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading store details...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold mb-4">Store not found</p>
          <Button onClick={() => setLocation("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const handleProductClick = (productId: number) => {
    setLocation(`/product/${productId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="text-sm text-gray-600">
              Home &gt; Stores &gt; {store.name}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Store Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-3xl font-bold text-white">{store.name.charAt(0)}</span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{store.name}</h1>
                <Badge 
                  variant={store.isOpen ? "default" : "secondary"}
                  className={store.isOpen ? "bg-green-600" : ""}
                >
                  {store.isOpen ? "Open" : "Closed"}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${
                        i < Math.floor(store.rating || 0) 
                          ? "fill-yellow-400 text-yellow-400" 
                          : "text-gray-300"
                      }`} 
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {store.rating} ({store.reviewCount} reviews)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{store.address || "Address not available"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>9:00 AM - 9:00 PM</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>+91 98765 43210</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{store.type}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Store Content */}
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products">Products ({storeProducts.length})</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            {storeProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {storeProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-square bg-gray-200 rounded-lg mb-3 overflow-hidden">
                        <img
                          src={product.imageUrl || "/api/placeholder/200/200"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                      <p className="text-orange-600 font-semibold">₹{product.price}</p>
                      <Badge variant="secondary" className="text-xs mt-2">
                        {product.category}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products available</h3>
                <p className="text-gray-600">This store hasn't added any products yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">About {store.name}</h3>
                <div className="space-y-4 text-gray-700">
                  <p>
                    {store.name} is a trusted local store serving the community with quality products 
                    and excellent customer service. We are committed to providing the best shopping 
                    experience for our customers.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Store Type</h4>
                      <p className="text-sm capitalize">{store.type}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Operating Hours</h4>
                      <p className="text-sm">Monday - Sunday: 9:00 AM - 9:00 PM</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Delivery Available</h4>
                      <p className="text-sm">Yes, within 5km radius</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Payment Methods</h4>
                      <p className="text-sm">Cash, UPI, Cards</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-4">
              {[1, 2, 3].map((review) => (
                <Card key={review}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">U{review}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">User {review}</span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className="h-3 w-3 fill-yellow-400 text-yellow-400" 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm">
                          Great store with excellent service and quality products. 
                          Highly recommended for everyday shopping needs.
                        </p>
                        <p className="text-xs text-gray-500 mt-2">2 days ago</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}