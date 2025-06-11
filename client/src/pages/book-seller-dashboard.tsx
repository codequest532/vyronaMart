import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Package, 
  TrendingUp, 
  ShoppingCart, 
  Plus,
  Store,
  BarChart3,
  Settings,
  Users,
  Star,
  LogOut,
  DollarSign,
  AlertCircle,
  Book,
  BookOpen,
  Library,
  Calendar,
  UserCheck,
  Clock,
  Search,
  Edit,
  Trash2,
  Eye,
  Upload,
  User,
  Printer,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Tablet,
  Building
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";

const categories = [
  "fiction", "non-fiction", "business", "self-help", "technology", 
  "science", "history", "biography", "education", "children"
];

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0, "Price must be positive"),
  stock: z.number().min(0, "Stock must be non-negative").optional(),
  module: z.string().default("vyronaread"),
});

export default function BookSellerDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [bookSection, setBookSection] = useState("overview");
  const [showAddBookDialog, setShowAddBookDialog] = useState(false);
  const [showAddLibraryDialog, setShowAddLibraryDialog] = useState(false);
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [showEbookUploadDialog, setShowEbookUploadDialog] = useState(false);
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Move all useState hooks to the top before any conditional logic
  const [newLibrary, setNewLibrary] = useState({
    name: "",
    type: "",
    address: "",
    contact: "",
    phone: "",
    email: "",
    description: "",
    booksListCsv: null as File | null
  });
  const [csvBooksList, setCsvBooksList] = useState<any[]>([]);
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    publisher: "",
    publicationYear: "",
    copies: 1,
    language: "English",
    description: "",
    imageUrl: "",
    salePrice: "",
    rentPrice: ""
  });
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [activeBookOrderTab, setActiveBookOrderTab] = useState('all');
  const [driveLink, setDriveLink] = useState("");
  const [selectedLibraryId, setSelectedLibraryId] = useState<number | null>(null);
  const [selectedLibraryBooks, setSelectedLibraryBooks] = useState<any[]>([]);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [newEbook, setNewEbook] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    format: "PDF",
    description: "",
    price: 0,
    file: null as File | null
  });

  // All useQuery hooks must be at top level before any conditional logic
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/current-user"],
  });

  const { data: sellerBooks } = useQuery({
    queryKey: ["/api/vyronaread/seller-books"],
  });

  const { data: sellerEBooks } = useQuery({
    queryKey: ["/api/vyronaread/ebooks"],
  });

  const { data: libraryBooks } = useQuery({
    queryKey: ["/api/vyronaread/library-books"],
  });

  const { data: libraryRequests } = useQuery({
    queryKey: ["/api/library-integration-requests"],
  });

  const { data: sellerOrders } = useQuery({
    queryKey: ["/api/seller/orders"],
  });

  const { data: sellerAnalytics } = useQuery({
    queryKey: ["/api/seller/analytics"],
  });

  // Fetch requested books for library membership orders
  const { data: requestedBooksData } = useQuery({
    queryKey: ['/api/orders', selectedOrder?.order_id || selectedOrder?.id, 'requested-books'],
    enabled: !!selectedOrder && selectedOrder.module === 'library_membership',
  });

  // Update order status mutation with email workflow
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/seller/orders/${orderId}/status`, {
        status
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/seller/orders"] });
      toast({
        title: "Order Updated",
        description: `Order status updated successfully. ${data.emailSent ? 'Email sent to customer.' : 'Email notification failed.'}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  // All useMutation hooks must also be at top level
  const createLibraryRequestMutation = useMutation({
    mutationFn: async (libraryData: any) => {
      return await apiRequest("POST", "/api/library-integration-requests", libraryData);
    },
    onSuccess: () => {
      toast({
        title: "Library Integration Request Submitted",
        description: "Your request has been sent to admin for review.",
      });
      setShowAddLibraryDialog(false);
      setNewLibrary({
        name: "",
        type: "",
        address: "",
        contact: "",
        phone: "",
        email: "",
        description: "",
        booksListCsv: null
      });
      setCsvBooksList([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit library integration request.",
        variant: "destructive",
      });
    },
  });

  // Add book mutation - move to top level
  const addBookMutation = useMutation({
    mutationFn: async (bookData: any) => {
      return await apiRequest("POST", "/api/products", bookData);
    },
    onSuccess: () => {
      toast({
        title: "Book Added",
        description: "Book has been added to your library successfully.",
      });
      setShowAddBookDialog(false);
      setNewBook({
        title: "",
        author: "",
        isbn: "",
        category: "",
        publisher: "",
        publicationYear: "",
        copies: 1,
        language: "English",
        description: "",
        imageUrl: "",
        salePrice: "",
        rentPrice: ""
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vyronaread/seller-books"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add book. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Authentication logic after all hooks
  useEffect(() => {
    if (!userLoading && currentUser) {
      if (currentUser.role !== "seller") {
        setLocation("/login");
      } else if (currentUser.email !== "bookseller@vyronaread.com") {
        setLocation("/seller-dashboard");
      }
    }
  }, [currentUser, userLoading, setLocation]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleAddLibrary = () => {
    setShowAddLibraryDialog(true);
  };

  const handleSubmitLibrary = () => {
    if (!newLibrary.name || !newLibrary.type || !newLibrary.address || !newLibrary.contact) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Map frontend field names to backend field names
    const libraryData = {
      libraryName: newLibrary.name,
      libraryType: newLibrary.type,
      address: newLibrary.address,
      contactPerson: newLibrary.contact,
      phone: newLibrary.phone,
      email: newLibrary.email,
      description: newLibrary.description,
      booksListCsv: csvBooksList.length > 0 ? csvBooksList : null
    };

    createLibraryRequestMutation.mutate(libraryData);
  };

  const handleInputChange = (field: string, value: any) => {
    setNewBook(prev => ({ ...prev, [field]: value }));
  };



  const handleAddBook = () => {
    if (!newBook.title || !newBook.author || !newBook.category || !newBook.salePrice || !newBook.rentPrice) {
      toast({
        title: "Error",
        description: "Please fill in all required fields including sale price and rent price",
        variant: "destructive",
      });
      return;
    }

    // Convert prices to numbers and validate
    const salePrice = parseFloat(newBook.salePrice);
    const rentPrice = parseFloat(newBook.rentPrice);
    
    if (isNaN(salePrice) || salePrice <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid sale price",
        variant: "destructive",
      });
      return;
    }
    
    if (isNaN(rentPrice) || rentPrice <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid rent price",
        variant: "destructive",
      });
      return;
    }

    // Prepare book data for API
    const bookData = {
      name: newBook.title,
      description: newBook.description,
      price: Math.round(salePrice * 100), // Convert to cents
      category: "books",
      module: "vyronaread",
      imageUrl: newBook.imageUrl,
      metadata: {
        author: newBook.author,
        isbn: newBook.isbn,
        genre: newBook.category,
        publisher: newBook.publisher,
        publicationYear: newBook.publicationYear,
        language: newBook.language,
        copies: newBook.copies,
        rentalPrice: rentPrice
      }
    };

    console.log("Adding book:", bookData);
    addBookMutation.mutate(bookData);
  };

  const handleSearchBooks = () => {
    const searchTerm = prompt("Search books by title, author, or ISBN:");
    if (searchTerm) {
      console.log(`Searching books for: ${searchTerm}`);
    }
  };

  const handleLibrarySelect = async (libraryId: number) => {
    setSelectedLibraryId(libraryId);
    try {
      const response = await fetch(`/api/vyronaread/library-books/${libraryId}`);
      const data = await response.json();
      setSelectedLibraryBooks(data);
    } catch (error) {
      console.error("Error fetching library books:", error);
      toast({
        title: "Error",
        description: "Failed to fetch library books",
        variant: "destructive",
      });
    }
  };

  const handleBackToLibraries = () => {
    setSelectedLibraryId(null);
    setSelectedLibraryBooks([]);
  };

  const handleCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      parseCsvFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid CSV file",
        variant: "destructive",
      });
    }
  };

  const parseCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
      
      console.log('CSV Headers:', headers);
      
      const books = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = [];
        let current = '';
        let inQuotes = false;
        
        // Parse CSV line properly handling quoted fields
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim().replace(/"/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim().replace(/"/g, ''));
        
        if (values.length > 0 && values[0]) {
          // Map common header variations to standard names
          const getValueByHeader = (possibleNames: string[]) => {
            for (const name of possibleNames) {
              const index = headers.findIndex(h => h.includes(name.toLowerCase().replace(/[^a-z0-9]/g, '')));
              if (index !== -1 && values[index]) {
                return values[index];
              }
            }
            return '';
          };
          
          const book = {
            'Title': getValueByHeader(['bookname', 'title', 'name']) || values[0],
            'Author': getValueByHeader(['author']) || values[1] || 'Unknown Author',
            'ISBN': getValueByHeader(['isbn', 'isbnnumber']) || values[2] || '',
            'Year': getValueByHeader(['year', 'yearofpublishing', 'publicationyear']) || values[3] || new Date().getFullYear().toString(),
            'Category': getValueByHeader(['genre', 'category']) || values[4] || 'General',
            'Publisher': getValueByHeader(['publisher']) || values[5] || 'Unknown Publisher',
            'Language': getValueByHeader(['language']) || values[6] || 'English',
            'Image URL': getValueByHeader(['bookimage', 'imageurl', 'image']) || values[7] || '',
            'Price': getValueByHeader(['price', 'saleprice', 'cost']) || getValueByHeader(['price']) || '299',
            'Rental Price': getValueByHeader(['rentalprice', 'rentprice', 'rent']) || '49',
            'Copies': getValueByHeader(['copies', 'quantity', 'stock']) || '5',
            'Description': getValueByHeader(['description', 'desc']) || `${getValueByHeader(['genre', 'category']) || 'General'} book by ${getValueByHeader(['author']) || values[1] || 'Unknown Author'}`
          };
          
          // Clean up price values - remove currency symbols and parse as numbers
          book['Price'] = book['Price'].replace(/[₹$£€,]/g, '').trim() || '299';
          book['Rental Price'] = book['Rental Price'].replace(/[₹$£€,]/g, '').trim() || '49';
          book['Copies'] = book['Copies'].replace(/[^0-9]/g, '') || '5';
          
          books.push(book);
        }
      }
      
      setCsvPreview(books);
      toast({
        title: "CSV Parsed Successfully",
        description: `Found ${books.length} books to import with prices`,
      });
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    if (!csvPreview.length) {
      toast({
        title: "No Data",
        description: "Please upload a CSV file first",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      for (let i = 0; i < csvPreview.length; i++) {
        const book = csvPreview[i];
        
        const bookData = {
          title: book.Title,
          author: book.Author,
          isbn: book.ISBN || `AUTO-${Date.now()}-${i}`,
          category: book.Category,
          description: book.Description || '',
          fixedCostPrice: parseFloat(book.Price) || 299,
          rentalPrice: parseFloat(book['Rental Price']) || 49,
          imageUrl: book['Image URL'] || '',
          copies: parseInt(book.Copies) || 5,
          language: book.Language || 'English',
          publisher: book.Publisher || 'Unknown',
          publicationYear: book.Year || new Date().getFullYear().toString(),
        };

        await apiRequest('POST', '/api/vyronaread/books', bookData);

        setImportProgress(Math.round(((i + 1) / csvPreview.length) * 100));
      }

      toast({
        title: "Import Successful",
        description: `Successfully imported ${csvPreview.length} books`,
      });
      
      // Reset state and refresh data
      setShowAddBookDialog(false);
      setCsvFile(null);
      setCsvPreview([]);
      queryClient.invalidateQueries({ queryKey: ['/api/vyronaread/seller-books'] });
      
    } catch (error) {
      console.error('Bulk import error:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import books. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await apiRequest("POST", "/api/auth/logout");
      setLocation("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleEbookUpload = () => {
    if (!newEbook.title || !newEbook.author || !newEbook.category || !newEbook.file) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and select a file",
        variant: "destructive",
      });
      return;
    }

    console.log("Uploading e-book:", newEbook);
    toast({
      title: "E-Book Uploaded",
      description: "E-book has been uploaded successfully.",
    });
    setShowEbookUploadDialog(false);
    setNewEbook({
      title: "",
      author: "",
      isbn: "",
      category: "",
      format: "PDF",
      description: "",
      price: 0,
      file: null
    });
  };



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">VyronaRead Book Management</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Complete Book Ecosystem Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{currentUser?.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser?.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">VyronaRead - Complete Book Ecosystem</h2>
              <p className="text-gray-600 dark:text-gray-300">Manage physical library, sell e-books, and provide digital reading services</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSearchBooks}>
                <Search className="h-4 w-4 mr-2" />
                Search Library
              </Button>
              <Dialog open={showAddBookDialog} onOpenChange={setShowAddBookDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Book
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Books to Library</DialogTitle>
                    <DialogDescription>
                      Add books to your VyronaRead library inventory - single entry or bulk import via CSV
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs defaultValue="single" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="single">Single Book Entry</TabsTrigger>
                      <TabsTrigger value="bulk">Bulk CSV Import</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="single" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Book Title *</Label>
                      <Input
                        id="title"
                        value={newBook.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        placeholder="Enter book title"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="author">Author *</Label>
                      <Input
                        id="author"
                        value={newBook.author}
                        onChange={(e) => handleInputChange("author", e.target.value)}
                        placeholder="Enter author name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="isbn">ISBN</Label>
                      <Input
                        id="isbn"
                        value={newBook.isbn}
                        onChange={(e) => handleInputChange("isbn", e.target.value)}
                        placeholder="978-0123456789"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={newBook.category} onValueChange={(value) => handleInputChange("category", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fiction">Fiction</SelectItem>
                          <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="self-help">Self-Help</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="science">Science</SelectItem>
                          <SelectItem value="history">History</SelectItem>
                          <SelectItem value="biography">Biography</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="children">Children</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="publisher">Publisher</Label>
                      <Input
                        id="publisher"
                        value={newBook.publisher}
                        onChange={(e) => handleInputChange("publisher", e.target.value)}
                        placeholder="Publisher name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="publicationYear">Publication Year</Label>
                      <Input
                        id="publicationYear"
                        type="number"
                        value={newBook.publicationYear}
                        onChange={(e) => handleInputChange("publicationYear", e.target.value)}
                        placeholder="2023"
                        min="1000"
                        max={new Date().getFullYear()}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="copies">Number of Copies *</Label>
                      <Input
                        id="copies"
                        type="number"
                        value={newBook.copies}
                        onChange={(e) => handleInputChange("copies", parseInt(e.target.value) || 1)}
                        placeholder="1"
                        min="1"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="salePrice">Sale Price (₹) *</Label>
                      <Input
                        id="salePrice"
                        type="number"
                        value={newBook.salePrice}
                        onChange={(e) => handleInputChange("salePrice", e.target.value)}
                        placeholder="299"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rentPrice">Rent Price (₹/month) *</Label>
                      <Input
                        id="rentPrice"
                        type="number"
                        value={newBook.rentPrice}
                        onChange={(e) => handleInputChange("rentPrice", e.target.value)}
                        placeholder="49"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={newBook.language} onValueChange={(value) => handleInputChange("language", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Hindi">Hindi</SelectItem>
                          <SelectItem value="Bengali">Bengali</SelectItem>
                          <SelectItem value="Tamil">Tamil</SelectItem>
                          <SelectItem value="Telugu">Telugu</SelectItem>
                          <SelectItem value="Marathi">Marathi</SelectItem>
                          <SelectItem value="Gujarati">Gujarati</SelectItem>
                          <SelectItem value="Kannada">Kannada</SelectItem>
                          <SelectItem value="Malayalam">Malayalam</SelectItem>
                          <SelectItem value="Punjabi">Punjabi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="imageUrl">Book Cover Image URL</Label>
                      <Input
                        id="imageUrl"
                        value={newBook.imageUrl}
                        onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                        placeholder="Enter Google Drive link or direct image URL"
                      />
                      <p className="text-sm text-gray-500">
                        Paste a Google Drive share link or direct image URL. Google Drive links will be automatically converted for display.
                      </p>
                      {newBook.imageUrl && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                          <img 
                            src={newBook.imageUrl.includes('drive.google.com') 
                              ? newBook.imageUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) 
                                ? `https://drive.google.com/thumbnail?id=${newBook.imageUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1]}&sz=w200`
                                : newBook.imageUrl
                              : newBook.imageUrl
                            }
                            alt="Book cover preview"
                            className="w-24 h-32 object-cover rounded border"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const sibling = target.nextElementSibling as HTMLElement;
                              if (sibling) {
                                sibling.style.display = 'block';
                              }
                            }}
                          />
                          <div className="w-24 h-32 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500 hidden">
                            Invalid URL
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newBook.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Brief description of the book..."
                        rows={3}
                      />
                    </div>
                  </div>
                  
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setShowAddBookDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddBook}
                          disabled={!newBook.title || !newBook.author || !newBook.category || !newBook.salePrice || !newBook.rentPrice || addBookMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {addBookMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Book
                            </>
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="bulk" className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700">CSV Format Guide:</div>
                          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded border">
                            <div className="font-medium mb-2">Supported columns (flexible headers):</div>
                            <div className="grid grid-cols-2 gap-1 text-xs">
                              <div>• <strong>Title/Book Name</strong> (required)</div>
                              <div>• <strong>Author</strong> (required)</div>
                              <div>• <strong>Price/Sale Price</strong> (₹299)</div>
                              <div>• <strong>Rental Price/Rent</strong> (₹49)</div>
                              <div>• <strong>Category/Genre</strong></div>
                              <div>• <strong>Copies/Quantity</strong></div>
                              <div>• <strong>ISBN/ISBN Number</strong></div>
                              <div>• <strong>Publisher</strong></div>
                              <div>• <strong>Language</strong></div>
                              <div>• <strong>Image URL/Book Image</strong></div>
                              <div>• <strong>Year/Publication Year</strong></div>
                              <div>• <strong>Description</strong></div>
                            </div>
                            <div className="mt-2 text-xs text-blue-600">
                              Note: Prices can include currency symbols (₹, $) - they will be automatically cleaned
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="csvFile">Select CSV File</Label>
                          <Input
                            id="csvFile"
                            type="file"
                            accept=".csv"
                            onChange={handleCsvFileChange}
                            className="cursor-pointer"
                          />
                        </div>
                        
                        {csvPreview.length > 0 && (
                          <div className="space-y-4">
                            <div className="text-sm font-medium">Preview ({csvPreview.length} books found):</div>
                            <div className="max-h-40 overflow-y-auto border rounded p-2">
                              {csvPreview.slice(0, 5).map((book: any, index) => (
                                <div key={index} className="text-xs p-2 border-b last:border-b-0">
                                  <strong>{book.Title}</strong> by {book.Author} - {book.Category} - ₹{book.Price}
                                </div>
                              ))}
                              {csvPreview.length > 5 && (
                                <div className="text-xs text-gray-500 p-2">
                                  And {csvPreview.length - 5} more books...
                                </div>
                              )}
                            </div>
                            
                            {isImporting && (
                              <div className="space-y-2">
                                <div className="text-sm">Importing books... {importProgress}%</div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${importProgress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setCsvFile(null);
                                  setCsvPreview([]);
                                }}
                                disabled={isImporting}
                              >
                                Clear
                              </Button>
                              <Button 
                                onClick={handleBulkImport}
                                disabled={isImporting || csvPreview.length === 0}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {isImporting ? 'Importing...' : `Import ${csvPreview.length} Books`}
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500 mt-4">
                          <strong>Note:</strong> ISBN and Publisher fields will be auto-generated if not provided in CSV.
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* VyronaRead Navigation Tabs - Vertical Layout */}
          <div className="flex gap-6 mb-6">
            {/* Vertical Navigation Sidebar */}
            <div className="w-64 flex-shrink-0">
              <div className="text-xs text-gray-500 mb-4">Current section: {bookSection}</div>
              <nav className="flex flex-col space-y-2">
                <button
                  onClick={() => {
                    console.log("Switching to overview");
                    setBookSection("overview");
                  }}
                  className={`py-3 px-4 rounded-lg font-medium text-sm text-left transition-colors ${
                    bookSection === "overview"
                      ? "bg-blue-100 text-blue-700 border-l-4 border-blue-500"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-4 w-4" />
                    Overview
                  </div>
                </button>
                <button
                  onClick={() => {
                    console.log("Switching to physical");
                    setBookSection("physical");
                  }}
                  className={`py-3 px-4 rounded-lg font-medium text-sm text-left transition-colors ${
                    bookSection === "physical"
                      ? "bg-blue-100 text-blue-700 border-l-4 border-blue-500"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Library className="h-4 w-4" />
                    Physical Library
                  </div>
                </button>
                <button
                  onClick={() => {
                    console.log("Switching to ebooks");
                    setBookSection("ebooks");
                  }}
                  className={`py-3 px-4 rounded-lg font-medium text-sm text-left transition-colors ${
                    bookSection === "ebooks"
                      ? "bg-blue-100 text-blue-700 border-l-4 border-blue-500"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4" />
                    E-Book Store
                  </div>
                </button>
                <button
                  onClick={() => {
                    console.log("Switching to reader");
                    setBookSection("reader");
                  }}
                  className={`py-3 px-4 rounded-lg font-medium text-sm text-left transition-colors ${
                    bookSection === "reader"
                      ? "bg-blue-100 text-blue-700 border-l-4 border-blue-500"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Tablet className="h-4 w-4" />
                    Digital Reader
                  </div>
                </button>
                <button
                  onClick={() => {
                    console.log("Switching to orders");
                    setBookSection("orders");
                  }}
                  className={`py-3 px-4 rounded-lg font-medium text-sm text-left transition-colors ${
                    bookSection === "orders"
                      ? "bg-green-100 text-green-700 border-l-4 border-green-500"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-4 w-4" />
                    Order Management
                  </div>
                </button>
                <button
                  onClick={() => {
                    console.log("Switching to analytics");
                    setBookSection("analytics");
                  }}
                  className={`py-3 px-4 rounded-lg font-medium text-sm text-left transition-colors ${
                    bookSection === "analytics"
                      ? "bg-blue-100 text-blue-700 border-l-4 border-blue-500"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-4 w-4" />
                    Analytics
                  </div>
                </button>
              </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">

          {/* Overview Section */}
          {bookSection === "overview" && (
            <div className="space-y-6">
              {/* Dynamic Stats from Real Data */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Physical Books</p>
                        <p className="text-3xl font-bold text-blue-600">
                          {sellerBooks?.filter((book: any) => book.category === 'books' && book.module === 'vyronaread').length || 0}
                        </p>
                        <p className="text-xs text-blue-500">Library inventory</p>
                      </div>
                      <Library className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">E-Books Listed</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {sellerEBooks?.length || 0}
                        </p>
                        <p className="text-xs text-purple-500">Digital catalog</p>
                      </div>
                      <BookOpen className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Orders</p>
                        <p className="text-3xl font-bold text-green-600">
                          {sellerOrders?.filter((order: any) => order.status === 'pending' || order.status === 'processing').length || 0}
                        </p>
                        <p className="text-xs text-green-500">Current period</p>
                      </div>
                      <Users className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-3xl font-bold text-orange-600">
                          ₹{sellerOrders?.reduce((total: number, order: any) => total + (order.totalAmount / 100), 0).toLocaleString() || 0}
                        </p>
                        <p className="text-xs text-orange-500">All time</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Library className="h-5 w-5" />
                      Library Integration
                    </CardTitle>
                    <CardDescription>Connect with libraries for book distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={handleAddLibrary} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Request Library Integration
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Digital Collection
                    </CardTitle>
                    <CardDescription>Manage your e-book catalog</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload E-Book
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Performance Insights
                    </CardTitle>
                    <CardDescription>Track your book business metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Physical Library Section */}
          {bookSection === "physical" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Library className="h-5 w-5" />
                    Physical Library Management
                  </CardTitle>
                  <CardDescription>Manage your physical book inventory and library partnerships</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button onClick={handleAddLibrary}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Library Partnership
                      </Button>
                    </div>
                    
                    {selectedLibraryId ? (
                      // Show books for selected library
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-4 border-b">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleBackToLibraries}
                            className="flex items-center gap-2"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Back to Libraries
                          </Button>
                          <h3 className="text-lg font-semibold">
                            {libraryRequests?.find((lib: any) => lib.id === selectedLibraryId)?.libraryName || 'Library'} Books
                          </h3>
                        </div>
                        
                        {selectedLibraryBooks && selectedLibraryBooks.length > 0 ? (
                          <div className="grid gap-4">
                            {selectedLibraryBooks.map((book: any) => (
                              <div key={book.id} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                  <div className="flex gap-4">
                                    {book.imageUrl && (
                                      <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                        <img 
                                          src={book.imageUrl.includes('drive.google.com') 
                                            ? book.imageUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) 
                                              ? `https://drive.google.com/thumbnail?id=${book.imageUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1]}&sz=w200`
                                              : book.imageUrl
                                            : book.imageUrl
                                          }
                                          alt={book.title}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const fallback = target.parentElement?.querySelector('.book-fallback') as HTMLElement;
                                            if (fallback) fallback.style.display = 'flex';
                                          }}
                                        />
                                        <div className="book-fallback w-full h-full bg-gray-200 flex items-center justify-center hidden">
                                          <Book className="h-6 w-6 text-gray-400" />
                                        </div>
                                      </div>
                                    )}
                                    <div>
                                      <h4 className="font-semibold">{book.title}</h4>
                                      <p className="text-sm text-gray-600">by {book.author}</p>
                                      <p className="text-xs text-gray-500">ISBN: {book.isbn} | Category: {book.category}</p>
                                      <p className="text-xs text-green-600">Available: {book.available}/{book.copies} copies</p>
                                      {book.publisher && (
                                        <p className="text-xs text-gray-500">Publisher: {book.publisher}</p>
                                      )}
                                      {book.publicationYear && (
                                        <p className="text-xs text-gray-500">Year: {book.publicationYear}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No books found in this library.</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Show library list
                      libraryRequests && libraryRequests.length > 0 ? (
                        <div className="grid gap-4">
                          <h3 className="text-lg font-semibold mb-4">Your Library Partnerships</h3>
                          {libraryRequests.map((library: any) => (
                            <div 
                              key={library.id} 
                              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
                              onClick={() => handleLibrarySelect(library.id)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Library className="h-6 w-6 text-blue-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                      {library.libraryName}
                                    </h4>
                                    <p className="text-sm text-gray-600">Type: {library.libraryType}</p>
                                    <p className="text-xs text-gray-500">{library.address}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge 
                                        variant={library.status === 'approved' ? 'default' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {library.status || 'pending'}
                                      </Badge>
                                      <span className="text-xs text-gray-500">
                                        Contact: {library.contactPerson}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500">View Books</span>
                                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Library className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Library Partnerships Yet</h3>
                          <p className="text-gray-500 mb-4">Start by adding library partnerships to manage book inventory</p>
                          <Button onClick={handleAddLibrary}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Library
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* E-Book Store Section */}
          {bookSection === "ebooks" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    E-Book Store Management
                  </CardTitle>
                  <CardDescription>Manage your digital book catalog and sales</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button onClick={() => setShowEbookUploadDialog(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload E-Book
                      </Button>
                      <Button variant="outline" onClick={() => setShowBulkImportDialog(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Bulk Import from Drive
                      </Button>
                      <Button variant="outline">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Sales Analytics
                      </Button>
                    </div>
                    
                    {sellerEBooks && sellerEBooks.length > 0 ? (
                      <div className="grid gap-4">
                        {sellerEBooks.map((ebook: any) => (
                          <div key={ebook.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold">{ebook.title}</h4>
                                <p className="text-sm text-gray-600">by {ebook.author}</p>
                                <p className="text-xs text-gray-500">Format: {ebook.format} | Downloads: {ebook.downloads}</p>
                                <p className="text-xs text-blue-600">Status: {ebook.status}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No E-Books Yet</h3>
                        <p className="text-gray-500 mb-4">Start building your digital catalog by uploading e-books</p>
                        <Button onClick={() => setShowEbookUploadDialog(true)}>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload First E-Book
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Digital Reader Section */}
          {bookSection === "reader" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Book className="h-5 w-5" />
                    Digital Reading Platform
                  </CardTitle>
                  <CardDescription>Provide reading experience to your customers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Digital Reader Interface</h3>
                    <p className="text-gray-500 mb-4">Integrated reading platform for your customers</p>
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Reader
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Order Management Section */}
          {bookSection === "orders" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Order Management
                  </CardTitle>
                  <CardDescription>Manage book rentals, library loans, membership requests, and e-book purchases</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const allOrders = sellerOrders?.filter((order: any) => 
                      order.module === 'vyronaread' || order.module === 'library_membership'
                    ) || [];
                    
                    if (allOrders.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Orders Yet</h3>
                          <p className="text-gray-500">Library membership requests and book orders will appear here</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {allOrders.map((order: any) => {
                          const currentStatus = order.order_status || order.status || 'pending';
                          const isLibraryMembership = order.module === 'library_membership';
                          
                          return (
                            <div key={order.order_id} className="border rounded-lg p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <p className="font-medium">Order #{order.order_id}</p>
                                    <p className="text-sm text-gray-600">
                                      {order.customer_name || 'Customer'} • {order.customer_email}
                                    </p>
                                    {order.customer_phone && (
                                      <p className="text-xs text-gray-500">
                                        Phone: {order.customer_phone}
                                      </p>
                                    )}
                                  </div>
                                  <Badge variant="outline" className={
                                    isLibraryMembership 
                                      ? "border-green-500 text-green-700" 
                                      : "border-blue-500 text-blue-700"
                                  }>
                                    {isLibraryMembership ? 'Library Membership' : 'VyronaRead'}
                                  </Badge>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">₹{(order.total_amount / 100).toFixed(2)}</p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(order.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              
                              {/* 4-Stage Status Workflow */}
                              <div className="flex items-center justify-between pt-3 border-t">
                                <div className="flex items-center gap-2">
                                  <Badge variant={
                                    currentStatus === 'delivered' ? 'default' :
                                    currentStatus === 'out_for_delivery' ? 'secondary' :
                                    currentStatus === 'shipped' ? 'outline' : 
                                    currentStatus === 'processing' ? 'secondary' : 'destructive'
                                  }>
                                    {currentStatus === 'out_for_delivery' ? 'Ready for Collection' : 
                                     currentStatus === 'shipped' ? isLibraryMembership ? 'Membership Active' : 'Shipped' :
                                     currentStatus === 'delivered' ? isLibraryMembership ? 'Books Collected' : 'Delivered' :
                                     currentStatus?.charAt(0).toUpperCase() + currentStatus?.slice(1) || 'Pending'}
                                  </Badge>
                                </div>
                                
                                {/* Interactive Status Buttons */}
                                <div className="flex gap-1">
                                  {(currentStatus === 'pending' || !currentStatus) && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs px-3 py-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                                      onClick={() => updateOrderStatusMutation.mutate({
                                        orderId: order.order_id,
                                        status: 'processing'
                                      })}
                                      disabled={updateOrderStatusMutation.isPending}
                                      title={isLibraryMembership ? "Approve Membership - Sends confirmation email" : "Start Processing - Sends 'Order Confirmed' email"}
                                    >
                                      {isLibraryMembership ? '✓ Approve' : '📧 Process'}
                                    </Button>
                                  )}
                                  
                                  {currentStatus === 'processing' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs px-3 py-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                                      onClick={() => updateOrderStatusMutation.mutate({
                                        orderId: order.order_id,
                                        status: 'shipped'
                                      })}
                                      disabled={updateOrderStatusMutation.isPending}
                                      title={isLibraryMembership ? "Activate Membership - Sends welcome email" : "Mark Shipped - Sends tracking email"}
                                    >
                                      {isLibraryMembership ? '🎫 Activate' : '📦 Ship'}
                                    </Button>
                                  )}
                                  
                                  {currentStatus === 'shipped' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs px-3 py-1 text-purple-600 border-purple-200 hover:bg-purple-50"
                                      onClick={() => updateOrderStatusMutation.mutate({
                                        orderId: order.order_id,
                                        status: 'out_for_delivery'
                                      })}
                                      disabled={updateOrderStatusMutation.isPending}
                                      title={isLibraryMembership ? "Ready for Book Collection" : "Out for Delivery"}
                                    >
                                      {isLibraryMembership ? '📚 Ready' : '🚚 Out'}
                                    </Button>
                                  )}
                                  
                                  {currentStatus === 'out_for_delivery' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs px-3 py-1 text-green-600 border-green-200 hover:bg-green-50"
                                      onClick={() => updateOrderStatusMutation.mutate({
                                        orderId: order.order_id,
                                        status: 'delivered'
                                      })}
                                      disabled={updateOrderStatusMutation.isPending}
                                      title={isLibraryMembership ? "Mark Books Collected" : "Mark Delivered"}
                                    >
                                      {isLibraryMembership ? '✅ Collected' : '✅ Delivered'}
                                    </Button>
                                  )}
                                  
                                  {updateOrderStatusMutation.isPending && (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analytics Section */}
          {bookSection === "analytics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Books</p>
                        <p className="text-2xl font-bold">{(sellerBooks?.length || 0) + (sellerEBooks?.length || 0)}</p>
                      </div>
                      <Book className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold">{sellerOrders?.length || 0}</p>
                      </div>
                      <ShoppingCart className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Revenue</p>
                        <p className="text-2xl font-bold">₹{sellerAnalytics?.totalRevenue || 0}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Books</p>
                        <p className="text-2xl font-bold">{sellerEBooks?.filter((book: any) => book.status === 'active').length || 0}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* E-Book Upload Dialog */}
          <Dialog open={showEbookUploadDialog} onOpenChange={setShowEbookUploadDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload New E-Book</DialogTitle>
                <DialogDescription>
                  Add a new e-book to your digital catalog
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="ebookTitle">Book Title *</Label>
                  <Input
                    id="ebookTitle"
                    value={newEbook.title}
                    onChange={(e) => setNewEbook({ ...newEbook, title: e.target.value })}
                    placeholder="Enter book title"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ebookAuthor">Author *</Label>
                  <Input
                    id="ebookAuthor"
                    value={newEbook.author}
                    onChange={(e) => setNewEbook({ ...newEbook, author: e.target.value })}
                    placeholder="Enter author name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ebookIsbn">ISBN</Label>
                  <Input
                    id="ebookIsbn"
                    value={newEbook.isbn}
                    onChange={(e) => setNewEbook({ ...newEbook, isbn: e.target.value })}
                    placeholder="978-0123456789"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ebookCategory">Category *</Label>
                  <Select value={newEbook.category} onValueChange={(value) => setNewEbook({ ...newEbook, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fiction">Fiction</SelectItem>
                      <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="self-help">Self-Help</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="history">History</SelectItem>
                      <SelectItem value="biography">Biography</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="children">Children</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ebookFormat">Format</Label>
                  <Select value={newEbook.format} onValueChange={(value) => setNewEbook({ ...newEbook, format: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="EPUB">EPUB</SelectItem>
                      <SelectItem value="MOBI">MOBI</SelectItem>
                      <SelectItem value="TXT">TXT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ebookPrice">Price (₹)</Label>
                  <Input
                    id="ebookPrice"
                    type="number"
                    value={newEbook.price}
                    onChange={(e) => setNewEbook({ ...newEbook, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="ebookFile">E-Book File *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <div className="text-sm text-gray-600 mb-2">
                        Upload your e-book file
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.epub,.mobi,.txt"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setNewEbook({ ...newEbook, file });
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <div className="text-xs text-gray-500 mt-2">
                        Supported formats: PDF, EPUB, MOBI, TXT
                      </div>
                    </div>
                    {newEbook.file && (
                      <div className="mt-4 p-3 bg-green-50 rounded border">
                        <div className="text-sm text-green-700">
                          ✓ File selected: {newEbook.file.name}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="ebookDescription">Description</Label>
                  <Textarea
                    id="ebookDescription"
                    value={newEbook.description}
                    onChange={(e) => setNewEbook({ ...newEbook, description: e.target.value })}
                    placeholder="Brief description of the e-book..."
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowEbookUploadDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleEbookUpload}
                  disabled={!newEbook.title || !newEbook.author || !newEbook.category || !newEbook.file}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload E-Book
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Bulk Import Dialog */}
          <Dialog open={showBulkImportDialog} onOpenChange={setShowBulkImportDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Bulk Import from Google Drive</DialogTitle>
                <DialogDescription>
                  Import multiple e-books from your Google Drive folder
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="driveLink">Google Drive Folder Link *</Label>
                  <Input
                    id="driveLink"
                    value={driveLink}
                    onChange={(e) => setDriveLink(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                  />
                  <div className="text-xs text-gray-500">
                    Make sure the folder is publicly accessible or shared with our service
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Import Instructions:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Organize e-books in your Google Drive folder</li>
                    <li>• Supported formats: PDF, EPUB, MOBI, TXT</li>
                    <li>• File names should include title and author</li>
                    <li>• Processing may take 5-10 minutes for large collections</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowBulkImportDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleBulkImport}
                  disabled={!driveLink}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Start Import
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Library Integration Dialog */}
          <Dialog open={showAddLibraryDialog} onOpenChange={setShowAddLibraryDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Add New Library to VyronaMart</DialogTitle>
                <DialogDescription>
                  Integrate a new physical library into your VyronaMart network
                </DialogDescription>
              </DialogHeader>
              
              <div className="overflow-y-auto flex-1 px-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="libraryName">Library Name *</Label>
                    <Input
                      id="libraryName"
                      placeholder="Central City Library"
                      value={newLibrary.name}
                      onChange={(e) => setNewLibrary({ ...newLibrary, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="libraryType">Library Type *</Label>
                    <Select 
                      value={newLibrary.type} 
                      onValueChange={(value) => setNewLibrary({ ...newLibrary, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select library type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public Library</SelectItem>
                        <SelectItem value="academic">Academic Library</SelectItem>
                        <SelectItem value="school">School Library</SelectItem>
                        <SelectItem value="community">Community Center</SelectItem>
                        <SelectItem value="private">Private Collection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="libraryAddress">Address *</Label>
                    <Input
                      id="libraryAddress"
                      placeholder="123 Main Street, City, State, ZIP"
                      value={newLibrary.address}
                      onChange={(e) => setNewLibrary({ ...newLibrary, address: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person *</Label>
                    <Input
                      id="contactPerson"
                      placeholder="John Smith"
                      value={newLibrary.contact}
                      onChange={(e) => setNewLibrary({ ...newLibrary, contact: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="(555) 123-4567"
                      value={newLibrary.phone}
                      onChange={(e) => setNewLibrary({ ...newLibrary, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="library@example.com"
                      value={newLibrary.email}
                      onChange={(e) => setNewLibrary({ ...newLibrary, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of the library and its collection"
                      value={newLibrary.description}
                      onChange={(e) => setNewLibrary({ ...newLibrary, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="booksListCsv">Books List (CSV Upload)</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <div className="text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <div className="text-sm text-gray-600 mb-2">
                          Upload CSV file with your book collection
                        </div>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setNewLibrary({ ...newLibrary, booksListCsv: file });
                              // Parse CSV file
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const csvText = event.target?.result as string;
                                const lines = csvText.split('\n').filter(line => line.trim());
                                
                                if (lines.length === 0) {
                                  setCsvBooksList([]);
                                  return;
                                }
                                
                                const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                                console.log('CSV Headers:', headers);
                                
                                const books = [];
                                const seenBooks = new Set(); // Track unique books by ISBN
                                
                                for (let i = 1; i < lines.length; i++) {
                                  const line = lines[i].trim();
                                  if (!line) continue;
                                  
                                  // Parse CSV line properly handling quoted fields
                                  const values = [];
                                  let current = '';
                                  let inQuotes = false;
                                  
                                  for (let j = 0; j < line.length; j++) {
                                    const char = line[j];
                                    if (char === '"') {
                                      inQuotes = !inQuotes;
                                    } else if (char === ',' && !inQuotes) {
                                      values.push(current.trim().replace(/"/g, ''));
                                      current = '';
                                    } else {
                                      current += char;
                                    }
                                  }
                                  values.push(current.trim().replace(/"/g, ''));
                                  
                                  // Only process rows with valid book data
                                  if (values.length >= 7 && values[0] && values[1] && values[2]) {
                                    const isbn = values[2];
                                    
                                    // Skip if we've already seen this book (by ISBN)
                                    if (seenBooks.has(isbn)) {
                                      console.log(`Skipping duplicate book with ISBN: ${isbn}`);
                                      continue;
                                    }
                                    
                                    const book: any = {};
                                    book["Book Name"] = values[0] || '';
                                    book["Author"] = values[1] || '';
                                    book["ISBN Number"] = values[2] || '';
                                    book["Year of Publishing"] = values[3] || '';
                                    book["Genre"] = values[4] || 'General';
                                    book["Publisher"] = values[5] || 'Unknown Publisher';
                                    book["Language"] = values[6] || 'English';
                                    book["Book Image"] = values[7] || '';
                                    
                                    if (book["Book Name"] && book["Author"]) {
                                      books.push(book);
                                      seenBooks.add(isbn);
                                      console.log(`Added book: "${book["Book Name"]}" by ${book["Author"]}`);
                                    }
                                  }
                                }
                                
                                setCsvBooksList(books);
                                console.log(`Final result: ${books.length} unique books parsed`);
                              };
                              reader.readAsText(file);
                            }
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <div className="text-xs text-gray-500 mt-2">
                          Expected columns: Book Name, Author, ISBN Number, Book Image, Year of Publishing
                        </div>
                      </div>
                      {csvBooksList.length > 0 && (
                        <div className="mt-4 p-3 bg-green-50 rounded border">
                          <div className="text-sm text-green-700">
                            ✓ CSV parsed successfully: {csvBooksList.length} books found
                          </div>
                          <div className="text-xs text-green-600 mt-1">
                            Preview: {csvBooksList.slice(0, 3).map(book => book.bookName || book.title).join(', ')}
                            {csvBooksList.length > 3 && '...'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t bg-white">
                <Button variant="outline" onClick={() => setShowAddLibraryDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitLibrary} className="bg-blue-600 hover:bg-blue-700">
                  Submit Integration Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Order Details Modal */}
          <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedOrder?.module === 'library_membership' ? 'bg-purple-100' : 
                    selectedOrder?.module === 'vyronahub' ? 'bg-green-100' : 
                    selectedOrder?.module === 'vyronasocial' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {selectedOrder?.module === 'library_membership' ? (
                      <Book className="h-5 w-5 text-purple-600" />
                    ) : selectedOrder?.module === 'vyronahub' ? (
                      <Store className="h-5 w-5 text-green-600" />
                    ) : selectedOrder?.module === 'vyronasocial' ? (
                      <Users className="h-5 w-5 text-blue-600" />
                    ) : (
                      <ShoppingCart className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                  {selectedOrder?.module === 'library_membership' ? 'Library Membership' : 'Order'} #{selectedOrder?.order_id || selectedOrder?.id} Details
                  <Badge variant="outline" className="ml-auto">
                    {selectedOrder?.module === 'library_membership' ? 'Library' : selectedOrder?.module || 'VyronaRead'}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              
              {selectedOrder && (
                <div className="space-y-6">
                  {/* Customer Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Customer Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Customer Name</label>
                          <p className="text-sm font-semibold">
                            {selectedOrder.customer_name || 
                             selectedOrder.metadata?.fullName || 
                             selectedOrder.metadata?.customerName || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Email</label>
                          <p className="text-sm">
                            {selectedOrder.customer_email || 
                             selectedOrder.metadata?.email || 
                             selectedOrder.metadata?.customerEmail || 'N/A'}
                          </p>
                        </div>
                        {selectedOrder.metadata?.phone && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Phone</label>
                            <p className="text-sm">{selectedOrder.metadata.phone}</p>
                          </div>
                        )}
                        {(selectedOrder.metadata?.address && selectedOrder.metadata.address !== "Not provided") ? (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Address</label>
                            <p className="text-sm">{selectedOrder.metadata.address}</p>
                          </div>
                        ) : (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Address</label>
                            <p className="text-sm text-gray-500">Address not provided - library pickup</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Order Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Order ID</label>
                          <p className="text-sm font-mono">#{selectedOrder.order_id || selectedOrder.id}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Status</label>
                          <Badge variant={
                            (selectedOrder.order_status || selectedOrder.metadata?.status) === 'delivered' ? 'default' :
                            (selectedOrder.order_status || selectedOrder.metadata?.status) === 'shipped' ? 'secondary' :
                            (selectedOrder.order_status || selectedOrder.metadata?.status) === 'processing' ? 'outline' : 'destructive'
                          }>
                            {selectedOrder.order_status || selectedOrder.metadata?.status || 'pending'}
                          </Badge>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Amount</label>
                          <p className="text-sm font-semibold">₹{((selectedOrder.total_amount || 0) / 100).toFixed(2)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Date</label>
                          <p className="text-sm">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                        </div>
                        {selectedOrder.module === 'library_membership' && selectedOrder.metadata?.membershipFee && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Membership Fee</label>
                            <p className="text-sm font-semibold">₹{selectedOrder.metadata.membershipFee}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Library Membership Details */}
                  {selectedOrder.module === 'library_membership' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building className="h-5 w-5" />
                          Library Membership Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Library ID</label>
                            <p className="text-sm">{selectedOrder.metadata?.libraryId || '28'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Membership Type</label>
                            <p className="text-sm capitalize">{selectedOrder.metadata?.membershipType || 'Annual'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Membership Fee</label>
                            <p className="text-sm font-semibold">₹{selectedOrder.metadata?.membershipFee || 2000}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Application Date</label>
                            <p className="text-sm">{selectedOrder.metadata?.applicationDate ? new Date(selectedOrder.metadata.applicationDate).toLocaleDateString() : new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Current Status</label>
                            <Badge variant={selectedOrder.metadata?.status === 'activated' ? 'default' : 'secondary'}>
                              {selectedOrder.metadata?.status === 'activated' ? 'Automatically Activated' : 'Processing Activation'}
                            </Badge>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Valid Until</label>
                            <p className="text-sm">{selectedOrder.metadata?.expiryDate ? new Date(selectedOrder.metadata.expiryDate).toLocaleDateString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        {/* Automatic Activation Notice */}
                        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="font-semibold text-green-800">Automatic Processing Enabled</span>
                          </div>
                          <p className="text-sm text-green-700">
                            This membership activates automatically upon payment completion. No manual intervention required.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Requested Books for Borrowing */}
                  {selectedOrder.module === 'library_membership' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Books Requested for Borrowing
                          {requestedBooksData?.totalBooks > 0 && (
                            <Badge variant="secondary">{requestedBooksData.totalBooks} books</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          Books the customer wants to borrow - prepare these for dispatch after membership approval
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {requestedBooksData?.requestedBooks?.length > 0 ? (
                          <div className="space-y-4">
                            {requestedBooksData.requestedBooks.map((book: any, index: number) => (
                              <div key={book.id} className="border rounded-lg p-4 bg-gray-50">
                                <div className="flex gap-4">
                                  {book.imageUrl && (
                                    <img 
                                      src={book.imageUrl} 
                                      alt={book.title}
                                      className="w-16 h-20 object-cover rounded"
                                    />
                                  )}
                                  <div className="flex-1 space-y-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-xs font-medium text-gray-600">Title</label>
                                        <p className="text-sm font-semibold">{book.title}</p>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-gray-600">Author</label>
                                        <p className="text-sm">{book.author}</p>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-gray-600">ISBN</label>
                                        <p className="text-sm font-mono">{book.isbn}</p>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-gray-600">Category</label>
                                        <p className="text-sm">{book.category}</p>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-gray-600">Publisher</label>
                                        <p className="text-sm">{book.publisher}</p>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-gray-600">Language</label>
                                        <p className="text-sm">{book.language}</p>
                                      </div>
                                      {book.rentalDuration && (
                                        <div>
                                          <label className="text-xs font-medium text-gray-600">Rental Duration</label>
                                          <p className="text-sm">{book.rentalDuration} days</p>
                                        </div>
                                      )}
                                      {book.pricePerDay && (
                                        <div>
                                          <label className="text-xs font-medium text-gray-600">Daily Rate</label>
                                          <p className="text-sm">₹{book.pricePerDay}/day</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          // Show default for library membership orders
                          <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                            <div className="flex items-center gap-3 mb-3">
                              <BookOpen className="h-5 w-5 text-blue-600" />
                              <h4 className="font-semibold text-blue-800">Library Access Request</h4>
                            </div>
                            <div className="bg-white p-4 rounded border">
                              <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                  {selectedOrder.metadata?.bookTitle && selectedOrder.metadata.bookTitle !== 'Unknown Book' ? (
                                    <div className="border-l-4 border-blue-500 pl-4 mb-4">
                                      <p className="font-semibold text-gray-900 text-lg">Book Requested for Borrowing:</p>
                                      <p className="font-medium text-blue-900 text-xl">{selectedOrder.metadata.bookTitle}</p>
                                      {selectedOrder.metadata?.bookId && (
                                        <p className="text-sm text-gray-600">Book ID: {selectedOrder.metadata.bookId}</p>
                                      )}
                                      <div className="mt-2 p-2 bg-blue-50 rounded">
                                        <p className="text-sm text-blue-800">
                                          <strong>Action Required:</strong> Prepare this book for customer collection after membership activation
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="border-l-4 border-gray-400 pl-4 mb-4">
                                      <p className="font-medium text-gray-900">General Library Access</p>
                                      <p className="text-sm text-gray-600">No specific book requested - general membership</p>
                                    </div>
                                  )}
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                    <div>
                                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Customer Name</label>
                                      <p className="text-sm font-medium text-gray-900">
                                        {selectedOrder.metadata?.fullName || selectedOrder.customer_name || 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                                      <p className="text-sm text-gray-900">
                                        {selectedOrder.metadata?.email || selectedOrder.customer_email || 'N/A'}
                                      </p>
                                    </div>
                                    {selectedOrder.metadata?.phone && (
                                      <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</label>
                                        <p className="text-sm text-gray-900">{selectedOrder.metadata.phone}</p>
                                      </div>
                                    )}
                                    <div>
                                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Order Date</label>
                                      <p className="text-sm text-gray-900">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                                    <p><strong>Library Access Details:</strong></p>
                                    <p>• Annual membership: ₹{selectedOrder.metadata?.membershipFee || 2000}</p>
                                    <p>• Unlimited book borrowing for one year</p>
                                    <p>• 14-day borrowing period per book</p>
                                    <p>• Access to all partner libraries</p>
                                  </div>
                                </div>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  {selectedOrder.metadata?.status === 'activated' || selectedOrder.order_status === 'completed' 
                                    ? 'Activated - Ready to Borrow' 
                                    : 'Processing Activation'}
                                </Badge>
                              </div>
                            </div>
                            <div className="mt-3 text-xs text-blue-600">
                              Membership activates automatically upon payment completion
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Status Workflow */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Status Management & Email Workflow
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedOrder.module === 'library_membership' ? (
                          // Library membership: show automatic activation status
                          <div className="space-y-3">
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="font-semibold text-green-800">
                                  {selectedOrder.order_status === 'completed' || selectedOrder.metadata?.status === 'activated' 
                                    ? 'Membership Automatically Activated'
                                    : 'Processing Automatic Activation'}
                                </span>
                              </div>
                              <div className="space-y-2 text-sm text-green-700">
                                <p>
                                  {selectedOrder.order_status === 'completed' || selectedOrder.metadata?.status === 'activated' 
                                    ? 'Customer can now access library services and borrow books. Welcome email sent automatically.'
                                    : 'Membership will be activated automatically upon payment completion. No manual approval required.'}
                                </p>
                                {selectedOrder.metadata?.activatedDate && (
                                  <div className="flex justify-between border-t border-green-200 pt-2 mt-2">
                                    <span>Activated:</span>
                                    <span className="font-medium">{new Date(selectedOrder.metadata.activatedDate).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {selectedOrder.metadata?.expiryDate && (
                                  <div className="flex justify-between">
                                    <span>Expires:</span>
                                    <span className="font-medium">{new Date(selectedOrder.metadata.expiryDate).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              Library memberships are processed automatically. Manual intervention is not required.
                            </div>
                          </div>
                        ) : (
                          // Regular orders: show manual workflow
                          <div className="space-y-3">
                            <div className="text-sm text-gray-600">
                              Update order status to progress through the fulfillment workflow. Automated emails are sent at each stage.
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {['processing', 'shipped', 'out_for_delivery', 'delivered'].map((status) => {
                                const currentStatus = selectedOrder.order_status || 'pending';
                                const isCurrentStatus = currentStatus === status;
                                const isPastStatus = ['processing', 'shipped', 'out_for_delivery', 'delivered'].indexOf(currentStatus) > 
                                                    ['processing', 'shipped', 'out_for_delivery', 'delivered'].indexOf(status);
                                
                                const statusLabels: { [key: string]: string } = {
                                  processing: 'Start Processing',
                                  shipped: 'Mark Shipped',
                                  out_for_delivery: 'Out for Delivery', 
                                  delivered: 'Mark Delivered'
                                };

                                return (
                                  <Button
                                    key={status}
                                    size="sm"
                                    variant={isCurrentStatus ? "default" : isPastStatus ? "secondary" : "outline"}
                                    disabled={isPastStatus || updateOrderStatusMutation.isPending}
                                    onClick={() => updateOrderStatusMutation.mutate({
                                      orderId: selectedOrder.order_id || selectedOrder.id,
                                      status: status
                                    })}
                                    className={isCurrentStatus ? "bg-blue-600 text-white" : ""}
                                  >
                                    {isPastStatus ? '✓' : ''} {statusLabels[status]}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {updateOrderStatusMutation.isPending && (
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                            Updating status and sending email...
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
            </div>
          </div>
    </div>
  );
}