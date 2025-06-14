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
import { Star, Heart, ShoppingCart, ArrowLeft, Truck, Shield, RotateCcw, Share2, MessageCircle, Users, Zap, Award, Clock, Send, BookOpen, Download, Calendar, Library } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

interface ReadProductDetailsProps {
  productId: string;
}

export default function ReadProductDetails({ productId }: ReadProductDetailsProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [questionerName, setQuestionerName] = useState("");
  const [borrowDuration, setBorrowDuration] = useState("14");
  const [borrowerName, setBorrowerName] = useState("");

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
  });

  // Fetch available libraries
  const { data: libraries = [] } = useQuery({
    queryKey: ["/api/vyronaread/libraries"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Loading book details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold mb-4">Book not found</p>
          <Button onClick={() => setLocation("/vyronaread")}>Back to VyronaRead</Button>
        </div>
      </div>
    );
  }

  const mockImages = [
    product.imageUrl || "/api/placeholder/300/450",
    "/api/placeholder/300/450",
    "/api/placeholder/300/450",
    "/api/placeholder/300/450"
  ];

  const handleBuyBook = () => {
    setLocation(`/vyronaread-checkout?type=buy&bookId=${productId}`);
  };

  const handleRentBook = () => {
    setLocation(`/vyronaread-checkout?type=rent&bookId=${productId}`);
  };

  const handleBorrowBook = () => {
    setBorrowDialogOpen(true);
  };

  const handleDownloadEbook = () => {
    setLocation(`/ebook-checkout?bookId=${productId}`);
  };

  const handleSubmitBorrow = () => {
    if (!borrowerName.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Borrow request submitted!",
      description: "Your request has been sent to the library for approval.",
    });
    
    setBorrowerName("");
    setBorrowDuration("14");
    setBorrowDialogOpen(false);
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
      description: "Your question has been posted to the reading community.",
    });
    
    setQuestionText("");
    setQuestionerName("");
    setQuestionDialogOpen(false);
  };

  // Extract book metadata
  const bookData = product.metadata || {};
  const isEbook = bookData.format === 'digital' || bookData.isEbook;
  const isPhysicalBook = !isEbook;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-teal-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/vyronaread")}
                className="flex items-center gap-2 hover:bg-green-100 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to VyronaRead
              </Button>
              <div className="text-sm text-gray-600">
                <span className="text-green-600 font-medium">VyronaRead</span> › {product.category} › {product.name}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="hover:bg-green-100">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Reading Ecosystem Trust Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-green-100">
            <BookOpen className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-800">Read Anywhere</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-green-100">
            <Library className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-800">Library Access</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-green-100">
            <RotateCcw className="h-6 w-6 text-teal-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-800">Easy Returns</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-green-100">
            <Award className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-800">Quality Content</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Book Cover Images */}
          <div className="space-y-4">
            <div className="relative">
              <div className="aspect-[3/4] bg-white rounded-xl border border-green-100 overflow-hidden shadow-lg max-w-sm mx-auto">
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
                  <Badge className={`text-white text-xs ${
                    isEbook 
                      ? "bg-gradient-to-r from-blue-500 to-teal-500" 
                      : "bg-gradient-to-r from-green-500 to-emerald-500"
                  }`}>
                    {isEbook ? (
                      <>
                        <Download className="h-2 w-2 mr-1" />
                        E-Book
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-2 w-2 mr-1" />
                        Physical Book
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
              {mockImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-[3/4] bg-white rounded-lg border overflow-hidden transition-all ${
                    selectedImageIndex === index ? "ring-2 ring-green-500 border-green-300" : "border-gray-200 hover:border-green-200"
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

          {/* Enhanced Book Info */}
          <div className="space-y-8">
            {/* Book Header */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">{product.category}</Badge>
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  <Zap className="h-3 w-3 mr-1" />
                  Popular
                </Badge>
                {bookData.genre && (
                  <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
                    {bookData.genre}
                  </Badge>
                )}
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 leading-tight">{product.name}</h1>
              {bookData.author && (
                <p className="text-xl text-gray-600 mb-4">by {bookData.author}</p>
              )}
              
              {/* Enhanced Rating */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-lg font-semibold text-gray-800">4.6</span>
                <span className="text-sm text-green-600 font-medium hover:underline cursor-pointer">2,143 reader reviews</span>
                <span className="text-sm text-blue-600 font-medium">✓ Reader recommended</span>
              </div>

              {/* Book Info */}
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                {bookData.isbn && (
                  <div className="flex items-center gap-1">
                    <span>ISBN: {bookData.isbn}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Published 2023</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>1,847 readers</span>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed text-lg">{product.description}</p>
            </div>

            {/* Enhanced Pricing */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
              <div className="space-y-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-green-600">₹{product.price}</span>
                  {isPhysicalBook && (
                    <>
                      <span className="text-xl text-gray-500 line-through">₹{Math.floor(product.price * 1.2}</span>
                      <Badge className="bg-gradient-to-r from-green-500 to-teal-500 text-white text-sm">
                        Reader's Discount
                      </Badge>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {isEbook 
                    ? "Instant download • Read on any device • Lifetime access" 
                    : "Free delivery on orders above ₹399 • Return within 30 days"
                  }
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600 font-medium">✓ Best reading price</span>
                  {isPhysicalBook && <span className="text-sm text-blue-600">• Rental available from ₹{Math.floor(product.price * 0.2}/month</span>}
                </div>
              </div>
            </div>

            {/* Reading Options */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100 space-y-6">
              {isPhysicalBook && (
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <label className="font-semibold text-gray-800">Quantity:</label>
                    <div className="flex items-center border-2 border-green-200 rounded-xl bg-white">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-2 hover:bg-green-50 transition-colors"
                      >
                        -
                      </button>
                      <span className="px-6 py-2 border-x-2 border-green-100 font-semibold">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-4 py-2 hover:bg-green-50 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="text-green-600 font-medium">📚 Multiple Reading Options</p>
                    <p className="text-gray-600">Buy, rent, or borrow from library</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {isEbook ? (
                  <div className="grid grid-cols-1 gap-4">
                    <Button
                      onClick={handleDownloadEbook}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white text-lg py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
                    >
                      <Download className="h-5 w-5 mr-3" />
                      Download E-Book • ₹{(product.price * quantity).toLocaleString()}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    <Button
                      onClick={handleBuyBook}
                      size="lg"
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-lg py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
                    >
                      <ShoppingCart className="h-5 w-5 mr-3" />
                      Buy Book • ₹{(product.price * quantity).toLocaleString()}
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="border-2 border-green-300 text-green-700 hover:bg-green-50 py-4 rounded-xl"
                        onClick={handleRentBook}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Rent Book
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50 py-4 rounded-xl"
                        onClick={handleBorrowBook}
                      >
                        <Library className="h-4 w-4 mr-2" />
                        Borrow from Library
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>📖 {isEbook ? "Instant access on all devices" : "Physical book delivery"}</span>
                <span>🔄 {isEbook ? "Cloud sync across devices" : "Easy return policy"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Book Details with Reading Features */}
        <div className="mt-16">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-green-200">
              <TabsTrigger value="details" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Book Details</TabsTrigger>
              <TabsTrigger value="reviews" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Reader Reviews</TabsTrigger>
              <TabsTrigger value="preview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Preview</TabsTrigger>
              <TabsTrigger value="libraries" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Available Libraries</TabsTrigger>
              <TabsTrigger value="qa" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Q&A</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-green-100">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Book Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Book Information</h4>
                      <ul className="space-y-1 text-gray-600">
                        {bookData.author && <li>• Author: {bookData.author}</li>}
                        {bookData.genre && <li>• Genre: {bookData.genre}</li>}
                        {bookData.isbn && <li>• ISBN: {bookData.isbn}</li>}
                        <li>• Format: {isEbook ? 'Digital E-Book' : 'Physical Book'}</li>
                        <li>• Language: English</li>
                        <li>• Publisher: Premium Publishing</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Reading Options</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Purchase for permanent access</li>
                        {isPhysicalBook && <li>• Rental options available</li>}
                        {isPhysicalBook && <li>• Library borrowing supported</li>}
                        {isEbook && <li>• Instant download</li>}
                        {isEbook && <li>• Read offline capability</li>}
                        <li>• Mobile app compatibility</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-green-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Reader Reviews</h3>
                    <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                          Write Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Share Your Reading Experience</DialogTitle>
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
                              placeholder="Share your thoughts about this book..."
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
                    <div className="border border-green-100 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <span className="font-medium">Alex R.</span>
                        <Badge variant="outline" className="text-xs">Verified Reader</Badge>
                      </div>
                      <p className="text-gray-600">Absolutely captivating read! The author's writing style kept me engaged from start to finish. Highly recommend for anyone interested in this genre.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="mt-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-green-100">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Book Preview</h3>
                  <div className="bg-gray-50 rounded-lg p-6 border">
                    <h4 className="font-medium mb-3">Chapter 1: The Beginning</h4>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat...
                    </p>
                    <Button variant="outline" className="border-green-300 text-green-700">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Continue Reading (Sample)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="libraries" className="mt-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-green-100">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Available in Libraries</h3>
                  <div className="space-y-4">
                    <div className="border border-green-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Central City Library</h4>
                        <Badge className="bg-green-100 text-green-800">Available • 3 copies</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Open Mon-Sat, 9AM-6PM • 2.5km away</p>
                      <Button size="sm" variant="outline" className="border-green-200" onClick={handleBorrowBook}>
                        <Library className="h-3 w-3 mr-1" />
                        Request Borrow
                      </Button>
                    </div>
                    <div className="border border-orange-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">University Library</h4>
                        <Badge className="bg-orange-100 text-orange-800">Wait list • 2 people ahead</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Academic library • 5.1km away</p>
                      <Button size="sm" variant="outline" className="border-orange-200">
                        <Clock className="h-3 w-3 mr-1" />
                        Join Wait List
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="qa" className="mt-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-green-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Questions & Answers</h3>
                    <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-green-300 text-green-700">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Ask Question
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Ask the Reading Community</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="question">Your Question</Label>
                            <Textarea
                              id="question"
                              placeholder="What would you like to know about this book?"
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
                    <div className="border border-green-100 rounded-lg p-4">
                      <div className="mb-2">
                        <span className="font-medium">Q:</span>
                        <span className="ml-2">Is this book part of a series?</span>
                      </div>
                      <div className="text-green-600">
                        <span className="font-medium">A:</span>
                        <span className="ml-2">Yes, this is the first book in a trilogy. The next book is already available for pre-order.</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Borrow Dialog */}
      <Dialog open={borrowDialogOpen} onOpenChange={setBorrowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Borrow from Library</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Borrower Name</Label>
              <Input 
                placeholder="Enter your full name"
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Borrow Duration</Label>
              <select 
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                value={borrowDuration}
                onChange={(e) => setBorrowDuration(e.target.value)}
              >
                <option value="7">1 week</option>
                <option value="14">2 weeks</option>
                <option value="30">1 month</option>
              </select>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Library will review your request and notify you within 24 hours.
              </p>
            </div>
            <Button onClick={handleSubmitBorrow} className="w-full">
              Submit Borrow Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}