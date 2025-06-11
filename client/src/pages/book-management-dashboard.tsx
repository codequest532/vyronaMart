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
  Home,
  ArrowLeft
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

const bookCategories = [
  { value: "fiction", label: "Fiction" },
  { value: "non-fiction", label: "Non-Fiction" },
  { value: "science", label: "Science" },
  { value: "technology", label: "Technology" },
  { value: "history", label: "History" },
  { value: "biography", label: "Biography" },
  { value: "self-help", label: "Self Help" },
  { value: "business", label: "Business" },
  { value: "finance", label: "Finance" },
  { value: "philosophy", label: "Philosophy" },
  { value: "psychology", label: "Psychology" },
  { value: "education", label: "Education" },
  { value: "health", label: "Health & Wellness" },
  { value: "cooking", label: "Cooking" },
  { value: "travel", label: "Travel" },
  { value: "art", label: "Art & Design" },
  { value: "music", label: "Music" },
  { value: "sports", label: "Sports" },
  { value: "children", label: "Children's Books" },
  { value: "romance", label: "Romance" },
  { value: "mystery", label: "Mystery & Thriller" },
  { value: "fantasy", label: "Fantasy" },
  { value: "sci-fi", label: "Science Fiction" }
];

const bookSchema = z.object({
  title: z.string().min(1, "Book title is required"),
  author: z.string().min(1, "Author name is required"),
  isbn: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  publisher: z.string().optional(),
  publicationYear: z.string().optional(),
  language: z.string().default("English"),
  copies: z.number().min(1, "Number of copies must be at least 1"),
  condition: z.string().default("good"),
  location: z.string().optional(),
  price: z.number().min(0, "Price must be positive").optional(),
  rentalPrice: z.number().min(0, "Rental price must be positive").optional(),
});

const ebookSchema = z.object({
  title: z.string().min(1, "E-book title is required"),
  author: z.string().min(1, "Author name is required"),
  isbn: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  format: z.string().default("PDF"),
  fileSize: z.number().optional(),
  salePrice: z.number().min(0, "Sale price must be positive").optional(),
  rentalPrice: z.number().min(0, "Rental price must be positive").optional(),
  language: z.string().default("English"),
  publisher: z.string().optional(),
  publicationYear: z.string().optional(),
});

const libraryIntegrationSchema = z.object({
  libraryName: z.string().min(1, "Library name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  libraryType: z.string().min(1, "Library type is required"),
  totalBooks: z.number().min(1, "Total books must be at least 1"),
  message: z.string().optional(),
});

export default function BookManagementDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [bookSection, setBookSection] = useState("overview");
  const [showAddBookDialog, setShowAddBookDialog] = useState(false);
  const [showAddEBookDialog, setShowAddEBookDialog] = useState(false);
  const [showLibraryIntegrationDialog, setShowLibraryIntegrationDialog] = useState(false);
  const [activeBookOrderTab, setActiveBookOrderTab] = useState("all");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Book form states
  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    description: "",
    publisher: "",
    publicationYear: "",
    language: "English",
    copies: 1,
    condition: "good",
    location: "",
    price: 0,
    rentalPrice: 0,
  });

  const [ebookForm, setEbookForm] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    description: "",
    format: "PDF",
    fileSize: 0,
    salePrice: 0,
    rentalPrice: 0,
    language: "English",
    publisher: "",
    publicationYear: "",
  });

  const [libraryIntegrationForm, setLibraryIntegrationForm] = useState({
    libraryName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    libraryType: "",
    totalBooks: 0,
    message: "",
  });

  const { toast } = useToast();

  // Get current user for authentication check
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/current-user"],
  });

  // Redirect non-sellers to login
  useEffect(() => {
    if (!userLoading && currentUser) {
      if (currentUser.role !== "seller") {
        setLocation("/login");
      }
    }
  }, [currentUser, userLoading, setLocation]);

  // Data fetching queries
  const { data: libraryBooks = [], isLoading: booksLoading } = useQuery({
    queryKey: ["/api/physical-books"],
    enabled: !!currentUser && currentUser.role === "seller"
  });

  const { data: ebooks = [], isLoading: ebooksLoading } = useQuery({
    queryKey: ["/api/ebooks"],
    enabled: !!currentUser && currentUser.role === "seller"
  });

  const { data: libraries = [], isLoading: libraryLoading } = useQuery({
    queryKey: ["/api/libraries"],
    enabled: !!currentUser && currentUser.role === "seller"
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
    enabled: !!currentUser && currentUser.role === "seller"
  });

  const { data: sellerOrders = [], isLoading: sellerOrdersLoading } = useQuery({
    queryKey: ["/api/seller/orders"],
    enabled: !!currentUser && currentUser.role === "seller"
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/seller/analytics"],
    enabled: !!currentUser && currentUser.role === "seller"
  });

  const { data: rentals = [], isLoading: rentalsLoading } = useQuery({
    queryKey: ["/api/seller/rentals"],
    enabled: !!currentUser && currentUser.role === "seller"
  });

  const { data: returnRequests = [], isLoading: returnRequestsLoading } = useQuery({
    queryKey: ["/api/seller/return-requests"],
    enabled: !!currentUser && currentUser.role === "seller"
  });

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await apiRequest("POST", "/api/auth/logout");
      queryClient.clear();
      setLocation("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setLocation("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Add physical book mutation
  const addBookMutation = useMutation({
    mutationFn: async (bookData: any) => {
      const response = await apiRequest("POST", "/api/physical-books", bookData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Physical book added successfully!",
      });
      setShowAddBookDialog(false);
      setBookForm({
        title: "",
        author: "",
        isbn: "",
        category: "",
        description: "",
        publisher: "",
        publicationYear: "",
        language: "English",
        copies: 1,
        condition: "good",
        location: "",
        price: 0,
        rentalPrice: 0,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/physical-books"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to add physical book. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add e-book mutation
  const addEBookMutation = useMutation({
    mutationFn: async (ebookData: any) => {
      const response = await apiRequest("POST", "/api/ebooks", ebookData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "E-book added successfully!",
      });
      setShowAddEBookDialog(false);
      setEbookForm({
        title: "",
        author: "",
        isbn: "",
        category: "",
        description: "",
        format: "PDF",
        fileSize: 0,
        salePrice: 0,
        rentalPrice: 0,
        language: "English",
        publisher: "",
        publicationYear: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ebooks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to add e-book. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Library integration request mutation
  const libraryIntegrationMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await apiRequest("POST", "/api/library-integration-requests", formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Library integration request submitted successfully!",
      });
      setShowLibraryIntegrationDialog(false);
      setLibraryIntegrationForm({
        libraryName: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        libraryType: "",
        totalBooks: 0,
        message: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to submit library request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submissions
  const handleAddBook = () => {
    addBookMutation.mutate(bookForm);
  };

  const handleAddEBook = () => {
    addEBookMutation.mutate(ebookForm);
  };

  const handleLibraryIntegrationSubmit = () => {
    libraryIntegrationMutation.mutate(libraryIntegrationForm);
  };

  // Utility functions
  const handleViewBook = (bookTitle: string) => {
    toast({
      title: "View Book",
      description: `Viewing details for ${bookTitle}`,
    });
  };

  const handleDeleteBook = (bookTitle: string) => {
    toast({
      title: "Delete Book",
      description: `Deleted ${bookTitle}`,
      variant: "destructive",
    });
  };

  const handleQuickIssue = () => {
    toast({
      title: "Quick Issue",
      description: "Opening quick book issue dialog",
    });
  };

  const handleQuickReturn = () => {
    toast({
      title: "Quick Return",
      description: "Opening quick book return dialog",
    });
  };

  const handleAddMember = () => {
    toast({
      title: "Add Member",
      description: "Opening member registration form",
    });
  };

  const handleReservations = () => {
    toast({
      title: "Reservations",
      description: "Opening book reservations management",
    });
  };

  if (userLoading || booksLoading || ebooksLoading || libraryLoading || ordersLoading || sellerOrdersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Book Management Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/seller-dashboard")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Main Dashboard
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Book className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Book Management</h1>
                  <p className="text-sm text-gray-600">Comprehensive book and library management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/seller-dashboard")}
                className="text-gray-600 hover:text-gray-900"
              >
                <Home className="h-4 w-4 mr-2" />
                Main Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white shadow-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="physical-library" className="flex items-center gap-2">
              <Library className="h-4 w-4" />
              Physical Library
            </TabsTrigger>
            <TabsTrigger value="ebook-store" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              E-Book Store
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Order Management
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="integration" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Library Integration
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Physical Books</CardTitle>
                  <Book className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{libraryBooks?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Available copies: {libraryBooks?.reduce((sum: number, book: any) => sum + (book.available || 0), 0) || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">E-Books</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ebooks?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Active listings
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Book Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sellerOrders?.filter((order: any) => order.module === 'vyronaread')?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    VyronaRead orders
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{analytics?.totalRevenue ? (analytics.totalRevenue / 100).toFixed(2) : "0.00"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Book sales & rentals
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Library Actions</CardTitle>
                  <CardDescription>Common library management tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-16 flex-col hover:bg-green-50"
                      onClick={handleQuickIssue}
                    >
                      <Book className="h-6 w-6 mb-2 text-green-600" />
                      <span className="text-xs">Issue Book</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-16 flex-col hover:bg-blue-50"
                      onClick={handleQuickReturn}
                    >
                      <BookOpen className="h-6 w-6 mb-2 text-blue-600" />
                      <span className="text-xs">Return Book</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-16 flex-col hover:bg-purple-50"
                      onClick={handleAddMember}
                    >
                      <Users className="h-6 w-6 mb-2 text-purple-600" />
                      <span className="text-xs">Add Member</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-16 flex-col hover:bg-orange-50"
                      onClick={handleReservations}
                    >
                      <Calendar className="h-6 w-6 mb-2 text-orange-600" />
                      <span className="text-xs">Reservations</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Book Orders</CardTitle>
                      <CardDescription>Latest transactions</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab("orders")}
                      className="text-green-600 hover:text-green-700 border-green-300 hover:border-green-400"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Manage All Orders
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(() => {
                      const bookOrders = sellerOrders?.filter((order: any) => order.module === 'vyronaread') || [];
                      return bookOrders.length > 0 ? (
                        bookOrders.slice(0, 3).map((order: any, index: number) => (
                          <div key={order.order_id || order.id || index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                order.order_status === 'delivered' || order.status === 'delivered' ? 'bg-green-500' : 
                                order.order_status === 'processing' || order.status === 'processing' ? 'bg-blue-500' : 
                                order.order_status === 'shipped' || order.status === 'shipped' ? 'bg-orange-500' : 'bg-gray-500'
                              }`}></div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">Order #{order.order_id || order.id}</p>
                                <p className="text-xs text-gray-600">{order.customer_name || 'Customer'} • {order.customer_email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {order.order_status || order.status || 'pending'}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {order.metadata?.transaction_type || 'Purchase'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold">₹{(order.total_amount / 100).toFixed(2)}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-600 mb-2">No Book Orders Yet</h3>
                          <p className="text-gray-500">Book orders will appear here</p>
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Physical Library Tab */}
          <TabsContent value="physical-library" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Physical Library Management</h2>
                <p className="text-gray-600">Manage your physical book inventory and lending</p>
              </div>
              <Button 
                onClick={() => setShowAddBookDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Physical Book
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Book Inventory</CardTitle>
                <CardDescription>Manage your physical book collection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {libraryBooks && libraryBooks.length > 0 ? (
                    libraryBooks.map((book: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Book className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-lg mb-1">{book.title || 'Untitled Book'}</h3>
                                <p className="text-sm text-gray-600 mb-2">by {book.author || 'Unknown Author'}</p>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">{book.category || 'General'}</Badge>
                                  {book.isbn && <Badge variant="secondary">ISBN: {book.isbn}</Badge>}
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm">Copies: {book.copies || 1}</span>
                                  <span className="text-sm">Available: {book.available || book.copies || 1}</span>
                                  <span className={`text-sm font-medium ${(book.available || book.copies) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {(book.available || book.copies) > 0 ? 'In Stock' : 'Out of Stock'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewBook(book.title)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteBook(book.title)}
                                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Physical Books</h3>
                      <p className="text-gray-600 mb-4">Start building your library by adding physical books</p>
                      <Button 
                        onClick={() => setShowAddBookDialog(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Book
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* E-Book Store Tab */}
          <TabsContent value="ebook-store" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">E-Book Store Management</h2>
                <p className="text-gray-600">Manage your digital book collection and sales</p>
              </div>
              <Button 
                onClick={() => setShowAddEBookDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add E-Book
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>E-Book Collection</CardTitle>
                <CardDescription>Manage your digital book inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ebooks && ebooks.length > 0 ? (
                    ebooks.map((ebook: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-20 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpen className="h-8 w-8 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-lg mb-1">{ebook.title || 'Untitled E-Book'}</h3>
                                <p className="text-sm text-gray-600 mb-2">by {ebook.author || 'Unknown Author'}</p>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">{ebook.category || 'General'}</Badge>
                                  <Badge variant="secondary">{ebook.format || 'PDF'}</Badge>
                                  {ebook.isbn && <Badge variant="outline">ISBN: {ebook.isbn}</Badge>}
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm">Sale Price: ₹{ebook.salePrice || 0}</span>
                                  <span className="text-sm">Rental: ₹{ebook.rentalPrice || 0}</span>
                                  <span className="text-sm">Downloads: {ebook.downloads || 0}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewBook(ebook.title)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteBook(ebook.title)}
                                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No E-Books</h3>
                      <p className="text-gray-600 mb-4">Start your digital library by adding e-books</p>
                      <Button 
                        onClick={() => setShowAddEBookDialog(true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First E-Book
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Order Management Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Book Order Management</h2>
                <p className="text-gray-600">Manage book sales, rentals, and library loans</p>
              </div>
            </div>

            <Tabs value={activeBookOrderTab} onValueChange={setActiveBookOrderTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All Orders</TabsTrigger>
                <TabsTrigger value="sales">Sales</TabsTrigger>
                <TabsTrigger value="rentals">Rentals</TabsTrigger>
                <TabsTrigger value="loans">Library Loans</TabsTrigger>
                <TabsTrigger value="returns">Returns</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>All Book Orders</CardTitle>
                    <CardDescription>Complete order history for all book transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sellerOrders?.filter((order: any) => order.module === 'vyronaread').length > 0 ? (
                        sellerOrders.filter((order: any) => order.module === 'vyronaread').map((order: any, index: number) => (
                          <div key={order.order_id || order.id || index} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`w-4 h-4 rounded-full ${
                                  order.order_status === 'delivered' || order.status === 'delivered' ? 'bg-green-500' : 
                                  order.order_status === 'processing' || order.status === 'processing' ? 'bg-blue-500' : 
                                  order.order_status === 'shipped' || order.status === 'shipped' ? 'bg-orange-500' : 'bg-gray-500'
                                }`}></div>
                                <div>
                                  <p className="font-medium">Order #{order.order_id || order.id}</p>
                                  <p className="text-sm text-gray-600">{order.customer_name || 'Customer'} • {order.customer_email}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline">
                                      {order.order_status || order.status || 'pending'}
                                    </Badge>
                                    <Badge variant="secondary">
                                      {order.metadata?.transaction_type || 'Purchase'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">₹{(order.total_amount / 100).toFixed(2)}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </p>
                                <div className="flex gap-2 mt-2">
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4 mr-1" />
                                    Update
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-600 mb-2">No Book Orders</h3>
                          <p className="text-gray-500">Book orders will appear here when customers make purchases</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sales">
                <Card>
                  <CardHeader>
                    <CardTitle>Book Sales</CardTitle>
                    <CardDescription>Direct book purchase orders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">No Sales Orders</h3>
                      <p className="text-gray-500">Book sales will appear here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rentals">
                <Card>
                  <CardHeader>
                    <CardTitle>Book Rentals</CardTitle>
                    <CardDescription>Rental agreements and due dates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">No Active Rentals</h3>
                      <p className="text-gray-500">Book rental orders will appear here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="loans">
                <Card>
                  <CardHeader>
                    <CardTitle>Library Loans</CardTitle>
                    <CardDescription>Inter-library loan transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Library className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">No Library Loans</h3>
                      <p className="text-gray-500">Library loan requests will appear here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="returns">
                <Card>
                  <CardHeader>
                    <CardTitle>Return Requests</CardTitle>
                    <CardDescription>Book return and condition tracking</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {returnRequests && returnRequests.length > 0 ? (
                        returnRequests.map((returnReq: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Return Request #{returnReq.id}</p>
                                <p className="text-sm text-gray-600">{returnReq.book_title} by {returnReq.customer_name}</p>
                                <Badge variant="outline" className="mt-1">
                                  {returnReq.status || 'Pending'}
                                </Badge>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Review
                                </Button>
                                <Button variant="outline" size="sm" className="text-green-600">
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-600 mb-2">No Return Requests</h3>
                          <p className="text-gray-500">Book return requests will appear here</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Book Analytics</h2>
                <p className="text-gray-600">Performance insights for your book business</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">₹{analytics?.totalRevenue ? (analytics.totalRevenue / 100).toFixed(2) : "0.00"}</div>
                  <p className="text-sm text-gray-600">Total book revenue</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Popular Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Fiction</span>
                      <span className="text-sm font-medium">35%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Business</span>
                      <span className="text-sm font-medium">28%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Science</span>
                      <span className="text-sm font-medium">22%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lending Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Active Loans</span>
                      <span className="text-sm font-medium">{rentals?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Overdue Books</span>
                      <span className="text-sm font-medium text-red-600">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Return Rate</span>
                      <span className="text-sm font-medium text-green-600">98%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Library Integration Tab */}
          <TabsContent value="integration" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Library Integration</h2>
                <p className="text-gray-600">Connect with local libraries and expand your network</p>
              </div>
              <Button 
                onClick={() => setShowLibraryIntegrationDialog(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Request Integration
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Connected Libraries</CardTitle>
                <CardDescription>Libraries integrated with your book management system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {libraries && libraries.length > 0 ? (
                    libraries.map((library: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Library className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{library.name || 'Library Name'}</h3>
                              <p className="text-sm text-gray-600">{library.location || 'Location'}</p>
                              <Badge variant="outline" className="mt-1">
                                {library.status || 'Active'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4 mr-1" />
                              Manage
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <Library className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Libraries Connected</h3>
                      <p className="text-gray-600 mb-4">
                        Connect with local libraries to expand your book ecosystem
                      </p>
                      <Button 
                        className="bg-purple-600 hover:bg-purple-700" 
                        onClick={() => setShowLibraryIntegrationDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Request Your First Integration
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Physical Book Dialog */}
      {showAddBookDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Physical Book</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddBookDialog(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Book Title</Label>
                <Input
                  id="title"
                  value={bookForm.title}
                  onChange={(e) => setBookForm({...bookForm, title: e.target.value})}
                  placeholder="Enter book title"
                />
              </div>
              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={bookForm.author}
                  onChange={(e) => setBookForm({...bookForm, author: e.target.value})}
                  placeholder="Enter author name"
                />
              </div>
              <div>
                <Label htmlFor="isbn">ISBN (Optional)</Label>
                <Input
                  id="isbn"
                  value={bookForm.isbn}
                  onChange={(e) => setBookForm({...bookForm, isbn: e.target.value})}
                  placeholder="Enter ISBN"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={bookForm.category} onValueChange={(value) => setBookForm({...bookForm, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="copies">Number of Copies</Label>
                <Input
                  id="copies"
                  type="number"
                  value={bookForm.copies}
                  onChange={(e) => setBookForm({...bookForm, copies: parseInt(e.target.value) || 1})}
                  placeholder="Enter number of copies"
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="price">Sale Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  value={bookForm.price}
                  onChange={(e) => setBookForm({...bookForm, price: parseFloat(e.target.value) || 0})}
                  placeholder="Enter sale price"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="rentalPrice">Rental Price (₹)</Label>
                <Input
                  id="rentalPrice"
                  type="number"
                  value={bookForm.rentalPrice}
                  onChange={(e) => setBookForm({...bookForm, rentalPrice: parseFloat(e.target.value) || 0})}
                  placeholder="Enter rental price"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={bookForm.description}
                  onChange={(e) => setBookForm({...bookForm, description: e.target.value})}
                  placeholder="Enter book description"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleAddBook}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={addBookMutation.isPending}
                >
                  {addBookMutation.isPending ? "Adding..." : "Add Book"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddBookDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add E-Book Dialog */}
      {showAddEBookDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add E-Book</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddEBookDialog(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ebook-title">E-Book Title</Label>
                <Input
                  id="ebook-title"
                  value={ebookForm.title}
                  onChange={(e) => setEbookForm({...ebookForm, title: e.target.value})}
                  placeholder="Enter e-book title"
                />
              </div>
              <div>
                <Label htmlFor="ebook-author">Author</Label>
                <Input
                  id="ebook-author"
                  value={ebookForm.author}
                  onChange={(e) => setEbookForm({...ebookForm, author: e.target.value})}
                  placeholder="Enter author name"
                />
              </div>
              <div>
                <Label htmlFor="ebook-category">Category</Label>
                <Select value={ebookForm.category} onValueChange={(value) => setEbookForm({...ebookForm, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ebook-format">Format</Label>
                <Select value={ebookForm.format} onValueChange={(value) => setEbookForm({...ebookForm, format: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="EPUB">EPUB</SelectItem>
                    <SelectItem value="MOBI">MOBI</SelectItem>
                    <SelectItem value="AZW">AZW</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ebook-sale-price">Sale Price (₹)</Label>
                <Input
                  id="ebook-sale-price"
                  type="number"
                  value={ebookForm.salePrice}
                  onChange={(e) => setEbookForm({...ebookForm, salePrice: parseFloat(e.target.value) || 0})}
                  placeholder="Enter sale price"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="ebook-rental-price">Rental Price (₹)</Label>
                <Input
                  id="ebook-rental-price"
                  type="number"
                  value={ebookForm.rentalPrice}
                  onChange={(e) => setEbookForm({...ebookForm, rentalPrice: parseFloat(e.target.value) || 0})}
                  placeholder="Enter rental price"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="ebook-description">Description (Optional)</Label>
                <Textarea
                  id="ebook-description"
                  value={ebookForm.description}
                  onChange={(e) => setEbookForm({...ebookForm, description: e.target.value})}
                  placeholder="Enter e-book description"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleAddEBook}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={addEBookMutation.isPending}
                >
                  {addEBookMutation.isPending ? "Adding..." : "Add E-Book"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddEBookDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Library Integration Dialog */}
      {showLibraryIntegrationDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Request Library Integration</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLibraryIntegrationDialog(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="library-name">Library Name</Label>
                <Input
                  id="library-name"
                  value={libraryIntegrationForm.libraryName}
                  onChange={(e) => setLibraryIntegrationForm({...libraryIntegrationForm, libraryName: e.target.value})}
                  placeholder="Enter library name"
                />
              </div>
              <div>
                <Label htmlFor="contact-person">Contact Person</Label>
                <Input
                  id="contact-person"
                  value={libraryIntegrationForm.contactPerson}
                  onChange={(e) => setLibraryIntegrationForm({...libraryIntegrationForm, contactPerson: e.target.value})}
                  placeholder="Enter contact person name"
                />
              </div>
              <div>
                <Label htmlFor="library-email">Email</Label>
                <Input
                  id="library-email"
                  type="email"
                  value={libraryIntegrationForm.email}
                  onChange={(e) => setLibraryIntegrationForm({...libraryIntegrationForm, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="library-phone">Phone</Label>
                <Input
                  id="library-phone"
                  value={libraryIntegrationForm.phone}
                  onChange={(e) => setLibraryIntegrationForm({...libraryIntegrationForm, phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="library-address">Address</Label>
                <Textarea
                  id="library-address"
                  value={libraryIntegrationForm.address}
                  onChange={(e) => setLibraryIntegrationForm({...libraryIntegrationForm, address: e.target.value})}
                  placeholder="Enter library address"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="library-type">Library Type</Label>
                <Select 
                  value={libraryIntegrationForm.libraryType} 
                  onValueChange={(value) => setLibraryIntegrationForm({...libraryIntegrationForm, libraryType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select library type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public Library</SelectItem>
                    <SelectItem value="academic">Academic Library</SelectItem>
                    <SelectItem value="school">School Library</SelectItem>
                    <SelectItem value="special">Special Library</SelectItem>
                    <SelectItem value="private">Private Library</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="total-books">Total Books</Label>
                <Input
                  id="total-books"
                  type="number"
                  value={libraryIntegrationForm.totalBooks}
                  onChange={(e) => setLibraryIntegrationForm({...libraryIntegrationForm, totalBooks: parseInt(e.target.value) || 0})}
                  placeholder="Approximate number of books"
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="library-message">Message (Optional)</Label>
                <Textarea
                  id="library-message"
                  value={libraryIntegrationForm.message}
                  onChange={(e) => setLibraryIntegrationForm({...libraryIntegrationForm, message: e.target.value})}
                  placeholder="Additional information or requirements"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleLibraryIntegrationSubmit}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  disabled={libraryIntegrationMutation.isPending}
                >
                  {libraryIntegrationMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowLibraryIntegrationDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}