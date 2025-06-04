import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import { 
  Book, 
  ArrowLeft, 
  Search,
  Filter,
  MapPin,
  Calendar,
  User,
  CreditCard,
  CheckCircle,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

const membershipSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(1, "Address is required"),
  idType: z.string().min(1, "ID type is required"),
  idNumber: z.string().min(1, "ID number is required"),
  emergencyContact: z.string().min(10, "Emergency contact is required"),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to terms and conditions")
});

export default function LibraryBrowse() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLibrary, setSelectedLibrary] = useState<any>(null);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [membershipFee, setMembershipFee] = useState(0);

  // Format price in Indian Rupees
  const formatPrice = (priceInPaise: number) => {
    return `₹${(priceInPaise / 100).toFixed(2)}`;
  };

  // Membership form
  const membershipForm = useForm<z.infer<typeof membershipSchema>>({
    resolver: zodResolver(membershipSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      idType: "",
      idNumber: "",
      emergencyContact: "",
      agreeToTerms: false
    }
  });

  // Fetch available libraries
  const { data: libraries, isLoading: librariesLoading } = useQuery({
    queryKey: ["/api/libraries"],
    queryFn: async (): Promise<any[]> => {
      const response = await fetch("/api/libraries");
      if (!response.ok) {
        throw new Error('Failed to fetch libraries');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
  });

  // Fetch library books
  const { data: libraryBooks, isLoading: booksLoading } = useQuery({
    queryKey: ["/api/library-books", selectedLibrary?.id],
    queryFn: async (): Promise<any[]> => {
      if (!selectedLibrary?.id) return [];
      const response = await fetch(`/api/library-books?libraryId=${selectedLibrary.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch library books');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!selectedLibrary?.id
  });

  // Membership subscription mutation
  const membershipMutation = useMutation({
    mutationFn: async (membershipData: any) => {
      return await apiRequest("POST", "/api/library/membership", membershipData);
    },
    onSuccess: (response) => {
      toast({
        title: "Membership Application Submitted",
        description: "Your membership request has been sent for approval. You'll receive confirmation soon."
      });
      setShowMembershipModal(false);
      membershipForm.reset();
      
      // Notify admin and seller
      toast({
        title: "Notifications Sent",
        description: "Admin and library have been notified of your membership application."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Membership Application Failed",
        description: error.message || "Failed to submit membership application. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleBorrowBook = (book: any, library: any) => {
    setSelectedBook(book);
    setSelectedLibrary(library);
    setMembershipFee(library.membershipFee || 50000); // Default ₹500 if not set
    setShowMembershipModal(true);
  };

  const handleMembershipSubmit = (data: z.infer<typeof membershipSchema>) => {
    const membershipData = {
      ...data,
      libraryId: selectedLibrary.id,
      bookId: selectedBook.id,
      bookTitle: selectedBook.title,
      membershipFee: membershipFee,
      requestType: "membership_and_borrow"
    };
    
    membershipMutation.mutate(membershipData);
  };

  const filteredBooks = Array.isArray(libraryBooks) ? libraryBooks.filter(book =>
    book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => window.location.href = "/home"}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Library Browse</h1>
                <p className="text-gray-600 dark:text-gray-300">Discover books available for borrowing</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Library Selection */}
        {!selectedLibrary ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Select a Library</h2>
              {librariesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p>Loading libraries...</p>
                </div>
              ) : !libraries || libraries.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No libraries available</p>
                  <p className="text-sm text-gray-500">Libraries will appear here once they're integrated</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {libraries.map((library: any) => (
                    <Card key={library.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedLibrary(library)}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          {library.name}
                        </CardTitle>
                        <CardDescription>{library.type} Library</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            {library.address}
                          </div>
                          {library.membershipFee && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <CreditCard className="h-4 w-4" />
                              Annual Fee: {formatPrice(library.membershipFee)}
                            </div>
                          )}
                          <Badge variant="outline" className="w-fit">
                            {library.booksCount || 0} Books Available
                          </Badge>
                        </div>
                        <Button className="w-full mt-4">
                          Browse Books
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Book Browsing */
          <div className="space-y-6">
            {/* Library Header */}
            <div className="flex items-center justify-between">
              <div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedLibrary(null)}
                  className="mb-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Libraries
                </Button>
                <h2 className="text-2xl font-bold">{selectedLibrary.name}</h2>
                <p className="text-gray-600">{selectedLibrary.address}</p>
              </div>
              <Badge variant="secondary">
                {filteredBooks.length} Books Available
              </Badge>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search books by title or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Books Grid */}
            {booksLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p>Loading books...</p>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="text-center py-8">
                <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No books found</p>
                <p className="text-sm text-gray-500">Try adjusting your search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBooks.map((book: any) => (
                  <Card key={book.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                        <Book className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="font-semibold mb-1 line-clamp-2">{book.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                      <div className="space-y-2">
                        {book.isbn && (
                          <p className="text-xs text-gray-500">ISBN: {book.isbn}</p>
                        )}
                        <div className="flex justify-between items-center">
                          <Badge variant={book.available > 0 ? "default" : "destructive"}>
                            {book.available > 0 ? `${book.available} Available` : "Not Available"}
                          </Badge>
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={() => handleBorrowBook(book, selectedLibrary)}
                          disabled={book.available <= 0}
                        >
                          {book.available > 0 ? "Borrow Book" : "Out of Stock"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Membership Subscription Modal */}
      <Dialog open={showMembershipModal} onOpenChange={setShowMembershipModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Library Membership Application</DialogTitle>
            <DialogDescription>
              Complete your membership to borrow "{selectedBook?.title}" from {selectedLibrary?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">Annual Membership Fee: {formatPrice(membershipFee)}</span>
            </div>
            <p className="text-sm text-gray-600">
              This one-time annual fee gives you access to borrow books from this library
            </p>
          </div>

          <Form {...membershipForm}>
            <form onSubmit={membershipForm.handleSubmit(handleMembershipSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={membershipForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={membershipForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={membershipForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={membershipForm.control}
                  name="emergencyContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact *</FormLabel>
                      <FormControl>
                        <Input placeholder="Emergency contact number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={membershipForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={membershipForm.control}
                  name="idType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select ID type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="aadhar">Aadhar Card</SelectItem>
                          <SelectItem value="passport">Passport</SelectItem>
                          <SelectItem value="driving_license">Driving License</SelectItem>
                          <SelectItem value="voter_id">Voter ID</SelectItem>
                          <SelectItem value="pan_card">PAN Card</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={membershipForm.control}
                  name="idNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter ID number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={membershipForm.control}
                name="agreeToTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I agree to the library terms and conditions *
                      </FormLabel>
                      <p className="text-sm text-gray-600">
                        By checking this box, you agree to follow library rules and regulations
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowMembershipModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={membershipMutation.isPending}>
                  {membershipMutation.isPending ? "Processing..." : `Pay ${formatPrice(membershipFee)} & Apply`}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}