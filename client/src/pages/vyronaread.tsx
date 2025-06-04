import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft,
  Book,
  Star,
  Heart,
  BookOpen,
  Download,
  Eye,
  Clock,
  Users,
  Trophy,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Search,
  Filter,
  Play,
  Pause,
  Volume2,
  Settings,
  Moon,
  Sun,
  Type,
  Layers,
  FileText,
  Library,
  Building,
  Edit
} from "lucide-react";

export default function VyronaRead() {
  const [location, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [readingMode, setReadingMode] = useState("light");
  const [fontSize, setFontSize] = useState("medium");
  const [selectedLibrary, setSelectedLibrary] = useState<any>(null);
  const [selectedEBook, setSelectedEBook] = useState<any>(null);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedBookForBorrow, setSelectedBookForBorrow] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showEReader, setShowEReader] = useState(false);
  const { toast } = useToast();
  const [selectedLibraryBooks, setSelectedLibraryBooks] = useState<any[]>([]);

  // Handler functions for buy/rent/borrow operations
  const handleBuyBook = async (book: any) => {
    // Navigate to VyronaRead checkout page with buy parameters
    setLocation(`/vyronaread-checkout?type=buy&bookId=${book.id}`);
  };

  const handleRentBook = async (book: any) => {
    // Navigate to VyronaRead checkout page with rent parameters  
    setLocation(`/vyronaread-checkout?type=rent&bookId=${book.id}`);
  };

  const openBorrowModal = (book: any) => {
    setSelectedBookForBorrow(book);
    setShowBorrowModal(true);
  };

  const handleReadEBook = (ebook: any) => {
    setSelectedEBook(ebook);
    setShowEReader(true);
    setCurrentPage(1);
  };

  const submitBorrowRequest = async (formData: any) => {
    try {
      await apiRequest("POST", "/api/book-loans", {
        bookId: selectedBookForBorrow.id,
        ...formData,
        module: "VyronaRead"
      });
      
      toast({
        title: "Borrow Request Submitted",
        description: "Your request has been sent to the library for approval.",
      });
      
      setShowBorrowModal(false);
      setSelectedBookForBorrow(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit borrow request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const proceedToEBookCheckout = async () => {
    try {
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount: selectedEBook.price || 1999, // Default price for e-book access
        type: "ebook-access",
        bookId: selectedEBook.id,
        module: "VyronaRead"
      });
      const { clientSecret } = await response.json();
      setLocation(`/checkout?client_secret=${clientSecret}&type=ebook&bookId=${selectedEBook.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate e-book purchase. Please try again.",
        variant: "destructive"
      });
    }
  };

  // VyronaRead data queries - real-time data from seller dashboard and admin
  const { data: sellerEBooks = [] } = useQuery({
    queryKey: ["/api/vyronaread/ebooks"],
  });

  const { data: sellerBooks = [] } = useQuery({
    queryKey: ["/api/vyronaread/seller-books"],
  });

  const { data: libraryBooks = [] } = useQuery({
    queryKey: ["/api/vyronaread/library-books"],
  });

  const { data: availableLibraries = [] } = useQuery({
    queryKey: ["/api/vyronaread/libraries"],
  });

  // Handle library click to show books from specific library
  const handleLibraryClick = async (library: any) => {
    try {
      setSelectedLibrary(library);
      const response = await fetch(`/api/vyronaread/library-books/${library.id}`);
      const books = await response.json();
      setSelectedLibraryBooks(books);
    } catch (error) {
      console.error("Error fetching library books:", error);
    }
  };



  const { data: libraryRequests = [] } = useQuery({
    queryKey: ["/api/admin/library-requests"],
  });

  // Get all products from seller dashboard for Browse Books section
  const { data: allProducts = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  // Filter books from products (books have category like 'books', 'education', etc.)
  const allBooks = Array.isArray(allProducts) ? allProducts.filter((product: any) => 
    product.category && ['books', 'education', 'romance', 'sci-fi', 'mystery', 'fantasy', 'biography'].includes(product.category.toLowerCase())
  ) : [];

  // Apply category filter
  const filteredBooks = selectedCategory === "all" 
    ? allBooks 
    : allBooks.filter((book: any) => book.category?.toLowerCase() === selectedCategory);

  // Combine all book sources for Browse Books section
  const combinedBooks = [
    ...filteredBooks,
    ...(Array.isArray(sellerEBooks) ? sellerEBooks : []),
    ...(Array.isArray(sellerBooks) ? sellerBooks : []),
    ...(Array.isArray(libraryBooks) ? libraryBooks : [])
  ].filter((book, index, self) => 
    index === self.findIndex((b) => b.id === book.id)
  );

  // Get user's orders for Currently Reading
  const { data: userOrders = [] } = useQuery({
    queryKey: ["/api/orders"],
  });

  // Get currently reading books from user's completed orders
  const currentlyReadingBooks = Array.isArray(userOrders) ? userOrders
    .filter((order: any) => order.status === 'completed' && order.module === 'vyronaread')
    .slice(0, 2) : [];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => setLocation("/home")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Header */}
      <Card className="vyrona-gradient-read text-white mb-6">
        <CardContent className="p-6">
          <h1 className="text-3xl font-bold mb-2">VyronaRead</h1>
          <p className="text-lg opacity-90">Read. Return. Repeat. - Your smart reading ecosystem</p>
        </CardContent>
      </Card>



      {/* 1. Browse Books */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Browse Books</h3>
            <div className="flex items-center space-x-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="romance">Romance</SelectItem>
                  <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                  <SelectItem value="mystery">Mystery</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="fantasy">Fantasy</SelectItem>
                  <SelectItem value="biography">Biography</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {combinedBooks.length > 0 ? combinedBooks.map((book, index) => (
              <Card key={index} className="border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-4">
                  <div className="text-center mb-3">
                    <div className="text-4xl mb-2">📚</div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">{book.name || book.title}</h4>
                    <p className="text-xs text-gray-500 mb-2">by {book.author || "Unknown Author"}</p>
                    <Badge variant="secondary" className="text-xs">{book.category}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Star className="text-amber-400 h-3 w-3 fill-current" />
                        <span className="font-medium">4.2</span>
                      </div>
                      <span className="font-bold text-purple-600">₹{(book.price / 100).toFixed(0)}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleBuyBook(book)}
                      >
                        <BookOpen className="mr-1 h-3 w-3" />
                        Buy
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleRentBook(book)}
                      >
                        <Clock className="mr-1 h-3 w-3" />
                        Rent
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No books available in this category.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Library Integration */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">📚 Library Integration</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(availableLibraries) && availableLibraries.length > 0 ? availableLibraries.map((library: any, index: number) => (
              <Card key={index} className="border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Library className="text-green-600 h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-base">{library.libraryName || library.name}</h4>
                        <p className="text-sm text-gray-500 capitalize">{library.libraryType || library.type || "Public"} Library</p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium text-green-600">Active</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium text-gray-900 capitalize">{library.libraryType || library.type || "Public"}</span>
                    </div>
                    {library.address && (
                      <div className="text-sm">
                        <span className="text-gray-600">Location:</span>
                        <p className="font-medium text-gray-700 mt-1">{library.address}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <Button 
                      size="sm" 
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
                      onClick={() => handleLibraryClick(library)}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Visit Library
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No libraries available for connection.</p>
              </div>
            )}
          </div>

          {/* Selected Library Books Display */}
          {selectedLibrary && (
            <div className="mt-6 border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  📖 Books from {selectedLibrary.libraryName || selectedLibrary.name}
                </h4>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedLibrary(null)}
                >
                  ← Back to Libraries
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedLibraryBooks.length > 0 ? selectedLibraryBooks.map((book: any, index: number) => (
                  <Card key={index} className="border border-gray-200 hover:border-green-300 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex space-x-3">
                        <div className="w-12 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded flex items-center justify-center flex-shrink-0">
                          <Book className="text-green-600 h-6 w-6" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="mb-2">
                            <h5 className="font-semibold text-sm text-gray-900 truncate">{book.title}</h5>
                            <p className="text-xs text-gray-500 mb-2">by {book.author || "Unknown Author"}</p>
                            <Badge variant="secondary" className="text-xs">{book.genre || "General"}</Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-1">
                                <Clock className="text-green-600 h-3 w-3" />
                                <span className="text-xs">Available</span>
                              </div>
                              <span className="text-xs text-gray-600">Free Borrowing</span>
                            </div>
                            
                            <Button 
                              size="sm" 
                              className="w-full bg-green-600 hover:bg-green-700"
                              onClick={() => openBorrowModal(book)}
                            >
                              <BookOpen className="mr-1 h-3 w-3" />
                              Borrow Book
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">No books available in this library yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. VyronaRead E-Reader */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">📱 VyronaRead E-Reader</h3>
            <Badge variant="outline" className="text-blue-700">Kindle-like Experience</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(sellerEBooks) && sellerEBooks.length > 0 ? sellerEBooks.map((ebook: any, index: number) => (
              <Card key={index} className="border border-gray-200 hover:border-blue-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex space-x-3">
                    <div className="w-12 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded flex items-center justify-center flex-shrink-0">
                      <BookOpen className="text-blue-600 h-6 w-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="mb-2">
                        <h5 className="font-semibold text-sm text-gray-900 truncate">{ebook.title}</h5>
                        <p className="text-xs text-gray-500 mb-2">by {ebook.author || "Unknown Author"}</p>
                        <Badge variant="secondary" className="text-xs">{ebook.genre || "General"}</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-1">
                            <FileText className="text-blue-600 h-3 w-3" />
                            <span className="text-xs">{ebook.pages || "PDF"}</span>
                          </div>
                          <span className="text-xs text-gray-600">{ebook.fileSize || "2.5MB"}</span>
                        </div>
                        
                        <Button 
                          size="sm" 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleReadEBook(ebook)}
                        >
                          <BookOpen className="mr-1 h-3 w-3" />
                          Read E-Book
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 mb-2">No e-books available yet</p>
                <p className="text-sm text-gray-400">E-books uploaded by sellers will appear here</p>
              </div>
            )}
          </div>

          {/* Reader Settings */}
          {Array.isArray(sellerEBooks) && sellerEBooks.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Reader Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Reading Mode</span>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant={readingMode === "light" ? "default" : "outline"}
                      onClick={() => setReadingMode("light")}
                    >
                      <Sun className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={readingMode === "dark" ? "default" : "outline"}
                      onClick={() => setReadingMode("dark")}
                    >
                      <Moon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Font Size</span>
                  <Select value={fontSize} onValueChange={setFontSize}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Currently Reading */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📖 Currently Reading</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.isArray(currentlyReadingBooks) && currentlyReadingBooks.length > 0 ? currentlyReadingBooks.map((order: any, index: number) => (
              <Card key={index} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">📚</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Order #{order.id}</h4>
                      <p className="text-sm text-gray-500 mb-2">Module: {order.module}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Progress</span>
                          <span>65%</span>
                        </div>
                        <Progress value={65} className="h-2" />
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Amount: ₹{(order.totalAmount / 100).toFixed(0)}</span>
                          <span>Status: {order.status}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mt-3">
                        <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700">
                          <Play className="mr-1 h-3 w-3" />
                          Continue
                        </Button>
                        <Button size="sm" variant="outline">
                          <Bookmark className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No currently reading books found.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Borrow Book Modal */}
      <Dialog open={showBorrowModal} onOpenChange={setShowBorrowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Borrow Book Request</DialogTitle>
          </DialogHeader>
          
          {selectedBookForBorrow && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900">{selectedBookForBorrow.title}</h4>
                <p className="text-sm text-gray-600">by {selectedBookForBorrow.author || "Unknown Author"}</p>
                <Badge variant="secondary" className="mt-1">{selectedBookForBorrow.genre || "General"}</Badge>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="borrowerName">Full Name</Label>
                  <Input id="borrowerName" placeholder="Enter your full name" />
                </div>
                
                <div>
                  <Label htmlFor="borrowerEmail">Email Address</Label>
                  <Input id="borrowerEmail" type="email" placeholder="Enter your email" />
                </div>
                
                <div>
                  <Label htmlFor="borrowerPhone">Phone Number</Label>
                  <Input id="borrowerPhone" placeholder="Enter your phone number" />
                </div>
                
                <div>
                  <Label htmlFor="borrowReason">Reason for Borrowing</Label>
                  <Textarea id="borrowReason" placeholder="Why do you need this book?" />
                </div>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowBorrowModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    const formData = {
                      borrowerName: (document.getElementById('borrowerName') as HTMLInputElement)?.value,
                      borrowerEmail: (document.getElementById('borrowerEmail') as HTMLInputElement)?.value,
                      borrowerPhone: (document.getElementById('borrowerPhone') as HTMLInputElement)?.value,
                      borrowReason: (document.getElementById('borrowReason') as HTMLTextAreaElement)?.value,
                    };
                    submitBorrowRequest(formData);
                  }}
                >
                  Submit Request
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* E-Reader Modal with Sample Pages */}
      <Dialog open={showEReader} onOpenChange={setShowEReader}>
        <DialogContent className="sm:max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>VyronaRead E-Reader</DialogTitle>
          </DialogHeader>
          
          {selectedEBook && (
            <div className="flex flex-col h-full">
              <div className="p-3 bg-gray-50 rounded-lg mb-4">
                <h4 className="font-semibold text-gray-900">{selectedEBook.title}</h4>
                <p className="text-sm text-gray-600">by {selectedEBook.author || "Unknown Author"}</p>
                <Badge variant="secondary" className="mt-1">{selectedEBook.genre || "General"}</Badge>
              </div>
              
              {/* Sample Pages Content */}
              <div className="flex-1 bg-white border rounded-lg p-6 overflow-y-auto">
                {currentPage === 1 && (
                  <div className="space-y-4">
                    <h1 className="text-2xl font-bold text-center mb-6">{selectedEBook.title}</h1>
                    <div className="space-y-4 text-justify leading-relaxed">
                      <p>This is a sample preview of the e-book. You can read the first few pages to get a feel for the content and writing style.</p>
                      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                      <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                    </div>
                  </div>
                )}
                
                {currentPage === 2 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold mb-4">Chapter 1: Introduction</h2>
                    <div className="space-y-4 text-justify leading-relaxed">
                      <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
                      <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
                      <p>Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.</p>
                    </div>
                  </div>
                )}
                
                {currentPage === 3 && (
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <BookOpen className="mx-auto h-16 w-16 text-blue-600 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Continue Reading</h3>
                      <p className="text-gray-600 mb-6">To access the full e-book, please complete your purchase.</p>
                      <Button 
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={proceedToEBookCheckout}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Purchase Full E-Book - ₹{Math.floor((selectedEBook.price || 1999) / 100)}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of 3 (Sample)
                  </span>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage >= 3}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={() => setShowEReader(false)}>
                    Close Reader
                  </Button>
                  {currentPage < 3 && (
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={proceedToEBookCheckout}
                    >
                      Purchase Full Access
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}