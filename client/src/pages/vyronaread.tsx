import { useState, useEffect } from "react";
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
  Edit,
  X,
  Send,
  Calendar
} from "lucide-react";

// Google Drive URL conversion function
function convertGoogleDriveUrl(url: string): string {
  if (!url || !url.includes('drive.google.com')) return url;
  
  // Handle both /file/d/ID/view and /file/d/ID formats
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch) {
    const fileId = fileIdMatch[1];
    // Use the thumbnail format which works more reliably for direct image display
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
  }
  return url;
}

// Component to display featured books from a specific library
function LibraryBooksSection({ libraryId, libraryName, addToLibraryCart }: { libraryId: number; libraryName: string; addToLibraryCart: (book: any) => void }) {
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
      bookName: encodeURIComponent(book.title || book.name || 'Unknown Title'),
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
            <div key={index} className="group cursor-pointer">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 mb-2 h-32 flex items-center justify-center group-hover:shadow-md transition-shadow">
                {book.imageUrl ? (
                  <img 
                    src={convertGoogleDriveUrl(book.imageUrl)} 
                    alt={book.name || book.title}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <BookOpen className="h-8 w-8 text-green-600" />
                )}
              </div>
              <h6 className="font-medium text-sm text-gray-900 mb-1 truncate">{book.title || book.name}</h6>
              <p className="text-xs text-gray-500 mb-2 truncate">by {book.author || "Unknown Author"}</p>
              <div className="flex gap-1">
                <Button 
                  size="sm" 
                  className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700"
                  onClick={() => handleBorrowBook(book)}
                >
                  Borrow
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1 h-7 text-xs border-green-600 text-green-600 hover:bg-green-50"
                  onClick={() => addToLibraryCart(book)}
                >
                  Add to Cart
                </Button>
              </div>
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
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedBookForBorrow, setSelectedBookForBorrow] = useState<any>(null);
  const { toast } = useToast();

  // Authentication check
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/current-user"],
    retry: false,
  });

  // Use useEffect for redirect to avoid setState during render
  useEffect(() => {
    if (!userLoading && !user) {
      setLocation("/login");
    }
  }, [user, userLoading, setLocation]);

  // Show loading while checking authentication
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading VyronaRead...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const [selectedLibraryBooks, setSelectedLibraryBooks] = useState<any[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    priceRange: [0, 5000],
    availability: "all",
    format: "all",
    language: "all",
    rating: 0
  });

  // Cart state management
  const [cart, setCart] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  
  // Library cart state management
  const [libraryCart, setLibraryCart] = useState<any[]>([]);
  const [showLibraryCart, setShowLibraryCart] = useState(false);

  // Load cart from session storage on component mount
  useEffect(() => {
    try {
      const savedCart = sessionStorage.getItem('vyronaread_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
      
      const savedLibraryCart = sessionStorage.getItem('vyronaread_library_cart');
      if (savedLibraryCart) {
        setLibraryCart(JSON.parse(savedLibraryCart));
      }
    } catch (error) {
      console.error('Error loading cart from session storage:', error);
    }
  }, []);

  // Save cart to session storage whenever cart changes
  useEffect(() => {
    try {
      sessionStorage.setItem('vyronaread_cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to session storage:', error);
    }
  }, [cart]);

  // Save library cart to session storage whenever library cart changes
  useEffect(() => {
    try {
      sessionStorage.setItem('vyronaread_library_cart', JSON.stringify(libraryCart));
    } catch (error) {
      console.error('Error saving library cart to session storage:', error);
    }
  }, [libraryCart]);

  // Cart handler functions
  const addToCart = (book: any, type: 'buy' | 'rent') => {
    const cartItem = {
      id: `${book.id}-${type}`,
      book,
      type,
      addedAt: new Date().toISOString()
    };

    // Check if item already exists in cart
    const existingItem = cart.find(item => item.id === cartItem.id);
    if (existingItem) {
      toast({
        title: "Already in Cart",
        description: `${book.title || book.name} (${type}) is already in your cart.`,
        variant: "destructive"
      });
      return;
    }

    setCart(prev => [...prev, cartItem]);
    toast({
      title: "Added to Cart",
      description: `${book.title || book.name} added to cart for ${type}.`,
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
    toast({
      title: "Removed from Cart",
      description: "Item removed from cart.",
    });
  };

  const clearCart = () => {
    setCart([]);
    toast({
      title: "Cart Cleared",
      description: "All items removed from cart.",
    });
  };

  const goToCartCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before checkout.",
        variant: "destructive"
      });
      return;
    }

    // Navigate to checkout (cart is already persisted in session storage)
    setLocation('/vyronaread-cart-checkout');
  };

  // Library cart handler functions
  const addToLibraryCart = (book: any) => {
    const cartItem = {
      id: `library-${book.id}`,
      book,
      type: 'borrow',
      libraryId: book.libraryId,
      addedAt: new Date().toISOString()
    };

    // Check if item already exists in library cart
    const existingItem = libraryCart.find(item => item.id === cartItem.id);
    if (existingItem) {
      toast({
        title: "Already in Library Cart",
        description: `${book.title || book.name} is already in your library cart.`,
        variant: "destructive"
      });
      return;
    }

    setLibraryCart(prev => [...prev, cartItem]);
    toast({
      title: "Added to Library Cart",
      description: `${book.title || book.name} added to library cart for borrowing.`,
    });
  };

  const removeFromLibraryCart = (itemId: string) => {
    setLibraryCart(prev => prev.filter(item => item.id !== itemId));
    toast({
      title: "Removed from Library Cart",
      description: "Item removed from library cart.",
    });
  };

  const clearLibraryCart = () => {
    setLibraryCart([]);
    toast({
      title: "Library Cart Cleared",
      description: "All items removed from library cart.",
    });
  };

  const goToLibraryCartCheckout = () => {
    if (libraryCart.length === 0) {
      toast({
        title: "Empty Library Cart",
        description: "Please add library books to cart before checkout.",
        variant: "destructive"
      });
      return;
    }

    // Navigate to the same checkout page used by individual borrow button
    // Mark this as a bulk borrow request by adding a special parameter
    const params = new URLSearchParams({
      type: 'borrow',
      source: 'library-cart'
    });
    setLocation(`/vyronaread-checkout?${params.toString()}`);
  };

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

  const proceedToEBookCheckout = async (ebook: any, type: 'buy' | 'rent' = 'buy') => {
    if (!ebook) return;
    
    // Navigate to VyronaRead checkout page with appropriate parameters
    const params = new URLSearchParams({
      type: type,
      bookId: ebook.id.toString(),
      bookName: encodeURIComponent(ebook.name || ebook.title || 'Unknown Title'),
      author: encodeURIComponent(ebook.author || 'Unknown Author'),
      format: 'ebook'
    });
    setLocation(`/vyronaread-checkout?${params.toString()}`);
  };

  // Filter and collection handlers
  const handleAdvancedFilters = () => {
    setShowAdvancedFilters(true);
  };

  const handleExploreCollection = (collectionType: string) => {
    setSelectedCollection(collectionType);
    setSelectedCategory("all"); // Reset category filter when exploring collections
  };

  const applyFilters = (newFilters: any) => {
    setFilters(newFilters);
    setShowAdvancedFilters(false);
  };

  const resetFilters = () => {
    setFilters({
      priceRange: [0, 5000],
      availability: "all",
      format: "all",
      language: "all",
      rating: 0
    });
    setSelectedCollection(null);
    setSelectedCategory("all");
  };

  // Filter books based on selected criteria
  const getFilteredBooks = () => {
    let allBooks: any[] = [...(Array.isArray(sellerBooks) ? sellerBooks : [])];
    
    // Only use seller books - library books are for library browsing only

    // Collection-based filtering
    if (selectedCollection) {
      switch (selectedCollection) {
        case "bestsellers":
          allBooks = allBooks.filter((book: any) => (book.rating || 0) >= 4 || book.popular);
          break;
        case "new-arrivals":
          allBooks = allBooks.filter((book: any) => {
            const bookDate = new Date(book.createdAt || book.dateAdded || Date.now());
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            return bookDate > thirtyDaysAgo;
          });
          break;
        case "staff-picks":
          allBooks = allBooks.filter((book: any) => book.featured || book.staffPick);
          break;
      }
    }

    // Category filtering
    if (selectedCategory !== "all") {
      allBooks = allBooks.filter((book: any) => 
        book.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Advanced filters
    if (filters.format !== "all") {
      allBooks = allBooks.filter((book: any) => {
        if (filters.format === "physical") return !book.isEbook;
        if (filters.format === "digital") return book.isEbook;
        return true;
      });
    }

    if (filters.availability !== "all") {
      allBooks = allBooks.filter((book: any) => {
        if (filters.availability === "available") return book.isAvailable || (book.copies || 0) > 0;
        if (filters.availability === "borrowed") return !book.isAvailable && (book.copies || 0) === 0;
        return true;
      });
    }

    if (filters.rating > 0) {
      allBooks = allBooks.filter((book: any) => (book.rating || 0) >= filters.rating);
    }

    if (filters.language !== "all") {
      allBooks = allBooks.filter((book: any) => 
        book.language?.toLowerCase() === filters.language.toLowerCase()
      );
    }

    return allBooks;
  };

  // VyronaRead data queries - real-time data from seller dashboard and admin
  const { data: sellerEBooks = [] } = useQuery({
    queryKey: ["/api/vyronaread/ebooks"],
  });

  const { data: sellerBooks = [] } = useQuery({
    queryKey: ["/api/products", "vyronaread", "books"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/products?module=vyronaread&category=books");
      return await response.json();
    },
    select: (data) => {
      // Transform the already filtered VyronaRead books data
      return Array.isArray(data) ? data.map((product: any) => ({
        id: product.id,
        name: product.name,
        title: product.name, // Map name to title for consistency
        author: product.metadata?.author || "Unknown Author",
        category: product.metadata?.genre || product.metadata?.category || "General",
        price: product.price, // Price is already in paise format
        rentalPrice: product.metadata?.rentalPrice || 0,
        imageUrl: product.imageUrl,
        isAvailable: true,
        copies: 1,
        description: product.description,
        isbn: product.metadata?.isbn,
        publisher: product.metadata?.publisher,
        publicationYear: product.metadata?.publicationYear,
        language: product.metadata?.language || "English",
        rating: 4.5, // Default rating
        createdAt: product.createdAt,
        popular: false,
        dateAdded: product.createdAt,
        featured: false,
        staffPick: false,
        isEbook: product.metadata?.format === "digital"
      })) : [];
    }
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

  // Only show seller books in Browse Books section - library books are for library browsing only
  const combinedBooks = [
    ...(Array.isArray(sellerBooks) ? sellerBooks : [])
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
          className="flex items-center gap-2"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Header */}
      <Card className="vyrona-gradient-read text-white mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">VyronaRead</h1>
              <p className="text-lg opacity-90">Read. Return. Repeat. - Your smart reading ecosystem</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 relative"
                onClick={() => setShowCart(true)}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Book Cart
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white min-w-5 h-5 flex items-center justify-center text-xs rounded-full">
                    {cart.length}
                  </Badge>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 relative"
                onClick={() => setShowLibraryCart(true)}
              >
                <Library className="h-5 w-5 mr-2" />
                Library Cart
                {libraryCart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-green-500 text-white min-w-5 h-5 flex items-center justify-center text-xs rounded-full">
                    {libraryCart.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
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
            <Button variant="outline" className="flex items-center gap-2" onClick={handleAdvancedFilters}>
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="group-hover:bg-gray-50"
                      onClick={() => handleExploreCollection(collection.title.toLowerCase().replace(' ', '-'))}
                    >
                      Explore Collection
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedCollection || selectedCategory !== "all" || filters.format !== "all" || filters.availability !== "all" || filters.rating > 0) && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-blue-900">Active Filters</h5>
                <Button variant="ghost" size="sm" onClick={resetFilters} className="text-blue-600 hover:text-blue-800">
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedCollection && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Collection: {selectedCollection.replace('-', ' ')}
                  </Badge>
                )}
                {selectedCategory !== "all" && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Category: {selectedCategory}
                  </Badge>
                )}
                {filters.format !== "all" && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    Format: {filters.format}
                  </Badge>
                )}
                {filters.availability !== "all" && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    Status: {filters.availability}
                  </Badge>
                )}
                {filters.rating > 0 && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Rating: {filters.rating}+ stars
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* All Available Books */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-gray-900">
                🔍 {selectedCollection ? `${selectedCollection.replace('-', ' ')} Collection` : 'All Books'}
              </h4>
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
              {getFilteredBooks().map((book: any, index: number) => (
                <Card key={`book-${book.id}-${index}`} className="group border-2 border-gray-200 hover:border-purple-300 transition-all hover:shadow-lg">
                  <div className="relative">
                    {/* Book Cover */}
                    <div className="h-48 bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 relative overflow-hidden rounded-t-lg">
                      <div className="absolute inset-0 bg-black/20"></div>
                      {book.imageUrl ? (
                        <img 
                          src={convertGoogleDriveUrl(book.imageUrl)} 
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
                            <span className="text-lg font-bold text-purple-600">₹{book.price || 299}</span>
                            <span className="text-xs text-gray-500 ml-1">to buy</span>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">or rent</div>
                            <div className="text-sm font-medium text-green-600">₹{Math.floor((book.price || 299) * 0.4)}/15 days</div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Button 
                              size="sm" 
                              className="bg-purple-600 hover:bg-purple-700"
                              onClick={() => handleBuyBook(book)}
                            >
                              Buy Now
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRentBook(book)}
                            >
                              Rent
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-purple-600 border-purple-600 hover:bg-purple-50"
                              onClick={() => addToCart(book, 'buy')}
                            >
                              <ShoppingCart className="mr-1 h-3 w-3" />
                              Add to Cart
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => addToCart(book, 'rent')}
                            >
                              <ShoppingCart className="mr-1 h-3 w-3" />
                              Add (Rent)
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
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
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-green-600"
                              onClick={() => setLocation("/library-browse")}
                            >
                              View All Books
                            </Button>
                          </div>
                          <LibraryBooksSection libraryId={library.id} libraryName={library.libraryName || library.name} addToLibraryCart={addToLibraryCart} />
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

      {/* 3. E-Books */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">📱 E-Books</h3>
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
                          {(ebook.metadata?.genre || ebook.genre) && (
                            <Badge variant="secondary" className="text-xs">{ebook.metadata?.genre || ebook.genre}</Badge>
                          )}
                          {ebook.metadata?.fileSize && (
                            <span className="text-xs text-gray-500">{ebook.metadata.fileSize}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                          {ebook.metadata?.format && (
                            <div className="flex items-center space-x-1">
                              <FileText className="h-3 w-3" />
                              <span>{ebook.metadata.format}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>Preview Available</span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-blue-600">₹{ebook.price || 0}</span>
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
                          className="w-full bg-blue-600 hover:bg-blue-700 group-hover:bg-blue-700 transition-colors"
                          onClick={() => proceedToEBookCheckout(ebook, 'buy')}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Buy - ₹{ebook.salePrice || ebook.price || '9.99'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                          onClick={() => proceedToEBookCheckout(ebook, 'rent')}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Rent - ₹{ebook.rentalPrice || '2.99'}
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



      {/* Advanced Filter Dialog */}
      <Dialog open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Format</Label>
              <Select value={filters.format} onValueChange={(value) => setFilters({...filters, format: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="physical">Physical Books</SelectItem>
                  <SelectItem value="digital">Digital Books</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Availability</Label>
              <Select value={filters.availability} onValueChange={(value) => setFilters({...filters, availability: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Books</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="borrowed">Currently Borrowed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Language</Label>
              <Select value={filters.language} onValueChange={(value) => setFilters({...filters, language: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="hindi">Hindi</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Minimum Rating</Label>
              <Select value={filters.rating.toString()} onValueChange={(value) => setFilters({...filters, rating: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any Rating</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="5">5 Stars Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAdvancedFilters(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => setShowAdvancedFilters(false)} className="flex-1">
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Book Cart Modal */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Book Cart ({cart.length} items)
              </span>
              {cart.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700"
                >
                  Clear All
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-500">Add books to your cart to get started</p>
              </div>
            ) : (
              <>
                {cart.map((item) => (
                  <Card key={item.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded flex items-center justify-center flex-shrink-0">
                            <Book className="text-purple-600 h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{item.book.name || item.book.title}</h4>
                            <p className="text-sm text-gray-600">by {item.book.author || "Unknown Author"}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={item.type === 'buy' ? 'default' : 'secondary'}>
                                {item.type === 'buy' ? 'Purchase' : 'Rental'}
                              </Badge>
                              <span className="text-sm font-medium text-purple-600">
                                ₹{item.type === 'buy' ? (item.book.price || 299) : Math.floor((item.book.price || 299) * 0.4)}
                                {item.type === 'rent' && '/15 days'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold">Total Amount:</span>
                    <span className="text-xl font-bold text-purple-600">
                      ₹{cart.reduce((total, item) => {
                        const price = item.type === 'buy' 
                          ? (item.book.price || 299)
                          : Math.floor((item.book.price || 299) * 0.4);
                        return total + price;
                      }, 0)}
                    </span>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setShowCart(false)}
                    >
                      Continue Shopping
                    </Button>
                    <Button 
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      onClick={goToCartCheckout}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Proceed to Checkout
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Library Cart Dialog */}
      <Dialog open={showLibraryCart} onOpenChange={setShowLibraryCart}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Library className="h-5 w-5" />
              <span>Library Cart ({libraryCart.length} items)</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto space-y-3">
            {libraryCart.length === 0 ? (
              <div className="text-center py-8">
                <Library className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Your library cart is empty</p>
                <p className="text-gray-400 text-sm">Add library books to borrow multiple books at once!</p>
              </div>
            ) : (
              <>
                {libraryCart.map((item) => (
                  <Card key={item.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded flex items-center justify-center flex-shrink-0">
                            <BookOpen className="text-green-600 h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{item.book.name || item.book.title}</h4>
                            <p className="text-sm text-gray-600">by {item.book.author || "Unknown Author"}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                Borrow Request
                              </Badge>
                              <span className="text-sm font-medium text-green-600">
                                Free Borrowing
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeFromLibraryCart(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <div className="border-t pt-4">
                  <div className="bg-green-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-green-800 mb-2">Bulk Borrow Request</h4>
                    <p className="text-sm text-green-700">
                      Submit borrow requests for all {libraryCart.length} books to their respective libraries. 
                      Libraries will review and approve/reject your requests individually.
                    </p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setShowLibraryCart(false)}
                    >
                      Continue Browsing
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={clearLibraryCart}
                      className="text-red-600 hover:text-red-700"
                    >
                      Clear Cart
                    </Button>
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={goToLibraryCartCheckout}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Proceed to Checkout
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}