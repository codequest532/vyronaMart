import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  ArrowLeft, 
  Search, 
  Book, 
  Calendar, 
  Clock, 
  Star,
  CreditCard,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// Format price in Indian Rupees
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(price);
};

const membershipSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(10, "Please enter your complete address"),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms and conditions")
});

export default function LibraryBrowse() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const { toast } = useToast();

  // Form for membership subscription
  const form = useForm({
    resolver: zodResolver(membershipSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      agreeToTerms: false
    }
  });

  // Fetch all books from approved libraries directly
  const { data: libraryBooks, isLoading: booksLoading } = useQuery({
    queryKey: ["/api/vyronaread/library-books"],
    queryFn: async (): Promise<any[]> => {
      const response = await fetch("/api/vyronaread/library-books");
      if (!response.ok) {
        throw new Error('Failed to fetch library books');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
  });

  // Membership subscription mutation
  const membershipMutation = useMutation({
    mutationFn: async (membershipData: any) => {
      const response = await fetch("/api/library-membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(membershipData)
      });
      if (!response.ok) throw new Error("Failed to create membership");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Membership Created",
        description: "Your library membership has been successfully created!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vyronaread/library-books"] });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create membership",
        variant: "destructive"
      });
    }
  });

  // Book borrowing mutation
  const borrowMutation = useMutation({
    mutationFn: async (bookId: number) => {
      const response = await fetch("/api/borrow-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId })
      });
      if (!response.ok) throw new Error("Failed to borrow book");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Book Borrowed",
        description: "Book has been successfully borrowed!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vyronaread/library-books"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to borrow book",
        variant: "destructive"
      });
    }
  });

  // Filter books based on search term
  const filteredBooks = useMemo(() => {
    if (!libraryBooks) return [];
    
    return libraryBooks.filter((book: any) =>
      book.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [libraryBooks, searchTerm]);

  const handleMembershipSubmit = (data: any) => {
    membershipMutation.mutate({
      ...data,
      membershipType: "annual",
      fee: 2000 // ₹2000 annual fee
    });
  };

  const handleBorrowBook = (book: any) => {
    borrowMutation.mutate(book.id);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setLocation("/vyronaread")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to VyronaRead
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Library Browse</h1>
                <p className="text-gray-600 dark:text-gray-300">Discover books available for borrowing</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">
                {filteredBooks.length} Books Available
              </Badge>
              
              {/* Annual Membership Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Get Annual Membership
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Annual Library Membership</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{formatPrice(2000)}</div>
                      <div className="text-sm text-gray-600">Annual Membership Fee</div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Unlimited book borrowing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>14-day borrowing period per book</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Access to all partner libraries</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Priority booking for new releases</span>
                      </div>
                    </div>

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleMembershipSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Enter your email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your complete address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
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
                                <FormLabel className="text-sm">
                                  I agree to the terms and conditions
                                </FormLabel>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={membershipMutation.isPending}
                        >
                          {membershipMutation.isPending ? "Processing..." : `Subscribe for ${formatPrice(2000)}`}
                        </Button>
                      </form>
                    </Form>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Search */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search books by title, author, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Books Grid */}
          {booksLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p>Loading books...</p>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-12">
              <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Books Found</h3>
              <p className="text-gray-600">
                {searchTerm ? "No books match your search criteria." : "No books available for borrowing at this time."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBooks.map((book: any) => (
                <Card key={book.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                      {book.imageUrl ? (
                        <img 
                          src={book.imageUrl} 
                          alt={book.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Book className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <CardTitle className="text-base line-clamp-2">{book.name}</CardTitle>
                    <CardDescription className="text-sm">
                      by {book.author || "Unknown Author"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 mb-4">
                      <Badge variant="outline" className="text-xs">
                        {book.category || "General"}
                      </Badge>
                      {book.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-gray-600">{book.rating}/5</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>14-day borrowing period</span>
                      </div>
                      {book.libraryName && (
                        <div className="text-xs text-gray-500">
                          Available at: {book.libraryName}
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => handleBorrowBook(book)}
                      disabled={borrowMutation.isPending}
                    >
                      {borrowMutation.isPending ? "Borrowing..." : "Borrow Book"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}