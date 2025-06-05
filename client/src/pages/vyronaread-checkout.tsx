import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  BookOpen, 
  CreditCard, 
  Calendar, 
  Clock, 
  ShoppingCart,
  CheckCircle,
  Building2,
  User,
  Mail,
  Phone
} from "lucide-react";

export default function VyronaReadCheckout() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const checkoutType = urlParams.get('type'); // 'buy', 'rent', or 'borrow'
  const bookId = urlParams.get('bookId');
  const bookName = urlParams.get('bookName');
  const author = urlParams.get('author');
  const clientSecret = urlParams.get('client_secret');
  
  // State management
  const [bookDetails, setBookDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [rentalDuration, setRentalDuration] = useState('15'); // 15 days default
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  
  // Customer information
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  });

  // Borrowing specific information
  const [borrowingInfo, setBorrowingInfo] = useState({
    libraryCardNumber: '',
    returnDate: '',
    purpose: 'personal' // personal, academic, research
  });

  useEffect(() => {
    fetchBookDetails();
  }, [bookId]);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      
      // For borrow type, use URL parameters instead of API call
      if (checkoutType === 'borrow' && bookName && author) {
        setBookDetails({
          id: bookId,
          name: decodeURIComponent(bookName),
          author: decodeURIComponent(author),
          price: 0 // Borrowing is free (membership fee handled separately)
        });
        return;
      }
      
      // For other types, try API endpoints
      let response;
      if (checkoutType === 'borrow') {
        response = await fetch(`/api/vyronaread/library-books/${bookId}`);
      } else {
        response = await fetch(`/api/products/${bookId}`);
      }
      
      if (response.ok) {
        const data = await response.json();
        setBookDetails(Array.isArray(data) ? data[0] : data);
      }
    } catch (error) {
      console.error('Error fetching book details:', error);
      toast({
        title: "Error",
        description: "Failed to load book details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if user has active membership
  const [hasMembership, setHasMembership] = useState(false);
  const [membershipLoading, setMembershipLoading] = useState(true);

  useEffect(() => {
    checkMembershipStatus();
  }, []);

  const checkMembershipStatus = async () => {
    try {
      const response = await fetch('/api/user/membership-status');
      if (response.ok) {
        const data = await response.json();
        setHasMembership(data.hasActiveMembership);
      }
    } catch (error) {
      console.error('Error checking membership:', error);
    } finally {
      setMembershipLoading(false);
    }
  };

  const calculatePrice = () => {
    if (!bookDetails) return 0;
    
    switch (checkoutType) {
      case 'buy':
        return bookDetails.price || bookDetails.buyPrice || 0;
      case 'rent':
        const baseDailyRate = (bookDetails.rentPrice || bookDetails.price * 0.1) / 100; // 10% of buy price per day
        return Math.round(baseDailyRate * parseInt(rentalDuration));
      case 'borrow':
        // If user doesn't have membership, charge membership fee
        return hasMembership ? 0 : 2000; // ₹2000 annual membership
      default:
        return 0;
    }
  };

  const getPriceLabel = () => {
    switch (checkoutType) {
      case 'buy':
        return 'Purchase Price';
      case 'rent':
        return `Rental Fee (${rentalDuration} days)`;
      case 'borrow':
        return hasMembership ? 'Borrowing Fee' : 'Annual Membership Fee';
      default:
        return 'Total Price';
    }
  };

  const getProcessButtonText = () => {
    if (processing) return 'Processing...';
    
    switch (checkoutType) {
      case 'buy':
        return 'Complete Purchase';
      case 'rent':
        return 'Start Rental';
      case 'borrow':
        return hasMembership ? 'Place Borrow Order' : 'Pay Membership & Borrow';
      default:
        return 'Complete Order';
    }
  };

  const handleCustomerInfoChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleBorrowingInfoChange = (field: string, value: string) => {
    setBorrowingInfo(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!customerInfo.name || !customerInfo.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in required customer information",
        variant: "destructive"
      });
      return false;
    }

    if (checkoutType === 'borrow' && !borrowingInfo.libraryCardNumber) {
      toast({
        title: "Validation Error", 
        description: "Library card number is required for borrowing",
        variant: "destructive"
      });
      return false;
    }

    if (!agreementAccepted) {
      toast({
        title: "Validation Error",
        description: "Please accept the terms and conditions",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const processCheckout = async () => {
    if (!validateForm()) return;

    setProcessing(true);
    try {
      let endpoint = '';
      let payload: any = {
        bookId: parseInt(bookId!),
        customerInfo,
        type: checkoutType
      };

      switch (checkoutType) {
        case 'buy':
          endpoint = '/api/vyronaread/purchase';
          payload.amount = calculatePrice();
          payload.paymentMethod = paymentMethod;
          break;
          
        case 'rent':
          endpoint = '/api/rentals/create';
          payload = {
            userId: 1, // Get from user context
            productId: parseInt(bookId!),
            bookId: parseInt(bookId!),
            bookType: 'physical',
            rentalPricePerCycle: calculatePrice(), // Price in paise
            sellerId: bookDetails.sellerId || 1,
            libraryId: null,
            customerInfo,
            paymentMethod
          };
          break;
          
        case 'borrow':
          // For borrowing, first handle membership payment if needed
          if (!hasMembership) {
            endpoint = '/api/library/membership';
            payload = {
              fullName: customerInfo.name,
              email: customerInfo.email,
              phone: customerInfo.phone,
              membershipType: "annual",
              fee: 2000,
              bookId: bookId,
              bookTitle: bookDetails?.name || 'Unknown Book'
            };
          } else {
            // Process borrowing order directly
            endpoint = '/api/process-borrow-order';
            payload.borrowingInfo = borrowingInfo;
          }
          break;
      }

      const response = await apiRequest("POST", endpoint, payload);
      
      toast({
        title: "Success!",
        description: getSuccessMessage(),
      });

      // Redirect to confirmation page or back to VyronaRead
      setTimeout(() => {
        setLocation('/vyronaread');
      }, 2000);

    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "Failed to process request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getSuccessMessage = () => {
    switch (checkoutType) {
      case 'buy':
        return "Book purchased successfully! You now have lifetime access.";
      case 'rent':
        return `Book rented successfully for ${rentalDuration} days!`;
      case 'borrow':
        return "Borrow request submitted successfully! Please wait for library approval.";
      default:
        return "Request processed successfully!";
    }
  };

  const getCheckoutTitle = () => {
    switch (checkoutType) {
      case 'buy':
        return "Purchase Book";
      case 'rent':
        return "Rent Book";
      case 'borrow':
        return "Borrow from Library";
      default:
        return "Checkout";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading checkout details...</div>
      </div>
    );
  }

  if (!bookDetails) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Book not found</p>
          <Button onClick={() => setLocation('/vyronaread')}>
            Back to VyronaRead
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => setLocation("/vyronaread")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to VyronaRead
        </Button>
      </div>

      {/* Header */}
      <Card className="vyrona-gradient-read text-white mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            {checkoutType === 'buy' && <ShoppingCart className="h-8 w-8" />}
            {checkoutType === 'rent' && <Clock className="h-8 w-8" />}
            {checkoutType === 'borrow' && <Building2 className="h-8 w-8" />}
            <div>
              <h1 className="text-2xl font-bold">{getCheckoutTitle()}</h1>
              <p className="opacity-90">Complete your book access request</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Book Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Book Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="w-16 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded flex items-center justify-center flex-shrink-0">
                  <BookOpen className="text-purple-600 h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{bookDetails.title || bookDetails.name}</h3>
                  <p className="text-gray-600 mb-2">by {bookDetails.author || "Unknown Author"}</p>
                  {bookDetails.isbn && (
                    <p className="text-sm text-gray-500">ISBN: {bookDetails.isbn}</p>
                  )}
                  {bookDetails.category && (
                    <Badge variant="secondary" className="mt-2">{bookDetails.category}</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rental Duration (for rent only) */}
          {checkoutType === 'rent' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Rental Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={rentalDuration} onValueChange={setRentalDuration}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="15" id="15days" />
                    <Label htmlFor="15days">15 days - ₹{Math.floor(calculatePrice() / 100)} (Recommended)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="30" id="30days" />
                    <Label htmlFor="30days">30 days - ₹{Math.floor((calculatePrice() * 2) / 100)}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="60" id="60days" />
                    <Label htmlFor="60days">60 days - ₹{Math.floor((calculatePrice() * 4) / 100)}</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={customerInfo.phone}
                    onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={customerInfo.city}
                    onChange={(e) => handleCustomerInfoChange('city', e.target.value)}
                    placeholder="Enter your city"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={customerInfo.address}
                  onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
                  placeholder="Enter your complete address"
                />
              </div>
            </CardContent>
          </Card>

          {/* Library Borrowing Information */}
          {checkoutType === 'borrow' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Library Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="libraryCard">Library Card Number *</Label>
                  <Input
                    id="libraryCard"
                    value={borrowingInfo.libraryCardNumber}
                    onChange={(e) => handleBorrowingInfoChange('libraryCardNumber', e.target.value)}
                    placeholder="Enter your library card number"
                  />
                </div>
                <div>
                  <Label htmlFor="purpose">Purpose of Borrowing</Label>
                  <RadioGroup 
                    value={borrowingInfo.purpose} 
                    onValueChange={(value) => handleBorrowingInfoChange('purpose', value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="personal" id="personal" />
                      <Label htmlFor="personal">Personal Reading</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="academic" id="academic" />
                      <Label htmlFor="academic">Academic Study</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="research" id="research" />
                      <Label htmlFor="research">Research Work</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Method (for buy/rent only) */}
          {(checkoutType === 'buy' || checkoutType === 'rent') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card">Credit/Debit Card</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi">UPI Payment</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="wallet" id="wallet" />
                    <Label htmlFor="wallet">Digital Wallet</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Book:</span>
                  <span className="font-medium">{bookDetails.title || bookDetails.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <Badge variant="outline" className="capitalize">{checkoutType}</Badge>
                </div>
                {checkoutType === 'rent' && (
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{rentalDuration} days</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                {checkoutType !== 'borrow' ? (
                  <>
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-bold">₹{Math.floor(calculatePrice() / 100)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Processing Fee:</span>
                      <span>₹0</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>₹{Math.floor(calculatePrice() / 100)}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-green-600 font-medium">Free Library Service</p>
                    <p className="text-sm text-gray-500">No payment required</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Terms and Conditions */}
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={agreementAccepted}
                    onCheckedChange={(checked) => setAgreementAccepted(checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed">
                    I agree to the VyronaRead terms and conditions and the book {checkoutType} policy
                  </Label>
                </div>
                
                {checkoutType === 'rent' && (
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>• Book must be returned within {rentalDuration} days</p>
                    <p>• Late return fee: ₹10 per day</p>
                    <p>• Digital copy will expire automatically</p>
                  </div>
                )}
                
                {checkoutType === 'borrow' && (
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>• Library approval required</p>
                    <p>• Return date will be communicated</p>
                    <p>• Late return may affect borrowing privileges</p>
                  </div>
                )}
              </div>

              <Button
                className="w-full"
                onClick={processCheckout}
                disabled={processing || !agreementAccepted}
                size="lg"
              >
                {processing ? (
                  "Processing..."
                ) : checkoutType === 'borrow' ? (
                  "Submit Borrow Request"
                ) : (
                  `Complete ${checkoutType === 'buy' ? 'Purchase' : 'Rental'}`
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}