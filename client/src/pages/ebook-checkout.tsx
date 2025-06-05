import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft,
  BookOpen,
  Download,
  Shield,
  Clock,
  CheckCircle,
  CreditCard,
  Smartphone,
  Tablet,
  Monitor,
  Star,
  Users,
  Zap
} from "lucide-react";

export default function EBookCheckout() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookDetails, setBookDetails] = useState<any>(null);
  const [paymentStep, setPaymentStep] = useState<"details" | "payment" | "success">("details");

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('bookId');
  const bookName = urlParams.get('bookName');
  const clientSecret = urlParams.get('client_secret');

  useEffect(() => {
    if (bookId) {
      // Fetch book details for checkout
      fetchBookDetails();
    }
  }, [bookId]);

  const fetchBookDetails = async () => {
    try {
      const response = await apiRequest("GET", `/api/vyronaread/ebooks`);
      const ebooks = await response.json();
      const book = ebooks.find((b: any) => b.id === parseInt(bookId || '0'));
      setBookDetails(book);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load book details",
        variant: "destructive"
      });
    }
  };

  const handlePurchase = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create order record
      await apiRequest("POST", "/api/orders", {
        items: [{
          productId: bookDetails.id,
          productName: bookDetails.name || bookDetails.title,
          price: bookDetails.price,
          quantity: 1
        }],
        totalAmount: bookDetails.price,
        paymentMethod: "card",
        module: "vyronaread",
        orderType: "ebook-purchase"
      });

      setPaymentStep("success");
      
      toast({
        title: "Purchase Successful!",
        description: "You now have full access to the e-book.",
      });
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return `₹${Math.floor(price / 100)}`;
  };

  if (!bookDetails) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading book details...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (paymentStep === "success") {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Purchase Complete!</h1>
              <p className="text-gray-600 mb-8">
                You now have lifetime access to "{bookDetails.name || bookDetails.title}". 
                Start reading immediately or download for offline access.
              </p>
              
              <div className="space-y-4">
                <Button 
                  size="lg" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => setLocation('/vyronaread')}
                >
                  <BookOpen className="mr-2 h-5 w-5" />
                  Start Reading Now
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => alert('Download functionality would be implemented here')}
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download PDF
                </Button>
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2">What's Next?</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>✓ Access from any device with your account</li>
                  <li>✓ Bookmark and highlight passages</li>
                  <li>✓ Search through the entire text</li>
                  <li>✓ Download for offline reading</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/vyronaread">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to VyronaRead
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Order Summary */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Complete Your Purchase
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Order Details</span>
                      <span>Payment</span>
                      <span>Complete</span>
                    </div>
                    <Progress value={paymentStep === "details" ? 33 : paymentStep === "payment" ? 66 : 100} />
                  </div>

                  {/* Book Preview */}
                  <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
                    <div className="w-16 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{bookDetails.name || bookDetails.title}</h3>
                      <p className="text-gray-600">by {bookDetails.metadata?.author || "Unknown Author"}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant="secondary">{bookDetails.metadata?.genre || "Digital Book"}</Badge>
                        <span className="text-sm text-gray-500">
                          {bookDetails.metadata?.fileSize || "2.5MB"} • {bookDetails.metadata?.format || "PDF"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatPrice(bookDetails.price || 1999)}
                      </div>
                      <div className="text-sm text-gray-500">One-time payment</div>
                    </div>
                  </div>

                  {/* What You Get */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">What's Included:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { icon: BookOpen, title: "Full E-Book Access", desc: "Complete digital version" },
                        { icon: Download, title: "Download Rights", desc: "PDF download included" },
                        { icon: Smartphone, title: "Multi-Device Access", desc: "Read on any device" },
                        { icon: Clock, title: "Lifetime Access", desc: "Never expires" }
                      ].map((feature, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <feature.icon className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-sm">{feature.title}</div>
                            <div className="text-xs text-gray-600">{feature.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Button */}
                  <div className="pt-4 border-t">
                    <Button
                      size="lg"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={handlePurchase}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-5 w-5" />
                          Complete Purchase - {formatPrice(bookDetails.price || 1999)}
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Secure payment powered by Stripe • 30-day money-back guarantee
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>E-Book Price</span>
                    <span>{formatPrice(bookDetails.price || 1999)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Platform Discount</span>
                    <span>-₹0</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{formatPrice(bookDetails.price || 1999)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Signals */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Why Choose VyronaRead?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Secure Payment</div>
                      <div className="text-xs text-gray-600">256-bit SSL encryption</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Instant Access</div>
                      <div className="text-xs text-gray-600">Read immediately after purchase</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">10,000+ Happy Readers</div>
                      <div className="text-xs text-gray-600">Join our reading community</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Reviews */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Reviews</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-sm font-medium">4.8/5 (124 reviews)</span>
                  </div>
                  <div className="space-y-3">
                    <div className="border-l-2 border-blue-200 pl-3">
                      <p className="text-sm italic">"Excellent content and smooth reading experience."</p>
                      <p className="text-xs text-gray-500 mt-1">- Verified Purchase</p>
                    </div>
                    <div className="border-l-2 border-green-200 pl-3">
                      <p className="text-sm italic">"Great value for money. Instant download worked perfectly."</p>
                      <p className="text-xs text-gray-500 mt-1">- Verified Purchase</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}