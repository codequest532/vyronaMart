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
  X
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

  // Get current user for authentication check
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/current-user"],
  });

  // Redirect non-book sellers
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
    description: ""
  });
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [activeBookOrderTab, setActiveBookOrderTab] = useState('all');
  const [driveLink, setDriveLink] = useState("");
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

  // Fetch book seller data
  const { data: sellerBooks } = useQuery({
    queryKey: ["/api/vyronaread/seller-books"],
  });

  const { data: sellerEBooks } = useQuery({
    queryKey: ["/api/vyronaread/ebooks"],
  });

  const { data: libraryBooks } = useQuery({
    queryKey: ["/api/vyronaread/library-books"],
  });

  const { data: sellerOrders } = useQuery({
    queryKey: ["/api/seller/orders"],
  });

  const { data: sellerAnalytics } = useQuery({
    queryKey: ["/api/seller/analytics"],
  });

  // Library integration request mutation
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

    // Include parsed CSV data in the submission
    const libraryData = {
      ...newLibrary,
      booksListCsv: csvBooksList.length > 0 ? csvBooksList : null
    };

    createLibraryRequestMutation.mutate(libraryData);
  };

  const handleInputChange = (field: string, value: any) => {
    setNewBook(prev => ({ ...prev, [field]: value }));
  };

  const handleAddBook = () => {
    if (!newBook.title || !newBook.author || !newBook.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    console.log("Adding book:", newBook);
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
      description: ""
    });
  };

  const handleSearchBooks = () => {
    const searchTerm = prompt("Search books by title, author, or ISBN:");
    if (searchTerm) {
      console.log(`Searching books for: ${searchTerm}`);
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

  const handleBulkImport = () => {
    if (!driveLink) {
      toast({
        title: "Error",
        description: "Please enter a Google Drive link",
        variant: "destructive",
      });
      return;
    }

    console.log("Importing from Google Drive:", driveLink);
    toast({
      title: "Bulk Import Started",
      description: "E-books are being imported from Google Drive. This may take a few minutes.",
    });
    setShowBulkImportDialog(false);
    setDriveLink("");
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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Book to Library</DialogTitle>
                    <DialogDescription>
                      Add a new book to your VyronaRead library inventory
                    </DialogDescription>
                  </DialogHeader>
                  
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
                      disabled={!newBook.title || !newBook.author || !newBook.category}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Book
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* VyronaRead Navigation Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
            <div className="text-xs text-gray-500 mb-2">Current section: {bookSection}</div>
            <nav className="flex space-x-8">
              <button
                onClick={() => {
                  console.log("Switching to overview");
                  setBookSection("overview");
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  bookSection === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => {
                  console.log("Switching to physical");
                  setBookSection("physical");
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  bookSection === "physical"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Physical Library
              </button>
              <button
                onClick={() => {
                  console.log("Switching to ebooks");
                  setBookSection("ebooks");
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  bookSection === "ebooks"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                E-Book Store
              </button>
              <button
                onClick={() => {
                  console.log("Switching to reader");
                  setBookSection("reader");
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  bookSection === "reader"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Digital Reader
              </button>
              <button
                onClick={() => {
                  console.log("Switching to orders");
                  setBookSection("orders");
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  bookSection === "orders"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Order Management
              </button>
              <button
                onClick={() => {
                  console.log("Switching to analytics");
                  setBookSection("analytics");
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  bookSection === "analytics"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>

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
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Bulk Import Books
                      </Button>
                    </div>
                    
                    {libraryBooks && libraryBooks.length > 0 ? (
                      <div className="grid gap-4">
                        {libraryBooks.map((book: any) => (
                          <div key={book.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold">{book.title}</h4>
                                <p className="text-sm text-gray-600">by {book.author}</p>
                                <p className="text-xs text-gray-500">ISBN: {book.isbn} | Category: {book.category}</p>
                                <p className="text-xs text-green-600">Available: {book.available}/{book.copies} copies</p>
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
                        <Library className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Library Books Yet</h3>
                        <p className="text-gray-500 mb-4">Start by adding books to your library or integrating with partner libraries</p>
                        <Button onClick={handleAddLibrary}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Library
                        </Button>
                      </div>
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
                    VyronaRead Order Management
                  </CardTitle>
                  <CardDescription>Manage book rentals, library loans, and e-book purchases</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const vyronareadOrders = sellerOrders?.filter((order: any) => order.module === 'vyronaread') || [];
                    
                    if (vyronareadOrders.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Book Orders Yet</h3>
                          <p className="text-gray-500">VyronaRead orders will appear here once customers start using your library</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {vyronareadOrders.map((order: any) => (
                          <div key={order.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div>
                                  <p className="font-medium">Order #{order.id}</p>
                                  <p className="text-sm text-gray-600">
                                    {order.customer_name || 'Customer'} • {order.customer_email}
                                  </p>
                                </div>
                                <Badge variant="outline" className="border-blue-500 text-blue-700">
                                  VyronaRead
                                </Badge>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">₹{(order.total_amount / 100).toFixed(2)}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
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
                                const lines = csvText.split('\n');
                                const headers = lines[0].split(',').map(h => h.trim());
                                const books = lines.slice(1).filter(line => line.trim()).map(line => {
                                  const values = line.split(',').map(v => v.trim());
                                  const book: any = {};
                                  headers.forEach((header, index) => {
                                    book[header] = values[index] || '';
                                  });
                                  return book;
                                });
                                setCsvBooksList(books);
                              };
                              reader.readAsText(file);
                            }
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <div className="text-xs text-gray-500 mt-2">
                          Expected columns: bookName, author, isbn, yearOfPublish, edition
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
        </div>
      </div>
    </div>
  );
}