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

// Component to display featured books from a specific library
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
      <div className="flex items-center justify-between mb-4">
        <h5 className="font-semibold text-gray-800">Featured Books</h5>
        {libraryBooks.length > 6 && (
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setLocation('/library-browse')}
            className="text-green-600 hover:text-green-700"
          >
            View All ({libraryBooks.length})
          </Button>
        )}
      </div>
      
      {displayBooks.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {displayBooks.map((book: any, index: number) => (
            <div key={index} className="group cursor-pointer">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 mb-2 h-32 flex items-center justify-center group-hover:shadow-md transition-shadow">
                {book.imageUrl ? (
                  <img 
                    src={book.imageUrl} 
                    alt={book.name || book.title}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <BookOpen className="h-8 w-8 text-green-600" />
                )}
              </div>
              <h6 className="font-medium text-sm text-gray-900 mb-1 truncate">{book.name || book.title}</h6>
              <p className="text-xs text-gray-500 mb-2 truncate">by {book.author || "Unknown Author"}</p>
              <Button 
                size="sm" 
                className="w-full h-7 text-xs bg-green-600 hover:bg-green-700"
                onClick={() => handleBorrowBook(book)}
              >
                Borrow
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No books available in this library</p>
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

  // Handle library click to navigate to library browse page
  const handleLibraryClick = (library: any) => {
    setLocation("/library-browse");
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
    product.category && [
      'books', 'education', 'romance', 'sci-fi', 'mystery', 'fantasy', 'biography',
      'self help', 'fiction', 'non-fiction', 'business', 'health', 'technology',
      'history', 'science', 'philosophy', 'religion', 'cooking', 'travel',
      'children', 'young adult', 'academic', 'reference'
    ].includes(product.category.toLowerCase())
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
        <Link href="/home">
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Header */}
      <Card className="vyrona-gradient-read text-white mb-6">
        <CardContent className="p-6">
          <h1 className="text-3xl font-bold mb-2">VyronaRead</h1>
          <p className="text-lg opacity-90">Read. Return. Repeat. - Your smart reading ecosystem</p>
        </CardContent>
      </Card>



      {/* 1. Browse Books */}
      <Card className="mb-8">
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">📖 Discover Amazing Books</h3>
              <p className="text-purple-100">Explore thousands of books from sellers, libraries, and digital collections</p>
            </div>
            <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
              Multi-Source Discovery
            </Badge>
          </div>
        </div>

        <CardContent className="p-6 space-y-8">
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search for books, authors, or topics..." 
                className="pl-10 py-2 border-gray-300 focus:border-blue-500"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Filter by category" />
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
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Advanced Filters
            </Button>
          </div>

          {/* Featured Collections */}
          <div>
            <h4 className="text-xl font-bold text-gray-900 mb-6">🌟 Featured Collections</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { title: "Bestsellers", desc: "Most popular books", icon: "📈", color: "from-orange-400 to-red-500" },
                { title: "New Arrivals", desc: "Latest additions", icon: "✨", color: "from-green-400 to-blue-500" },
                { title: "Staff Picks", desc: "Curated by experts", icon: "🎯", color: "from-purple-400 to-pink-500" }
              ].map((collection, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all cursor-pointer">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 bg-gradient-to-r ${collection.color} rounded-lg flex items-center justify-center mb-4`}>
                      <span className="text-2xl">{collection.icon}</span>
                    </div>
                    <h5 className="font-bold text-lg mb-2">{collection.title}</h5>
                    <p className="text-gray-600 text-sm mb-4">{collection.desc}</p>
                    <Button variant="outline" size="sm" className="group-hover:bg-gray-50">
                      Explore Collection
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* All Available Books */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-gray-900">🔍 All Books</h4>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <Select defaultValue="popular">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Popular</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {combinedBooks.length > 0 ? combinedBooks.map((book, index) => (
                <Card key={index} className="group border-2 border-gray-200 hover:border-purple-300 transition-all hover:shadow-lg">
                  <div className="relative">
                    {/* Book Cover */}
                    <div className="h-48 bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 relative overflow-hidden rounded-t-lg">
                      <div className="absolute inset-0 bg-black/20"></div>
                      {book.imageUrl ? (
                        <img 
                          src={book.imageUrl} 
                          alt={book.name || book.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`absolute inset-0 flex items-center justify-center text-white ${book.imageUrl ? 'hidden' : 'flex'}`}>
                        <div className="text-center p-4">
                          <Book className="h-12 w-12 mx-auto mb-2 opacity-90" />
                          <h4 className="font-bold text-sm leading-tight">{book.name || book.title}</h4>
                        </div>
                      </div>
                      {/* Popularity Badge */}
                      {index < 3 && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-yellow-500 text-yellow-900">Popular</Badge>
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Book Info */}
                        <div>
                          <h5 className="font-bold text-gray-900 text-sm leading-tight mb-1">{book.name || book.title}</h5>
                          <p className="text-xs text-gray-600 mb-2">by {book.author || "Unknown Author"}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs">{book.category || "General"}</Badge>
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-gray-600">4.{Math.floor(Math.random() * 5) + 3}</span>
                            </div>
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-bold text-purple-600">₹{Math.floor((book.price || 299) / 100)}</span>
                            <span className="text-xs text-gray-500 ml-1">to buy</span>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">or rent</div>
                            <div className="text-sm font-medium text-green-600">₹{Math.floor((book.price || 299) / 500)}/week</div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          <Button 
                            size="sm" 
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            onClick={() => handleBuyBook(book)}
                          >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Buy Now
                          </Button>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => handleRentBook(book)}
                            >
                              <Clock className="mr-1 h-3 w-3" />
                              Rent
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              Preview
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              )) : (
                <div className="col-span-full">
                  <Card className="border-2 border-dashed border-gray-300">
                    <CardContent className="text-center py-16">
                      <Search className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                      <h4 className="text-xl font-semibold text-gray-700 mb-2">No Books Found</h4>
                      <p className="text-gray-500 mb-4">Try adjusting your search or category filter</p>
                      <Button variant="outline">Clear Filters</Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Library Integration */}
      <Card className="mb-8">
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">📚 Partner Libraries</h3>
              <p className="text-green-100">Borrow books from verified libraries with digital membership</p>
            </div>
            <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
              Free Borrowing
            </Badge>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="space-y-8">
            {Array.isArray(availableLibraries) && availableLibraries.length > 0 ? (
              <>
                {/* Library Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <Card className="border border-green-200 bg-green-50">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-700">{availableLibraries.length}</div>
                      <div className="text-sm text-green-600">Partner Libraries</div>
                    </CardContent>
                  </Card>
                  <Card className="border border-blue-200 bg-blue-50">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-700">2,500+</div>
                      <div className="text-sm text-blue-600">Available Books</div>
                    </CardContent>
                  </Card>
                  <Card className="border border-purple-200 bg-purple-50">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-700">Free</div>
                      <div className="text-sm text-purple-600">Borrowing Cost</div>
                    </CardContent>
                  </Card>
                  <Card className="border border-orange-200 bg-orange-50">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-700">14 Days</div>
                      <div className="text-sm text-orange-600">Borrow Period</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Partner Libraries */}
                <div className="space-y-6">
                  {availableLibraries.map((library: any, index: number) => (
                    <Card key={index} className="border-2 border-green-200 hover:border-green-300 transition-all hover:shadow-xl">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                              <Library className="text-white h-8 w-8" />
                            </div>
                            <div>
                              <h4 className="text-xl font-bold text-gray-900">{library.libraryName || library.name}</h4>
                              <p className="text-green-700 font-medium capitalize">{library.libraryType || library.type || "Public"} Library</p>
                              {library.address && (
                                <p className="text-sm text-gray-600 mt-1 flex items-center">
                                  <Building className="h-4 w-4 mr-1" />
                                  {library.address}
                                </p>
                              )}
                              <div className="flex items-center space-x-4 mt-2">
                                <Badge className="bg-green-600 text-white">Verified Partner</Badge>
                                <div className="flex items-center space-x-1 text-sm text-gray-600">
                                  <Users className="h-4 w-4" />
                                  <span>1,200+ members</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <Button 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => setLocation('/library-browse')}
                            >
                              <BookOpen className="mr-2 h-4 w-4" />
                              Browse Collection
                            </Button>
                            <div className="text-xs text-gray-500">Free borrowing available</div>
                          </div>
                        </div>
                      </div>

                      <CardContent className="p-6">
                        {/* Library Features */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                            <Clock className="h-5 w-5 text-green-600" />
                            <div>
                              <div className="font-medium text-sm">14-Day Loans</div>
                              <div className="text-xs text-gray-600">Standard borrowing period</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                            <Download className="h-5 w-5 text-blue-600" />
                            <div>
                              <div className="font-medium text-sm">Digital Access</div>
                              <div className="text-xs text-gray-600">Read on any device</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                            <Heart className="h-5 w-5 text-purple-600" />
                            <div>
                              <div className="font-medium text-sm">No Late Fees</div>
                              <div className="text-xs text-gray-600">Auto-return system</div>
                            </div>
                          </div>
                        </div>

                        {/* Featured Books from Library */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="font-semibold text-gray-900">Featured Books</h5>
                            <Button variant="ghost" size="sm" className="text-green-600">
                              View All Books
                            </Button>
                          </div>
                          <LibraryBooksSection libraryId={library.id} libraryName={library.libraryName || library.name} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Library className="h-12 w-12 text-gray-400" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-700 mb-2">No Partner Libraries Yet</h4>
                  <p className="text-gray-500 mb-6">We're working on partnerships with local libraries to bring you free borrowing options</p>
                  <div className="space-y-4">
                    <Button variant="outline">
                      <Building className="mr-2 h-4 w-4" />
                      Suggest a Library
                    </Button>
                    <div className="text-sm text-gray-500">
                      Check back soon for library partnerships in your area
                    </div>
                  </div>
                </CardContent>
              </Card>
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">📱 VyronaRead E-Reader</h3>
              <p className="text-gray-600 mt-1">Premium digital reading experience with instant access</p>
            </div>
            <Badge variant="outline" className="text-blue-700 px-3 py-1">Kindle-like Experience</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(sellerEBooks) && sellerEBooks.length > 0 ? sellerEBooks.map((ebook: any, index: number) => (
              <Card key={index} className="group border-2 border-gray-200 hover:border-blue-400 transition-all duration-300 hover:shadow-lg overflow-hidden">
                <div className="relative">
                  {/* Book Cover Simulation */}
                  <div className="h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white p-4">
                        <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-90" />
                        <h4 className="font-bold text-lg leading-tight">{ebook.name || ebook.title}</h4>
                        <p className="text-sm opacity-75 mt-1">{ebook.metadata?.author || ebook.author || "Unknown Author"}</p>
                      </div>
                    </div>
                    {/* Premium Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-yellow-500 text-yellow-900 border-yellow-400">Premium</Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-5">
                    <div className="space-y-4">
                      {/* Book Info */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary" className="text-xs">{ebook.metadata?.genre || ebook.genre || "Digital Book"}</Badge>
                          <span className="text-xs text-gray-500">{ebook.metadata?.fileSize || "2.5MB"}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                          <div className="flex items-center space-x-1">
                            <FileText className="h-3 w-3" />
                            <span>{ebook.metadata?.format || "PDF"}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>Preview Available</span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-blue-600">₹{Math.floor((ebook.price || 1999) / 100)}</span>
                          <span className="text-sm text-gray-500 ml-1">one-time</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Instant Access</div>
                          <div className="text-xs text-green-600 font-medium">Download Included</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                          onClick={() => handleReadEBook(ebook)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Preview Book
                        </Button>
                        <Button 
                          size="sm" 
                          className="w-full bg-blue-600 hover:bg-blue-700 group-hover:bg-blue-700 transition-colors"
                          onClick={() => proceedToEBookCheckout(ebook)}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Buy Now - ₹{Math.floor((ebook.price || 1999) / 100)}
                        </Button>
                      </div>

                      {/* Features */}
                      <div className="pt-3 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Download className="h-3 w-3 text-green-500" />
                            <span>Offline Reading</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Bookmark className="h-3 w-3 text-blue-500" />
                            <span>Bookmarks</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Search className="h-3 w-3 text-purple-500" />
                            <span>Text Search</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Type className="h-3 w-3 text-orange-500" />
                            <span>Custom Fonts</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            )) : (
              <div className="col-span-full text-center py-12">
                <div className="max-w-md mx-auto">
                  <BookOpen className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <h4 className="text-xl font-semibold text-gray-700 mb-2">No E-Books Available Yet</h4>
                  <p className="text-gray-500 mb-4">Digital books uploaded by sellers will appear here for instant reading</p>
                  <Badge variant="outline" className="text-gray-500">Coming Soon</Badge>
                </div>
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

      {/* Enhanced E-Reader Preview Modal */}
      <Dialog open={showEReader} onOpenChange={setShowEReader}>
        <DialogContent className="sm:max-w-5xl h-[85vh] p-0">
          {selectedEBook && (
            <div className="flex flex-col h-full">
              {/* Header with Book Info & Purchase CTA */}
              <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-20 bg-white/20 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{selectedEBook.name || selectedEBook.title}</h3>
                      <p className="text-blue-100">by {selectedEBook.metadata?.author || selectedEBook.author || "Unknown Author"}</p>
                      <div className="flex items-center space-x-3 mt-2">
                        <Badge className="bg-white/20 text-white border-white/30">
                          {selectedEBook.metadata?.genre || "Digital Book"}
                        </Badge>
                        <span className="text-sm text-blue-100">
                          {selectedEBook.metadata?.fileSize || "2.5MB"} • {selectedEBook.metadata?.format || "PDF"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">₹{Math.floor((selectedEBook.price || 1999) / 100)}</div>
                    <div className="text-blue-100 text-sm">One-time purchase</div>
                    <Button 
                      className="mt-3 bg-white text-blue-600 hover:bg-blue-50"
                      onClick={() => proceedToEBookCheckout()}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Buy Full Access
                    </Button>
                  </div>
                </div>
              </div>

              {/* Preview Content Area */}
              <div className="flex-1 flex">
                {/* Reader Interface */}
                <div className="flex-1 bg-white">
                  <div className="h-full flex flex-col">
                    {/* Reader Toolbar */}
                    <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-700">Preview Mode</span>
                        <Badge variant="outline" className="text-xs">
                          Page {currentPage} of 5 (Limited Preview)
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <div className="flex bg-gray-200 rounded p-1">
                          <Button 
                            variant={readingMode === "light" ? "default" : "ghost"} 
                            size="sm"
                            onClick={() => setReadingMode("light")}
                            className="h-6 px-2"
                          >
                            <Sun className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant={readingMode === "dark" ? "default" : "ghost"} 
                            size="sm"
                            onClick={() => setReadingMode("dark")}
                            className="h-6 px-2"
                          >
                            <Moon className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Reading Content */}
                    <div className={`flex-1 p-8 overflow-y-auto ${readingMode === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
                      <div className="max-w-3xl mx-auto">
                        {currentPage === 1 && (
                          <div className="space-y-6">
                            <div className="text-center mb-8">
                              <h1 className="text-3xl font-bold mb-2">{selectedEBook.name || selectedEBook.title}</h1>
                              <p className="text-lg text-gray-600 dark:text-gray-300">
                                by {selectedEBook.metadata?.author || selectedEBook.author || "Unknown Author"}
                              </p>
                            </div>
                            <div className="space-y-4 text-justify leading-relaxed text-lg">
                              <p className="first-letter:text-6xl first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:mt-1">
                                Welcome to this comprehensive guide that will transform your understanding of the subject matter. This book represents years of research and practical experience in the field.
                              </p>
                              <p>
                                Through carefully crafted chapters, you'll discover insights that bridge the gap between theory and practice, providing you with actionable knowledge that you can apply immediately.
                              </p>
                              <p>
                                Each section builds upon the previous one, creating a comprehensive learning journey that takes you from fundamental concepts to advanced applications.
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {currentPage === 2 && (
                          <div className="space-y-6">
                            <h2 className="text-2xl font-bold mb-6">Table of Contents</h2>
                            <div className="space-y-3">
                              {[
                                "Chapter 1: Foundations and Core Principles",
                                "Chapter 2: Practical Implementation Strategies", 
                                "Chapter 3: Advanced Techniques and Methods",
                                "Chapter 4: Real-World Case Studies",
                                "Chapter 5: Future Trends and Developments",
                                "Chapter 6: Best Practices and Guidelines",
                                "Appendix A: Resource Directory",
                                "Appendix B: Quick Reference Guide"
                              ].map((chapter, index) => (
                                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                  <span>{chapter}</span>
                                  <span className="text-gray-500">{index + 1}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {currentPage === 3 && (
                          <div className="space-y-6">
                            <h2 className="text-2xl font-bold mb-6">Chapter 1: Introduction</h2>
                            <div className="space-y-4 text-justify leading-relaxed text-lg">
                              <p>
                                In this opening chapter, we establish the fundamental framework that will guide our exploration throughout this book. The concepts introduced here form the cornerstone of everything that follows.
                              </p>
                              <p>
                                Understanding these principles is crucial for anyone looking to master the subject matter. We'll examine historical context, current applications, and future possibilities.
                              </p>
                              <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 dark:text-gray-300 my-6">
                                "The journey of a thousand miles begins with a single step, and in learning, that step is understanding the foundations."
                              </blockquote>
                              <p>
                                As we progress through the material, you'll notice how each concept builds naturally upon the previous one, creating a cohesive understanding that extends far beyond individual topics.
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {currentPage >= 4 && (
                          <div className="text-center py-16">
                            <div className="max-w-md mx-auto">
                              <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                                <BookOpen className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                              </div>
                              <h3 className="text-2xl font-bold mb-4">Preview Limit Reached</h3>
                              <p className="text-gray-600 dark:text-gray-300 mb-6">
                                You've reached the end of the free preview. Purchase the full e-book to continue reading all {Math.floor(Math.random() * 200) + 150} pages.
                              </p>
                              <div className="space-y-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                  <h4 className="font-semibold mb-2">What you'll get:</h4>
                                  <ul className="text-sm space-y-1 text-left">
                                    <li>✓ Complete access to all chapters</li>
                                    <li>✓ Downloadable PDF format</li>
                                    <li>✓ Offline reading capability</li>
                                    <li>✓ Bookmarks and notes support</li>
                                    <li>✓ Lifetime access</li>
                                  </ul>
                                </div>
                                <Button 
                                  size="lg"
                                  className="w-full bg-blue-600 hover:bg-blue-700"
                                  onClick={() => proceedToEBookCheckout()}
                                >
                                  <ShoppingCart className="mr-2 h-5 w-5" />
                                  Purchase Full E-Book - ₹{Math.floor((selectedEBook.price || 1999) / 100)}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar with Features & CTA */}
                <div className="w-80 bg-gray-50 border-l p-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">Reading Features</h4>
                      <div className="space-y-3">
                        {[
                          { icon: Download, label: "Offline Reading", desc: "Read anywhere, anytime" },
                          { icon: Bookmark, label: "Smart Bookmarks", desc: "Never lose your place" },
                          { icon: Search, label: "Full-Text Search", desc: "Find any content instantly" },
                          { icon: Type, label: "Custom Typography", desc: "Adjust fonts & size" }
                        ].map((feature, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <feature.icon className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <div className="font-medium text-sm">{feature.label}</div>
                              <div className="text-xs text-gray-600">{feature.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-semibold mb-2">Instant Access</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Get immediate access after purchase. No waiting, no shipping delays.
                      </p>
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => proceedToEBookCheckout()}
                      >
                        Buy Now & Start Reading
                      </Button>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">₹{Math.floor((selectedEBook.price || 1999) / 100)}</div>
                      <div className="text-sm text-gray-500">One-time payment</div>
                      <div className="text-xs text-green-600 mt-1">✓ 30-day money-back guarantee</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom Navigation */}
              <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
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
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage >= 5}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    Preview: {currentPage} of 5 pages
                  </span>
                  <Button variant="outline" onClick={() => setShowEReader(false)}>
                    Close Preview
                  </Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => proceedToEBookCheckout()}
                  >
                    Purchase Full Book
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}