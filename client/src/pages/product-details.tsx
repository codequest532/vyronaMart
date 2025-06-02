import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Star, Heart, Share2, ShoppingCart, Zap, Shield, Truck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

interface ProductDetailsProps {
  productId: string;
}

export default function ProductDetails({ productId }: ProductDetailsProps) {
  const [, setLocation] = useLocation();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch product details
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/cart`, {
        productId: parseInt(productId),
        quantity,
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to Cart",
        description: "Product has been added to your cart successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add product to cart. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <Button onClick={() => setLocation("/")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const productImages = [
    product.imageUrl || "/api/placeholder/400/400",
    "/api/placeholder/400/400",
    "/api/placeholder/400/400",
    "/api/placeholder/400/400",
  ];

  const handleBuyNow = () => {
    // In a real app, this would navigate to checkout
    toast({
      title: "Buy Now",
      description: "Redirecting to secure checkout...",
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation("/")}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="text-sm text-gray-600">
              <span className="hover:text-blue-600 cursor-pointer">Electronics</span>
              <span className="mx-2">›</span>
              <span className="hover:text-blue-600 cursor-pointer">{product.category}</span>
              <span className="mx-2">›</span>
              <span className="text-gray-900 font-medium">{product.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Images */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={productImages[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Thumbnail Images */}
              <div className="grid grid-cols-4 gap-2">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-gray-100 rounded border-2 overflow-hidden ${
                      selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">4.0 (1,234 reviews)</span>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-red-600">₹{product.price}</span>
                <span className="text-lg text-gray-500 line-through">₹{Math.round(product.price * 1.2)}</span>
                <Badge variant="destructive" className="text-sm">
                  17% off
                </Badge>
              </div>
              <p className="text-sm text-gray-600">Inclusive of all taxes</p>
              <p className="text-sm text-green-600 font-medium">You save ₹{Math.round(product.price * 0.2)}</p>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Truck className="h-5 w-5 text-green-600" />
                <span className="text-sm">Free delivery by tomorrow</span>
              </div>
              <div className="flex items-center space-x-3">
                <RotateCcw className="h-5 w-5 text-blue-600" />
                <span className="text-sm">7-day return policy</span>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-purple-600" />
                <span className="text-sm">1 year warranty</span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity:</label>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
              >
                <Heart className="h-4 w-4 mr-2" />
                Save for later
              </Button>
              <Button
                size="sm"
                variant="outline"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Purchase Options */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">₹{product.price}</div>
                  <p className="text-sm text-gray-600">Free delivery by tomorrow</p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Button
                    onClick={handleBuyNow}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    size="lg"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Buy Now
                  </Button>
                  
                  <Button
                    onClick={() => addToCartMutation.mutate()}
                    disabled={addToCartMutation.isPending}
                    variant="outline"
                    className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                    size="lg"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                  </Button>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sold by:</span>
                    <span className="text-blue-600 hover:underline cursor-pointer">VyronaMart Official</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">In stock:</span>
                    <span className="text-green-600 font-medium">Available</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ships from:</span>
                    <span>VyronaMart Fulfillment</span>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">V</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Earn VyronaCoins</p>
                      <p className="text-xs text-yellow-700">Get {Math.round(product.price * 0.05)} coins with this purchase</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-6">Product Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Specifications</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Brand:</span>
                      <span>VyronaMart</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Model:</span>
                      <span>{product.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="capitalize">{product.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weight:</span>
                      <span>1.2 kg</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">What's in the Box</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• 1 x {product.name}</li>
                    <li>• 1 x User Manual</li>
                    <li>• 1 x Warranty Card</li>
                    <li>• 1 x Accessories Kit</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}