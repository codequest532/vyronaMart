import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  ShoppingBag, 
  Users, 
  Star, 
  Heart, 
  Share2,
  MessageSquare,
  Package,
  Shield,
  Truck,
  RefreshCw
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function SocialProductDetails() {
  const { productId } = useParams<{ productId: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [isGroupSelectionOpen, setIsGroupSelectionOpen] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Get authenticated user
  const { data: authUser } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Get product details
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
  });

  // Get user's groups
  const { data: userGroups = [] } = useQuery({
    queryKey: ["/api/social/groups"],
    enabled: !!authUser,
  });

  // Add to group cart mutation
  const addToGroupCartMutation = useMutation({
    mutationFn: async (data: { productId: number; groupId: number; quantity: number }) => {
      return await apiRequest("/api/social/group-cart", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to group cart!",
        description: "Product has been added to your group's cart"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social/group-cart"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to group cart",
        variant: "destructive"
      });
    }
  });

  const handleAddToGroupCart = (groupId: number) => {
    if (!product) return;
    
    addToGroupCartMutation.mutate({
      productId: product.id,
      groupId,
      quantity: selectedQuantity
    });
    setIsGroupSelectionOpen(false);
  };

  const showLogin = () => {
    toast({
      title: "Authentication Required",
      description: "Please log in to add items to your group cart",
      variant: "destructive"
    });
    // Redirect to login or show login modal
  };

  if (productLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="h-6 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-semibold mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => setLocation("/social")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Social Shopping
          </Button>
        </div>
      </div>
    );
  }

  const productImages = product.imageUrl ? [product.imageUrl] : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/social")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Social Shopping
              </Button>
              <div className="h-4 w-px bg-gray-300"></div>
              <h1 className="text-lg font-semibold">Product Details</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-800 dark:to-pink-800 rounded-lg overflow-hidden relative">
              {productImages.length > 0 ? (
                <img
                  src={productImages[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="w-16 h-16 text-purple-400" />
                </div>
              )}
              <Badge className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                VyronaSocial
              </Badge>
            </div>
            
            {/* Thumbnail Images */}
            {productImages.length > 1 && (
              <div className="flex gap-2">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? "border-purple-500 shadow-lg"
                        : "border-gray-200 hover:border-gray-300"
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
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {product.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {product.description}
              </p>
            </div>

            {/* Pricing */}
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-purple-600">
                  ₹{Math.round(product.price)}
                </span>
                {product.enableGroupBuy && (
                  <span className="text-xl text-gray-500 line-through">
                    ₹{Math.round(product.price * 1.2)}
                  </span>
                )}
              </div>
              {product.enableGroupBuy && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    20% OFF with Group Buy
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Save ₹{Math.round(product.price * 0.2)} with friends!
                  </span>
                </div>
              )}
            </div>

            {/* Group Buy Features */}
            {product.enableGroupBuy && (
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-800 dark:text-purple-200">
                      Group Buy Benefits
                    </h3>
                  </div>
                  <ul className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
                    <li>• 20% discount when buying with friends</li>
                    <li>• Free delivery on group orders</li>
                    <li>• Social shopping experience</li>
                    <li>• Share costs with group members</li>
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Quantity Selection */}
            <div className="flex items-center gap-4">
              <span className="font-medium">Quantity:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                  disabled={selectedQuantity <= 1}
                >
                  -
                </Button>
                <span className="w-12 text-center">{selectedQuantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="space-y-3">
              {authUser ? (
                userGroups.length > 0 ? (
                  <Dialog open={isGroupSelectionOpen} onOpenChange={setIsGroupSelectionOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6 text-lg"
                        disabled={addToGroupCartMutation.isPending}
                      >
                        <ShoppingBag className="w-5 h-5 mr-2" />
                        {addToGroupCartMutation.isPending ? "Adding..." : "Add to Group Cart"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Select a Group</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        {userGroups.map((group: any) => (
                          <Card
                            key={group.id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleAddToGroupCart(group.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold">{group.name}</h4>
                                  <p className="text-sm text-gray-600">{group.memberCount} members</p>
                                </div>
                                <Badge variant="outline">{group.roomCode}</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="text-center space-y-3">
                    <p className="text-gray-600">You need to join a group to add items to cart</p>
                    <Button
                      onClick={() => setLocation("/social")}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6 text-lg"
                    >
                      <Users className="w-5 h-5 mr-2" />
                      Join a Shopping Group
                    </Button>
                  </div>
                )
              ) : (
                <Button
                  onClick={showLogin}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6 text-lg"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Login to Add to Cart
                </Button>
              )}
            </div>

            {/* Product Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4" />
                <span>Quality Assured</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="w-4 h-4" />
                <span>Free Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <RefreshCw className="w-4 h-4" />
                <span>Easy Returns</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MessageSquare className="w-4 h-4" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Product Description</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {product.description || "No detailed description available for this product."}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="specifications" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Product Specifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Category:</span>
                      <span className="ml-2 text-gray-600">{product.category}</span>
                    </div>
                    <div>
                      <span className="font-medium">Stock:</span>
                      <span className="ml-2 text-gray-600">{product.stockQuantity} available</span>
                    </div>
                    <div>
                      <span className="font-medium">Group Buy:</span>
                      <span className="ml-2 text-gray-600">
                        {product.enableGroupBuy ? "Available" : "Not Available"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Customer Reviews</h3>
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">No reviews yet</p>
                    <p className="text-sm text-gray-500 mt-2">Be the first to review this product!</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}