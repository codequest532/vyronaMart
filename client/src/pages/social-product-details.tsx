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
import { Star, Heart, ShoppingCart, ArrowLeft, Truck, Shield, RotateCcw, Share2, MessageCircle, Users, Zap, Award, Clock, Send, UserPlus, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

interface SocialProductDetailsProps {
  productId: string;
}

export default function SocialProductDetails({ productId }: SocialProductDetailsProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [groupInviteOpen, setGroupInviteOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [questionerName, setQuestionerName] = useState("");

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
  });

  // Fetch user's groups for social shopping
  const { data: userGroups = [] } = useQuery({
    queryKey: ["/api/shopping-rooms"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
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
          <Button onClick={() => setLocation("/social")}>Back to VyronaSocial</Button>
        </div>
      </div>
    );
  }

  const mockImages = [
    product.imageUrl || "/api/placeholder/400/400",
    "/api/placeholder/400/400",
    "/api/placeholder/400/400",
    "/api/placeholder/400/400"
  ];

  const handleAddToGroupCart = (groupId?: number) => {
    if (groupId) {
      toast({
        title: "Added to Group Cart!",
        description: "Product has been added to your group's shared cart.",
      });
    } else {
      toast({
        title: "Please select a group",
        description: "Choose a shopping group to add this product to.",
        variant: "destructive",
      });
    }
  };

  const handleInviteFriends = () => {
    setGroupInviteOpen(true);
  };

  const handleSubmitReview = () => {
    if (!reviewText.trim() || !reviewerName.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Review submitted successfully!",
      description: `Thank you for your ${reviewRating}-star review.`,
    });
    
    setReviewText("");
    setReviewerName("");
    setReviewRating(5);
    setReviewDialogOpen(false);
  };

  const handleSubmitQuestion = () => {
    if (!questionText.trim() || !questionerName.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Question submitted successfully!",
      description: "Your question has been posted to the community.",
    });
    
    setQuestionText("");
    setQuestionerName("");
    setQuestionDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/social")}
                className="flex items-center gap-2 hover:bg-purple-100 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to VyronaSocial
              </Button>
              <div className="text-sm text-gray-600">
                <span className="text-purple-600 font-medium">VyronaSocial</span> › {product.category} › {product.name}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="hover:bg-purple-100" onClick={handleInviteFriends}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Friends
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-purple-100">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Social Shopping Trust Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-purple-100">
            <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-800">Group Shopping</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-purple-100">
            <MessageSquare className="h-6 w-6 text-pink-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-800">Live Chat</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-purple-100">
            <Shield className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-800">Secure Payment</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-purple-100">
            <Award className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-800">Community Verified</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Compact Product Images */}
          <div className="space-y-4">
            <div className="relative">
              <div className="aspect-square bg-white rounded-xl border border-purple-100 overflow-hidden shadow-lg max-w-md mx-auto">
                <img
                  src={mockImages[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-102 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <Button variant="secondary" size="sm" className="bg-white/90 backdrop-blur-sm hover:bg-white h-8 w-8 p-0">
                    <Heart className="h-3 w-3" />
                  </Button>
                </div>
                <div className="absolute top-3 left-3">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                    <Users className="h-2 w-2 mr-1" />
                    Social Shopping
                  </Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
              {mockImages.map((image, index) => (
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
                <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                  <Zap className="h-3 w-3 mr-1" />
                  Trending
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
                <span className="text-lg font-semibold text-gray-800">4.7</span>
                <span className="text-sm text-purple-600 font-medium hover:underline cursor-pointer">1,892 community reviews</span>
                <span className="text-sm text-green-600 font-medium">✓ Friend recommended</span>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>847 friends bought this</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>Active in 23 groups</span>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed text-lg">{product.description}</p>
            </div>

            {/* Enhanced Pricing */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
              <div className="space-y-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-purple-600">₹{product.price}</span>
                  <span className="text-xl text-gray-500 line-through">₹{Math.floor(product.price * 1.25)}</span>
                  <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm">
                    Group Discount Applied
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">Special social shopping price • Free delivery on group orders</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600 font-medium">✓ Best group price</span>
                  <span className="text-sm text-purple-600">• Split payments with friends</span>
                </div>
              </div>
            </div>

            {/* Social Shopping Actions */}
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
                <div className="text-sm">
                  <p className="text-purple-600 font-medium">💜 Social Shopping Benefits</p>
                  <p className="text-gray-600">Shop with friends & save more</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Group Selection */}
                {userGroups.length > 0 && (
                  <div className="space-y-2">
                    <label className="font-semibold text-gray-800">Add to Group:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(userGroups as any[]).slice(0, 4).map((group: any) => (
                        <Button
                          key={group.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddToGroupCart(group.id)}
                          className="border-purple-200 hover:bg-purple-50 text-sm"
                        >
                          <Users className="h-3 w-3 mr-1" />
                          {group.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <Button
                    onClick={() => handleAddToGroupCart()}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    <Users className="h-5 w-5 mr-3" />
                    Add to Group Cart • ₹{(product.price * quantity).toLocaleString()}
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="lg" className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 py-4 rounded-xl">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start Discussion
                    </Button>
                    <Button variant="outline" size="lg" className="border-2 border-pink-300 text-pink-700 hover:bg-pink-50 py-4 rounded-xl" onClick={handleInviteFriends}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Friends
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>💳 Split payments with friends</span>
                <span>🚚 Group delivery discounts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Product Details with Social Features */}
        <div className="mt-16">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-purple-200">
              <TabsTrigger value="details" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">Details</TabsTrigger>
              <TabsTrigger value="reviews" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">Community Reviews</TabsTrigger>
              <TabsTrigger value="groups" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">Active Groups</TabsTrigger>
              <TabsTrigger value="shipping" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">Shipping</TabsTrigger>
              <TabsTrigger value="qa" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">Q&A</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-purple-100">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Product Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Key Features</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Premium quality materials</li>
                        <li>• Eco-friendly packaging</li>
                        <li>• 1-year warranty included</li>
                        <li>• Free maintenance service</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Social Shopping Benefits</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Group discounts available</li>
                        <li>• Share with friends for better prices</li>
                        <li>• Community verified quality</li>
                        <li>• Split payment options</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Community Reviews</h3>
                    <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                          Write Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Share Your Experience</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="rating">Rating</Label>
                            <div className="flex items-center gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setReviewRating(star)}
                                  className="focus:outline-none"
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
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="review">Your Review</Label>
                            <Textarea
                              id="review"
                              placeholder="Share your experience with this product..."
                              value={reviewText}
                              onChange={(e) => setReviewText(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="name">Your Name</Label>
                            <Input
                              id="name"
                              placeholder="Enter your name"
                              value={reviewerName}
                              onChange={(e) => setReviewerName(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <Button onClick={handleSubmitReview} className="w-full">
                            <Send className="h-4 w-4 mr-2" />
                            Submit Review
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Sample community reviews */}
                    <div className="border border-purple-100 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <span className="font-medium">Sarah M.</span>
                        <Badge variant="outline" className="text-xs">Group Purchase</Badge>
                      </div>
                      <p className="text-gray-600">Amazing product! Bought it with my shopping group and got a great discount. Quality is exactly as described.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="groups" className="mt-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-purple-100">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Active Shopping Groups</h3>
                  <div className="space-y-4">
                    <div className="border border-purple-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Fashion Friends</h4>
                        <Badge className="bg-green-100 text-green-800">Active • 8 members</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Currently discussing this product with 3 potential buyers</p>
                      <Button size="sm" variant="outline" className="border-purple-200">
                        <UserPlus className="h-3 w-3 mr-1" />
                        Join Group
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="shipping" className="mt-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-purple-100">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Shipping & Returns</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">✓ Free Group Delivery</h4>
                      <p className="text-sm text-gray-600">Free delivery on all group orders above ₹999</p>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-blue-600 mb-2">🚚 Delivery Options</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Standard delivery: 3-5 business days</li>
                        <li>• Express delivery: 1-2 business days</li>
                        <li>• Group delivery: Coordinated delivery to all members</li>
                      </ul>
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
                        <Button variant="outline" className="border-purple-300 text-purple-700">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Ask Question
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Ask the Community</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="question">Your Question</Label>
                            <Textarea
                              id="question"
                              placeholder="What would you like to know about this product?"
                              value={questionText}
                              onChange={(e) => setQuestionText(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="questioner-name">Your Name</Label>
                            <Input
                              id="questioner-name"
                              placeholder="Enter your name"
                              value={questionerName}
                              onChange={(e) => setQuestionerName(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <Button onClick={handleSubmitQuestion} className="w-full">
                            <Send className="h-4 w-4 mr-2" />
                            Post Question
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="border border-purple-100 rounded-lg p-4">
                      <div className="mb-2">
                        <span className="font-medium">Q:</span>
                        <span className="ml-2">Is this product available for group buying?</span>
                      </div>
                      <div className="text-green-600">
                        <span className="font-medium">A:</span>
                        <span className="ml-2">Yes! Group buying is available with additional discounts for 5+ members.</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Group Invite Dialog */}
      <Dialog open={groupInviteOpen} onOpenChange={setGroupInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Friends to Shop</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Share this product with friends:</Label>
              <div className="flex gap-2 mt-2">
                <Input 
                  readOnly 
                  value={`https://vyrona.social/product/${productId}`}
                  className="flex-1"
                />
                <Button size="sm">Copy</Button>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Friends who join your group get the same discount!
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}