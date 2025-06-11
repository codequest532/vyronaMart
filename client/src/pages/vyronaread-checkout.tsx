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
  MapPin,
  Building2,
  User,
  Users,
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
  const source = urlParams.get('source'); // 'library-cart' for bulk borrow
  
  // State management
  const [bookDetails, setBookDetails] = useState<any>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [libraryCartItems, setLibraryCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [rentalDuration, setRentalDuration] = useState('15'); // 15 days default
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [userType, setUserType] = useState<'new' | 'existing' | null>(null);
  const [itemRentalDurations, setItemRentalDurations] = useState<{[key: number]: number}>({});
  
  // Customer information
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  });

  // Shipping address
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: ''
  });

  // Borrowing specific information
  const [borrowingInfo, setBorrowingInfo] = useState({
    libraryCardNumber: '',
    returnDate: '',
    purpose: 'personal' // personal, academic, research
  });

  useEffect(() => {
    fetchBookDetails();
  }, [bookId, checkoutType]);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      
      // Handle library cart checkout - load library cart items from sessionStorage
      if (checkoutType === 'borrow' && source === 'library-cart') {
        const libraryCartData = sessionStorage.getItem('vyronaread_library_cart');
        console.log('Loading library cart for checkout:', libraryCartData);
        if (libraryCartData) {
          const items = JSON.parse(libraryCartData);
          setLibraryCartItems(items);
          console.log('Loaded library cart items:', items);
        }
        setLoading(false);
        return;
      }
      
      // Handle cart checkout - load cart items from sessionStorage
      if (checkoutType === 'cart') {
        const cartData = sessionStorage.getItem('vyronaread_cart');
        if (cartData) {
          const items = JSON.parse(cartData);
          setCartItems(items);
          
          // Initialize rental durations for each cart item
          const initialDurations: {[key: number]: number} = {};
          items.forEach((item: any) => {
            initialDurations[item.book.id] = 1; // Default to 1 period (15 days)
          });
          setItemRentalDurations(initialDurations);
        }
        setLoading(false);
        return;
      }
      
      // For individual borrow type, use URL parameters instead of API call
      if (checkoutType === 'borrow' && bookName && author) {
        setBookDetails({
          id: bookId,
          name: decodeURIComponent(bookName),
          author: decodeURIComponent(author),
          price: 0 // Borrowing is free (membership fee handled separately)
        });
        setLoading(false);
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
    if (checkoutType === 'cart') {
      return cartItems.reduce((total, item) => {
        if (item.type === 'buy') {
          const price = item.book.price || 29900; // Price already in paise
          return total + Math.floor(price / 100);
        } else if (item.type === 'rent') {
          const bookPrice = item.book.price || 29900; // Price already in paise
          const periods = itemRentalDurations[item.book.id] || 1;
          const basePrice = Math.floor(bookPrice / 100); // Convert paise to rupees first
          // New pricing: 7 days = 20%, 15 days = 40%, 30 days = 80%
          let rentalPrice;
          if (periods === 1) rentalPrice = Math.floor(basePrice * 0.2); // 7 days
          else if (periods === 2) rentalPrice = Math.floor(basePrice * 0.4); // 15 days  
          else if (periods === 3) rentalPrice = Math.floor(basePrice * 0.6); // 22 days
          else rentalPrice = Math.floor(basePrice * 0.8); // 30 days
          return total + rentalPrice;
        }
        return total;
      }, 0);
    }
    
    if (!bookDetails) return 0;
    
    switch (checkoutType) {
      case 'buy':
        const buyPrice = (bookDetails.price || bookDetails.buyPrice || 29900); // Price already in paise
        return Math.floor(buyPrice / 100);
      case 'rent':
        // Dynamic rental pricing based on percentage of sale price (matching cart checkout)
        const bookPrice = (bookDetails.price || 29900); // Price already in paise
        const basePrice = Math.floor(bookPrice / 100); // Convert to rupees
        const days = parseInt(rentalDuration);
        if (days <= 7) return Math.max(Math.floor(basePrice * 0.20), 49); // 7 days = 20%, minimum ₹49
        else if (days <= 15) return Math.max(Math.floor(basePrice * 0.40), 89); // 15 days = 40%, minimum ₹89
        else return Math.max(Math.floor(basePrice * 0.80), 149); // 30 days = 80%, minimum ₹149
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

  const handleShippingAddressChange = (field: string, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
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

    if (checkoutType === 'borrow') {
      if (!userType) {
        toast({
          title: "Validation Error", 
          description: "Please select whether you are a new user or existing member",
          variant: "destructive"
        });
        return false;
      }
      
      if (userType === 'existing' && !borrowingInfo.libraryCardNumber) {
        toast({
          title: "Validation Error", 
          description: "Library card number is required for existing members",
          variant: "destructive"
        });
        return false;
      }
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
          
        case 'cart':
          endpoint = '/api/orders';
          payload = {
            items: cartItems.map(item => ({
              productId: item.book.id,
              name: item.book.title || item.book.name,
              price: item.type === 'buy' 
                ? Math.floor(item.book.price || 299)
                : Math.floor((item.book.price || 299) * 0.1) * (itemRentalDurations[item.book.id] || 1),
              quantity: 1,
              type: item.type,
              rentalDuration: item.type === 'rent' ? (itemRentalDurations[item.book.id] || 1) * 15 : undefined
            })),
            shippingAddress: `${customerInfo.address}, ${customerInfo.city} - ${customerInfo.postalCode}`,
            paymentMethod: paymentMethod,
            totalAmount: calculatePrice(),
            total: calculatePrice()
          };
          break;
          
        case 'borrow':
          if (userType === 'new') {
            // New user: process membership payment + borrowing request
            endpoint = '/api/library/membership';
            payload = {
              fullName: customerInfo.name,
              email: customerInfo.email,
              phone: customerInfo.phone,
              membershipType: "annual",
              fee: 2000,
              bookId: bookId,
              bookTitle: bookDetails?.name || 'Unknown Book',
              borrowingInfo: borrowingInfo
            };
          } else {
            // Existing member: process borrowing order directly
            endpoint = '/api/process-borrow-order';
            payload.borrowingInfo = borrowingInfo;
          }
          break;
      }

      const response = await apiRequest("POST", endpoint, payload);
      const result = await response.json();
      
      // Store order data for success page
      const orderData = {
        orderId: result.orderId || result.id,
        module: 'vyronaread',
        orderType: checkoutType,
        bookDetails: checkoutType === 'cart' ? cartItems.map(item => ({
          id: item.book.id,
          name: item.book.title || item.book.name,
          author: item.book.author,
          type: item.type,
          rentalDuration: item.type === 'rent' ? (itemRentalDurations[item.book.id] || 1) * 15 : undefined
        })) : {
          id: bookId,
          name: bookDetails?.name || bookName,
          author: author,
          type: checkoutType
        },
        customerInfo,
        amount: calculatePrice(),
        paymentMethod,
        timestamp: new Date().toISOString(),
        ...(checkoutType === 'rent' && { rentalDuration }),
        ...(checkoutType === 'borrow' && { borrowingInfo, userType })
      };
      
      sessionStorage.setItem('orderData', JSON.stringify(orderData));
      
      // Clear cart after successful checkout
      if (checkoutType === 'cart') {
        sessionStorage.removeItem('vyronaread_cart');
      }
      
      toast({
        title: "Success!",
        description: getSuccessMessage(),
      });

      // Redirect to order success page
      setTimeout(() => {
        setLocation('/order-success');
      }, 1500);

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
      case 'cart':
        return "Cart checkout completed successfully! Your orders have been processed.";
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
      case 'cart':
        return "Cart Checkout";
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

  // Handle library cart checkout
  if (checkoutType === 'borrow' && source === 'library-cart' && libraryCartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No items in library cart</p>
          <Button onClick={() => setLocation('/vyronaread')}>
            Back to VyronaRead
          </Button>
        </div>
      </div>
    );
  }

  // Handle individual book checkout
  if (!bookDetails && checkoutType !== 'cart' && !(checkoutType === 'borrow' && source === 'library-cart')) {
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

  if (checkoutType === 'cart' && cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No items in cart</p>
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
            {checkoutType === 'cart' && <ShoppingCart className="h-8 w-8" />}
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
                {checkoutType === 'cart' ? 'Cart Items' : 'Book Details'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checkoutType === 'cart' ? (
                <div className="space-y-4">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex gap-4 p-4 border rounded-lg">
                      <div className="w-16 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded flex items-center justify-center flex-shrink-0">
                        <BookOpen className="text-purple-600 h-8 w-8" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{item.book.title || item.book.name}</h3>
                        <p className="text-gray-600 mb-2">by {item.book.author || "Unknown Author"}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={item.type === 'buy' ? 'default' : 'secondary'}>
                            {item.type === 'buy' ? 'Purchase' : 'Rental'}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            ₹{item.type === 'buy' ? Math.floor((item.book.price || 29900) / 100) : (() => {
                              const bookPrice = item.book.price || 29900;
                              const basePrice = Math.floor(bookPrice / 100);
                              const days = itemRentalDurations[item.book.id] || 15;
                              if (days === 7) return Math.max(Math.floor(basePrice * 0.20), 49);
                              else if (days === 15) return Math.max(Math.floor(basePrice * 0.40), 89);
                              else return Math.max(Math.floor(basePrice * 0.80), 149);
                            })()}
                            {item.type === 'rent' && ` for ${itemRentalDurations[item.book.id] || 15} days`}
                          </span>
                        </div>
                        {item.type === 'rent' && (
                          <div className="mt-3">
                            <Label className="text-sm font-medium">Rental Duration:</Label>
                            <div className="flex gap-2 mt-2">
                              {[
                                { days: 7, label: '7 days' },
                                { days: 15, label: '15 days' },
                                { days: 30, label: '30 days' }
                              ].map((option) => (
                                <Button
                                  key={option.days}
                                  size="sm"
                                  variant={itemRentalDurations[item.book.id] === option.days ? 'default' : 'outline'}
                                  onClick={() => setItemRentalDurations(prev => ({
                                    ...prev,
                                    [item.book.id]: option.days
                                  }))}
                                  className="text-xs"
                                >
                                  {option.label}
                                </Button>
                              ))}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Total: ₹{(() => {
                                const bookPrice = item.book.price || 29900;
                                const basePrice = Math.floor(bookPrice / 100);
                                const days = itemRentalDurations[item.book.id] || 15;
                                if (days === 7) return Math.max(Math.floor(basePrice * 0.20), 49);
                                else if (days === 15) return Math.max(Math.floor(basePrice * 0.40), 89);
                                else return Math.max(Math.floor(basePrice * 0.80), 149);
                              })()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-4">
                  <div className="w-16 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded flex items-center justify-center flex-shrink-0">
                    <BookOpen className="text-purple-600 h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{bookDetails?.title || bookDetails?.name || "Book"}</h3>
                    <p className="text-gray-600 mb-2">by {bookDetails?.metadata?.author || bookDetails?.author || "Unknown Author"}</p>
                    {(bookDetails?.metadata?.isbn || bookDetails?.isbn) && (
                      <p className="text-sm text-gray-500">ISBN: {bookDetails?.metadata?.isbn || bookDetails?.isbn}</p>
                    )}
                    {(bookDetails?.metadata?.genre || bookDetails?.category) && (
                      <Badge variant="secondary" className="mt-2">{bookDetails?.metadata?.genre || bookDetails?.category}</Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rental Duration */}
          {(checkoutType === 'rent' || (checkoutType === 'cart' && cartItems.some(item => item.type === 'rent'))) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Rental Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                {checkoutType === 'rent' ? (
                  <RadioGroup value={rentalDuration} onValueChange={setRentalDuration}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="7" id="7days" />
                      <Label htmlFor="7days">7 days - ₹{(() => {
                        if (!bookDetails) return 0;
                        const price = bookDetails.price || 29900; // Price already in paise
                        const basePrice = Math.floor(price / 100); // Convert to rupees
                        return Math.max(Math.floor(basePrice * 0.20), 49);
                      })()}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="15" id="15days" />
                      <Label htmlFor="15days">15 days - ₹{(() => {
                        if (!bookDetails) return 0;
                        const price = bookDetails.price || 29900; // Price already in paise
                        const basePrice = Math.floor(price / 100); // Convert to rupees
                        return Math.max(Math.floor(basePrice * 0.40), 89);
                      })()} (Recommended)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="30" id="30days" />
                      <Label htmlFor="30days">30 days - ₹{(() => {
                        if (!bookDetails) return 0;
                        const price = bookDetails.price || 29900; // Price already in paise
                        const basePrice = Math.floor(price / 100); // Convert to rupees
                        return Math.max(Math.floor(basePrice * 0.80), 149);
                      })()}</Label>
                    </div>
                  </RadioGroup>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">Rental durations are set individually for each item above.</p>
                    {cartItems.filter(item => item.type === 'rent').map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{item.book.title || item.book.name}</span>
                        <span className="text-sm text-gray-600">
                          {itemRentalDurations[item.book.id] || 1} period{(itemRentalDurations[item.book.id] || 1) > 1 ? 's' : ''} 
                          ({(itemRentalDurations[item.book.id] || 1) * 15} days)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Shipping Address */}
          {(checkoutType === 'buy' || checkoutType === 'rent' || checkoutType === 'cart') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={shippingAddress.fullName}
                      onChange={(e) => handleShippingAddressChange('fullName', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={shippingAddress.phone}
                      onChange={(e) => handleShippingAddressChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="addressLine1">Address Line 1 *</Label>
                  <Input
                    id="addressLine1"
                    value={shippingAddress.addressLine1}
                    onChange={(e) => handleShippingAddressChange('addressLine1', e.target.value)}
                    placeholder="House/Flat number, Building name"
                  />
                </div>
                <div>
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    value={shippingAddress.addressLine2}
                    onChange={(e) => handleShippingAddressChange('addressLine2', e.target.value)}
                    placeholder="Street name, Area"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={shippingAddress.city}
                      onChange={(e) => handleShippingAddressChange('city', e.target.value)}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={shippingAddress.state}
                      onChange={(e) => handleShippingAddressChange('state', e.target.value)}
                      placeholder="Enter state"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">PIN Code *</Label>
                    <Input
                      id="pincode"
                      value={shippingAddress.pincode}
                      onChange={(e) => handleShippingAddressChange('pincode', e.target.value)}
                      placeholder="Enter PIN code"
                    />
                  </div>
                </div>
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

          {/* User Type Selection for Borrowing */}
          {checkoutType === 'borrow' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Member Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Are you a new user or existing library member?</Label>
                  <RadioGroup 
                    value={userType || ''} 
                    onValueChange={(value) => setUserType(value as 'new' | 'existing')}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2 p-3 rounded-lg border">
                      <RadioGroupItem value="new" id="new-user" />
                      <Label htmlFor="new-user" className="flex-1 cursor-pointer">
                        <div>
                          <span className="font-medium">New User</span>
                          <p className="text-sm text-gray-600">
                            First time using our library system. Includes ₹2000 annual membership fee.
                          </p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border">
                      <RadioGroupItem value="existing" id="existing-member" />
                      <Label htmlFor="existing-member" className="flex-1 cursor-pointer">
                        <div>
                          <span className="font-medium">Existing Member</span>
                          <p className="text-sm text-gray-600">
                            Already have an active library membership and card.
                          </p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Library Borrowing Information */}
          {checkoutType === 'borrow' && userType && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Library Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userType === 'existing' ? (
                  <div>
                    <Label htmlFor="libraryCard">Library Card Number *</Label>
                    <Input
                      id="libraryCard"
                      value={borrowingInfo.libraryCardNumber}
                      onChange={(e) => handleBorrowingInfoChange('libraryCardNumber', e.target.value)}
                      placeholder="Enter your library card number"
                    />
                  </div>
                ) : (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>New User Setup</strong><br />
                      No library card needed! After your membership payment, we'll create your library account and issue your card.
                    </p>
                  </div>
                )}
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

          {/* Payment Method */}
          {(checkoutType === 'buy' || checkoutType === 'rent' || checkoutType === 'cart') && (
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
                  <div className="flex items-center space-x-2 p-3 rounded-lg border">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      <div>
                        <span className="font-medium">Cash on Delivery (COD)</span>
                        <p className="text-sm text-gray-600">
                          Pay with cash when your book is delivered to your address
                        </p>
                      </div>
                    </Label>
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
              {checkoutType === 'cart' ? (
                <div className="space-y-3">
                  <div className="text-sm font-medium">Items in Cart:</div>
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{item.book.title || item.book.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.type === 'buy' ? 'default' : 'secondary'} className="text-xs">
                          {item.type === 'buy' ? 'Purchase' : 'Rental'}
                        </Badge>
                        <span className="text-sm font-medium">
                          ₹{item.type === 'buy' 
                            ? Math.floor((item.book.price || 29900) / 100)
                            : (() => {
                                const bookPrice = item.book.price || 29900;
                                const basePrice = Math.floor(bookPrice / 100);
                                const days = itemRentalDurations[item.book.id] || 15;
                                if (days === 7) return Math.floor(basePrice * 0.2);
                                else if (days === 15) return Math.floor(basePrice * 0.4);
                                else return Math.floor(basePrice * 0.8);
                              })()
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : checkoutType === 'borrow' && source === 'library-cart' ? (
                <div className="space-y-3">
                  <div className="text-sm font-medium">Books to Borrow:</div>
                  {libraryCartItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{item.book.title}</div>
                        <div className="text-xs text-gray-500">by {item.book.author}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Borrow
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Book:</span>
                    <span className="font-medium">{bookDetails?.title || bookDetails?.name || "Book"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <Badge variant="outline" className="capitalize">{checkoutType}</Badge>
                  </div>
                </div>
              )}
              {checkoutType === 'rent' && (
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>{rentalDuration} days</span>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                {checkoutType === 'borrow' ? (
                  userType === 'new' ? (
                    <>
                      <div className="flex justify-between">
                        <span>Annual Membership:</span>
                        <span className="font-bold">₹2,000</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Book Borrowing:</span>
                        <span>FREE</span>
                      </div>
                    </>
                  ) : userType === 'existing' ? (
                    <div className="flex justify-between">
                      <span>Borrowing Fee:</span>
                      <span className="font-bold">FREE</span>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Please select user type to see pricing
                    </div>
                  )
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-bold">₹{calculatePrice()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Processing Fee:</span>
                      <span>₹0</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>₹{calculatePrice()}</span>
                    </div>
                  </>
                )}
              </div>

              {checkoutType === 'borrow' && userType === 'existing' && (
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-green-600 font-medium">Free Library Service</p>
                  <p className="text-sm text-gray-500">No payment required</p>
                </div>
              )}

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