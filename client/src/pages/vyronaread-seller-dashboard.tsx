import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useUserData } from "@/hooks/use-user-data";
import { useLocation } from "wouter";
import { 
  BookOpen, 
  Plus, 
  Package, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Clock, 
  Calendar,
  Upload,
  FileText,
  Library,
  ShoppingCart,
  Eye,
  Edit,
  Trash2,
  Download,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Search,
  Filter,
  MoreHorizontal,
  ArrowUpDown,
  Image,
  Zap,
  BookMarked,
  GraduationCap,
  Archive,
  Settings,
  BarChart3,
  PieChart,
  Calendar as CalendarIcon,
  MapPin,
  Phone,
  Mail,
  Globe,
  CreditCard,
  Truck,
  Home,
  Building2,
  X
} from "lucide-react";

export default function VyronaReadSellerDashboard() {
  const { user, isLoading } = useUserData();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddBookDialog, setShowAddBookDialog] = useState(false);
  const [showAddEbookDialog, setShowAddEbookDialog] = useState(false);
  const [showAddLibraryDialog, setShowAddLibraryDialog] = useState(false);
  const [showLibraryIntegrationDialog, setShowLibraryIntegrationDialog] = useState(false);
  const [activeBookOrderTab, setActiveBookOrderTab] = useState('all');
  const [activeBookSection, setActiveBookSection] = useState("overview");
  const [activeManagementTab, setActiveManagementTab] = useState("physical");
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    condition: "excellent",
    price: 0,
    rentalPrice: 0,
    description: "",
    publisher: "",
    publicationYear: "",
    language: "English"
  });
  const [newEbook, setNewEbook] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    price: 0,
    description: "",
    fileUrl: "",
    previewUrl: ""
  });
  const [newLibrary, setNewLibrary] = useState({
    name: "",
    type: "",
    address: "",
    contact: "",
    phone: "",
    email: "",
    description: ""
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

  // Redirect non-sellers
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "seller")) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  // Queries for VyronaRead data
  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ["/api/vyronaread/seller-books"],
    enabled: !!user && user.role === "seller"
  });

  const { data: ebooks = [], isLoading: ebooksLoading } = useQuery({
    queryKey: ["/api/vyronaread/ebooks"],
    enabled: !!user && user.role === "seller"
  });

  const { data: libraryBooks = [], isLoading: libraryLoading } = useQuery({
    queryKey: ["/api/vyronaread/library-books"],
    enabled: !!user && user.role === "seller"
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/seller/orders"],
    enabled: !!user && user.role === "seller"
  });

  const { data: sellerOrders = [], isLoading: sellerOrdersLoading } = useQuery({
    queryKey: ["/api/seller/orders"],
    enabled: !!user && user.role === "seller"
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/seller/analytics"],
    enabled: !!user && user.role === "seller"
  });

  const { data: rentals = [], isLoading: rentalsLoading } = useQuery({
    queryKey: ["/api/seller/rentals"],
    enabled: !!user && user.role === "seller"
  });

  const { data: returnRequests = [], isLoading: returnsLoading } = useQuery({
    queryKey: ["/api/seller/return-requests"],
    enabled: !!user && user.role === "seller"
  });

  // Mutations for book management
  const addBookMutation = useMutation({
    mutationFn: async (bookData: any) => {
      const response = await apiRequest("POST", "/api/vyronaread/books", bookData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Physical book added successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vyronaread/seller-books"] });
      setShowAddBookDialog(false);
      setNewBook({
        title: "",
        author: "",
        isbn: "",
        category: "",
        condition: "excellent",
        price: 0,
        rentalPrice: 0,
        description: "",
        publisher: "",
        publicationYear: "",
        language: "English"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to add book. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addEbookMutation = useMutation({
    mutationFn: async (ebookData: any) => {
      const response = await apiRequest("POST", "/api/vyronaread/ebooks", ebookData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "E-book added successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vyronaread/ebooks"] });
      setShowAddEbookDialog(false);
      setNewEbook({
        title: "",
        author: "",
        isbn: "",
        category: "",
        price: 0,
        description: "",
        fileUrl: "",
        previewUrl: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to add e-book. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addLibraryMutation = useMutation({
    mutationFn: async (libraryData: any) => {
      const response = await apiRequest("POST", "/api/vyronaread/libraries", libraryData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Library integration request submitted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vyronaread/library-books"] });
      setShowAddLibraryDialog(false);
      setNewLibrary({
        name: "",
        type: "",
        address: "",
        contact: "",
        phone: "",
        email: "",
        description: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to submit library integration request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const submitLibraryIntegrationMutation = useMutation({
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading VyronaRead Dashboard...</p>
        </div>

        {/* Add Book Dialog */}
        {showAddBookDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add Physical Book</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAddBookDialog(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={newBook.title}
                    onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Enter book title"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
                    Author *
                  </label>
                  <input
                    id="author"
                    type="text"
                    value={newBook.author}
                    onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Enter author name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="isbn" className="block text-sm font-medium text-gray-700 mb-1">
                      ISBN
                    </label>
                    <input
                      id="isbn"
                      type="text"
                      value={newBook.isbn}
                      onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="ISBN number"
                    />
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      id="category"
                      value={newBook.category}
                      onChange={(e) => setNewBook({...newBook, category: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      required
                    >
                      <option value="">Select category</option>
                      <option value="fiction">Fiction</option>
                      <option value="non-fiction">Non-Fiction</option>
                      <option value="textbook">Textbook</option>
                      <option value="reference">Reference</option>
                      <option value="children">Children's Books</option>
                      <option value="academic">Academic</option>
                      <option value="biography">Biography</option>
                      <option value="history">History</option>
                      <option value="science">Science</option>
                      <option value="technology">Technology</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                      Condition *
                    </label>
                    <select
                      id="condition"
                      value={newBook.condition}
                      onChange={(e) => setNewBook({...newBook, condition: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      required
                    >
                      <option value="excellent">Excellent</option>
                      <option value="very-good">Very Good</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <select
                      id="language"
                      value={newBook.language}
                      onChange={(e) => setNewBook({...newBook, language: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Bengali">Bengali</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Telugu">Telugu</option>
                      <option value="Marathi">Marathi</option>
                      <option value="Gujarati">Gujarati</option>
                      <option value="Urdu">Urdu</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                      Selling Price (₹) *
                    </label>
                    <input
                      id="price"
                      type="number"
                      value={newBook.price}
                      onChange={(e) => setNewBook({...newBook, price: parseFloat(e.target.value) || 0})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="rentalPrice" className="block text-sm font-medium text-gray-700 mb-1">
                      Rental Price (₹/day)
                    </label>
                    <input
                      id="rentalPrice"
                      type="number"
                      value={newBook.rentalPrice}
                      onChange={(e) => setNewBook({...newBook, rentalPrice: parseFloat(e.target.value) || 0})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="publisher" className="block text-sm font-medium text-gray-700 mb-1">
                      Publisher
                    </label>
                    <input
                      id="publisher"
                      type="text"
                      value={newBook.publisher}
                      onChange={(e) => setNewBook({...newBook, publisher: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="Publisher name"
                    />
                  </div>

                  <div>
                    <label htmlFor="publicationYear" className="block text-sm font-medium text-gray-700 mb-1">
                      Publication Year
                    </label>
                    <input
                      id="publicationYear"
                      type="text"
                      value={newBook.publicationYear}
                      onChange={(e) => setNewBook({...newBook, publicationYear: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="2024"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={newBook.description}
                    onChange={(e) => setNewBook({...newBook, description: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    rows={3}
                    placeholder="Brief description of the book"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setShowAddBookDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (newBook.title && newBook.author && newBook.category && newBook.price > 0) {
                        addBookMutation.mutate(newBook);
                      } else {
                        toast({
                          title: "Error",
                          description: "Please fill in all required fields",
                          variant: "destructive",
                        });
                      }
                    }}
                    disabled={addBookMutation.isPending}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                  >
                    {addBookMutation.isPending ? "Adding..." : "Add Book"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add E-book Dialog */}
        {showAddEbookDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add E-Book</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAddEbookDialog(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="ebook-title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    id="ebook-title"
                    type="text"
                    value={newEbook.title}
                    onChange={(e) => setNewEbook({...newEbook, title: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Enter e-book title"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="ebook-author" className="block text-sm font-medium text-gray-700 mb-1">
                    Author *
                  </label>
                  <input
                    id="ebook-author"
                    type="text"
                    value={newEbook.author}
                    onChange={(e) => setNewEbook({...newEbook, author: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Enter author name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ebook-isbn" className="block text-sm font-medium text-gray-700 mb-1">
                      ISBN
                    </label>
                    <input
                      id="ebook-isbn"
                      type="text"
                      value={newEbook.isbn}
                      onChange={(e) => setNewEbook({...newEbook, isbn: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="ISBN number"
                    />
                  </div>

                  <div>
                    <label htmlFor="ebook-category" className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      id="ebook-category"
                      value={newEbook.category}
                      onChange={(e) => setNewEbook({...newEbook, category: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      required
                    >
                      <option value="">Select category</option>
                      <option value="fiction">Fiction</option>
                      <option value="non-fiction">Non-Fiction</option>
                      <option value="textbook">Textbook</option>
                      <option value="reference">Reference</option>
                      <option value="children">Children's Books</option>
                      <option value="academic">Academic</option>
                      <option value="biography">Biography</option>
                      <option value="history">History</option>
                      <option value="science">Science</option>
                      <option value="technology">Technology</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="ebook-price" className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    id="ebook-price"
                    type="number"
                    value={newEbook.price}
                    onChange={(e) => setNewEbook({...newEbook, price: parseFloat(e.target.value) || 0})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="ebook-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="ebook-description"
                    value={newEbook.description}
                    onChange={(e) => setNewEbook({...newEbook, description: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    rows={3}
                    placeholder="Brief description of the e-book"
                  />
                </div>

                <div>
                  <label htmlFor="ebook-fileUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    File URL
                  </label>
                  <input
                    id="ebook-fileUrl"
                    type="url"
                    value={newEbook.fileUrl}
                    onChange={(e) => setNewEbook({...newEbook, fileUrl: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="https://example.com/ebook.pdf"
                  />
                </div>

                <div>
                  <label htmlFor="ebook-previewUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Preview URL
                  </label>
                  <input
                    id="ebook-previewUrl"
                    type="url"
                    value={newEbook.previewUrl}
                    onChange={(e) => setNewEbook({...newEbook, previewUrl: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="https://example.com/preview.pdf"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setShowAddEbookDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (newEbook.title && newEbook.author && newEbook.category && newEbook.price > 0) {
                        addEbookMutation.mutate(newEbook);
                      } else {
                        toast({
                          title: "Error",
                          description: "Please fill in all required fields",
                          variant: "destructive",
                        });
                      }
                    }}
                    disabled={addEbookMutation.isPending}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                  >
                    {addEbookMutation.isPending ? "Adding..." : "Add E-book"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Library Dialog */}
        {showAddLibraryDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Request Library Integration</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAddLibraryDialog(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="library-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Library Name *
                  </label>
                  <input
                    id="library-name"
                    type="text"
                    value={newLibrary.name}
                    onChange={(e) => setNewLibrary({...newLibrary, name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Enter library name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="library-type" className="block text-sm font-medium text-gray-700 mb-1">
                    Library Type *
                  </label>
                  <select
                    id="library-type"
                    value={newLibrary.type}
                    onChange={(e) => setNewLibrary({...newLibrary, type: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="public">Public Library</option>
                    <option value="academic">Academic Library</option>
                    <option value="school">School Library</option>
                    <option value="special">Special Library</option>
                    <option value="private">Private Library</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="library-address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <textarea
                    id="library-address"
                    value={newLibrary.address}
                    onChange={(e) => setNewLibrary({...newLibrary, address: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    rows={2}
                    placeholder="Enter complete address"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="library-contact" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person *
                  </label>
                  <input
                    id="library-contact"
                    type="text"
                    value={newLibrary.contact}
                    onChange={(e) => setNewLibrary({...newLibrary, contact: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Contact person name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="library-phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      id="library-phone"
                      type="tel"
                      value={newLibrary.phone}
                      onChange={(e) => setNewLibrary({...newLibrary, phone: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <label htmlFor="library-email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      id="library-email"
                      type="email"
                      value={newLibrary.email}
                      onChange={(e) => setNewLibrary({...newLibrary, email: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="Email address"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="library-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="library-description"
                    value={newLibrary.description}
                    onChange={(e) => setNewLibrary({...newLibrary, description: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    rows={3}
                    placeholder="Brief description and integration requirements"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setShowAddLibraryDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (newLibrary.name && newLibrary.type && newLibrary.address && newLibrary.contact) {
                        addLibraryMutation.mutate(newLibrary);
                      } else {
                        toast({
                          title: "Error",
                          description: "Please fill in all required fields",
                          variant: "destructive",
                        });
                      }
                    }}
                    disabled={addLibraryMutation.isPending}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                  >
                    {addLibraryMutation.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!user || user.role !== "seller") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-amber-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">VyronaRead</h1>
                  <p className="text-xs text-gray-500">Book Seller Dashboard</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                {user.username}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/home")}
                className="text-gray-600 hover:text-gray-900"
              >
                <Home className="h-4 w-4 mr-2" />
                Customer View
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-7 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="books" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Books</span>
            </TabsTrigger>
            <TabsTrigger value="ebooks" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>E-Books</span>
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center space-x-2">
              <Library className="h-4 w-4" />
              <span>Library</span>
            </TabsTrigger>
            <TabsTrigger value="rentals" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Rentals</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4" />
              <span>Orders</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <PieChart className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Books</CardTitle>
                  <BookOpen className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{books.length}</div>
                  <p className="text-xs text-muted-foreground">
                    +{ebooks.length} digital books
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Rentals</CardTitle>
                  <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{rentals.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Books currently rented
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{analytics?.totalRevenue || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +20.1% from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orders.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Books & rentals combined
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-amber-600" />
                  <span>Quick Actions</span>
                </CardTitle>
                <CardDescription>Manage your VyronaRead store efficiently</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button 
                    className="h-20 flex flex-col items-center justify-center bg-amber-600 hover:bg-amber-700"
                    onClick={() => setShowAddBookDialog(true)}
                  >
                    <Plus className="h-6 w-6 mb-2" />
                    Add New Book
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => setShowAddEbookDialog(true)}
                  >
                    <Upload className="h-6 w-6 mb-2" />
                    Upload E-Book
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => setShowLibraryIntegrationDialog(true)}
                  >
                    <Library className="h-6 w-6 mb-2" />
                    Library Integration
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <BarChart3 className="h-6 w-6 mb-2" />
                    View Reports
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest book sales and rentals</CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No orders yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.slice(0, 5).map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">Order #{order.id}</p>
                            <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <Badge>{order.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Return Requests</CardTitle>
                  <CardDescription>Books pending return</CardDescription>
                </CardHeader>
                <CardContent>
                  {returnRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <RotateCcw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No return requests</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {returnRequests.slice(0, 5).map((request: any) => (
                        <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{request.bookTitle}</p>
                            <p className="text-sm text-gray-500">Due: {new Date(request.dueDate).toLocaleDateString()}</p>
                          </div>
                          <Badge variant="destructive">Overdue</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Books Tab - Complete Book Management Section */}
          <TabsContent value="books" className="space-y-6">
            {/* VyronaRead Navigation Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
              <div className="text-xs text-gray-500 mb-2">Current section: {activeBookSection}</div>
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveBookSection("overview")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeBookSection === "overview"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveBookSection("management")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeBookSection === "management"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Book Management
                </button>
                <button
                  onClick={() => setActiveBookSection("physical")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeBookSection === "physical"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Physical Library
                </button>
                <button
                  onClick={() => setActiveBookSection("ebooks")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeBookSection === "ebooks"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  E-Book Store
                </button>
                <button
                  onClick={() => setActiveBookSection("orders")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeBookSection === "orders"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Order Management
                </button>
                <button
                  onClick={() => setActiveBookSection("analytics")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeBookSection === "analytics"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Analytics
                </button>
              </nav>
            </div>

            {/* Overview Section */}
            {activeBookSection === "overview" && (
              <div className="space-y-6">
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
                          <p className="text-sm font-medium text-gray-600">Available for Loan</p>
                          <p className="text-3xl font-bold text-green-600">
                            {libraryBooks?.filter((book: any) => book.status === 'available').length || 0}
                          </p>
                          <p className="text-xs text-green-500">Ready to lend</p>
                        </div>
                        <BookOpen className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Active Orders</p>
                          <p className="text-3xl font-bold text-red-600">
                            {sellerOrders?.filter((order: any) => order.module === 'vyronaread' && order.status === 'pending').length || 0}
                          </p>
                          <p className="text-xs text-red-500">Processing orders</p>
                        </div>
                        <ShoppingCart className="h-8 w-8 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Service Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Physical Library Services</CardTitle>
                      <CardDescription>Traditional library management</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Books Available</span>
                          <span className="font-bold text-orange-600">
                            {sellerBooks?.filter((book: any) => book.category === 'books' && book.module === 'vyronaread').length || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Book Orders</span>
                          <span className="font-bold text-green-600">
                            {sellerOrders?.filter((order: any) => order.module === 'vyronaread').length || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Active Loans</span>
                          <span className="font-bold text-blue-600">
                            {libraryBooks?.filter((book: any) => book.status === 'loaned').length || 0}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Digital Services</CardTitle>
                      <CardDescription>E-book store and digital reader</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">E-Books Available</span>
                          <span className="font-bold text-purple-600">
                            {sellerEBooks?.length || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Digital Sales</span>
                          <span className="font-bold text-green-600">
                            {sellerOrders?.filter((order: any) => order.metadata && JSON.stringify(order.metadata).includes('ebook')).length || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Reader Downloads</span>
                          <span className="font-bold text-blue-600">
                            {sellerEBooks?.reduce((total: number, book: any) => total + (book.downloads || 0), 0) || 0}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Book Management Section */}
            {activeBookSection === "management" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">Book Management</h3>
                    <p className="text-gray-600">Comprehensive book catalog management</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowAddBookDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Physical Book
                    </Button>
                    <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowAddEbookDialog(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload E-Book
                    </Button>
                  </div>
                </div>

                {/* Management Tabs */}
                <Tabs value={activeManagementTab} onValueChange={setActiveManagementTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="physical">Physical Books</TabsTrigger>
                    <TabsTrigger value="ebooks">E-Books</TabsTrigger>
                    <TabsTrigger value="library">Library Books</TabsTrigger>
                  </TabsList>

                  <TabsContent value="physical" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Physical Books Catalog</CardTitle>
                        <CardDescription>Manage your physical book inventory</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {sellerBooks && sellerBooks.filter((book: any) => book.category === 'books' && book.module === 'vyronaread').length > 0 ? (
                            sellerBooks
                              .filter((book: any) => book.category === 'books' && book.module === 'vyronaread')
                              .map((book: any, index: number) => (
                                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                                  <div className="w-12 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="h-6 w-6 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold">{book.title || book.name}</h4>
                                    <p className="text-sm text-gray-600">by {book.author || 'Unknown Author'}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                      <Badge variant="secondary">{book.category || 'General'}</Badge>
                                      <span className="text-sm font-medium text-green-600">₹{book.price || 0} Sale</span>
                                      <span className="text-sm font-medium text-blue-600">₹{book.rentalPrice || 0}/month Rent</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-gray-600">Status: {book.status || 'Available'}</p>
                                    <p className="text-sm text-gray-600">Stock: {book.stock || book.quantity || 1}</p>
                                    <div className="flex gap-2 mt-2">
                                      <Button variant="outline" size="sm">
                                        <Edit className="h-4 w-4 mr-1" />
                                        Edit
                                      </Button>
                                      <Button variant="outline" size="sm">
                                        <Eye className="h-4 w-4 mr-1" />
                                        View
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No Physical Books</h3>
                              <p className="text-gray-600 mb-4">
                                Add your first physical book to start building your catalog
                              </p>
                              <Button onClick={() => setShowAddBookDialog(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Book
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="ebooks" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>E-Book Catalog</CardTitle>
                        <CardDescription>Your digital book inventory</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {sellerEBooks && sellerEBooks.length > 0 ? (
                            sellerEBooks.map((ebook: any, index: number) => (
                              <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                                <div className="w-12 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center flex-shrink-0">
                                  <BookOpen className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold">{ebook.title || 'Untitled E-Book'}</h4>
                                  <p className="text-sm text-gray-600">by {ebook.author || 'Unknown Author'}</p>
                                  <div className="flex items-center gap-4 mt-2">
                                    <Badge variant="secondary">{ebook.category || 'General'}</Badge>
                                    <span className="text-sm font-medium text-green-600">₹{ebook.salePrice || 0} Sale</span>
                                    {ebook.rentalPrice && (
                                      <span className="text-sm font-medium text-blue-600">₹{ebook.rentalPrice}/month Rent</span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">Status: {ebook.status || 'Active'}</p>
                                  <p className="text-sm text-gray-600">Format: {ebook.format || 'PDF'}</p>
                                  <div className="flex gap-2 mt-2">
                                    <Button variant="outline" size="sm">
                                      <Edit className="h-4 w-4 mr-1" />
                                      Edit
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      <Download className="h-4 w-4 mr-1" />
                                      Download
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No E-Books Listed</h3>
                              <p className="text-gray-600 mb-4">
                                Start building your digital catalog by uploading your first e-book
                              </p>
                              <Button onClick={() => setShowAddEbookDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Upload First E-Book
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="library" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Library Books Collection</CardTitle>
                        <CardDescription>Books available for library loans</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {libraryBooks && libraryBooks.length > 0 ? (
                            libraryBooks.map((book: any, index: number) => (
                              <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                                <div className="w-12 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded flex items-center justify-center flex-shrink-0">
                                  <Library className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold">{book.title}</h4>
                                  <p className="text-sm text-gray-600">by {book.author}</p>
                                  <div className="flex items-center gap-4 mt-2">
                                    <Badge variant="secondary">{book.category}</Badge>
                                    <Badge variant={book.status === 'available' ? 'default' : 'destructive'}>
                                      {book.status === 'available' ? 'Available' : 'On Loan'}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">Copies: {book.copies}</p>
                                  <p className="text-sm text-gray-600">Available: {book.available}</p>
                                  <div className="flex gap-2 mt-2">
                                    <Button variant="outline" size="sm">
                                      <Edit className="h-4 w-4 mr-1" />
                                      Edit
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      <Eye className="h-4 w-4 mr-1" />
                                      View
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                              <Library className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No Library Books</h3>
                              <p className="text-gray-600 mb-4">
                                Add books to your library collection for lending services
                              </p>
                              <Button onClick={() => setShowAddLibraryDialog(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Library Book
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Physical Library Section */}
            {activeBookSection === "physical" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Books</p>
                          <p className="text-3xl font-bold text-blue-600">
                            {libraryBooks?.length || 0}
                          </p>
                          <p className="text-xs text-blue-500">Physical inventory</p>
                        </div>
                        <Library className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Available</p>
                          <p className="text-3xl font-bold text-green-600">
                            {libraryBooks?.filter((book: any) => book.status === 'available').length || 0}
                          </p>
                          <p className="text-xs text-green-500">Ready to lend</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">On Loan</p>
                          <p className="text-3xl font-bold text-orange-600">
                            {libraryBooks?.filter((book: any) => book.status === 'loaned').length || 0}
                          </p>
                          <p className="text-xs text-orange-500">Currently borrowed</p>
                        </div>
                        <Clock className="h-8 w-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Copies</p>
                          <p className="text-3xl font-bold text-purple-600">
                            {libraryBooks?.reduce((total: number, book: any) => total + (book.copies || 0), 0) || 0}
                          </p>
                          <p className="text-xs text-purple-500">All copies</p>
                        </div>
                        <Archive className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Library Book Collection</CardTitle>
                    <CardDescription>Comprehensive library management</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {libraryBooks && libraryBooks.length > 0 ? (
                        libraryBooks.map((book: any, index: number) => (
                          <div key={index} className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
                            <div className="w-12 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded flex items-center justify-center flex-shrink-0">
                              <Library className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{book.title}</h4>
                              <p className="text-sm text-gray-600">by {book.author}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <Badge variant="secondary">{book.category}</Badge>
                                <Badge variant={book.status === 'available' ? 'default' : 'destructive'}>
                                  {book.status === 'available' ? 'Available' : 'On Loan'}
                                </Badge>
                                <span className="text-sm text-gray-500">ISBN: {book.isbn}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">Copies: {book.copies}</p>
                              <p className="text-sm text-green-600">Available: {book.available}</p>
                              <p className="text-sm text-orange-600">On Loan: {(book.copies || 0) - (book.available || 0)}</p>
                              <div className="flex gap-2 mt-2">
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                          <Library className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Library Books</h3>
                          <p className="text-gray-600 mb-4">
                            Start building your library collection for lending services
                          </p>
                          <Button onClick={() => setShowAddLibraryDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Library Book
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* E-Book Store Section */}
            {activeBookSection === "ebooks" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">E-Book Store Management</h3>
                    <p className="text-gray-600">Upload, sell, and rent digital books with VyronaRead</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Search className="h-4 w-4 mr-2" />
                      Search E-books
                    </Button>
                    <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowAddEbookDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Upload E-book
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Listed E-books</p>
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
                          <p className="text-sm font-medium text-gray-600">Digital Orders</p>
                          <p className="text-3xl font-bold text-green-600">
                            {sellerOrders?.filter((order: any) => order.metadata && JSON.stringify(order.metadata).includes('ebook')).length || 0}
                          </p>
                          <p className="text-xs text-green-500">Total sales</p>
                        </div>
                        <ShoppingCart className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Downloads</p>
                          <p className="text-3xl font-bold text-blue-600">
                            {sellerEBooks?.reduce((total: number, book: any) => total + (book.downloads || 0), 0) || 0}
                          </p>
                          <p className="text-xs text-blue-500">Total downloads</p>
                        </div>
                        <Download className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Revenue</p>
                          <p className="text-3xl font-bold text-orange-600">
                            ₹{sellerOrders?.filter((order: any) => order.metadata && JSON.stringify(order.metadata).includes('ebook'))
                              .reduce((total: number, order: any) => total + (order.totalAmount / 100), 0).toLocaleString() || 0}
                          </p>
                          <p className="text-xs text-orange-500">Digital sales</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>E-Book Catalog</CardTitle>
                      <CardDescription>Your digital book inventory</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {sellerEBooks && sellerEBooks.length > 0 ? (
                          sellerEBooks.map((ebook: any, index: number) => (
                            <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                              <div className="w-12 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center flex-shrink-0">
                                <BookOpen className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold">{ebook.title || 'Untitled E-Book'}</h4>
                                <p className="text-sm text-gray-600">by {ebook.author || 'Unknown Author'}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <Badge variant="secondary">{ebook.category || 'General'}</Badge>
                                  <span className="text-sm font-medium text-green-600">₹{ebook.salePrice || 0} Sale</span>
                                  {ebook.rentalPrice && (
                                    <span className="text-sm font-medium text-blue-600">₹{ebook.rentalPrice}/month Rent</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600">Status: {ebook.status || 'Active'}</p>
                                <p className="text-sm text-gray-600">Format: {ebook.format || 'PDF'}</p>
                                <Button variant="outline" size="sm" className="mt-2">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-600 mb-2">No E-Books Listed</h3>
                            <p className="text-gray-500 mb-4">Start building your digital catalog by uploading your first e-book</p>
                            <Button onClick={() => setShowAddEbookDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                              <Plus className="h-4 w-4 mr-2" />
                              Upload First E-Book
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => setShowAddEbookDialog(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload New E-Book
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Search className="h-4 w-4 mr-2" />
                        Browse Catalog
                      </Button>
                      <Button variant="outline" className="w-full">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Analytics
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Store Settings
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Order Management Section */}
            {activeBookSection === "orders" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      VyronaRead Order Management
                    </CardTitle>
                    <CardDescription>Manage book rentals, library loans, and e-book purchases</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const vyronareadOrders = sellerOrders?.filter((order: any) => order.module === 'vyronaread') || [];
                      const rentalOrders = vyronareadOrders.filter((order: any) => 
                        order.metadata?.transaction_type === 'rental' || 
                        (order.metadata && typeof order.metadata === 'string' && order.metadata.includes('rental'))
                      );
                      const loanOrders = vyronareadOrders.filter((order: any) => 
                        order.metadata?.transaction_type === 'loan' ||
                        (order.metadata && typeof order.metadata === 'string' && order.metadata.includes('loan'))
                      );
                      const purchaseOrders = vyronareadOrders.filter((order: any) => 
                        order.metadata?.transaction_type === 'purchase' ||
                        (order.metadata && typeof order.metadata === 'string' && order.metadata.includes('purchase')) ||
                        (!order.metadata?.transaction_type && order.metadata && !order.metadata.includes('rental') && !order.metadata.includes('loan'))
                      );

                      return (
                        <div className="space-y-6">
                          <div className="border-b">
                            <nav className="flex space-x-8">
                              <button
                                onClick={() => setActiveBookOrderTab('all')}
                                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                                  activeBookOrderTab === 'all'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                              >
                                All Orders ({vyronareadOrders.length})
                              </button>
                              <button
                                onClick={() => setActiveBookOrderTab('rentals')}
                                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                                  activeBookOrderTab === 'rentals'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                              >
                                Rentals ({rentalOrders.length})
                              </button>
                              <button
                                onClick={() => setActiveBookOrderTab('loans')}
                                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                                  activeBookOrderTab === 'loans'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                              >
                                Library Loans ({loanOrders.length})
                              </button>
                              <button
                                onClick={() => setActiveBookOrderTab('purchases')}
                                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                                  activeBookOrderTab === 'purchases'
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                              >
                                Purchases ({purchaseOrders.length})
                              </button>
                            </nav>
                          </div>

                          <div className="space-y-4">
                            {(() => {
                              let ordersToShow = vyronareadOrders;
                              if (activeBookOrderTab === 'rentals') ordersToShow = rentalOrders;
                              else if (activeBookOrderTab === 'loans') ordersToShow = loanOrders;
                              else if (activeBookOrderTab === 'purchases') ordersToShow = purchaseOrders;

                              return ordersToShow.length > 0 ? ordersToShow.map((order: any, index: number) => (
                                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-4">
                                        <h4 className="font-semibold">Order #{order.order_id || order.id}</h4>
                                        <Badge variant={order.status === 'delivered' ? 'default' : order.status === 'pending' ? 'secondary' : 'outline'}>
                                          {order.order_status || order.status || 'pending'}
                                        </Badge>
                                        <span className="text-sm text-gray-500">
                                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Date unavailable'}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-600">
                                        Customer: {order.customer_name || order.metadata?.customerName || 'N/A'}
                                      </p>
                                      <p className="text-sm font-medium text-green-600">
                                        Total: ₹{(order.total_amount / 100).toFixed(2)}
                                      </p>
                                      {order.metadata && (
                                        <div>
                                          <h4 className="font-medium text-sm mb-2">Order Details</h4>
                                          <div className="text-sm space-y-1">
                                            {typeof order.metadata === 'string' ? (
                                              <p>{order.metadata}</p>
                                            ) : (
                                              Object.entries(order.metadata).map(([key, value]) => (
                                                <div key={key} className="flex justify-between">
                                                  <span className="capitalize">{key.replace('_', ' ')}:</span>
                                                  <span>{String(value)}</span>
                                                </div>
                                              ))
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex gap-2 items-center">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => {
                                          console.log('View order details:', order);
                                        }}
                                      >
                                        View Details
                                      </Button>
                                      
                                      {activeBookOrderTab === 'rentals' && (
                                        <Button size="sm" variant="secondary">
                                          Extend Rental
                                        </Button>
                                      )}
                                      {activeBookOrderTab === 'loans' && (
                                        <Button size="sm" variant="secondary">
                                          Mark Returned
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )) : (
                                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
                                  <p className="text-gray-600">
                                    {activeBookOrderTab === 'all' ? 'No VyronaRead orders yet' :
                                     activeBookOrderTab === 'rentals' ? 'No rental orders found' :
                                     activeBookOrderTab === 'loans' ? 'No library loan orders found' :
                                     'No purchase orders found'}
                                  </p>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Analytics Section */}
            {activeBookSection === "analytics" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">VyronaRead Analytics</h3>
                    <p className="text-gray-600">Comprehensive insights across all book services</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      Date Range
                    </Button>
                    <Button variant="outline">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Export Report
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                          <p className="text-3xl font-bold text-green-600">
                            ₹{sellerOrders?.filter((order: any) => order.module === 'vyronaread')
                              .reduce((total: number, order: any) => total + (order.totalAmount / 100), 0).toLocaleString() || 0}
                          </p>
                          <p className="text-xs text-green-500">VyronaRead orders</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Books Available</p>
                          <p className="text-3xl font-bold text-purple-600">
                            {(sellerBooks?.filter((book: any) => book.category === 'books' && book.module === 'vyronaread').length || 0) + 
                             (sellerEBooks?.length || 0)}
                          </p>
                          <p className="text-xs text-purple-500">Physical + Digital</p>
                        </div>
                        <ShoppingCart className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Active Orders</p>
                          <p className="text-3xl font-bold text-blue-600">
                            {sellerOrders?.filter((order: any) => order.module === 'vyronaread' && 
                              (order.status === 'pending' || order.status === 'processing')).length || 0}
                          </p>
                          <p className="text-xs text-blue-500">Processing orders</p>
                        </div>
                        <Clock className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">E-Books Listed</p>
                          <p className="text-3xl font-bold text-orange-600">
                            {sellerEBooks?.length || 0}
                          </p>
                          <p className="text-xs text-orange-500">Digital catalog</p>
                        </div>
                        <BookOpen className="h-8 w-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trends</CardTitle>
                    <CardDescription>Monthly revenue breakdown by service type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Revenue chart visualization would be displayed here</p>
                        <p className="text-sm text-gray-400">Physical Library • E-book Sales • Rentals • Subscriptions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Physical Books</CardTitle>
                      <CardDescription>Most ordered physical books</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {sellerBooks && sellerBooks.filter((book: any) => book.category === 'books' && book.module === 'vyronaread').length > 0 ? (
                          sellerBooks
                            .filter((book: any) => book.category === 'books' && book.module === 'vyronaread')
                            .slice(0, 3)
                            .map((book: any, index: number) => (
                              <div key={book.id} className="flex items-center justify-between">
                                <span className="text-sm">{book.title || book.name}</span>
                                <span className="font-bold text-blue-600">
                                  {sellerOrders?.filter((order: any) => 
                                    order.items?.some((item: any) => item.productId === book.id)
                                  ).length || 0} orders
                                </span>
                              </div>
                            ))
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No physical books available</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top Digital Books</CardTitle>
                      <CardDescription>Best-selling e-books</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {sellerEBooks && sellerEBooks.length > 0 ? (
                          sellerEBooks
                            .slice(0, 3)
                            .map((ebook: any, index: number) => (
                              <div key={ebook.id} className="flex items-center justify-between">
                                <span className="text-sm">{ebook.title || ebook.name}</span>
                                <span className="font-bold text-purple-600">
                                  ₹{(ebook.salePrice || 0).toLocaleString()}
                                </span>
                              </div>
                            ))
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No e-books available</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* E-Books Tab */}
          <TabsContent value="ebooks" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Digital Library</h2>
                <p className="text-gray-600">Manage your e-book collection</p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Upload className="h-4 w-4 mr-2" />
                Upload E-Book
              </Button>
            </div>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>E-Book Collection</CardTitle>
                <CardDescription>{ebooks.length} digital books available</CardDescription>
              </CardHeader>
              <CardContent>
                {ebooks.length === 0 ? (
                  <div className="text-center py-12">
                    <Zap className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No e-books yet</h3>
                    <p className="text-gray-500 mb-4">Upload your first digital book to get started</p>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload E-Book
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ebooks.map((ebook: any) => (
                      <Card key={ebook.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="aspect-[3/4] bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-4 flex items-center justify-center">
                            <FileText className="h-12 w-12 text-blue-600" />
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">{ebook.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{ebook.author}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-blue-600">₹{ebook.price}</span>
                            <Badge>{ebook.downloads || 0} downloads</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Library Management</h2>
                <p className="text-gray-600">Manage library integration and services</p>
              </div>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Library Settings
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Library className="h-5 w-5 text-green-600" />
                    <span>Library Books</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-2">{libraryBooks.length}</div>
                  <p className="text-sm text-gray-600">Books in library system</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span>Active Members</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-2">142</div>
                  <p className="text-sm text-gray-600">Registered library users</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookMarked className="h-5 w-5 text-purple-600" />
                    <span>Borrowed Today</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600 mb-2">24</div>
                  <p className="text-sm text-gray-600">Books borrowed today</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Library Integration Status</CardTitle>
                <CardDescription>Your library management system connection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">VyronaRead Library System</p>
                        <p className="text-sm text-gray-500">Connected and syncing</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline">
                      <Archive className="h-4 w-4 mr-2" />
                      Manage Catalog
                    </Button>
                    <Button variant="outline">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Educational Tools
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rentals Tab - Comprehensive Order Management */}
          <TabsContent value="rentals" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">VyronaRead Order Management</h2>
                <p className="text-gray-600">Manage book rentals, library loans, and e-book purchases</p>
              </div>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Rental Calendar
              </Button>
            </div>

            {(() => {
              const vyronareadOrders = sellerOrders?.filter((order: any) => order.module === 'vyronaread') || [];
              const rentalOrders = vyronareadOrders.filter((order: any) => 
                order.metadata?.transaction_type === 'rental' || 
                (order.metadata && typeof order.metadata === 'string' && order.metadata.includes('rental'))
              );
              const loanOrders = vyronareadOrders.filter((order: any) => 
                order.metadata?.transaction_type === 'loan' ||
                (order.metadata && typeof order.metadata === 'string' && order.metadata.includes('loan'))
              );
              const purchaseOrders = vyronareadOrders.filter((order: any) => 
                order.metadata?.transaction_type === 'purchase' ||
                (!order.metadata?.transaction_type && !order.metadata?.includes?.('rental') && !order.metadata?.includes?.('loan'))
              );

              return (
                <div className="space-y-6">
                  {/* Order Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Book Orders</p>
                            <p className="text-2xl font-bold text-blue-600">{vyronareadOrders.length}</p>
                          </div>
                          <BookOpen className="h-6 w-6 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Book Rentals</p>
                            <p className="text-2xl font-bold text-purple-600">{rentalOrders.length}</p>
                          </div>
                          <Clock className="h-6 w-6 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Library Loans</p>
                            <p className="text-2xl font-bold text-green-600">{loanOrders.length}</p>
                          </div>
                          <Users className="h-6 w-6 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Book Purchases</p>
                            <p className="text-2xl font-bold text-orange-600">{purchaseOrders.length}</p>
                          </div>
                          <ShoppingCart className="h-6 w-6 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tabs for Different Order Types */}
                  <div className="border-b">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                      <button
                        onClick={() => setActiveBookOrderTab('all')}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                          activeBookOrderTab === 'all'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        All Orders ({vyronareadOrders.length})
                      </button>
                      <button
                        onClick={() => setActiveBookOrderTab('rentals')}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                          activeBookOrderTab === 'rentals'
                            ? 'border-purple-500 text-purple-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Rentals ({rentalOrders.length})
                      </button>
                      <button
                        onClick={() => setActiveBookOrderTab('loans')}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                          activeBookOrderTab === 'loans'
                            ? 'border-green-500 text-green-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Library Loans ({loanOrders.length})
                      </button>
                      <button
                        onClick={() => setActiveBookOrderTab('purchases')}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                          activeBookOrderTab === 'purchases'
                            ? 'border-orange-500 text-orange-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Purchases ({purchaseOrders.length})
                      </button>
                    </nav>
                  </div>

                  {/* Order List */}
                  <div className="space-y-4">
                    {(() => {
                      let ordersToShow = [];
                      switch (activeBookOrderTab) {
                        case 'rentals':
                          ordersToShow = rentalOrders;
                          break;
                        case 'loans':
                          ordersToShow = loanOrders;
                          break;
                        case 'purchases':
                          ordersToShow = purchaseOrders;
                          break;
                        default:
                          ordersToShow = vyronareadOrders;
                      }

                      if (ordersToShow.length === 0) {
                        return (
                          <Card>
                            <CardContent className="p-8 text-center">
                              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                              <p className="text-gray-500">
                                {activeBookOrderTab === 'all' && "No book orders yet"}
                                {activeBookOrderTab === 'rentals' && "No rental orders yet"}
                                {activeBookOrderTab === 'loans' && "No library loan orders yet"}
                                {activeBookOrderTab === 'purchases' && "No purchase orders yet"}
                              </p>
                            </CardContent>
                          </Card>
                        );
                      }

                      return ordersToShow.map((order: any) => (
                        <Card key={order.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                  {activeBookOrderTab === 'rentals' || order.metadata?.transaction_type === 'rental' ? (
                                    <Clock className="h-6 w-6 text-purple-600" />
                                  ) : activeBookOrderTab === 'loans' || order.metadata?.transaction_type === 'loan' ? (
                                    <Users className="h-6 w-6 text-green-600" />
                                  ) : (
                                    <ShoppingCart className="h-6 w-6 text-orange-600" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h3 className="font-semibold text-gray-900">Order #{order.id}</h3>
                                    <Badge variant={
                                      order.status === 'delivered' ? 'default' :
                                      order.status === 'shipped' ? 'secondary' :
                                      order.status === 'processing' ? 'outline' :
                                      'destructive'
                                    }>
                                      {order.status}
                                    </Badge>
                                    {(activeBookOrderTab === 'rentals' || order.metadata?.transaction_type === 'rental') && (
                                      <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                        Rental
                                      </Badge>
                                    )}
                                    {(activeBookOrderTab === 'loans' || order.metadata?.transaction_type === 'loan') && (
                                      <Badge variant="outline" className="bg-green-50 text-green-700">
                                        Library Loan
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-1">
                                    Customer: {order.customerName || 'N/A'} • {order.customerEmail || 'N/A'}
                                  </p>
                                  <p className="text-sm text-gray-500 mb-2">
                                    {order.items?.length || 0} item(s) • Total: ₹{(order.totalAmount / 100).toFixed(2)}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    Order Date: {new Date(order.createdAt).toLocaleDateString()} • 
                                    {order.trackingNumber && ` Tracking: ${order.trackingNumber}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                {order.status === 'processing' && (
                                  <Button variant="outline" size="sm">
                                    <Package className="h-4 w-4 mr-1" />
                                    Ship
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ));
                    })()}
                  </div>
                </div>
              );
            })()}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
                <p className="text-gray-600">Track book sales and deliveries</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>{orders.length} total orders</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-500">Customer orders will appear here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Order ID</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Customer</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Books</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Total</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order: any) => (
                          <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">#{order.id}</td>
                            <td className="py-3 px-4">{order.customerName}</td>
                            <td className="py-3 px-4">{order.items?.length || 1} book(s)</td>
                            <td className="py-3 px-4 font-medium">₹{order.total}</td>
                            <td className="py-3 px-4">
                              <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                                {order.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Truck className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
                <p className="text-gray-600">Track performance and insights</p>
              </div>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-600">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">₹{analytics?.totalRevenue || 0}</div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+12.5%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-600">Books Sold</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{analytics?.totalOrders || 0}</div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-sm text-blue-600">+8.2%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-600">Avg. Order Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">₹{analytics?.averageOrderValue || 0}</div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
                    <span className="text-sm text-purple-600">+5.1%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-600">Return Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">2.1%</div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-orange-500 mr-1" />
                    <span className="text-sm text-orange-600">-0.8%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Sales Trends</CardTitle>
                  <CardDescription>Monthly sales performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>Sales chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Popular Categories</CardTitle>
                  <CardDescription>Best-selling book categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Fiction</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">75%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Non-Fiction</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">60%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Educational</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">45%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Children's Books</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-orange-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">30%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Library Integration Dialog */}
      {showLibraryIntegrationDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Library Integration Request</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowLibraryIntegrationDialog(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-gray-600 mb-6">
              Submit a request to integrate with libraries for book lending and distribution
            </p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              submitLibraryIntegrationMutation.mutate(libraryIntegrationForm);
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="libraryName">Library Name *</Label>
                  <Input
                    id="libraryName"
                    placeholder="Enter library name"
                    value={libraryIntegrationForm.libraryName}
                    onChange={(e) => setLibraryIntegrationForm({
                      ...libraryIntegrationForm,
                      libraryName: e.target.value
                    })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="libraryType">Library Type *</Label>
                  <Select 
                    value={libraryIntegrationForm.libraryType}
                    onValueChange={(value) => setLibraryIntegrationForm({
                      ...libraryIntegrationForm,
                      libraryType: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public Library</SelectItem>
                      <SelectItem value="academic">Academic Library</SelectItem>
                      <SelectItem value="corporate">Corporate Library</SelectItem>
                      <SelectItem value="special">Special Library</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    placeholder="Enter contact person name"
                    value={libraryIntegrationForm.contactPerson}
                    onChange={(e) => setLibraryIntegrationForm({
                      ...libraryIntegrationForm,
                      contactPerson: e.target.value
                    })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@library.com"
                    value={libraryIntegrationForm.email}
                    onChange={(e) => setLibraryIntegrationForm({
                      ...libraryIntegrationForm,
                      email: e.target.value
                    })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="+91 9876543210"
                    value={libraryIntegrationForm.phone}
                    onChange={(e) => setLibraryIntegrationForm({
                      ...libraryIntegrationForm,
                      phone: e.target.value
                    })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="totalBooks">Total Books in Collection</Label>
                  <Input
                    id="totalBooks"
                    type="number"
                    placeholder="0"
                    value={libraryIntegrationForm.totalBooks}
                    onChange={(e) => setLibraryIntegrationForm({
                      ...libraryIntegrationForm,
                      totalBooks: Number(e.target.value)
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  placeholder="Complete address with city, state, and pincode"
                  className="resize-none"
                  value={libraryIntegrationForm.address}
                  onChange={(e) => setLibraryIntegrationForm({
                    ...libraryIntegrationForm,
                    address: e.target.value
                  })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="message">Additional Message</Label>
                <Textarea
                  id="message"
                  placeholder="Any additional information or special requirements"
                  className="resize-none"
                  value={libraryIntegrationForm.message}
                  onChange={(e) => setLibraryIntegrationForm({
                    ...libraryIntegrationForm,
                    message: e.target.value
                  })}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowLibraryIntegrationDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitLibraryIntegrationMutation.isPending}
                >
                  {submitLibraryIntegrationMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Book Dialog */}
      {showAddBookDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Physical Book</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddBookDialog(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              addBookMutation.mutate(newBook);
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Book Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter book title"
                    value={newBook.title}
                    onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    placeholder="Enter author name"
                    value={newBook.author}
                    onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    placeholder="Enter ISBN"
                    value={newBook.isbn}
                    onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={newBook.category}
                    onValueChange={(value) => setNewBook({...newBook, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fiction">Fiction</SelectItem>
                      <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Self-Help">Self-Help</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Children">Children</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="condition">Book Condition *</Label>
                  <Select 
                    value={newBook.condition}
                    onValueChange={(value) => setNewBook({...newBook, condition: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Input
                    id="language"
                    placeholder="Enter language"
                    value={newBook.language}
                    onChange={(e) => setNewBook({...newBook, language: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="salePrice">Sale Price (₹)</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    placeholder="0"
                    value={newBook.salePrice}
                    onChange={(e) => setNewBook({...newBook, salePrice: Number(e.target.value)})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="rentalPrice">Rental Price (₹/15 days)</Label>
                  <Input
                    id="rentalPrice"
                    type="number"
                    placeholder="0"
                    value={newBook.rentalPrice}
                    onChange={(e) => setNewBook({...newBook, rentalPrice: Number(e.target.value)})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="copies">Available Copies</Label>
                  <Input
                    id="copies"
                    type="number"
                    placeholder="1"
                    value={newBook.copies}
                    onChange={(e) => setNewBook({...newBook, copies: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the book"
                  className="resize-none"
                  value={newBook.description}
                  onChange={(e) => setNewBook({...newBook, description: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddBookDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addBookMutation.isPending}
                >
                  {addBookMutation.isPending ? "Adding..." : "Add Book"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add E-book Dialog */}
      {showAddEbookDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Upload E-book</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddEbookDialog(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              addEbookMutation.mutate(newEbook);
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ebook-title">E-book Title *</Label>
                  <Input
                    id="ebook-title"
                    placeholder="Enter e-book title"
                    value={newEbook.title}
                    onChange={(e) => setNewEbook({...newEbook, title: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="ebook-author">Author *</Label>
                  <Input
                    id="ebook-author"
                    placeholder="Enter author name"
                    value={newEbook.author}
                    onChange={(e) => setNewEbook({...newEbook, author: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ebook-isbn">ISBN</Label>
                  <Input
                    id="ebook-isbn"
                    placeholder="Enter ISBN"
                    value={newEbook.isbn}
                    onChange={(e) => setNewEbook({...newEbook, isbn: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="ebook-category">Category *</Label>
                  <Select 
                    value={newEbook.category}
                    onValueChange={(value) => setNewEbook({...newEbook, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fiction">Fiction</SelectItem>
                      <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Self-Help">Self-Help</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Children">Children</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ebook-format">Format *</Label>
                  <Select 
                    value={newEbook.format}
                    onValueChange={(value) => setNewEbook({...newEbook, format: value})}
                  >
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
                
                <div>
                  <Label htmlFor="ebook-language">Language</Label>
                  <Input
                    id="ebook-language"
                    placeholder="Enter language"
                    value={newEbook.language}
                    onChange={(e) => setNewEbook({...newEbook, language: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ebook-salePrice">Sale Price (₹)</Label>
                  <Input
                    id="ebook-salePrice"
                    type="number"
                    placeholder="0"
                    value={newEbook.salePrice}
                    onChange={(e) => setNewEbook({...newEbook, salePrice: Number(e.target.value)})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="ebook-rentalPrice">Rental Price (₹/15 days)</Label>
                  <Input
                    id="ebook-rentalPrice"
                    type="number"
                    placeholder="0"
                    value={newEbook.rentalPrice}
                    onChange={(e) => setNewEbook({...newEbook, rentalPrice: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ebook-description">Description</Label>
                <Textarea
                  id="ebook-description"
                  placeholder="Brief description of the e-book"
                  className="resize-none"
                  value={newEbook.description}
                  onChange={(e) => setNewEbook({...newEbook, description: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="file-url">File URL/Path</Label>
                <Input
                  id="file-url"
                  placeholder="Enter file URL or upload path"
                  value={newEbook.fileUrl}
                  onChange={(e) => setNewEbook({...newEbook, fileUrl: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload your e-book file and provide the URL or file path
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddEbookDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addEbookMutation.isPending}
                >
                  {addEbookMutation.isPending ? "Uploading..." : "Upload E-book"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}