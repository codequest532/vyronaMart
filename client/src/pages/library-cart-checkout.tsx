import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft,
  BookOpen,
  Library,
  Send,
  CheckCircle
} from "lucide-react";

export default function LibraryCartCheckout() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [libraryCart, setLibraryCart] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    borrowerName: "",
    borrowerEmail: "",
    borrowerPhone: "",
    borrowReason: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load library cart from session storage
  useEffect(() => {
    try {
      const savedLibraryCart = sessionStorage.getItem('vyronaread_library_cart');
      if (savedLibraryCart) {
        setLibraryCart(JSON.parse(savedLibraryCart));
      }
    } catch (error) {
      console.error('Error loading library cart:', error);
    }
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (libraryCart.length === 0) {
      toast({
        title: "Empty Library Cart",
        description: "Your library cart is empty. Redirecting back to VyronaRead.",
        variant: "destructive"
      });
      setLocation('/vyronaread');
    }
  }, [libraryCart, setLocation, toast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const submitBulkBorrowRequests = async () => {
    // Validate form
    if (!formData.borrowerName || !formData.borrowerEmail || !formData.borrowerPhone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit borrow requests for all items in library cart
      for (const item of libraryCart) {
        await apiRequest("POST", "/api/book-loans", {
          bookId: item.book.id,
          borrowerName: formData.borrowerName,
          borrowerEmail: formData.borrowerEmail,
          borrowerPhone: formData.borrowerPhone,
          borrowReason: formData.borrowReason || "Bulk borrow request from VyronaRead",
          requestDate: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
          module: "VyronaRead"
        });
      }

      toast({
        title: "Borrow Requests Submitted",
        description: `${libraryCart.length} borrow requests have been sent to the libraries for approval.`,
      });

      // Clear library cart after successful submission
      sessionStorage.removeItem('vyronaread_library_cart');
      setLibraryCart([]);
      
      // Redirect back to VyronaRead
      setLocation('/vyronaread');
    } catch (error) {
      console.error("Error submitting bulk borrow requests:", error);
      toast({
        title: "Error",
        description: "Failed to submit borrow requests. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group books by library for better organization
  const booksByLibrary = libraryCart.reduce((acc, item) => {
    const libraryId = item.libraryId || 'unknown';
    if (!acc[libraryId]) {
      acc[libraryId] = [];
    }
    acc[libraryId].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  if (libraryCart.length === 0) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="outline"
          className="flex items-center gap-2 mb-4"
          onClick={() => setLocation('/vyronaread')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to VyronaRead
        </Button>
        
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Library Cart Checkout</h1>
              <p className="text-green-100">Submit borrow requests for {libraryCart.length} books</p>
            </div>
            <div className="text-right">
              <Library className="h-12 w-12 text-green-200" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Books to Borrow ({libraryCart.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(booksByLibrary).map(([libraryId, books]) => (
                <div key={libraryId} className="space-y-3">
                  <h4 className="font-semibold text-sm text-gray-600 uppercase tracking-wide">
                    {books[0]?.book?.libraryName || `Library ${libraryId}`}
                  </h4>
                  
                  {books.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                      <div className="w-12 h-16 bg-gradient-to-br from-green-200 to-green-300 rounded flex items-center justify-center flex-shrink-0">
                        <BookOpen className="text-green-700 h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.book.name || item.book.title}</h4>
                        <p className="text-sm text-gray-600">by {item.book.author || "Unknown Author"}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Free Borrowing
                          </Badge>
                          {item.book.isbn && (
                            <span className="text-xs text-gray-500">ISBN: {item.book.isbn}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {Object.keys(booksByLibrary).length > 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Borrower Information Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Borrower Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="borrowerName">Full Name *</Label>
                <Input
                  id="borrowerName"
                  value={formData.borrowerName}
                  onChange={(e) => handleInputChange('borrowerName', e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="borrowerEmail">Email Address *</Label>
                <Input
                  id="borrowerEmail"
                  type="email"
                  value={formData.borrowerEmail}
                  onChange={(e) => handleInputChange('borrowerEmail', e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <Label htmlFor="borrowerPhone">Phone Number *</Label>
                <Input
                  id="borrowerPhone"
                  value={formData.borrowerPhone}
                  onChange={(e) => handleInputChange('borrowerPhone', e.target.value)}
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div>
                <Label htmlFor="borrowReason">Reason for Borrowing (Optional)</Label>
                <Textarea
                  id="borrowReason"
                  value={formData.borrowReason}
                  onChange={(e) => handleInputChange('borrowReason', e.target.value)}
                  placeholder="Why do you need these books?"
                  rows={3}
                />
              </div>

              <Separator />

              {/* Request Summary */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Request Summary</h4>
                <div className="space-y-2 text-sm text-green-700">
                  <div className="flex justify-between">
                    <span>Total Books:</span>
                    <span className="font-semibold">{libraryCart.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Libraries:</span>
                    <span className="font-semibold">{Object.keys(booksByLibrary).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost:</span>
                    <span className="font-semibold">Free</span>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-3">
                  Individual libraries will review and approve/reject your requests.
                </p>
              </div>

              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={submitBulkBorrowRequests}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting Requests...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit All Borrow Requests
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                By submitting, you agree to the library borrowing terms and conditions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}