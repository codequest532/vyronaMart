import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Heart, ShoppingCart, ArrowLeft, Truck, Shield, RotateCcw, Share2, MessageCircle, Users, Zap, Award, Clock, Send } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

interface ProductDetailsProps {
  productId: string;
}

export default function ProductDetails({ productId }: ProductDetailsProps) {
  const [, setLocation] = useLocation();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [questionerName, setQuestionerName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
  });

  const { data: currentUser } = useQuery({
    queryKey: ["/api/current-user"],
    retry: false,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      return await apiRequest("POST", "/api/cart/add", { productId, quantity });
    },
    onSuccess: () => {
      toast({
        title: "Added to Cart",
        description: `${product?.name} has been added to your cart.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: any) => {
      if (error.message.includes("401")) {
        toast({
          title: "Please Login",
          description: "You need to login to add items to cart.",
          variant: "destructive",
        });
        setLocation("/login");
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to add item to cart. Please try again.",
          variant: "destructive",
        });
      }
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
          <p className="text-xl font-semibold mb-4">Product not found</p>
          <Button onClick={() => setLocation("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  // Use imageUrls array if available, fallback to single imageUrl, then placeholder
  const productImages = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls 
    : product.imageUrl 
      ? [product.imageUrl] 
      : ["/api/placeholder/400/400"];
  
  const images = productImages;

  const handleAddToCart = () => {
    if (!currentUser) {
      toast({
        title: "Please Login",
        description: "You need to login to add items to cart.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    if (!product) return;

    addToCartMutation.mutate({
      productId: product.id,
      quantity: quantity,
    });
  };

  const handleSubmitReview = () => {
    if (!reviewText.trim() || !reviewerName.trim()) {
      alert("Please fill in all fields");
      return;
    }
    
    // In a real app, this would make an API call to submit the review
    alert(`Review submitted successfully!\nRating: ${reviewRating} stars\nReview: ${reviewText}\nName: ${reviewerName}`);
    
    // Reset form and close dialog
    setReviewText("");
    setReviewerName("");
    setReviewRating(5);
    setReviewDialogOpen(false);
  };

  const handleSubmitQuestion = () => {
    if (!questionText.trim() || !questionerName.trim()) {
      alert("Please fill in all fields");
      return;
    }
    
    // In a real app, this would make an API call to submit the question
    alert(`Question submitted successfully!\nQuestion: ${questionText}\nName: ${questionerName}`);
    
    // Reset form and close dialog
    setQuestionText("");
    setQuestionerName("");
    setQuestionDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/vyronahub")}
                className="flex items-center gap-2 hover:bg-purple-100 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to VyronaHub
              </Button>
              <div className="text-sm text-gray-600">
                <span className="text-purple-600 font-medium">VyronaHub</span> › {product.category} › {product.name}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="hover:bg-purple-100">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trust Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-purple-100">
            <Truck className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-800">Free Delivery</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-purple-100">
            <Shield className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-800">Secure Payment</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-purple-100">
            <RotateCcw className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-800">Easy Returns</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-purple-100">
            <Award className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-800">Quality Assured</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Compact Product Images */}
          <div className="space-y-4">
            <div className="relative">
              <div className="aspect-square bg-white rounded-xl border border-purple-100 overflow-hidden shadow-lg max-w-md mx-auto">
                <img
                  src={images[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-102 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <Button variant="secondary" size="sm" className="bg-white/90 backdrop-blur-sm hover:bg-white h-8 w-8 p-0">
                    <Heart className="h-3 w-3" />
                  </Button>
                </div>
                {product.enableGroupBuy && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs">
                      <Users className="h-2 w-2 mr-1" />
                      Group Buy
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-square bg-white rounded-lg border overflow-hidden transition-all ${
                    selectedImageIndex === index ? "ring-2 ring-purple-500 border-purple-300" : "border-gray-200 hover:border-purple-200"
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

          {/* Enhanced Product Info */}
          <div className="space-y-8">
            {/* Product Header */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-50">{product.category}</Badge>
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  <Zap className="h-3 w-3 mr-1" />
                  Best Seller
                </Badge>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">{product.name}</h1>
              
              {/* Enhanced Rating */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-lg font-semibold text-gray-800">4.8</span>
                <span className="text-sm text-purple-600 font-medium hover:underline cursor-pointer">2,847 reviews</span>
                <span className="text-sm text-green-600 font-medium">✓ Verified purchases</span>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>1,247 customers bought this week</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Limited time offer</span>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed text-lg">{product.description}</p>
            </div>

            {/* Enhanced Pricing */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-200">
              <div className="space-y-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-purple-600">₹{product.price}</span>
                  <span className="text-xl text-gray-500 line-through">₹{Math.floor(product.price * 1.3)}</span>
                  <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm">
                    {Math.round((1 - product.price / (product.price * 1.3)) * 100)}% OFF
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">Inclusive of all taxes • Free delivery on orders above ₹499</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600 font-medium">✓ Best price guaranteed</span>
                  <span className="text-sm text-blue-600">• EMI starting ₹{Math.floor(product.price / 12}/month</span>
                </div>
              </div>
            </div>

            {/* Enhanced Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-100 space-y-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <label className="font-semibold text-gray-800">Quantity:</label>
                  <div className="flex items-center border-2 border-purple-200 rounded-xl bg-white">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 hover:bg-purple-50 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-6 py-2 border-x-2 border-purple-100 font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-4 py-2 hover:bg-purple-50 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
                {product.enableGroupBuy && (
                  <div className="text-sm">
                    <p className="text-green-600 font-medium">🔥 Group Buy: Save extra 15%</p>
                    <p className="text-gray-600">Min {product.groupBuyMinQuantity} people required</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={addToCartMutation.isPending}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addToCartMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Adding to Cart...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-3" />
                      Add to Cart • ₹{(product.price * quantity).toLocaleString(}
                    </>
                  )}
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 py-4 rounded-xl"
                    onClick={() => setLocation(`/vyronahub-checkout?productId=${productId}&quantity=${quantity}`)}
                  >
                    Buy Now
                  </Button>
                  {product.enableGroupBuy && (
                    <Button variant="outline" size="lg" className="border-2 border-green-300 text-green-700 hover:bg-green-50 py-4 rounded-xl">
                      <Users className="h-4 w-4 mr-2" />
                      Group Buy
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>💳 Secure checkout with 256-bit encryption</span>
                <span>🚚 Same-day delivery available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Product Details */}
        <div className="mt-16">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-purple-200">
              <TabsTrigger value="details" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Product Details</TabsTrigger>
              <TabsTrigger value="reviews" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Reviews (2,847)</TabsTrigger>
              <TabsTrigger value="shipping" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Shipping & Returns</TabsTrigger>
              <TabsTrigger value="qa" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Q&A (156)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-purple-100">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Product Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Description:</h4>
                      <div className="text-gray-700">
                        {product.description || "No description provided by seller."}
                      </div>
                      {product.specifications && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Additional Details:</h4>
                          <div className="text-gray-700 whitespace-pre-line">
                            {product.specifications}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Specifications:</h4>
                      <ul className="space-y-2 text-gray-700">
                        {product.brand && <li>• Brand: {product.brand}</li>}
                        {product.weight && <li>• Weight: {product.weight}</li>}
                        {product.dimensions && <li>• Dimensions: {product.dimensions}</li>}
                        {product.sku && <li>• SKU: {product.sku}</li>}
                        {product.category && <li>• Category: {product.category}</li>}
                        {(!product.brand && !product.weight && !product.dimensions && !product.sku) && (
                          <li className="text-gray-500 italic">No specifications provided by seller.</li>
                        )}
                      </ul>
                      {product.tags && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Tags:</h4>
                          <div className="flex flex-wrap gap-2">
                            {product.tags.split(',').map((tag, index) => (
                              <span key={index} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-sm">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Customer Reviews</h3>
                    <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Write a Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-semibold text-purple-700">Write a Review</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="reviewerName" className="text-sm font-medium">Your Name</Label>
                            <Input
                              id="reviewerName"
                              value={reviewerName}
                              onChange={(e) => setReviewerName(e.target.value)}
                              placeholder="Enter your name"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Rating</Label>
                            <div className="flex items-center gap-2 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setReviewRating(star)}
                                  className="transition-colors"
                                >
                                  <Star
                                    className={`h-6 w-6 ${
                                      star <= reviewRating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                </button>
                              ))}
                              <span className="ml-2 text-sm text-gray-600">
                                {reviewRating} star{reviewRating !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="reviewText" className="text-sm font-medium">Your Review</Label>
                            <Textarea
                              id="reviewText"
                              value={reviewText}
                              onChange={(e) => setReviewText(e.target.value)}
                              placeholder="Share your experience with this product..."
                              className="mt-1 min-h-[100px]"
                            />
                          </div>
                          <div className="flex gap-3 pt-4">
                            <Button
                              onClick={handleSubmitReview}
                              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Submit Review
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setReviewDialogOpen(false)}
                              className="border-gray-300"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="space-y-4">
                    {[1, 2, 3].map((review) => (
                      <div key={review} className="border-b border-gray-200 pb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <span className="font-medium">Verified Buyer</span>
                          <span className="text-sm text-gray-600">• 2 days ago</span>
                        </div>
                        <p className="text-gray-700">"Excellent product quality and fast delivery. Highly recommended!"</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="shipping" className="mt-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-purple-100">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Shipping & Returns</h3>
                  <div className="grid gap-6">
                    <div className="flex items-start gap-4">
                      <Truck className="h-6 w-6 text-green-600 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-900">Free Delivery</h4>
                        <p className="text-gray-600">Get free delivery on orders above ₹499. Same-day delivery available in select cities.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <RotateCcw className="h-6 w-6 text-blue-600 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-900">Easy Returns</h4>
                        <p className="text-gray-600">30-day return policy. Items must be in original condition with tags attached.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="qa" className="mt-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Questions & Answers</h3>
                    <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Ask a Question
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-semibold text-purple-700">Ask a Question</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="questionerName" className="text-sm font-medium">Your Name</Label>
                            <Input
                              id="questionerName"
                              value={questionerName}
                              onChange={(e) => setQuestionerName(e.target.value)}
                              placeholder="Enter your name"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="questionText" className="text-sm font-medium">Your Question</Label>
                            <Textarea
                              id="questionText"
                              value={questionText}
                              onChange={(e) => setQuestionText(e.target.value)}
                              placeholder="Ask about product features, compatibility, warranty, or anything else..."
                              className="mt-1 min-h-[100px]"
                            />
                          </div>
                          <div className="flex gap-3 pt-4">
                            <Button
                              onClick={handleSubmitQuestion}
                              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Submit Question
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setQuestionDialogOpen(false)}
                              className="border-gray-300"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-4">
                      <p className="font-medium text-gray-900 mb-2">Q: What is the warranty period?</p>
                      <p className="text-gray-700">A: This product comes with a 2-year manufacturer warranty covering all defects.</p>
                    </div>
                    <div className="border-b border-gray-200 pb-4">
                      <p className="font-medium text-gray-900 mb-2">Q: Is assembly required?</p>
                      <p className="text-gray-700">A: No assembly required. The product comes ready to use out of the box.</p>
                    </div>
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