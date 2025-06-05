import { useState } from "react";
import { useLocation, Link } from "wouter";
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
  CheckCircle,
  Filter,
  Play,
  Pause,
  Volume2,
  Building,
  Library,
  CreditCard
} from "lucide-react";

// Format price in Indian Rupees
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(price);
};

function LibraryBooksSection({ libraryId, libraryName }: { libraryId: number; libraryName: string }) {
  const [location, setLocation] = useLocation();
  
  const { data: rawLibraryBooks, isLoading } = useQuery({
    queryKey: ["/api/vyronaread/library-books", libraryId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/vyronaread/library-books/${libraryId}`);
      return response.json();
    },
  });

  const libraryBooks = Array.isArray(rawLibraryBooks) ? rawLibraryBooks : [];

  const handleBorrowBook = (book: any) => {
    const params = new URLSearchParams({
      type: 'borrow',
      bookId: book.id.toString(),
      bookName: encodeURIComponent(book.name || book.title || 'Unknown Title'),
      author: encodeURIComponent(book.author || 'Unknown Author')
    });
    setLocation(`/vyronaread-checkout?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-32 rounded-lg mb-2"></div>
            <div className="bg-gray-200 h-4 rounded mb-1"></div>
            <div className="bg-gray-200 h-3 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const displayBooks = libraryBooks.slice(0, 6); // Show first 6 books

  return (
    <div>
      {displayBooks.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {displayBooks.map((book: any, index: number) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group">
              <div className="relative">
                <div className="aspect-[3/4] bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center">
                  <Book className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="absolute top-2 right-2">
                  <Badge className="bg-green-600 text-white text-xs">Free</Badge>
                </div>
              </div>
              <div className="p-3">
                <h6 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">
                  {book.title || book.name || 'Unknown Title'}
                </h6>
                <p className="text-xs text-gray-600 mb-2">{book.author || 'Unknown Author'}</p>
                <Button 
                  size="sm" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleBorrowBook(book)}
                >
                  Borrow Free
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Book className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No books available from this library</p>
        </div>
      )}
    </div>
  );
}

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

  const proceedToEBookCheckout = async (ebook?: any) => {
    const targetEBook = ebook || selectedEBook;
    if (!targetEBook) return;
    
    // Navigate directly to the dedicated e-book checkout page
    const params = new URLSearchParams({
      bookId: targetEBook.id.toString(),
      bookName: encodeURIComponent(targetEBook.name || targetEBook.title || 'Unknown Title'),
      price: (targetEBook.price || 1999).toString()
    });
    setLocation(`/ebook-checkout?${params.toString()}`);
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

  // Mock reading content for e-reader demo
  const mockPages = [
    "Welcome to VyronaRead - Your Digital Reading Companion...",
    "Chapter 1: The Beginning of Knowledge...",
    "Every journey starts with a single step...",
    "Learning is a treasure that will follow its owner everywhere...",
    "Thank you for choosing VyronaRead for your reading journey!"
  ];

  if (showEReader && selectedEBook) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
        {/* E-Reader Header */}
        <div className="bg-white dark:bg-gray-800 border-b shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowEReader(false)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Library
              </Button>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {selectedEBook.name || selectedEBook.title}
                </h2>
                <p className="text-sm text-gray-500">Page {currentPage} of {mockPages.length}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={readingMode} onValueChange={setReadingMode}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light Mode</SelectItem>
                  <SelectItem value="dark">Dark Mode</SelectItem>
                  <SelectItem value="sepia">Sepia Mode</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={fontSize} onValueChange={setFontSize}>
                <SelectTrigger className="w-32">
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

        {/* Reading Area */}
        <div className="flex-1 flex">
          <div className={`flex-1 p-8 max-w-4xl mx-auto ${
            readingMode === 'dark' ? 'bg-gray-900 text-white' : 
            readingMode === 'sepia' ? 'bg-yellow-50 text-yellow-900' : 
            'bg-white text-gray-900'
          }`}>
            <div className={`prose max-w-none ${
              fontSize === 'small' ? 'text-sm' : 
              fontSize === 'large' ? 'text-lg' : 
              'text-base'
            }`}>
              <p className="leading-relaxed">
                {mockPages[currentPage - 1]}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="bg-white dark:bg-gray-800 border-t p-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <Button 
              variant="outline" 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-4">
              <Progress value={(currentPage / mockPages.length) * 100} className="w-48" />
              <span className="text-sm text-gray-500">
                {Math.round((currentPage / mockPages.length) * 100)}%
              </span>
            </div>
            
            <Button 
              variant="outline"
              onClick={() => setCurrentPage(Math.min(mockPages.length, currentPage + 1))}
              disabled={currentPage === mockPages.length}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to VyronaSocial
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">VyronaRead</h1>
                <p className="text-gray-600">Discover, Read, and Learn</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bookmark className="h-4 w-4 mr-2" />
                My Library
              </Button>
              <Button variant="outline" size="sm">
                <Trophy className="h-4 w-4 mr-2" />
                Reading Goals
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* 1. Browse Books - E-Reader Section with Enhanced Design */}
        <Card className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-6 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">📖 E-Reader Collection</h3>
                <p className="text-blue-100">Premium digital books with instant access and enhanced reading experience</p>
              </div>
              <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                Digital Library
              </Badge>
            </div>
          </div>

          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Input 
                  placeholder="Search books, authors, genres..." 
                  className="w-64"
                  prefix={<Search className="h-4 w-4" />}
                />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="fiction">Fiction</SelectItem>
                    <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* Featured E-Books Grid */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Featured E-Books</h4>
              {Array.isArray(sellerEBooks) && sellerEBooks.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {sellerEBooks.slice(0, 6).map((ebook: any, index: number) => (
                    <div key={index} className="group cursor-pointer">
                      <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100 hover:border-blue-300 transition-all hover:shadow-xl">
                        <div className="aspect-[3/4] bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center relative">
                          <Book className="h-12 w-12 text-white" />
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-white/90 text-purple-700 text-xs font-medium">
                              E-Book
                            </Badge>
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Button 
                              size="sm" 
                              className="bg-white text-purple-700 hover:bg-gray-50"
                              onClick={() => handleReadEBook(ebook)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <h5 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">
                            {ebook.name || ebook.title || 'Unknown Title'}
                          </h5>
                          <p className="text-xs text-gray-600 mb-2">{ebook.author || 'Unknown Author'}</p>
                          
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              ))}
                              <span className="text-xs text-gray-500 ml-1">(4.5)</span>
                            </div>
                            <div className="text-sm font-bold text-purple-700">
                              {formatPrice(ebook.price || 299)}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Button 
                              size="sm" 
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                              onClick={() => proceedToEBookCheckout(ebook)}
                            >
                              <ShoppingCart className="h-3 w-3 mr-1" />
                              Buy Now
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full text-purple-700 border-purple-200 hover:bg-purple-50"
                              onClick={() => handleReadEBook(ebook)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              5-Page Preview
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Book className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No e-books available</p>
                  <p className="text-gray-400 text-sm">Check back later for new releases</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. Library Integration - Discover & Borrow */}
        <div className="mb-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl border border-emerald-100 overflow-hidden">
          {/* Hero Header */}
          <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative p-8">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Library className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold">Digital Library Network</h3>
                        <p className="text-emerald-100 text-lg">Discover thousands of books from partner libraries</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-emerald-100">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5" />
                        <span>100% Free Borrowing</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Download className="h-5 w-5" />
                        <span>Instant Digital Access</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5" />
                        <span>14-Day Loans</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="hidden md:block">
                    <Button 
                      size="lg"
                      className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-8 py-3 shadow-lg"
                      onClick={() => setLocation('/library-browse')}
                    >
                      <BookOpen className="mr-2 h-5 w-5" />
                      Explore All Books
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8">
            {Array.isArray(availableLibraries) && availableLibraries.length > 0 ? (
              <div className="space-y-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-emerald-100">
                    <div className="text-3xl font-bold text-emerald-700">{availableLibraries.length}</div>
                    <div className="text-sm text-gray-600 font-medium">Partner Libraries</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-blue-100">
                    <div className="text-3xl font-bold text-blue-700">2,500+</div>
                    <div className="text-sm text-gray-600 font-medium">Books Available</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-purple-100">
                    <div className="text-3xl font-bold text-purple-700">FREE</div>
                    <div className="text-sm text-gray-600 font-medium">Borrowing Cost</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-orange-100">
                    <div className="text-3xl font-bold text-orange-700">14</div>
                    <div className="text-sm text-gray-600 font-medium">Days Per Loan</div>
                  </div>
                </div>

                {/* Featured Library Spotlight */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xl font-bold mb-1">Featured Partner Library</h4>
                        <p className="text-emerald-100">Most popular collection this month</p>
                      </div>
                      <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                        🏆 Top Choice
                      </Badge>
                    </div>
                  </div>
                  
                  {availableLibraries.slice(0, 1).map((library: any, index: number) => (
                    <div key={index} className="p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Library className="text-white h-8 w-8" />
                          </div>
                          <div>
                            <h5 className="text-xl font-bold text-gray-900">{library.libraryName || library.name}</h5>
                            <p className="text-emerald-700 font-medium text-lg capitalize">{library.libraryType || library.type || "Public"} Library</p>
                            {library.address && (
                              <p className="text-gray-600 mt-1 flex items-center">
                                <Building className="h-4 w-4 mr-1" />
                                {library.address}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-4 mt-3">
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm font-medium text-green-700">Verified Partner</span>
                              </div>
                              <div className="flex items-center space-x-1 text-sm text-gray-600">
                                <Users className="h-4 w-4" />
                                <span>1,200+ active members</span>
                              </div>
                              <div className="flex items-center space-x-1 text-sm text-gray-600">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>4.8 rating</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right space-y-3">
                          <Button 
                            size="lg"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 shadow-lg"
                            onClick={() => setLocation('/library-browse')}
                          >
                            <BookOpen className="mr-2 h-5 w-5" />
                            Browse Collection
                          </Button>
                          <div className="text-xs text-gray-500">Browse {library.bookCount || '500+'} books</div>
                        </div>
                      </div>

                      {/* Library Benefits */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                              <Clock className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-emerald-900">14-Day Loans</div>
                              <div className="text-sm text-emerald-700">Perfect reading time</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Download className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-blue-900">Instant Access</div>
                              <div className="text-sm text-blue-700">Read immediately</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Heart className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-purple-900">No Late Fees</div>
                              <div className="text-sm text-purple-700">Auto-return system</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Featured Books Preview */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h6 className="text-lg font-semibold text-gray-900">Popular Books from this Library</h6>
                          <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
                            View All →
                          </Button>
                        </div>
                        <LibraryBooksSection libraryId={library.id} libraryName={library.libraryName || library.name} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional Libraries */}
                {availableLibraries.length > 1 && (
                  <div className="space-y-4">
                    <h4 className="text-xl font-bold text-gray-900">More Partner Libraries</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {availableLibraries.slice(1).map((library: any, index: number) => (
                        <Card key={index} className="border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all bg-white">
                          <CardContent className="p-6">
                            <div className="flex items-center space-x-4 mb-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                                <Library className="text-white h-6 w-6" />
                              </div>
                              <div className="flex-1">
                                <h5 className="font-bold text-gray-900">{library.libraryName || library.name}</h5>
                                <p className="text-emerald-700 text-sm capitalize">{library.libraryType || library.type || "Public"} Library</p>
                              </div>
                              <Button 
                                size="sm"
                                variant="outline"
                                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                onClick={() => setLocation('/library-browse')}
                              >
                                Browse
                              </Button>
                            </div>
                            <div className="text-sm text-gray-600">
                              {library.address && (
                                <div className="flex items-center mb-2">
                                  <Building className="h-4 w-4 mr-1" />
                                  {library.address}
                                </div>
                              )}
                              <div className="flex items-center space-x-4">
                                <span className="flex items-center">
                                  <Users className="h-4 w-4 mr-1" />
                                  800+ members
                                </span>
                                <span className="flex items-center">
                                  <BookOpen className="h-4 w-4 mr-1" />
                                  300+ books
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Call to Action */}
                <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
                  <div className="max-w-md mx-auto">
                    <h4 className="text-2xl font-bold text-gray-900 mb-3">Ready to Start Reading?</h4>
                    <p className="text-gray-600 mb-6">Join thousands of readers accessing free books from verified libraries</p>
                    <Button 
                      size="lg"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 shadow-lg"
                      onClick={() => setLocation('/library-browse')}
                    >
                      <BookOpen className="mr-2 h-5 w-5" />
                      Explore Full Collection
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Library className="h-12 w-12 text-emerald-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-3">Library Network Coming Soon</h4>
                  <p className="text-gray-600 mb-8">We're partnering with local libraries to bring you thousands of free books</p>
                  <div className="space-y-4">
                    <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
                      <Building className="mr-2 h-5 w-5" />
                      Suggest a Library Partnership
                    </Button>
                    <div className="text-sm text-gray-500">
                      Be the first to know when libraries join our network
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
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
                Close
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {selectedLibraryBooks.map((book: any, index: number) => (
                <div key={index} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
                  <div className="w-full h-32 bg-green-100 rounded-lg mb-3 flex items-center justify-center">
                    <Book className="h-8 w-8 text-green-600" />
                  </div>
                  <h6 className="font-medium text-sm mb-1">{book.title || book.name}</h6>
                  <p className="text-xs text-gray-600 mb-2">{book.author}</p>
                  <Button 
                    size="sm" 
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => openBorrowModal(book)}
                  >
                    Borrow
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Borrow Book Modal */}
      <Dialog open={showBorrowModal} onOpenChange={setShowBorrowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Borrow Book Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="borrower-name">Full Name</Label>
              <Input id="borrower-name" placeholder="Enter your full name" />
            </div>
            <div>
              <Label htmlFor="borrower-email">Email Address</Label>
              <Input id="borrower-email" type="email" placeholder="Enter your email" />
            </div>
            <div>
              <Label htmlFor="borrower-phone">Phone Number</Label>
              <Input id="borrower-phone" placeholder="Enter your phone number" />
            </div>
            <div>
              <Label htmlFor="purpose">Purpose of Reading</Label>
              <Textarea id="purpose" placeholder="Why do you want to read this book?" />
            </div>
            <div className="flex space-x-2">
              <Button className="flex-1" onClick={() => submitBorrowRequest({})}>
                Submit Request
              </Button>
              <Button variant="outline" onClick={() => setShowBorrowModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}