import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  BookOpen,
  Library,
  Plus,
  Search,
  Trash2,
  Users,
  Calendar,
  DollarSign,
  Book,
  Heart,
  CheckCircle,
  AlertCircle,
  Clock,
  ShoppingCart,
  TrendingUp,
  FileText,
  Upload,
  Download,
  Edit,
  Eye,
  Star,
  Gift,
  CreditCard,
  Package,
  MapPin,
  Phone,
  Mail,
  LogOut
} from "lucide-react";
import { Link } from "wouter";

interface Book {
  id: number;
  title: string;
  author: string;
  isbn?: string;
  category: string;
  publisher?: string;
  publicationYear?: number;
  copies: number;
  availableCopies: number;
  language?: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  sellerId: number;
}

interface EBook {
  id: number;
  title: string;
  author: string;
  category: string;
  price: number;
  description?: string;
  fileUrl?: string;
  imageUrl?: string;
  createdAt: string;
  downloads: number;
  sellerId: number;
}

export default function VyronaReadSellerDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [activeBookOrderTab, setActiveBookOrderTab] = useState("all");
  const [showAddBookDialog, setShowAddBookDialog] = useState(false);
  const [showAddEBookDialog, setShowAddEBookDialog] = useState(false);
  
  // Book form state
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

  // E-book form state
  const [newEBook, setNewEBook] = useState({
    title: "",
    author: "",
    category: "",
    price: 0,
    description: "",
    fileUrl: ""
  });

  // Fetch seller books
  const { data: sellerBooks = [], isLoading: booksLoading, refetch: refetchBooks } = useQuery({
    queryKey: ["/api/vyronaread/seller-books"],
  });

  // Fetch seller e-books
  const { data: sellerEBooks = [], isLoading: ebooksLoading, refetch: refetchEBooks } = useQuery({
    queryKey: ["/api/vyronaread/ebooks"],
  });

  // Fetch VyronaRead orders
  const { data: vyronareadOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/seller/orders"],
  });

  // Fetch library books
  const { data: libraryBooks = [], isLoading: libraryLoading } = useQuery({
    queryKey: ["/api/vyronaread/library-books"],
  });

  // Filter orders by type
  const rentalOrders = (vyronareadOrders as any[]).filter((order: any) => order.order_type === 'rental');
  const loanOrders = (vyronareadOrders as any[]).filter((order: any) => order.order_type === 'loan');
  const purchaseOrders = (vyronareadOrders as any[]).filter((order: any) => order.order_type === 'purchase');

  // Add book mutation
  const addBookMutation = useMutation({
    mutationFn: async (bookData: any) => {
      return await apiRequest("/api/vyronaread/books", "POST", bookData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Book added to library successfully",
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
      refetchBooks();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add book",
        variant: "destructive",
      });
    },
  });

  // Add e-book mutation
  const addEBookMutation = useMutation({
    mutationFn: async (ebookData: any) => {
      return await apiRequest("/api/vyronaread/ebooks", "POST", ebookData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "E-book added successfully",
      });
      setShowAddEBookDialog(false);
      setNewEBook({
        title: "",
        author: "",
        category: "",
        price: 0,
        description: "",
        fileUrl: ""
      });
      refetchEBooks();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add e-book",
        variant: "destructive",
      });
    },
  });

  // Delete book mutation
  const deleteBookMutation = useMutation({
    mutationFn: async (bookId: number) => {
      return await apiRequest(`/api/vyronaread/books/${bookId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Book deleted successfully",
      });
      refetchBooks();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete book",
        variant: "destructive",
      });
    },
  });

  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
    setNewBook(prev => ({ ...prev, [field]: value }));
  };

  const handleEBookInputChange = (field: string, value: any) => {
    setNewEBook(prev => ({ ...prev, [field]: value }));
  };

  // Handle form submissions
  const handleAddBook = () => {
    if (!newBook.title || !newBook.author || !newBook.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    addBookMutation.mutate(newBook);
  };

  const handleAddEBook = () => {
    if (!newEBook.title || !newEBook.author || !newEBook.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    addEBookMutation.mutate(newEBook);
  };

  const handleDeleteBook = (bookId: number) => {
    if (confirm("Are you sure you want to delete this book?")) {
      deleteBookMutation.mutate(bookId);
    }
  };

  const handleSearchBooks = () => {
    // Implement search functionality
    toast({
      title: "Search",
      description: "Book search functionality coming soon",
    });
  };

  // Logout function
  const handleLogout = async () => {
    try {
      await apiRequest("/api/auth/logout", "POST");
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Library className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">VyronaRead</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">Seller Dashboard</p>
            </div>
          </div>
          
          <nav className="space-y-2">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("overview")}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeTab === "books" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("books")}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Physical Books
            </Button>
            <Button
              variant={activeTab === "ebooks" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("ebooks")}
            >
              <FileText className="h-4 w-4 mr-2" />
              E-Books
            </Button>
            <Button
              variant={activeTab === "orders" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("orders")}
            >
              <Package className="h-4 w-4 mr-2" />
              Orders & Loans
            </Button>
            <Button
              variant={activeTab === "library" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("library")}
            >
              <Library className="h-4 w-4 mr-2" />
              Library Network
            </Button>
          </nav>

          <div className="mt-auto pt-6">
            <Link href="/">
              <Button variant="ghost" className="w-full justify-start text-gray-600">
                <Eye className="h-4 w-4 mr-2" />
                View Customer Site
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start text-red-600" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">VyronaRead Overview</h2>
              <p className="text-gray-600 dark:text-gray-300">Your complete book ecosystem dashboard</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Physical Books</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{(sellerBooks as any[]).length}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">In your library</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">E-Books</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{sellerEBooks.length}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Digital collection</p>
                    </div>
                    <FileText className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Orders</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{vyronareadOrders.length}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">All transactions</p>
                    </div>
                    <Package className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Loans</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{loanOrders.length}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Currently borrowed</p>
                    </div>
                    <Calendar className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" onClick={() => setShowAddBookDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Physical Book
                  </Button>
                  <Button className="w-full justify-start" onClick={() => setShowAddEBookDialog(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload E-Book
                  </Button>
                  <Button className="w-full justify-start" onClick={handleSearchBooks}>
                    <Search className="h-4 w-4 mr-2" />
                    Search Library Network
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {vyronareadOrders.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                  ) : (
                    <div className="space-y-2">
                      {vyronareadOrders.slice(0, 3).map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between text-sm">
                          <span>Order #{order.id}</span>
                          <Badge variant="outline">{order.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "books" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Physical Books Library</h2>
                <p className="text-gray-600 dark:text-gray-300">Manage your physical book inventory for loans and rentals</p>
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
                      <Button onClick={handleAddBook} disabled={addBookMutation.isPending}>
                        {addBookMutation.isPending ? "Adding..." : "Add Book"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Books Grid */}
            {booksLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">Loading books...</p>
              </div>
            ) : sellerBooks.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No Books Yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Add your first book to start building your library</p>
                <Button onClick={() => setShowAddBookDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Book
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sellerBooks.map((book: Book) => (
                  <Card key={book.id} className="overflow-hidden">
                    <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800">
                      {book.imageUrl ? (
                        <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-2">{book.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-2">by {book.author}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">{book.category}</Badge>
                        {book.language && (
                          <Badge variant="secondary">{book.language}</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-3">
                        <span>Copies: {book.availableCopies}/{book.copies}</span>
                        {book.isbn && <span>ISBN: {book.isbn}</span>}
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteBook(book.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "ebooks" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Digital E-Books</h2>
                <p className="text-gray-600 dark:text-gray-300">Manage your digital book collection for sale</p>
              </div>
              <Dialog open={showAddEBookDialog} onOpenChange={setShowAddEBookDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload E-Book
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Upload New E-Book</DialogTitle>
                    <DialogDescription>
                      Add a new digital book to your collection
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="ebook-title">Title *</Label>
                      <Input
                        id="ebook-title"
                        value={newEBook.title}
                        onChange={(e) => handleEBookInputChange("title", e.target.value)}
                        placeholder="Enter book title"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ebook-author">Author *</Label>
                      <Input
                        id="ebook-author"
                        value={newEBook.author}
                        onChange={(e) => handleEBookInputChange("author", e.target.value)}
                        placeholder="Enter author name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ebook-category">Category *</Label>
                      <Select value={newEBook.category} onValueChange={(value) => handleEBookInputChange("category", value)}>
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
                      <Label htmlFor="ebook-price">Price (₹) *</Label>
                      <Input
                        id="ebook-price"
                        type="number"
                        value={newEBook.price}
                        onChange={(e) => handleEBookInputChange("price", parseFloat(e.target.value) || 0)}
                        placeholder="99"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="ebook-description">Description</Label>
                      <Textarea
                        id="ebook-description"
                        value={newEBook.description}
                        onChange={(e) => handleEBookInputChange("description", e.target.value)}
                        placeholder="Brief description of the e-book..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="ebook-file">File URL</Label>
                      <Input
                        id="ebook-file"
                        value={newEBook.fileUrl}
                        onChange={(e) => handleEBookInputChange("fileUrl", e.target.value)}
                        placeholder="https://example.com/book.pdf"
                      />
                      <p className="text-xs text-gray-500">Upload your PDF file to a cloud service and paste the public URL here</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowAddEBookDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddEBook} disabled={addEBookMutation.isPending}>
                      {addEBookMutation.isPending ? "Uploading..." : "Upload E-Book"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* E-Books Grid */}
            {ebooksLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">Loading e-books...</p>
              </div>
            ) : sellerEBooks.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No E-Books Yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Upload your first digital book to start selling</p>
                <Button onClick={() => setShowAddEBookDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First E-Book
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sellerEBooks.map((ebook: EBook) => (
                  <Card key={ebook.id} className="overflow-hidden">
                    <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800">
                      {ebook.imageUrl ? (
                        <img src={ebook.imageUrl} alt={ebook.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-2">{ebook.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-2">by {ebook.author}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">{ebook.category}</Badge>
                        <Badge variant="default" className="bg-green-600">₹{ebook.price}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-3">
                        <span>Downloads: {ebook.downloads}</span>
                        <span>Digital</span>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Orders & Loans Management</h2>
              <p className="text-gray-600 dark:text-gray-300">Track all your book transactions, rentals, and library loans</p>
            </div>

            {/* Order Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold text-blue-600">{vyronareadOrders.length}</p>
                    </div>
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
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
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Library Loans</p>
                      <p className="text-2xl font-bold text-green-600">{loanOrders.length}</p>
                    </div>
                    <Library className="h-6 w-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
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
                    <div className="text-center py-12">
                      <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                        No {activeBookOrderTab === 'all' ? 'Book Orders' : activeBookOrderTab.charAt(0).toUpperCase() + activeBookOrderTab.slice(1)} Yet
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        VyronaRead {activeBookOrderTab === 'all' ? 'orders' : activeBookOrderTab} will appear here once customers start using your library
                      </p>
                    </div>
                  );
                }

                return ordersToShow.map((order: any) => (
                  <div key={order.order_id || order.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">Order #{order.order_id || order.id}</p>
                          <p className="text-sm text-gray-600">
                            {order.customer_name || 'Customer'} • {order.customer_email}
                          </p>
                        </div>
                        <Badge variant={
                          order.order_status === 'delivered' || order.status === 'delivered' ? 'default' :
                          order.order_status === 'processing' || order.status === 'processing' ? 'secondary' :
                          'outline'
                        }>
                          {order.order_status || order.status || 'pending'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{order.total_amount || order.amount || 0}</p>
                        <p className="text-sm text-gray-600">{order.order_type || 'purchase'}</p>
                      </div>
                    </div>
                    
                    {order.book_title && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                        <p className="font-medium">{order.book_title}</p>
                        <p className="text-sm text-gray-600">by {order.book_author}</p>
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {activeTab === "library" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Library Network</h2>
              <p className="text-gray-600 dark:text-gray-300">Connect with other libraries and expand your book collection</p>
            </div>

            {/* Library Network Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Connected Libraries</p>
                      <p className="text-2xl font-bold text-blue-600">{libraryBooks.length}</p>
                    </div>
                    <Library className="h-6 w-6 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Available Books</p>
                      <p className="text-2xl font-bold text-green-600">
                        {libraryBooks.reduce((sum: number, book: any) => sum + (book.availableCopies || 0), 0)}
                      </p>
                    </div>
                    <BookOpen className="h-6 w-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Inter-library Loans</p>
                      <p className="text-2xl font-bold text-purple-600">0</p>
                    </div>
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Library Books */}
            <Card>
              <CardHeader>
                <CardTitle>Network Library Collection</CardTitle>
              </CardHeader>
              <CardContent>
                {libraryLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">Loading library network...</p>
                  </div>
                ) : libraryBooks.length === 0 ? (
                  <div className="text-center py-8">
                    <Library className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">No Network Libraries</h3>
                    <p className="text-gray-500 dark:text-gray-400">Connect with other libraries to expand your book collection</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {libraryBooks.slice(0, 10).map((book: any) => (
                      <div key={book.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <div>
                          <p className="font-medium">{book.title}</p>
                          <p className="text-sm text-gray-600">by {book.author} • {book.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{book.availableCopies}/{book.copies} available</p>
                          <Badge variant="outline">{book.language || 'English'}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}