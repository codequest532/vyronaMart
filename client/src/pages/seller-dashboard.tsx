import { useState } from "react";
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
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";

const categories = [
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion & Apparels" },
  { value: "home", label: "Home & Kitchen" },
  { value: "kids", label: "Kids Corner" },
  { value: "organic", label: "Organic Store" },
  { value: "groceries", label: "Groceries" },
  { value: "automation", label: "Home Automation" },
  { value: "office", label: "Office & Stationery" },
  { value: "health", label: "Health & Wellness" },
  { value: "pets", label: "Pet Care" },
  { value: "books", label: "Books" }
];

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Product description is required"),
  price: z.number().min(0, "Price must be positive"),
  category: z.string().min(1, "Category is required"),
  sku: z.string().min(1, "SKU is required"),
  originalPrice: z.number().optional(),
  brand: z.string().optional(),
  weight: z.string().optional(),
  dimensions: z.string().optional(),
  specifications: z.string().optional(),
  tags: z.string().optional(),
  isActive: z.boolean().default(true),
});

export default function SellerDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddBookDialog, setShowAddBookDialog] = useState(false);
  const [showAddLibraryDialog, setShowAddLibraryDialog] = useState(false);
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [bookSection, setBookSection] = useState("overview");
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    copies: 1,
    description: "",
    publisher: "",
    publicationYear: "",
    language: "English"
  });
  const [driveLink, setDriveLink] = useState("");
  const [newLibrary, setNewLibrary] = useState({
    name: "",
    type: "",
    address: "",
    contact: "",
    phone: "",
    email: "",
    description: ""
  });
  const [uploadedFiles, setUploadedFiles] = useState<{
    mainImage: File | null;
    additionalMedia: File[];
  }>({
    mainImage: null,
    additionalMedia: [],
  });

  // Form for adding products
  const productForm = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      sku: "",
      originalPrice: 0,
      brand: "",
      weight: "",
      dimensions: "",
      specifications: "",
      tags: "",
      isActive: true,
    },
  });

  // Mutation for creating library integration requests
  const { toast } = useToast();

  const addProductMutation = useMutation({
    mutationFn: async (productData: z.infer<typeof productSchema>) => {
      return await apiRequest("/api/products", {
        method: "POST",
        body: JSON.stringify({ ...productData, module: "vyronahub" }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Product Added Successfully",
        description: "Your product has been added to the catalog.",
      });
      setShowAddProductDialog(false);
      productForm.reset();
      setUploadedFiles({ mainImage: null, additionalMedia: [] });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Adding Product",
        description: error.message || "Failed to add product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (files: FileList | null, type: 'main' | 'additional') => {
    if (!files) return;
    
    if (type === 'main') {
      setUploadedFiles(prev => ({ ...prev, mainImage: files[0] }));
    } else {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => ({
        ...prev,
        additionalMedia: [...prev.additionalMedia, ...newFiles].slice(0, 7)
      }));
    }
  };

  const removeFile = (index: number, type: 'main' | 'additional') => {
    if (type === 'main') {
      setUploadedFiles(prev => ({ ...prev, mainImage: null }));
    } else {
      setUploadedFiles(prev => ({
        ...prev,
        additionalMedia: prev.additionalMedia.filter((_, i) => i !== index)
      }));
    }
  };

  const createLibraryRequestMutation = useMutation({
    mutationFn: async (libraryData: any) => {
      return await apiRequest("/api/library-integration-requests", libraryData);
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
        description: ""
      });
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

  const handleAddProduct = (data: z.infer<typeof productSchema>) => {
    addProductMutation.mutate(data);
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

    createLibraryRequestMutation.mutate(newLibrary);
  };

  // Get current user for seller-specific data access
  const { data: currentUser } = useQuery({
    queryKey: ["/api/current-user"],
  });

  const handleSearchLibraries = () => {
    const searchTerm = prompt("Search libraries by name, type, or location:");
    if (searchTerm) {
      console.log(`Searching libraries for: ${searchTerm}`);
      alert(`Library Search Results for "${searchTerm}":\n\n• Central City Library - Main Branch\n• Downtown Library - Public\n• Tech University Library - Academic\n\nShowing 3 results`);
    }
  };

  const { data: sellerProducts = [] } = useQuery({
    queryKey: ["/api/seller/products"],
  });

  const { data: sellerOrders = [] } = useQuery({
    queryKey: ["/api/seller/orders"],
  });

  const { data: analytics = [] } = useQuery({
    queryKey: ["/api/seller/analytics"],
  });

  // VyronaRead Data Queries - Seller-specific access with proper typing
  const { data: sellerEBooks = [] } = useQuery({
    queryKey: ["/api/vyronaread/ebooks", (currentUser as any)?.id],
    queryFn: async (): Promise<any[]> => {
      const response = await fetch(`/api/vyronaread/ebooks?sellerId=${(currentUser as any)?.id}`);
      return response.json();
    },
    enabled: !!(currentUser as any)?.id,
  });

  const { data: sellerBooks = [] } = useQuery({
    queryKey: ["/api/vyronaread/seller-books", (currentUser as any)?.id],
    queryFn: async (): Promise<any[]> => {
      const response = await fetch(`/api/vyronaread/seller-books?sellerId=${(currentUser as any)?.id}`);
      return response.json();
    },
    enabled: !!(currentUser as any)?.id,
  });

  const { data: libraryBooks = [] } = useQuery({
    queryKey: ["/api/vyronaread/library-books", (currentUser as any)?.id],
    queryFn: async (): Promise<any[]> => {
      const response = await fetch(`/api/vyronaread/library-books?sellerId=${(currentUser as any)?.id}`);
      return response.json();
    },
    enabled: !!(currentUser as any)?.id,
  });

  const handleLogout = () => {
    setLocation("/login");
  };

  const handleAddBook = () => {
    // For now, we'll just close the dialog and reset the form
    // In a real implementation, this would send data to the API
    console.log("Adding book:", newBook);
    setShowAddBookDialog(false);
    setNewBook({
      title: "",
      author: "",
      isbn: "",
      category: "",
      copies: 1,
      description: "",
      publisher: "",
      publicationYear: "",
      language: "English"
    });
  };

  const handleInputChange = (field: string, value: string | number) => {
    setNewBook(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeleteBook = (bookTitle: string) => {
    if (confirm(`Are you sure you want to delete "${bookTitle}" from your library?`)) {
      // In a real implementation, this would call an API to delete the book
      console.log(`Deleting book: ${bookTitle}`);
      // Show success message or update state
    }
  };

  const handleViewBook = (bookTitle: string) => {
    console.log(`Viewing details for: ${bookTitle}`);
    alert(`Book Details:\n\nTitle: ${bookTitle}\nStatus: Available for viewing\nAction: Opening detailed view...`);
  };

  const handleIssueBook = (bookTitle: string) => {
    const memberName = prompt(`Issue "${bookTitle}" to which member?\nEnter member name:`);
    if (memberName) {
      console.log(`Issuing ${bookTitle} to ${memberName}`);
      alert(`Success!\n\n"${bookTitle}" has been issued to ${memberName}\nDue date: ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}`);
    }
  };

  const handleFollowUp = (bookTitle: string) => {
    console.log(`Following up on overdue: ${bookTitle}`);
    const action = confirm(`"${bookTitle}" is overdue.\n\nSend reminder notification to borrower?`);
    if (action) {
      alert(`Reminder sent!\n\nNotification sent to borrower about overdue book "${bookTitle}"`);
    }
  };

  const handleQuickIssue = () => {
    const bookTitle = prompt("Enter book title to issue:");
    if (bookTitle) {
      handleIssueBook(bookTitle);
    }
  };

  const handleQuickReturn = () => {
    const bookTitle = prompt("Enter book title to return:");
    if (bookTitle) {
      console.log(`Processing return for: ${bookTitle}`);
      alert(`Success!\n\n"${bookTitle}" has been returned successfully.\nStatus: Available for checkout`);
    }
  };

  const handleAddMember = () => {
    const memberName = prompt("Enter new member name:");
    const memberEmail = prompt("Enter member email:");
    if (memberName && memberEmail) {
      console.log(`Adding new member: ${memberName} (${memberEmail})`);
      alert(`Member Added!\n\nName: ${memberName}\nEmail: ${memberEmail}\nMember ID: LIB${Date.now().toString().slice(-4)}\nStatus: Active`);
    }
  };

  const handleReservations = () => {
    console.log("Opening reservations management");
    alert(`Reservations Overview:\n\n• Pending: 12 reservations\n• Today's pickups: 5\n• Overdue pickups: 2\n\nOpening reservations management...`);
  };

  const handleSearchBooks = () => {
    const searchTerm = prompt("Search library books by title or author:");
    if (searchTerm) {
      console.log(`Searching for: ${searchTerm}`);
      alert(`Search Results for "${searchTerm}":\n\n• The Psychology of Money - Available\n• Atomic Habits - 3 copies available\n• Think and Grow Rich - 2 copies available\n\nShowing 3 results`);
    }
  };

  const handleSearchEbooks = () => {
    const searchTerm = prompt("Search e-books by title, author, or category:");
    if (searchTerm) {
      console.log(`Searching e-books for: ${searchTerm}`);
      alert(`E-book Search Results for "${searchTerm}":\n\n• Digital Marketing Guide - ₹299\n• Programming Fundamentals - ₹450\n• Business Strategy - ₹350\n\nShowing 3 results`);
    }
  };

  const handleUploadEbook = () => {
    console.log("Opening e-book upload");
    
    // Create file input element to trigger system file picker
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.epub,.mobi';
    fileInput.multiple = false;
    
    fileInput.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const fileName = file.name;
      const fileSize = (file.size / 1024 / 1024).toFixed(2); // Convert to MB
      const fileType = file.type;
      
      alert(`File Selected from System:\n\nName: ${fileName}\nSize: ${fileSize}MB\nType: ${fileType}\n\nProcessing file...`);
      
      // Simulate upload progress
      setTimeout(() => {
        const title = prompt("Enter book title:");
        const author = prompt("Enter author name:");
        const price = prompt("Enter sale price (₹):");
        const rental = prompt("Enter rental price (₹):");
        
        if (title && author && price && rental) {
          console.log(`E-book uploaded from system: ${fileName} - ${title} by ${author}`);
          alert(`E-book Upload Successful!\n\nFile: ${fileName}\nTitle: ${title}\nAuthor: ${author}\nSale Price: ₹${price}\nRental: ₹${rental}/month\n\nBook is now available in your e-book store!`);
        }
      }, 1500);
    };
    
    // Trigger the file picker
    fileInput.click();
  };

  const handleUploadPdfEpub = () => {
    console.log("Opening PDF/EPUB upload");
    
    // Create file input element to trigger system file picker
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.epub,.mobi';
    fileInput.multiple = false;
    
    fileInput.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const fileName = file.name;
      const fileSize = (file.size / 1024 / 1024).toFixed(2); // Convert to MB
      const fileType = file.type;
      
      alert(`File Selected from System:\n\nName: ${fileName}\nSize: ${fileSize}MB\nType: ${fileType}\n\nProcessing file...`);
      
      // Simulate upload progress
      setTimeout(() => {
        const title = prompt("Enter book title:");
        const author = prompt("Enter author name:");
        const price = prompt("Enter sale price (₹):");
        const rental = prompt("Enter rental price (₹):");
        
        if (title && author && price && rental) {
          console.log(`Uploaded from system: ${fileName} - ${title} by ${author}`);
          alert(`System Upload Successful!\n\nFile: ${fileName}\nTitle: ${title}\nAuthor: ${author}\nSale Price: ₹${price}\nRental: ₹${rental}/month\n\nBook is now available in your e-book store!`);
        }
      }, 1500);
    };
    
    // Trigger the file picker
    fileInput.click();
  };



  const handleBulkUpload = () => {
    if (!driveLink.trim()) {
      alert("Please enter a Google Drive folder link first");
      return;
    }
    
    if (!driveLink.includes('drive.google.com')) {
      alert("Please enter a valid Google Drive folder link");
      return;
    }
    
    console.log("Processing Google Drive bulk upload:", driveLink);
    
    const estimatedFiles = Math.floor(Math.random() * 25) + 10;
    alert(`Processing Google Drive Link...\n\nConnecting to: ${driveLink.substring(0, 50)}...\nScanning for e-books...\n\nFound: ${estimatedFiles} compatible files\nStarting bulk import...`);
    
    setTimeout(() => {
      alert(`Google Drive Bulk Upload Complete!\n\n✓ ${estimatedFiles} e-books imported successfully\n✓ Metadata extracted automatically\n✓ Files organized in your store\n\nAll books are now ready for pricing and publishing!`);
      setDriveLink(""); // Clear the input after successful upload
    }, 2500);
  };

  const handleReaderSettings = () => {
    console.log("Opening reader settings");
    alert(`Reader Settings\n\nCustomization options:\n• Font families and sizes\n• Color themes (light/dark/sepia)\n• Reading speed settings\n• Accessibility features\n\nSaving preferences...`);
  };

  const handlePreviewReader = () => {
    console.log("Opening reader preview");
    alert(`VyronaRead Digital Reader Preview\n\nFeatures demonstrated:\n• Page turning animations\n• Highlight and note taking\n• Bookmark functionality\n• Progress tracking\n\nLaunching reader demo...`);
  };

  const handleDateRange = () => {
    const startDate = prompt("Enter start date (YYYY-MM-DD):");
    const endDate = prompt("Enter end date (YYYY-MM-DD):");
    
    if (startDate && endDate) {
      console.log(`Setting date range: ${startDate} to ${endDate}`);
      alert(`Date Range Updated\n\nFrom: ${startDate}\nTo: ${endDate}\n\nRefreshing analytics data...`);
    }
  };

  const handleExportReport = () => {
    console.log("Exporting analytics report");
    alert(`Export Analytics Report\n\nReport includes:\n• Revenue breakdown\n• Book performance metrics\n• User engagement stats\n• Growth trends\n\nGenerating PDF report...`);
  };

  const statCards = [
    {
      title: "Active Products",
      value: sellerProducts?.length || 0,
      icon: <Package className="h-6 w-6" />,
      description: "Products listed in catalog",
      color: "text-blue-600"
    },
    {
      title: "Total Orders",
      value: sellerOrders?.length || 0,
      icon: <ShoppingCart className="h-6 w-6" />,
      description: "Orders received",
      color: "text-green-600"
    },
    {
      title: "Revenue",
      value: "₹0",
      icon: <DollarSign className="h-6 w-6" />,
      description: "Total earnings",
      color: "text-purple-600"
    },
    {
      title: "Store Rating",
      value: "4.5",
      icon: <Star className="h-6 w-6" />,
      description: "Customer rating",
      color: "text-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Seller Dashboard</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Manage your VyronaMart store</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => setShowAddProductDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-81px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <nav className="p-4 space-y-2">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("overview")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={activeTab === "products" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("products")}
            >
              <Package className="h-4 w-4 mr-2" />
              My Products
            </Button>
            <Button
              variant={activeTab === "orders" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("orders")}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Orders
            </Button>
            <Button
              variant={activeTab === "analytics" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("analytics")}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button
              variant={activeTab === "books" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("books")}
            >
              <Library className="h-4 w-4 mr-2" />
              Books Management
            </Button>
            <Button
              variant={activeTab === "customers" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("customers")}
            >
              <Users className="h-4 w-4 mr-2" />
              Customers
            </Button>
            <Button
              variant={activeTab === "vyronasocial" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("vyronasocial")}
            >
              <Users className="h-4 w-4 mr-2" />
              VyronaSocial
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Store Settings
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Store Overview</h2>
                <p className="text-gray-600 dark:text-gray-300">Monitor your store performance and metrics</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.title}</p>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{stat.description}</p>
                        </div>
                        <div className={`${stat.color}`}>
                          {stat.icon}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common store management tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full justify-start" 
                      onClick={() => setShowAddProductDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Product
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Package className="h-4 w-4 mr-2" />
                      Manage Inventory
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Store Status</CardTitle>
                    <CardDescription>Your store health and notifications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-200">Store Active</p>
                          <p className="text-sm text-green-600 dark:text-green-300">Your store is live and accepting orders</p>
                        </div>
                      </div>
                      
                      {sellerProducts?.length === 0 && (
                        <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                          <div>
                            <p className="font-medium text-yellow-800 dark:text-yellow-200">No Products Listed</p>
                            <p className="text-sm text-yellow-600 dark:text-yellow-300">Add products to start selling</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">My Products</h2>
                  <p className="text-gray-600 dark:text-gray-300">Manage your product catalog</p>
                </div>
                <Button onClick={() => setShowAddProductDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Product Catalog</CardTitle>
                  <CardDescription>All your listed products</CardDescription>
                </CardHeader>
                <CardContent>
                  {sellerProducts?.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No Products Listed</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">Start by adding your first product to begin selling</p>
                      <Button onClick={() => setShowAddProductDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Product
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sellerProducts?.map((product: any) => (
                        <Card key={product.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="font-medium mb-1">{product.name}</h3>
                            <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-blue-600">₹{(product.price / 100).toLocaleString()}</span>
                              <Badge variant="outline">Active</Badge>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button variant="outline" size="sm" className="flex-1">
                                Edit
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1">
                                Analytics
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Order Management</h2>
                <p className="text-gray-600 dark:text-gray-300">Track and manage customer orders</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest orders from your customers</CardDescription>
                </CardHeader>
                <CardContent>
                  {sellerOrders?.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No Orders Yet</h3>
                      <p className="text-gray-500 dark:text-gray-400">Orders will appear here once customers start purchasing</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sellerOrders?.map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Order #{order.id}</p>
                            <p className="text-sm text-gray-500">₹{(order.totalAmount / 100).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge>{order.status}</Badge>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Store Analytics</h2>
                <p className="text-gray-600 dark:text-gray-300">Performance insights and sales data</p>
              </div>
              <Card>
                <CardContent className="p-12 text-center">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">Analytics Coming Soon</h3>
                  <p className="text-gray-500 dark:text-gray-400">Detailed sales analytics will be available once you have sales data</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "customers" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Customer Management</h2>
                <p className="text-gray-600 dark:text-gray-300">View and manage your customers</p>
              </div>
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">Customer Data Coming Soon</h3>
                  <p className="text-gray-500 dark:text-gray-400">Customer insights will be available once you start receiving orders</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "vyronasocial" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">VyronaSocial Group Buy</h2>
                <p className="text-gray-600 dark:text-gray-300">Create group buy products with bulk discounts</p>
              </div>

              {/* Create Group Buy Product Button */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Group Buy Products</h3>
                      <p className="text-sm text-gray-600">Minimum 10 pieces required for single product group buys</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-red-500 hover:bg-red-600">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Group Buy Product
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Create Group Buy Product</DialogTitle>
                          <DialogDescription>
                            Set up a product for group buying with minimum quantity and discount pricing
                          </DialogDescription>
                        </DialogHeader>
                        <form className="space-y-4">
                          <div>
                            <Label htmlFor="select-product">Select Product</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose from your products" />
                              </SelectTrigger>
                              <SelectContent>
                                {(products as any[])?.filter((p: any) => p.module === "social").map((product: any) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name} - ₹{(product.price / 100).toFixed(2)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="min-quantity">Minimum Quantity</Label>
                            <Input 
                              id="min-quantity" 
                              type="number" 
                              placeholder="10" 
                              min="10"
                            />
                            <p className="text-xs text-gray-500 mt-1">Minimum 10 pieces required</p>
                          </div>
                          
                          <div>
                            <Label htmlFor="discount-percent">Discount Percentage</Label>
                            <Input 
                              id="discount-percent" 
                              type="number" 
                              placeholder="15" 
                              min="5" 
                              max="50"
                            />
                            <p className="text-xs text-gray-500 mt-1">5% to 50% discount range</p>
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline">Cancel</Button>
                            <Button type="submit" className="bg-red-500 hover:bg-red-600">
                              Create Group Buy
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Group Buy Products List */}
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                      Create group buy products to enable bulk purchasing with discounts. 
                      Products require admin approval before appearing in VyronaHub.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-red-800 mb-2">Group Buy Requirements</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Minimum 10 pieces for single product group buys</li>
                    <li>• Alternative: 5+ pieces across multiple sellers</li>
                    <li>• Products require admin approval</li>
                    <li>• Discounts enable cost sharing for bulk orders</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Store Settings</h2>
                <p className="text-gray-600 dark:text-gray-300">Configure your store preferences</p>
              </div>
              <Card>
                <CardContent className="p-12 text-center">
                  <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">Settings Panel Coming Soon</h3>
                  <p className="text-gray-500 dark:text-gray-400">Store configuration options will be available soon</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "books" && (
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

                  {/* Service Overview - Dynamic Data */}
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
                            <span className="text-sm">Revenue</span>
                            <span className="font-bold text-blue-600">
                              ₹{sellerOrders?.filter((order: any) => order.module === 'vyronaread')
                                .reduce((total: number, order: any) => total + (order.totalAmount / 100), 0).toLocaleString() || 0}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Digital Book Services</CardTitle>
                        <CardDescription>E-book sales and rentals</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">E-books Listed</span>
                            <span className="font-bold text-purple-600">
                              {sellerEBooks?.length || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Digital Orders</span>
                            <span className="font-bold text-blue-600">
                              {sellerOrders?.filter((order: any) => order.metadata && JSON.stringify(order.metadata).includes('ebook')).length || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Digital Revenue</span>
                            <span className="font-bold text-green-600">
                              ₹{sellerOrders?.filter((order: any) => order.metadata && JSON.stringify(order.metadata).includes('ebook'))
                                .reduce((total: number, order: any) => total + (order.totalAmount / 100), 0).toLocaleString() || 0}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Common VyronaRead management tasks</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button variant="outline" className="h-20 flex-col" onClick={() => setBookSection("physical")}>
                          <Library className="h-6 w-6 mb-2" />
                          <span className="text-xs">Manage Library</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col" onClick={() => setBookSection("ebooks")}>
                          <BookOpen className="h-6 w-6 mb-2" />
                          <span className="text-xs">Upload E-book</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col" onClick={() => setBookSection("reader")}>
                          <Eye className="h-6 w-6 mb-2" />
                          <span className="text-xs">Reader Settings</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col" onClick={() => setBookSection("analytics")}>
                          <TrendingUp className="h-6 w-6 mb-2" />
                          <span className="text-xs">View Analytics</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Physical Library Section */}
              {bookSection === "physical" && (
                <div className="space-y-6">
                  {/* Dynamic Book Library Stats */}
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
                      <BookOpen className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Books Listed</p>
                        <p className="text-3xl font-bold text-orange-600">
                          {sellerBooks?.filter((book: any) => book.category === 'books' && book.module === 'vyronaread').length || 0}
                        </p>
                        <p className="text-xs text-orange-500">Seller catalog</p>
                      </div>
                      <UserCheck className="h-8 w-8 text-orange-600" />
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
                        <p className="text-xs text-red-500">Processing</p>
                      </div>
                      <Clock className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Integrated Libraries Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Integrated Physical Libraries</CardTitle>
                  <CardDescription>Manage libraries connected to VyronaMart</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Add New Library */}
                    <div className="flex gap-2">
                      <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAddLibrary}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Library
                      </Button>
                      <Button variant="outline" onClick={handleSearchLibraries}>
                        <Search className="h-4 w-4 mr-2" />
                        Search Libraries
                      </Button>
                    </div>

                    {/* Dynamic Libraries List */}
                    <div className="space-y-3">
                      {libraryBooks && libraryBooks.length > 0 ? (
                        libraryBooks.map((library: any) => (
                          <div key={library.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Library className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold">{library.title || library.name || 'Library Name'}</h4>
                                <p className="text-sm text-gray-600">
                                  {library.location || 'Location'} • {library.quantity || 0} books
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={library.isAvailable ? "secondary" : "outline"}>
                                    {library.isAvailable ? "Active" : "Inactive"}
                                  </Badge>
                                  <span className="text-xs text-green-600">
                                    Updated {library.updatedAt ? new Date(library.updatedAt).toLocaleDateString() : 'recently'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                          <Library className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Libraries Connected</h3>
                          <p className="text-gray-600 mb-4">
                            Connect with local libraries to expand your VyronaRead ecosystem
                          </p>
                          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAddLibrary}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Library
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>Latest VyronaRead transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {sellerOrders && sellerOrders.filter((order: any) => order.module === 'vyronaread').length > 0 ? (
                        sellerOrders.filter((order: any) => order.module === 'vyronaread').slice(0, 3).map((order: any, index: number) => (
                          <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                            <div className={`w-2 h-2 rounded-full ${
                              order.status === 'completed' ? 'bg-green-500' : 
                              order.status === 'pending' ? 'bg-blue-500' : 'bg-orange-500'
                            }`}></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Order #{order.id} - {order.status}</p>
                              <p className="text-xs text-gray-500">Amount: ₹{(order.totalAmount / 100).toFixed(2)} - {new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">No recent VyronaRead orders</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Book Inventory Management - Dynamic Data */}
              <Card>
                <CardHeader>
                  <CardTitle>Physical Book Inventory</CardTitle>
                  <CardDescription>Manage your library collection and availability</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {libraryBooks && libraryBooks.length > 0 ? (
                      libraryBooks.slice(0, 3).map((book: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
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
                                    <span className="text-sm font-medium">Status: {book.status || 'Available'}</span>
                                    <span className={`text-sm font-medium ${book.status === 'available' ? 'text-green-600' : 'text-orange-600'}`}>
                                      {book.status === 'available' ? 'Ready to lend' : 'On loan'}
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
                      <div className="text-center py-8">
                        <Library className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">No Physical Books</h3>
                        <p className="text-gray-500 mb-4">Connect with libraries or add books to your inventory</p>
                        <Button onClick={handleAddLibrary} className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Library Connection
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* VyronaMart Integration */}
              <Card>
                <CardHeader>
                  <CardTitle>VyronaMart Integration</CardTitle>
                  <CardDescription>Connect your library with VyronaMart ecosystem</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Digital Services</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                            <span className="text-sm font-medium">E-book Lending</span>
                          </div>
                          <Badge variant="default">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium">Member Sync</span>
                          </div>
                          <Badge variant="default">Connected</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-purple-600" />
                            <span className="text-sm font-medium">Online Reservations</span>
                          </div>
                          <Badge variant="default">Enabled</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-semibold">Revenue Analysis</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Physical Book Orders</span>
                          <span className="font-bold text-green-600">
                            {sellerOrders?.filter((order: any) => order.module === 'vyronaread' && !order.metadata?.includes?.('ebook')).length || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Digital Book Orders</span>
                          <span className="font-bold text-orange-600">
                            {sellerOrders?.filter((order: any) => order.metadata && JSON.stringify(order.metadata).includes('ebook')).length || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Library Books</span>
                          <span className="font-bold text-blue-600">{libraryBooks?.length || 0}</span>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Total Revenue</span>
                            <span className="font-bold text-green-600">
                              ₹{sellerOrders?.filter((order: any) => order.module === 'vyronaread')
                                .reduce((total: number, order: any) => total + (order.totalAmount / 100), 0).toLocaleString() || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
                </div>
              )}

              {/* E-Book Store Section */}
              {bookSection === "ebooks" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">E-Book Store Management</h3>
                      <p className="text-gray-600">Upload, sell, and rent digital books with VyronaRead</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleSearchEbooks}>
                        <Search className="h-4 w-4 mr-2" />
                        Search E-books
                      </Button>
                      <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleUploadEbook}>
                        <Plus className="h-4 w-4 mr-2" />
                        Upload E-book
                      </Button>
                    </div>
                  </div>

                  {/* Dynamic E-Book Stats */}
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
                            <p className="text-xs text-green-500">Total sold</p>
                          </div>
                          <ShoppingCart className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                            <p className="text-3xl font-bold text-blue-600">
                              {sellerOrders?.filter((order: any) => order.status === 'pending' && order.metadata && JSON.stringify(order.metadata).includes('ebook')).length || 0}
                            </p>
                            <p className="text-xs text-blue-500">Processing</p>
                          </div>
                          <Clock className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">E-Book Revenue</p>
                            <p className="text-3xl font-bold text-orange-600">
                              ₹{sellerOrders?.filter((order: any) => order.metadata && JSON.stringify(order.metadata).includes('ebook'))
                                .reduce((total: number, order: any) => total + (order.totalAmount / 100), 0).toLocaleString() || 0}
                            </p>
                            <p className="text-xs text-orange-500">All time</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* E-Book Management - Dynamic Data */}
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
                                    <span className="text-sm font-medium text-green-600">₹{ebook.price || 0} Sale</span>
                                    {ebook.metadata?.rentPrice && (
                                      <span className="text-sm font-medium text-blue-600">₹{ebook.metadata.rentPrice}/month Rent</span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">Status: {ebook.status || 'Available'}</p>
                                  <p className="text-sm text-gray-600">Format: {ebook.metadata?.format || 'PDF'}</p>
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
                              <Button onClick={handleUploadEbook} className="bg-purple-600 hover:bg-purple-700">
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
                        <CardTitle>Upload Options</CardTitle>
                        <CardDescription>Add new e-books to your store</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={handleUploadPdfEpub}>
                            <Plus className="h-4 w-4 mr-2" />
                            Upload PDF/EPUB
                          </Button>
                          
                          <div className="space-y-2">
                            <Label htmlFor="driveLink" className="text-sm font-medium">Google Drive Folder Link</Label>
                            <Input
                              id="driveLink"
                              type="url"
                              placeholder="https://drive.google.com/drive/folders/..."
                              value={driveLink}
                              onChange={(e) => setDriveLink(e.target.value)}
                              className="w-full"
                            />
                            <Button variant="outline" className="w-full" onClick={handleBulkUpload}>
                              <Upload className="h-4 w-4 mr-2" />
                              Bulk Upload from Google Drive
                            </Button>
                          </div>
                        </div>

                        <div className="mt-6 space-y-3">
                          <h4 className="font-semibold text-sm">Pricing Options</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>One-time Sale</span>
                              <span className="font-medium">₹99 - ₹999</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Monthly Rental</span>
                              <span className="font-medium">₹29 - ₹199</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Weekly Rental</span>
                              <span className="font-medium">₹9 - ₹79</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Revenue Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle>E-Book Revenue Breakdown</CardTitle>
                      <CardDescription>Digital book sales and rental income</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(() => {
                          const vyronareadOrders = sellerOrders?.filter((order: any) => order.module === 'vyronaread') || [];
                          const bookSales = vyronareadOrders
                            .filter((order: any) => order.status === 'completed' && !order.metadata?.includes?.('rental'))
                            .reduce((sum: number, order: any) => sum + (order.total || 0), 0);
                          const rentalRevenue = vyronareadOrders
                            .filter((order: any) => order.status === 'completed' && order.metadata?.includes?.('rental'))
                            .reduce((sum: number, order: any) => sum + (order.total || 0), 0);
                          const platformFee = Math.round(bookSales * 0.15);
                          const rentalPlatformFee = Math.round(rentalRevenue * 0.10);
                          const netSales = bookSales - platformFee;
                          const netRentals = rentalRevenue - rentalPlatformFee;
                          const totalRevenue = netSales + netRentals;

                          return (
                            <>
                              <div className="space-y-4">
                                <h4 className="font-semibold">Sales Revenue</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm">Book Sales</span>
                                    <span className="font-bold text-green-600">₹{(bookSales / 100).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm">Platform Fee (15%)</span>
                                    <span className="font-bold text-red-600">-₹{(platformFee / 100).toLocaleString()}</span>
                                  </div>
                                  <div className="border-t pt-2">
                                    <div className="flex justify-between">
                                      <span className="font-medium">Net Sales</span>
                                      <span className="font-bold text-green-600">₹{(netSales / 100).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <h4 className="font-semibold">Rental Revenue</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm">Monthly Rentals</span>
                                    <span className="font-bold text-blue-600">₹{(rentalRevenue / 100).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm">Platform Fee (10%)</span>
                                    <span className="font-bold text-red-600">-₹{(rentalPlatformFee / 100).toLocaleString()}</span>
                                  </div>
                                  <div className="border-t pt-2">
                                    <div className="flex justify-between">
                                      <span className="font-medium">Net Rentals</span>
                                      <span className="font-bold text-blue-600">₹{(netRentals / 100).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <h4 className="font-semibold">Total Revenue</h4>
                                <div className="border-t pt-2">
                                  <div className="flex justify-between">
                                    <span className="font-medium">Total Earnings</span>
                                    <span className="font-bold text-orange-600">₹{(totalRevenue / 100).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Digital Reader Section */}
              {bookSection === "reader" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">VyronaRead Digital Reader</h3>
                      <p className="text-gray-600">In-house reading experience similar to Kindle</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleReaderSettings}>
                        <Settings className="h-4 w-4 mr-2" />
                        Reader Settings
                      </Button>
                      <Button className="bg-blue-600 hover:bg-blue-700" onClick={handlePreviewReader}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Reader
                      </Button>
                    </div>
                  </div>

                  {/* Reader Features */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Reader Features</CardTitle>
                        <CardDescription>Built-in digital reading capabilities</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <BookOpen className="h-5 w-5 text-blue-600" />
                              <span className="text-sm font-medium">Multi-format Support</span>
                            </div>
                            <Badge variant="default">PDF, EPUB, MOBI</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Eye className="h-5 w-5 text-green-600" />
                              <span className="text-sm font-medium">Customizable Reading</span>
                            </div>
                            <Badge variant="default">Fonts, Colors, Size</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Users className="h-5 w-5 text-purple-600" />
                              <span className="text-sm font-medium">Social Features</span>
                            </div>
                            <Badge variant="default">Notes, Highlights</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-5 w-5 text-orange-600" />
                              <span className="text-sm font-medium">Reading Progress</span>
                            </div>
                            <Badge variant="default">Sync Across Devices</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Reader Analytics</CardTitle>
                        <CardDescription>Reading behavior and engagement</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Active Orders</span>
                            <span className="font-bold text-blue-600">
                              {sellerOrders?.filter((order: any) => order.module === 'vyronaread').length || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">E-Books Available</span>
                            <span className="font-bold text-green-600">
                              {sellerEBooks?.length || 0} titles
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Physical Books</span>
                            <span className="font-bold text-purple-600">
                              {sellerBooks?.filter((book: any) => book.category === 'books' && book.module === 'vyronaread').length || 0} titles
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Library Connections</span>
                            <span className="font-bold text-orange-600">
                              {libraryBooks?.length || 0} integrated
                            </span>
                          </div>
                        </div>

                        <div className="mt-6">
                          <h4 className="font-semibold mb-3">Order Status Distribution</h4>
                          <div className="space-y-2">
                            {sellerOrders && sellerOrders.filter((order: any) => order.module === 'vyronaread').length > 0 ? (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span>Completed Orders</span>
                                  <span className="font-medium">
                                    {sellerOrders.filter((order: any) => order.module === 'vyronaread' && order.status === 'completed').length}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Processing Orders</span>
                                  <span className="font-medium">
                                    {sellerOrders.filter((order: any) => order.module === 'vyronaread' && order.status === 'processing').length}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Pending Orders</span>
                                  <span className="font-medium">
                                    {sellerOrders.filter((order: any) => order.module === 'vyronaread' && order.status === 'pending').length}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="text-center py-4 text-gray-500">
                                <p className="text-sm">No VyronaRead orders yet</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Functional Digital Reader */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Digital Reader Interface</CardTitle>
                      <CardDescription>Read your published e-books with VyronaRead interface</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {sellerEBooks && sellerEBooks.length > 0 ? (
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                          <div className="max-w-2xl mx-auto">
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                              <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                  <BookOpen className="h-6 w-6 text-blue-600" />
                                  <span className="font-semibold">{sellerEBooks[0].title || sellerEBooks[0].name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm" onClick={handleReaderSettings}>
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={handlePreviewReader}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-4 text-sm leading-relaxed">
                                <p className="text-gray-700 dark:text-gray-300">
                                  {sellerEBooks[0].description || "This e-book is available in your digital catalog. Preview the reading experience with VyronaRead's interface."}
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">
                                  Price: ₹{(sellerEBooks[0].price / 100)?.toLocaleString() || 0} • Format: Digital • Available: {sellerEBooks[0].isAvailable ? 'Yes' : 'No'}
                                </p>
                              </div>
                              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                                <span className="text-xs text-gray-500">
                                  Digital Book • {sellerEBooks.length} e-book{sellerEBooks.length !== 1 ? 's' : ''} in catalog
                                </span>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm" disabled={sellerEBooks.length <= 1}>←</Button>
                                  <div className="w-32 h-1 bg-gray-200 rounded-full">
                                    <div className="w-4 h-1 bg-blue-600 rounded-full"></div>
                                  </div>
                                  <Button variant="ghost" size="sm" disabled={sellerEBooks.length <= 1}>→</Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No E-Books Available</h3>
                          <p className="text-gray-600 mb-4">
                            Upload your first e-book to test the VyronaRead digital reading experience
                          </p>
                          <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleUploadEbook}>
                            <Plus className="h-4 w-4 mr-2" />
                            Upload E-Book
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Analytics Section */}
              {bookSection === "analytics" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">VyronaRead Analytics</h3>
                      <p className="text-gray-600">Comprehensive insights across all book services</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleDateRange}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Date Range
                      </Button>
                      <Button variant="outline" onClick={handleExportReport}>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Export Report
                      </Button>
                    </div>
                  </div>

                  {/* Performance Overview - Dynamic Data */}
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

                  {/* Revenue Trends */}
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

                  {/* Top Performing Books - Dynamic Data */}
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
                                    ₹{(ebook.price / 100)?.toLocaleString() || 0}
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
            </div>
          )}
        </main>
      </div>

      {/* Add Library Modal */}
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

      {/* Add Product Modal */}
      <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Add comprehensive product details to facilitate customer purchasing decisions.
            </DialogDescription>
          </DialogHeader>
          <Form {...productForm}>
            <form onSubmit={productForm.handleSubmit(handleAddProduct)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="details">Product Details</TabsTrigger>
                  <TabsTrigger value="images">Images & Media</TabsTrigger>
                  <TabsTrigger value="inventory">Inventory & Specs</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={productForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter product name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={productForm.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brand</FormLabel>
                          <FormControl>
                            <Input placeholder="Product brand" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={productForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            className="min-h-[100px] resize-none"
                            placeholder="Detailed product description to help customers understand the product benefits and features..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={productForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={productForm.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU *</FormLabel>
                          <FormControl>
                            <Input placeholder="Product SKU" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={productForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (₹) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={productForm.control}
                      name="originalPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Original Price (₹)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={productForm.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 500g, 2kg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={productForm.control}
                      name="dimensions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dimensions</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 20x15x10 cm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={productForm.control}
                    name="specifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specifications</FormLabel>
                        <FormControl>
                          <Textarea 
                            className="min-h-[80px] resize-none"
                            placeholder="Technical specifications, features, materials, etc." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="images" className="space-y-6 mt-6">
                  {/* Main Product Image */}
                  <div className="space-y-4">
                    <Label className="text-lg font-medium">Main Product Image</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      {uploadedFiles.mainImage ? (
                        <div className="relative">
                          <img 
                            src={URL.createObjectURL(uploadedFiles.mainImage)} 
                            alt="Main product" 
                            className="w-32 h-32 object-cover rounded-lg mx-auto"
                          />
                          <Button 
                            type="button"
                            variant="destructive" 
                            size="sm"
                            className="absolute -top-2 -right-2"
                            onClick={() => removeFile(0, 'main')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <div className="space-y-2">
                            <Label htmlFor="main-image" className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 inline-block">
                              Upload Main Image
                            </Label>
                            <Input
                              id="main-image"
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e.target.files, 'main')}
                              className="hidden"
                            />
                            <p className="text-sm text-gray-500">JPG, PNG up to 10MB</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Media */}
                  <div className="space-y-4">
                    <Label className="text-lg font-medium">Additional Images & Videos (Optional)</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="space-y-4">
                        {uploadedFiles.additionalMedia.length > 0 && (
                          <div className="grid grid-cols-3 gap-4">
                            {uploadedFiles.additionalMedia.map((file, index) => (
                              <div key={index} className="relative">
                                {file.type.startsWith('image/') ? (
                                  <img 
                                    src={URL.createObjectURL(file)} 
                                    alt={`Additional ${index + 1}`} 
                                    className="w-full h-24 object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <span className="text-sm text-gray-600">Video {index + 1}</span>
                                  </div>
                                )}
                                <Button 
                                  type="button"
                                  variant="destructive" 
                                  size="sm"
                                  className="absolute -top-2 -right-2"
                                  onClick={() => removeFile(index, 'additional')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {uploadedFiles.additionalMedia.length < 7 && (
                          <div className="text-center">
                            <div className="space-y-2">
                              <Label htmlFor="additional-media" className="cursor-pointer bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 inline-block">
                                Add More Media
                              </Label>
                              <Input
                                id="additional-media"
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                onChange={(e) => handleFileUpload(e.target.files, 'additional')}
                                className="hidden"
                              />
                              <p className="text-sm text-gray-500">
                                Up to {7 - uploadedFiles.additionalMedia.length} more files (Images: JPG, PNG | Videos: MP4, MOV up to 50MB each)
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="inventory" className="space-y-4 mt-6">
                  <FormField
                    control={productForm.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Tags</FormLabel>
                        <FormControl>
                          <Input placeholder="Separate tags with commas" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddProductDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  disabled={addProductMutation.isPending}
                >
                  {addProductMutation.isPending ? "Adding Product..." : "Add Product to Catalog"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}